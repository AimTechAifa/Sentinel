"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Package, Search, Ticket } from "lucide-react";
import { searchAll } from "@/lib/dummy-data";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

const icons = {
  release: Package,
  ticket: Ticket,
  change: FileText,
};

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const results = searchAll(query);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[15vh]" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search releases, tickets, change records..."
            className="flex-1 text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.trim() === "" ? (
            <p className="p-4 text-sm text-slate-400">Try v2.14.0, CR-8842, PLAT-4422...</p>
          ) : results.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No results for &ldquo;{query}&rdquo;</p>
          ) : (
            results.map((r) => {
              const Icon = icons[r.type];
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => navigate(r.href)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0"
                >
                  <Icon className="w-4 h-4 text-brand-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.label}</p>
                    <p className="text-xs text-slate-400">{r.sublabel}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
