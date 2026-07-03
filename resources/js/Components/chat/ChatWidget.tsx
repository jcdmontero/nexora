import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { ChatPanel } from './ChatPanel'

export function ChatWidget() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        aria-label="Chat interno"
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {open && <ChatPanel onClose={() => setOpen(false)} />}
    </div>
  )
}
