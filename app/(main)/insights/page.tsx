"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { AICardSkeleton } from "@/components/ui/AISkeleton";
import { TrendChart } from "@/components/insights/TrendChart";
import { callAgent } from "@/lib/agent-client";
import { historicalTrend, getOrgContext } from "@/lib/dummy-data";
import type { RiskFlag } from "@/lib/types";
import { Send } from "lucide-react";

export default function InsightsPage() {
  const [patterns, setPatterns] = useState<RiskFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    callAgent({
      agentRole: "Risk Agent",
      context: { historicalTrend, org: getOrgContext() },
      mode: "structured",
    }).then((res) => {
      if (res.flags) setPatterns(res.flags as RiskFlag[]);
      else setError(res.error ?? "AI unavailable");
      setLoading(false);
    });
  }, []);

  const ask = async () => {
    if (!question.trim()) return;
    setAsking(true);
    const res = await callAgent({
      agentRole: "Conversation Agent",
      context: getOrgContext(),
      userMessage: question,
    });
    setAnswer(res.text ?? res.error ?? "AI unavailable");
    setAsking(false);
  };

  return (
    <div>
      <TopBar title="Insights" subtitle="Org-wide AI risk and trend analysis" />

      <div className="bg-white ta-card p-4 mb-6">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Ask Insights</label>
        <div className="flex gap-2">
          <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Which team has the most blocked releases?" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ai/30" />
          <button onClick={ask} disabled={asking} className="px-4 py-2 bg-ai text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1"><Send className="w-4 h-4" /> Ask</button>
        </div>
        {asking && <div className="mt-3"><AICardSkeleton /></div>}
        {answer && !asking && (
          <div className="mt-3 ai-card p-4 text-sm text-gray-700">
            <AgentBadge agent="Conversation Agent" className="mb-2" />
            <p className="whitespace-pre-wrap">{answer}</p>
          </div>
        )}
      </div>

      <TrendChart data={historicalTrend} />

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-semibold text-gray-800">Patterns Detected</h2>
          <AgentBadge agent="Risk Agent" />
        </div>
        {loading && <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><AICardSkeleton /><AICardSkeleton /></div>}
        {error && !loading && <p className="text-sm text-error-600">{error}</p>}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patterns.map((p, i) => (
              <div key={i} className="ai-card p-5">
                <h3 className="font-medium text-gray-800 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-600">{p.explanation}</p>
                {p.citations?.length > 0 && <p className="text-xs text-gray-400 mt-3">{p.citations.join(" · ")}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
