"use client"

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ChatWindow } from "@/components/chat-window"
import { useEffect } from "react"
import { useChatStore } from "@/lib/store"

export default function Page() {
  const load = useChatStore((s) => s.loadConversations)
  const selectedId = useChatStore((s) => s.selectedId)
  const select = useChatStore((s) => s.select)
  const create = useChatStore((s) => s.createConversation)

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    // Auto-select first conversation after loading if none is selected
    // This is handled within loadConversations too, but keep as a safety.
    // No-op here to avoid excess logic.
  }, [selectedId])

  return (
    <div className="min-h-screen text-white">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="relative flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-neutral-900 to-emerald-950">
            <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-black/30 px-3 py-2 backdrop-blur">
              <SidebarTrigger />
              <div className="flex-1 text-sm text-white/70">{selectedId ? "Chat" : "Start a new chat"}</div>
              <button
                onClick={() => create().then((id) => select(id))}
                className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300 hover:bg-emerald-500/20"
              >
                New Chat
              </button>
            </header>
            <section className="flex-1">
              <ChatWindow />
            </section>
            <footer className="border-t border-white/10 px-4 py-3 text-center text-xs text-white/50">
              Takeshi - Chat
            </footer>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
