"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, CheckCircle2, XCircle } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { ReleaseFiltersBar } from "@/components/releases/ReleaseFiltersBar";
import { BookingAssistantPanel } from "@/components/booking/BookingAssistantPanel";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { filterLabel } from "@/lib/release-filters";
import { taBtnPrimary, taBtnSecondary, taInput } from "@/lib/styles";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth/roles";

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
  application: { id: string; name: string };
  release: { releaseCode: string } | null;
};

export default function BookingPage() {
  const searchParams = useSearchParams();
  const [existing, setExisting] = useState<BookingRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [purpose, setPurpose] = useState("End-to-end test window");
  const [result, setResult] = useState<{ available: boolean; conflicts: Conflict[] } | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [booked, setBooked] = useState(false);
  const [urlApplied, setUrlApplied] = useState(false);

  const {
    filters,
    hasRefinement,
    departments,
    applications,
    environments,
    dbRows,
    refreshLookups,
  } = useReleaseFilters();

  const scopeLabel = useMemo(
    () => filterLabel(filters, departments, applications, environments),
    [filters, departments, applications, environments]
  );

  const filteredApps = useMemo(() => {
    let list = applications;
    if (filters.departmentId) {
      list = list.filter((a) => a.departmentId === filters.departmentId);
    }
    if (filters.applicationId) {
      list = list.filter((a) => a.id === filters.applicationId);
    }
    return list;
  }, [applications, filters.departmentId, filters.applicationId]);

  const deptName = (departmentId: string) =>
    departments.find((d) => d.id === departmentId)?.name ?? "—";

  const loadBookings = () =>
    fetch("/api/bookings")
      .then((r) => r.json())
      .then(setExisting);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
    loadBookings();
  }, []);

  useEffect(() => {
    if (urlApplied || !applications.length) return;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const apps = searchParams.get("apps");
    const urlPurpose = searchParams.get("purpose");
    if (from) setFromDate(from);
    if (to) setToDate(to);
    if (urlPurpose) setPurpose(decodeURIComponent(urlPurpose));
    if (apps) {
      const ids = apps.split(",").filter((id) => applications.some((a) => a.id === id));
      if (ids.length) setSelected(ids);
    }
    setUrlApplied(true);
  }, [searchParams, applications, urlApplied]);

  useEffect(() => {
    if (filters.applicationId) {
      setSelected([filters.applicationId]);
    } else {
      setSelected((prev) => prev.filter((id) => filteredApps.some((a) => a.id === id)));
    }
    setResult(null);
    setBooked(false);
  }, [filters.applicationId, filteredApps]);

  const filteredBookings = useMemo(() => {
    const appIds = new Set(filteredApps.map((a) => a.id));
    if (!hasRefinement) return existing;
    return existing.filter((b) => appIds.has(b.application.id));
  }, [existing, filteredApps, hasRefinement]);

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
      refreshLookups();
    } else {
      setResult(await res.json());
    }
  };

  const canBook = user?.role === "editor" || user?.role === "admin";

  const releaseRows = useMemo(
    () =>
      dbRows.map((r) => ({
        releaseCode: r.releaseCode,
        name: r.name,
        releaseDate: r.releaseDate,
        status: r.status,
        applications: r.applications,
      })),
    [dbRows]
  );

  return (
    <div className="space-y-6">
      <TopBar
        title="Environment Booking"
        subtitle={
          hasRefinement
            ? `Book test windows · ${scopeLabel}`
            : "Select one or more applications, choose dates, check availability, and book for end-to-end testing"
        }
        highlight
      />

      <ReleaseFiltersBar />

      <BookingAssistantPanel
        bookings={existing}
        releases={releaseRows}
        selectedAppIds={selected}
        fromDate={fromDate}
        toDate={toDate}
        onPickWindow={(from, to) => {
          setFromDate(from);
          setToDate(to);
          setResult(null);
          setBooked(false);
        }}
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
              {filteredApps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {deptName(a.departmentId)}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">
              Hold Ctrl (Windows) or Cmd (Mac) to select multiple applications for end-to-end testing.
            </p>
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

      <AdvancedCard
        title="Current bookings"
        subtitle={hasRefinement ? `Filtered by ${scopeLabel}` : "All active reservations from the database"}
      >
        <div className="space-y-2">
          {filteredBookings.length === 0 && <p className="text-sm text-gray-500">No bookings in this scope.</p>}
          {filteredBookings.map((b) => (
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
