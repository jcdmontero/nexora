import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'

export function usePageLoading() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const start = () => setLoading(true)
    const finish = () => setLoading(false)

    router.on('start', start)
    router.on('finish', finish)

    return () => {
      router.off('start', start)
      router.off('finish', finish)
    }
  }, [])

  return loading
}
