import { put, getAll, remove, count, STORES } from './offline-db'

export interface SyncOperation {
  id: string
  type: string
  endpoint: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data: Record<string, unknown>
  createdAt: number
  retries: number
}

const MAX_RETRIES = 5
const SYNC_ENDPOINT = '/api/v1/offline/sync'

function generateId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export async function enqueue(operation: Omit<SyncOperation, 'id' | 'createdAt' | 'retries'>): Promise<SyncOperation> {
  const op: SyncOperation = {
    ...operation,
    id: generateId(),
    createdAt: Date.now(),
    retries: 0,
  }
  await put(STORES.SYNC_QUEUE, op)
  return op
}

export async function getPendingCount(): Promise<number> {
  return count(STORES.SYNC_QUEUE)
}

export async function processQueue(): Promise<{ synced: number; failed: number }> {
  const operations = await getAll<SyncOperation>(STORES.SYNC_QUEUE)
  if (operations.length === 0) return { synced: 0, failed: 0 }

  operations.sort((a, b) => a.createdAt - b.createdAt)

  let synced = 0
  let failed = 0

  for (const op of operations) {
    try {
      const response = await fetch(SYNC_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          operations: [{
            id: op.id,
            type: op.type,
            endpoint: op.endpoint,
            method: op.method,
            data: op.data,
          }],
        }),
      })

      if (response.ok) {
        await remove(STORES.SYNC_QUEUE, op.id)
        synced++
      } else {
        failed++
        if (op.retries >= MAX_RETRIES) {
          await remove(STORES.SYNC_QUEUE, op.id)
        } else {
          await put(STORES.SYNC_QUEUE, { ...op, retries: op.retries + 1 })
        }
      }
    } catch {
      failed++
      if (op.retries < MAX_RETRIES) {
        await put(STORES.SYNC_QUEUE, { ...op, retries: op.retries + 1 })
      } else {
        await remove(STORES.SYNC_QUEUE, op.id)
      }
    }
  }

  return { synced, failed }
}

export async function getAllPending(): Promise<SyncOperation[]> {
  return getAll<SyncOperation>(STORES.SYNC_QUEUE)
}
