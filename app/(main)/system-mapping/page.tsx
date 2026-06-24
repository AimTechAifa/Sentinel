"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, GitBranch, Sparkles, Trash2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { taBtnPrimary, taBtnSecondary, taInput } from "@/lib/styles";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth/roles";

type Edge = {
  id: string;
  direction: string;
  notes: string | null;
  isDefault: boolean;
  sourceApp: { name: string };
  sourceEnv: { name: string };
  targetApp: { name: string };
  targetEnv: { name: string };
};

type Risk = {
  source: string;
  target: string;
  notes: string | null;
  risk: string;
  bookedBy: string;
  team: string;
  fromDate: string;
  toDate: string;
  purpose?: string;
};

type App = { id: string; name: string };
type Env = { id: string; name: string; applicationId: string };

export default function SystemMappingPage() {
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    return endDate.toISOString().slice(0, 10);
  });
  const [edges, setEdges] = useState<Edge[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [mappingNotes, setMappingNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [envs, setEnvs] = useState<Env[]>([]);
  const [form, setForm] = useState({
    sourceAppId: "",
    sourceEnvId: "",
    targetAppId: "",
    targetEnvId: "",
    direction: "downstream",
    notes: "",
  });

  const canEdit = user?.role === "editor" || user?.role === "admin";

  const loadMapping = useCallback(() => {
    if (!from || !to) return;
    fetch(`/api/system-mapping?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => {
        setEdges(d.edges ?? []);
        setRisks(d.risks ?? []);
      });
  }, [from, to]);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
    fetch("/api/applications").then((r) => r.json()).then(setApps);
    fetch("/api/environments").then((r) => r.json()).then(setEnvs);
  }, []);

  useEffect(() => { loadMapping(); }, [loadMapping]);

  const sourceEnvs = useMemo(() => envs.filter((e) => e.applicationId === form.sourceAppId), [envs, form.sourceAppId]);
  const targetEnvs = useMemo(() => envs.filter((e) => e.applicationId === form.targetAppId), [envs, form.targetAppId]);

  const generateFromNotes = async () => {
    setGenerating(true);
    setGenerateMessage(null);
    try {
      const res = await fetch("/api/system-mapping/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: mappingNotes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGenerateMessage({
          type: "error",
          text: data.error ?? "Could not generate mapping — check your notes or try again.",
        });
        return;
      }
      setGenerateMessage({
        type: "success",
        text: data.message ?? `Added ${data.created?.length ?? 0} mapping edge(s).`,
      });
      loadMapping();
    } catch {
      setGenerateMessage({ type: "error", text: "Request failed — please try again." });
    } finally {
      setGenerating(false);
    }
  };

  const addEdge = async () => {
    await fetch("/api/system-mapping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ sourceAppId: "", sourceEnvId: "", targetAppId: "", targetEnvId: "", direction: "downstream", notes: "" });
    loadMapping();
  };

  const removeEdge = async (id: string) => {
    await fetch(`/api/system-mapping/${id}`, { method: "DELETE" });
    loadMapping();
  };

  return (
    <div className="space-y-6">
      <TopBar
        title="System Mapping"
        subtitle="Document which environments depend on each other, then check booking conflicts for your test window"
        highlight
      />

      <AdvancedCard title="What is this?" variant="glass">
        <p className="text-sm text-gray-600 leading-relaxed">
          System mapping records <strong>upstream → downstream</strong> links between application environments
          (e.g. FIN UAT consumes SAP TEST). When you set an analysis period, Release Desk flags{" "}
          <strong>mapping risks</strong> — cases where a required environment is already booked by another team.
        </p>
      </AdvancedCard>

      <AdvancedCard title="Mapping notes" subtitle="Describe upstream/downstream setup — Release Desk generates mapping from your notes" icon={Sparkles} variant="ai" beam>
        <textarea
          className={`${taInput} min-h-[100px] resize-y`}
          placeholder="e.g. FIN Dev feeds SAP Test; CRM UAT depends on Oracle Dev..."
          value={mappingNotes}
          onChange={(e) => setMappingNotes(e.target.value)}
          disabled={!canEdit}
        />
        {!canEdit && (
          <p className="mt-2 text-xs text-gray-500">Sign in as Editor or Admin to generate or edit mappings.</p>
        )}
        {canEdit && (
          <button
            type="button"
            className={`${taBtnPrimary} mt-3 text-sm`}
            onClick={generateFromNotes}
            disabled={!mappingNotes.trim() || generating}
          >
            {generating ? "Generating…" : "Generate mapping from notes"}
          </button>
        )}
        {generateMessage && (
          <p className={`mt-3 text-sm ${generateMessage.type === "success" ? "text-success-700" : "text-error-600"}`}>
            {generateMessage.text}
          </p>
        )}
      </AdvancedCard>

      {canEdit && (
        <AdvancedCard title="Add mapping edge" subtitle="Dropdowns from reference data">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <select className={taInput} value={form.sourceAppId} onChange={(e) => setForm({ ...form, sourceAppId: e.target.value, sourceEnvId: "" })}>
              <option value="">Source application</option>
              {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select className={taInput} value={form.sourceEnvId} onChange={(e) => setForm({ ...form, sourceEnvId: e.target.value })}>
              <option value="">Source environment</option>
              {sourceEnvs.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select className={taInput} value={form.targetAppId} onChange={(e) => setForm({ ...form, targetAppId: e.target.value, targetEnvId: "" })}>
              <option value="">Target application</option>
              {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select className={taInput} value={form.targetEnvId} onChange={(e) => setForm({ ...form, targetEnvId: e.target.value })}>
              <option value="">Target environment</option>
              {targetEnvs.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select className={taInput} value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
              <option value="downstream">Downstream</option>
              <option value="upstream">Upstream</option>
            </select>
            <input className={taInput} placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button
            type="button"
            className={`${taBtnSecondary} mt-3 text-sm`}
            onClick={addEdge}
            disabled={!form.sourceAppId || !form.sourceEnvId || !form.targetAppId || !form.targetEnvId}
          >
            Add edge
          </button>
        </AdvancedCard>
      )}

      <AdvancedCard title="Analysis period" icon={GitBranch} variant="glass">
        <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
          <div>
            <label className="text-xs text-gray-500">From</label>
            <input type="date" className={taInput} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500">To</label>
            <input type="date" className={taInput} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </AdvancedCard>

      {risks.length > 0 && (
        <AdvancedCard title="Mapping risks" subtitle="Required mapped environments unavailable in selected period" icon={AlertTriangle} variant="ai" beam>
          <div className="space-y-3">
            {risks.map((r, i) => (
              <div key={i} className="rounded-xl border border-error-200 bg-error-50/60 p-4 text-sm">
                <p className="font-semibold text-error-800">{r.source} → {r.target}</p>
                <p className="text-xs text-error-700 mt-1">{r.risk}</p>
                {r.notes && <p className="text-xs text-gray-600 mt-2 italic">{r.notes}</p>}
                <p className="text-[10px] text-gray-500 mt-2">
                  Booked {formatDate(r.fromDate)} → {formatDate(r.toDate)} · {r.purpose}
                </p>
              </div>
            ))}
          </div>
        </AdvancedCard>
      )}

      <AdvancedCard title="Current system mapping" subtitle="Default setup from reference data and mapping notes">
        <div className="space-y-3">
          {edges.length === 0 && (
            <p className="text-sm text-gray-500">
              No mapping edges yet. Use the notes above, add an edge manually, or run{" "}
              <code className="text-xs bg-gray-100 px-1 rounded">npm run db:setup</code> to load demo defaults.
            </p>
          )}
          {edges.map((e) => (
            <div key={e.id} className="rounded-xl border border-gray-100 p-4 bg-white/70 flex justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-800">
                  {e.sourceApp.name} / {e.sourceEnv.name}
                  <span className="text-gray-400 mx-2">→</span>
                  {e.targetApp.name} / {e.targetEnv.name}
                </p>
                <p className="text-xs text-gray-500 mt-1 capitalize">{e.direction} · {e.isDefault ? "Default setup" : "Custom"}</p>
                {e.notes && <p className="text-sm text-gray-600 mt-2">{e.notes}</p>}
              </div>
              {canEdit && (
                <button type="button" onClick={() => removeEdge(e.id)} className="text-error-500 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </AdvancedCard>
    </div>
  );
}
