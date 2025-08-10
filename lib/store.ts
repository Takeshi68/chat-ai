"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { dbDeleteConversation, dbGetConversation, dbListConversations, dbPutConversation } from "./db"
import type { Conversation, Message } from "@/types/chat"

type ChatState = {
  conversations: Conversation[]
  selectedId?: string
  isLoaded: boolean
  loadConversations: () => Promise<void>
  select: (id?: string) => void
  createConversation: () => Promise<string>
  deleteConversation: (id: string) => Promise<void>
  addMessage: (id: string, m: Message) => Promise<void>
  renameConversation: (id: string, title: string) => Promise<void>
}

function newConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New Chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  }
}

export const useChatStore = create<ChatState>()(
  devtools((set, get) => ({
    conversations: [],
    selectedId: undefined,
    isLoaded: false,
    loadConversations: async () => {
      const list = await dbListConversations()
      set({ conversations: list, isLoaded: true })
      const current = get().selectedId
      if (!current && list.length > 0) {
        set({ selectedId: list[0].id })
      }
    },
    select: (id) => set({ selectedId: id }),
    createConversation: async () => {
      const conv = newConversation()
      await dbPutConversation(conv)
      set((s) => ({ conversations: [conv, ...s.conversations] }))
      return conv.id
    },
    deleteConversation: async (id: string) => {
      await dbDeleteConversation(id)
      set((s) => {
        const remaining = s.conversations.filter((c) => c.id !== id)
        const selectedId = s.selectedId === id ? remaining[0]?.id : s.selectedId
        return { conversations: remaining, selectedId }
      })
    },
    addMessage: async (id: string, m: Message) => {
      const state = get()
      const idx = state.conversations.findIndex((c) => c.id === id)
      let conv: Conversation | undefined = state.conversations[idx]
      if (!conv) {
        conv = await dbGetConversation(id)
      }
      if (!conv) return

      const updated: Conversation = {
        ...conv,
        updatedAt: Date.now(),
        messages: [...conv.messages, m],
      }
      await dbPutConversation(updated)
      set((s) => {
        const next = [...s.conversations]
        const existingIdx = next.findIndex((c) => c.id === id)
        if (existingIdx >= 0) {
          next.splice(existingIdx, 1)
        }
        return { conversations: [updated, ...next] }
      })
    },
    renameConversation: async (id: string, title: string) => {
      const state = get()
      const idx = state.conversations.findIndex((c) => c.id === id)
      let conv: Conversation | undefined = state.conversations[idx]
      if (!conv) {
        conv = await dbGetConversation(id)
      }
      if (!conv) return
      const updated: Conversation = { ...conv, title, updatedAt: Date.now() }
      await dbPutConversation(updated)
      set((s) => {
        const next = [...s.conversations]
        const existingIdx = next.findIndex((c) => c.id === id)
        if (existingIdx >= 0) {
          next.splice(existingIdx, 1)
        }
        return { conversations: [updated, ...next] }
      })
    },
  })),
)
