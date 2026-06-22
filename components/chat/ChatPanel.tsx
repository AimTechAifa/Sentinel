"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { AISkeleton } from "@/components/ui/AISkeleton";
import { useChat } from "./ChatProvider";
import { callAgent } from "@/lib/agent-client";
import { getOrgContext } from "@/lib/dummy-data";
import { parseCitations } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

const SEED: ChatMessage[] = [
  { role: "user", content: "Can we ship v2.14.0 tonight?" },
];

export function ChatPanel() {
  const { open, setOpen, toggle } = useChat();
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
        context: getOrgContext(),
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
  }, [open, seeded, messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    const res = await callAgent({
      agentRole: "Conversation Agent",
      context: getOrgContext(),
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
      <button onClick={toggle} className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-ai to-violet-700 text-white rounded-full shadow-[0_0_30px_-5px_rgba(122,90,248,0.6)] flex items-center justify-center hover:shadow-[0_0_40px_-5px_rgba(122,90,248,0.8)] transition-all z-50 animate-float">
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
      {open && (
        <div className="fixed top-0 right-0 z-40 flex h-full w-96 flex-col border-l border-gray-200/80 bg-white/90 shadow-theme-md backdrop-blur-xl">
          <div className="p-4 border-b border-gray-200/80 flex items-center justify-between bg-gradient-to-r from-violet-50/50 to-brand-50/50">
            <div>
              <p className="font-semibold text-gray-800">Sentinel Conversation Agent</p>
              <AgentBadge agent="Conversation Agent" className="mt-1" />
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-theme-sm ${m.role === "user" ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white" : "bg-violet-50/80 border border-violet-100 text-gray-800 backdrop-blur-sm"}`}>
                  {m.role === "assistant" && <AgentBadge agent="Conversation Agent" className="mb-2" />}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.citations && m.citations.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2 border-t border-violet-100 pt-2">
                      Based on: {m.citations.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {loading && <AISkeleton lines={3} />}
            <div ref={bottomRef} />
          </div>
          <div className="p-4 border-t border-gray-200 flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask about releases..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ai/30" />
            <button onClick={send} disabled={loading} className="px-3 py-2 bg-ai text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </>
  );
}
