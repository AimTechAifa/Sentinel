"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { AISkeleton } from "@/components/ui/AISkeleton";
import { useChat } from "./ChatProvider";
import { callAgent } from "@/lib/agent-client";
import { useOrgContext } from "@/lib/use-org-context";
import { parseCitations } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

const SEED: ChatMessage[] = [
  { role: "user", content: "Can we ship v2.14.0 tonight?" },
];

export function ChatPanel() {
  const { open, setOpen, toggle } = useChat();
  const orgContext = useOrgContext();
  const [messages, setMessages] = useState<ChatMessage[]>(SEED);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open && !seeded && messages.length === 1) {
      setSeeded(true);
      setLoading(true);
      callAgent({
        agentRole: "Conversation Agent",
        context: orgContext,
        userMessage: messages[0].content,
        conversationHistory: [],
      }).then((res) => {
        if (res.text) {
          const { content, citations } = parseCitations(res.text);
          setMessages((m) => [...m, { role: "assistant", content, citations }]);
        } else {
          setMessages((m) => [...m, { role: "assistant", content: res.error ?? "AI unavailable", citations: [] }]);
        }
        setLoading(false);
      });
    }
  }, [open, seeded, messages, orgContext]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    const res = await callAgent({
      agentRole: "Conversation Agent",
      context: orgContext,
      userMessage: userMsg,
      conversationHistory: newMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
    });
    if (res.text) {
      const { content, citations } = parseCitations(res.text);
      setMessages((m) => [...m, { role: "assistant", content, citations }]);
    } else {
      setMessages((m) => [...m, { role: "assistant", content: res.error ?? "AI unavailable" }]);
    }
    setLoading(false);
  };

  return (
    <>
      <button onClick={toggle} className="fixed bottom-6 right-6 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg dark:shadow-md flex items-center justify-center hover:bg-brand-600 transition-all z-50">
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
      {open && (
        <div className="fixed top-0 right-0 z-40 flex h-full w-96 flex-col border-l border-gray-200/80 dark:border-[var(--border)] bg-white dark:bg-[var(--sidebar)] shadow-theme-md">
          <div className="p-4 border-b border-gray-200 dark:border-[var(--border)] flex items-center justify-between bg-brand-50/50 dark:bg-[var(--card)]">
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">Sentinel Conversation Agent</p>
              <AgentBadge agent="Conversation Agent" className="mt-1" />
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm shadow-theme-sm ${m.role === "user" ? "bg-brand-500 text-white" : "bg-brand-50 dark:bg-[var(--card)] border border-brand-100 dark:border-[var(--border)] text-gray-800 dark:text-white"}`}>
                  {m.role === "assistant" && <AgentBadge agent="Conversation Agent" className="mb-2" />}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.citations && m.citations.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-white/60 mt-2 border-t border-brand-100 dark:border-[var(--border)] pt-2">
                      Based on: {m.citations.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {loading && <AISkeleton lines={3} />}
            <div ref={bottomRef} />
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-[var(--border)] flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask about releases..." className="flex-1 px-3 py-2 border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-[var(--card)] text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ai/30 placeholder:text-gray-400 dark:placeholder:text-white/40" />
            <button onClick={send} disabled={loading} className="px-3 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </>
  );
}
