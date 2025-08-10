"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, MessageSquare } from "lucide-react"
import { useChatStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const conversations = useChatStore((s) => s.conversations)
  const selectedId = useChatStore((s) => s.selectedId)
  const select = useChatStore((s) => s.select)
  const create = useChatStore((s) => s.createConversation)
  const remove = useChatStore((s) => s.deleteConversation)
  const [query, setQuery] = useState("")

  useEffect(() => {
    // ensure conversations sorted on every update
  }, [conversations])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => (c.title || "Untitled").toLowerCase().includes(q))
  }, [conversations, query])

  return (
    <Sidebar collapsible="offcanvas" className="bg-black text-white">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/20 ring-1 ring-emerald-500/40">
            <MessageSquare className="h-4 w-4 text-emerald-300" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wide text-white/60">Takeshi</div>
            <div className="text-sm font-semibold text-emerald-200">Chat</div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-emerald-300 hover:bg-emerald-500/20"
            onClick={() => create().then((id) => select(id))}
            aria-label="New chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70">History</SidebarGroupLabel>
          <div className="px-2 pb-2">
            <Input
              placeholder="Search chats..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-emerald-500"
            />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {filtered.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.id === selectedId}
                    className={cn(
                      "data-[active=true]:bg-emerald-500/20 data-[active=true]:text-emerald-200 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        select(item.id)
                      }}
                      aria-current={item.id === selectedId ? "page" : undefined}
                      title={item.title || "Untitled"}
                    >
                      <MessageSquare />
                      <span className="truncate">{item.title || "Untitled"}</span>
                    </a>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    title="Delete chat"
                    className="hover:bg-red-500/20 hover:text-red-200"
                    onClick={() => remove(item.id)}
                    aria-label={`Delete ${item.title || "Untitled"}`}
                  >
                    <Trash2 />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
              {filtered.length === 0 && <div className="px-3 py-2 text-xs text-white/50">No chats found.</div>}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
      </SidebarContent>

      <SidebarFooter className="text-xs text-white/50">
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
          Your chats are saved locally in your browser (IndexedDB).
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
