"use client"

import { createStore, get, set, del, keys } from "idb-keyval"
import type { Conversation } from "@/types/chat"

const store = createStore("takeshi-chat-db", "conversations")

const INDEX_KEY = "__index__" // stores list of conversation ids for quick scans

type IndexEntry = { id: string; updatedAt: number }

async function readIndex(): Promise<IndexEntry[]> {
  const list = (await get(INDEX_KEY, store)) as IndexEntry[] | undefined
  return Array.isArray(list) ? list : []
}

async function writeIndex(entries: IndexEntry[]) {
  await set(INDEX_KEY, entries, store)
}

export async function dbGetConversation(id: string): Promise<Conversation | undefined> {
  return await get(id, store)
}

export async function dbPutConversation(conv: Conversation): Promise<void> {
  await set(conv.id, conv, store)
  const idx = await readIndex()
  const existing = idx.find((e) => e.id === conv.id)
  if (existing) {
    existing.updatedAt = conv.updatedAt
  } else {
    idx.push({ id: conv.id, updatedAt: conv.updatedAt })
  }
  await writeIndex(idx)
}

export async function dbDeleteConversation(id: string): Promise<void> {
  await del(id, store)
  const idx = await readIndex()
  await writeIndex(idx.filter((e) => e.id !== id))
}

export async function dbListConversations(): Promise<Conversation[]> {
  // Prefer index for ordering by updatedAt
  const idx = await readIndex()
  if (idx.length > 0) {
    const convs = await Promise.all(idx.map((e) => get(e.id, store) as Promise<Conversation | undefined>))
    return convs.filter(Boolean).sort((a, b) => b!.updatedAt - a!.updatedAt) as Conversation[]
  }
  // Fallback: scan keys (first run)
  const allKeys = (await keys(store)) as string[]
  const convKeys = allKeys.filter((k) => k !== INDEX_KEY)
  const convs = await Promise.all(convKeys.map((k) => get(k, store) as Promise<Conversation | undefined>))
  const filtered = convs.filter(Boolean) as Conversation[]
  const ordered = filtered.sort((a, b) => b.updatedAt - a.updatedAt)
  // Seed index
  await writeIndex(ordered.map((c) => ({ id: c.id, updatedAt: c.updatedAt })))
  return ordered
}
