"use client";

import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, XCircle } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { taBtnPrimary, taBtnSecondary, taInput } from "@/lib/styles";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth/roles";

type App = { id: string; name: string; department: { name: string } };

type Conflict = {
  applicationName: string;
  bookedBy: string;
  team: string;
  departmentName?: string;
  fromDate: string;
  toDate: string;
  purpose?: string;
  environmentName?: string;
};

type BookingRow = {
  id: string;
  bookedBy: string;
  team: string;
  fromDate: string;
  toDate: string;
  purpose: string | null;
  application: { name: string };
  release: { releaseCode: string } | null;
};

export default function BookingPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [existing, setExisting] = useState<BookingRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [purpose, setPurpose] = useState("End-to-end test window");
  const [result, setResult] = useState<{ available: boolean; conflicts: Conflict[] } | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [booked, setBooked] = useState(false);

  const loadBookings = () => fetch("/api/bookings").then((r) => r.json()).then(setExisting);

  useEffect(() => {
    fetch("/api/applications").then((r) => r.json()).then(setApps);
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
    loadBookings();
  }, []);

  const check = async () => {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationIds: selected, fromDate, toDate }),
    });
    setResult(await res.json());
    setBooked(false);
  };

  const book = async () => {
    const res = await fetch("/api/bookings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationIds: selected, fromDate, toDate, purpose }),
    });
    if (res.ok) {
      setBooked(true);
      setResult({ available: true, conflicts: [] });
      loadBookings();
    } else {
      setResult(await res.json());
    }
  };

  const canBook = user?.role === "editor" || user?.role === "admin";

  return (
    <div className="space-y-6">
      <TopBar
        title="Environment Booking"
        subtitle="Select one or more applications, choose dates, check availability, and book for end-to-end testing"
        highlight
      />

      <AdvancedCard title="Book environments" icon={Calendar} variant="glass">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Applications</p>
            <select
              multiple
              className={`${taInput} min-h-[120px]`}
              value={selected}
              onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                setSelected(opts);
                setResult(null);
                setBooked(false);
              }}
            >
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.department.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple applications for end-to-end testing.</p>
            {selected.length > 0 && (
              <p className="text-xs text-brand-600 mt-1">{selected.length} application(s) selected</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-gray-600">From</label>
              <input type="date" className={taInput} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">To</label>
              <input type="date" className={taInput} value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Purpose</label>
            <input className={taInput} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <button type="button" className={taBtnSecondary} onClick={check} disabled={!selected.length || !fromDate || !toDate}>
              Check Availability
            </button>
            {result?.available && canBook && (
              <button type="button" className={taBtnPrimary} onClick={book}>
                Book Now
              </button>
            )}
          </div>

          {booked && (
            <p className="flex items-center gap-2 text-sm text-success-700">
              <CheckCircle2 className="h-4 w-4" /> Booking confirmed for {selected.length} application(s).
            </p>
          )}

          {result && !result.available && (
            <div className="rounded-xl border border-error-200 bg-error-50/80 p-4 space-y-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-error-800">
                <XCircle className="h-4 w-4" /> Not available — existing bookings conflict
              </p>
              {result.conflicts?.map((c, i) => (
                <p key={i} className="text-xs text-error-700">
                  <strong>{c.applicationName}</strong> booked by {c.bookedBy} ({c.team}) · {formatDate(c.fromDate)} → {formatDate(c.toDate)}
                  {c.purpose && ` · ${c.purpose}`}
                </p>
              ))}
            </div>
          )}
        </div>
      </AdvancedCard>

      <AdvancedCard title="Current bookings" subtitle="All active reservations from the database">
        <div className="space-y-2">
          {existing.length === 0 && <p className="text-sm text-gray-500">No bookings yet.</p>}
          {existing.map((b) => (
            <div key={b.id} className="rounded-xl border border-gray-100 bg-white/80 px-4 py-3 text-sm flex flex-wrap justify-between gap-2">
              <span><strong>{b.application.name}</strong> · {formatDate(b.fromDate)} → {formatDate(b.toDate)}</span>
              <span className="text-gray-500 text-xs">{b.bookedBy} ({b.team}){b.purpose ? ` · ${b.purpose}` : ""}{b.release ? ` · ${b.release.releaseCode}` : ""}</span>
            </div>
          ))}
        </div>
      </AdvancedCard>
    </div>
  );
}
