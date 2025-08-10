"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import { useChatStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import type { Message } from "@/types/chat"

function NeonTyping() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
    >
      <span className="block h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
      <span className="flex items-center gap-1 text-xs">
        <span className="opacity-80">Thinking</span>
        <span className="relative inline-flex h-3 w-5 overflow-hidden">
          <span className="absolute inset-0 animate-[typing_1.2s_infinite_steps(3)]">
            <span className="pr-1">.</span>
            <span className="pr-1">.</span>
            <span className="pr-1">.</span>
          </span>
        </span>
      </span>
      <style>
        {`@keyframes typing { 
            0% { transform: translateX(-100%); } 
            100% { transform: translateX(0%); } 
          }`}
      </style>
    </div>
  )
}

export function ChatWindow() {
  const selectedId = useChatStore((s) => s.selectedId)
  const conversations = useChatStore((s) => s.conversations)
  const addMessage = useChatStore((s) => s.addMessage)
  const rename = useChatStore((s) => s.renameConversation)
  const create = useChatStore((s) => s.createConversation)
  const select = useChatStore((s) => s.select)

  const convo = useMemo(() => conversations.find((c) => c.id === selectedId), [conversations, selectedId])

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedId && conversations.length === 0) {
      create().then((id) => select(id))
    }
  }, [selectedId, conversations.length, create, select])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [convo?.messages?.length, isLoading])

  const send = async () => {
    const text = input.trim()
    if (!text) return

    let targetId = selectedId
    if (!targetId) {
      targetId = await create()
      select(targetId)
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    }
    await addMessage(targetId!, userMsg)

    const current = conversations.find((c) => c.id === targetId)
    if (current && (!current.title || current.title === "New Chat")) {
      const title = text.slice(0, 48)
      await rename(targetId!, title)
    }

    setInput("")
    setIsLoading(true)

    try {
      const url = `https://api.siputzx.my.id/api/ai/perplexity?text=${encodeURIComponent(text)}&model=sonar-pro`
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format')
      }

      let answer = ""
      
      if (data.status === true && data.data?.output) {
        answer = data.data.output
      } 
      else if (data.answer) {
        answer = data.answer
      }
      else if (data.output) {
        answer = data.output
      }
      else if (data.result) {
        answer = data.result
      }
      else if (data.message) {
        answer = data.message
      }
      else if (data.text) {
        answer = data.text
      }
      else if (typeof data.data === "string") {
        answer = data.data
      }
      else if (data.data?.text) {
        answer = data.data.text
      }
      else if (data.response) {
        answer = data.response
      }
      else if (data.choices?.[0]?.message?.content) {
        answer = data.choices[0].message.content
      }
      else {
        // If no recognized pattern, show error message
        throw new Error('No valid response content found')
      }

      // Clean up the answer
      const cleanAnswer = String(answer).trim()
      if (!cleanAnswer) {
        throw new Error('Empty response received')
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: cleanAnswer,
        createdAt: Date.now(),
      }
      await addMessage(targetId!, aiMsg)

    } catch (err: any) {
      console.error('Chat API Error:', err)
      
      let errorMessage = "There was an error fetching a response. Please try again in a moment."
      
      // Provide more specific error messages
      if (err.name === 'AbortError') {
        errorMessage = "Request timed out. Please try again with a shorter message."
      } else if (err.message?.includes('HTTP')) {
        errorMessage = "Server error occurred. Please try again later."
      } else if (err.message?.includes('Failed to fetch')) {
        errorMessage = "Network error. Please check your connection and try again."
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: errorMessage,
        createdAt: Date.now(),
      }
      
      if (targetId) {
        await addMessage(targetId, aiMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  if (!convo) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center p-4">
        <div className="max-w-md text-center text-white/70">
          <div className="text-lg font-semibold text-emerald-300">Welcome to Takeshi - Chat</div>
          <p className="mt-2 text-sm">
            Start a conversation using the input below or create a new chat from the sidebar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-8" aria-label="Conversation history">
        <div className="mx-auto max-w-3xl space-y-4">
          {convo.messages.map((m) => (
            <MessageBubble key={m.id} role={m.role} content={m.content} />
          ))}
          {isLoading && (
            <div className="flex w-full justify-start">
              <NeonTyping />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/30 px-3 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything..."
            className="h-12 flex-1 rounded-xl border-emerald-500/30 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-emerald-500"
            aria-label="Your message"
            disabled={isLoading}
          />
          <Button
            onClick={send}
            disabled={!input.trim() || isLoading}
            className="h-12 rounded-xl border border-emerald-500/40 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50"
          >
            <Send className="mr-1 h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble(props: { role: Message["role"]; content: string }) {
  const isUser = props.role === "user"
  return (
    <div className={"flex w-full " + (isUser ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm md:max-w-[70%] " +
          (isUser
            ? "border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-100 shadow-[0_0_18px_rgba(217,70,239,0.15)]"
            : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.15)]")
        }
      >
        <div className="whitespace-pre-wrap">{props.content}</div>
      </div>
    </div>
  )
}