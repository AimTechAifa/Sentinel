"use client";

import { Calendar, ChevronDown, List, MoreVertical, Plus, Table2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data matching the screenshot exactly
const mockResources = [
  { id: "1", app: "Payment Gateway", env: "Prod", envColor: "bg-error-500" },
  { id: "2", app: "Auth Service", env: "UAT", envColor: "bg-warning-500" },
  { id: "3", app: "User Portal", env: "Staging", envColor: "bg-blue-400" },
];

const mockGanttBookings = [
  {
    id: "b1",
    resourceId: "1",
    startCol: 3, // Wed 3
    endCol: 5,   // Fri 5 (so it spans 3 columns)
    label: "Payments Team - v2.14.0",
    variant: "blue",
  },
  {
    id: "b2",
    resourceId: "2", // Row 2 has two bookings
    startCol: 8,     // Mon 8
    endCol: 11,      // Thu 11
    label: "Security Patch v1.9",
    variant: "red",
    icon: true,
  },
  {
    id: "b3",
    resourceId: "2",
    startCol: 10,    // Wed 10
    endCol: 12,      // Fri 12
    label: "Core Identity Rollout",
    variant: "red",
    icon: true,
    rowOffset: true, // Show slightly below in the same row
  },
  {
    id: "b4",
    resourceId: "3",
    startCol: 3,     // Wed 3
    endCol: 4,       // Thu 4
    label: "UI Refresh Alph",
    variant: "gray",
  },
];

const mockTableBookings = [
  { id: "t1", app: "Payment Gateway", env: "Prod", envColor: "bg-error-500", team: "Payments Team", date: "Oct 02 - Oct 04", status: "Booked" },
  { id: "t2", app: "Auth Service", env: "UAT", envColor: "bg-warning-500", team: "Security Ops", date: "Oct 08 - Oct 11", warning: true, status: "Conflict" },
  { id: "t3", app: "Auth Service", env: "UAT", envColor: "bg-warning-500", team: "Identity Core", date: "Oct 10 - Oct 12", warning: true, status: "Conflict" },
  { id: "t4", app: "User Portal", env: "Staging", envColor: "bg-blue-400", team: "Frontend VNext", date: "Oct 01 - Oct 02", status: "Released" },
];

const days = [
  { day: "MON", date: "1" }, { day: "TUE", date: "2" }, { day: "WED", date: "3" },
  { day: "THU", date: "4" }, { day: "FRI", date: "5" }, { day: "SAT", date: "6" }, { day: "SUN", date: "7" },
  { day: "MON", date: "8" }, { day: "TUE", date: "9" }, { day: "WED", date: "10" },
  { day: "THU", date: "11" }, { day: "FRI", date: "12" }, { day: "SAT", date: "13" }, { day: "SUN", date: "14" }
];

export default function BookingPage() {
  return (
    <div className="space-y-6 pb-12 font-sans max-w-[1200px] mx-auto">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">Environment Booking</h1>
          <p className="mt-1 text-[15px] text-gray-600 font-medium">Manage and schedule deployments across all infrastructure layers.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[#2548C9] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1E3A9F] transition-colors">
          <Plus className="h-4 w-4" /> New Booking
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">Application</label>
          <div className="relative">
            <select className="w-full appearance-none rounded-lg bg-gray-50/50 border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 cursor-pointer hover:bg-gray-50 transition-colors">
              <option>All Applications</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">Environment</label>
          <div className="relative">
            <select className="w-full appearance-none rounded-lg bg-gray-50/50 border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 cursor-pointer hover:bg-gray-50 transition-colors">
              <option>All Environments</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="flex-1 min-w-[240px]">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">Date Range</label>
          <div className="relative flex items-center rounded-lg bg-gray-50/50 border border-gray-200 px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-text">
            <Calendar className="mr-2 h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Oct 01, 2023 - Oct 31, 2023</span>
          </div>
        </div>
        <button className="rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm whitespace-nowrap h-[42px]">
          Apply Filters
        </button>
      </div>

      {/* Schedule View Gantt */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-50 text-brand-600">
              <Calendar className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Schedule View</h2>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1 bg-gray-50/50">
            <button className="rounded flex h-7 w-8 items-center justify-center bg-white shadow-sm text-brand-600 border border-gray-200/50">
              <Calendar className="h-4 w-4" />
            </button>
            <button className="rounded flex h-7 w-8 items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="grid grid-cols-[200px_repeat(14,minmax(0,1fr))] border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                Resource
              </div>
              {days.map((d, i) => (
                <div key={i} className="flex flex-col items-center justify-center border-l border-gray-100 py-3 text-center">
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1">{d.day}</span>
                  <span className="text-[14px] font-bold text-gray-700">{d.date}</span>
                </div>
              ))}
            </div>

            {/* Grid Body */}
            {mockResources.map((res, i) => (
              <div key={res.id} className="grid grid-cols-[200px_repeat(14,minmax(0,1fr))] border-b border-gray-100 last:border-b-0 min-h-[100px] relative group">
                <div className="flex flex-col justify-center px-5 py-4 bg-white z-10 border-r border-gray-100">
                  <span className="font-bold text-gray-900 text-sm">{res.app}</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={cn("h-1.5 w-1.5 rounded-full", res.envColor)} />
                    <span className="text-xs font-medium text-gray-500">{res.env}</span>
                  </div>
                </div>

                {/* Vertical Grid Lines */}
                {days.map((_, i) => (
                  <div key={i} className="border-r border-gray-50 last:border-r-0" />
                ))}

                {/* Gantt Bars for this resource */}
                {mockGanttBookings.filter(b => b.resourceId === res.id).map(booking => {
                  const isBlue = booking.variant === "blue";
                  const isRed = booking.variant === "red";
                  const isGray = booking.variant === "gray";
                  return (
                    <div
                      key={booking.id}
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 mx-1 flex items-center rounded px-3 py-1.5 text-[11px] font-bold shadow-sm whitespace-nowrap overflow-hidden z-20 transition-transform hover:-translate-y-[calc(50%+2px)] cursor-pointer",
                        booking.rowOffset && "mt-7",
                        !booking.rowOffset && booking.variant === "red" && "-mt-4", // slight vertical stagger for multiple red warnings
                        isBlue && "bg-[#EFF3FF] text-[#2548C9] border border-[#BFDBFE]",
                        isRed && "bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]",
                        isGray && "bg-gray-100 text-gray-700 border border-gray-200"
                      )}
                      style={{
                        left: `calc(200px + ((100% - 200px) / 14) * ${booking.startCol - 1})`,
                        width: `calc(((100% - 200px) / 14) * ${booking.endCol - booking.startCol + 1} - 8px)`
                      }}
                    >
                      {booking.icon && <TriangleAlert className="mr-1.5 h-3.5 w-3.5" />}
                      {booking.label}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent & Upcoming Bookings Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-100 p-5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-50 text-brand-600">
            <Table2 className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Recent & Upcoming Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                <th className="px-5 py-4 font-bold">Application</th>
                <th className="px-5 py-4 font-bold">Environment</th>
                <th className="px-5 py-4 font-bold">Team</th>
                <th className="px-5 py-4 font-bold">Date Range</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockTableBookings.map((row) => {
                const isBooked = row.status === "Booked";
                const isConflict = row.status === "Conflict";
                const isReleased = row.status === "Released";
                return (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-4 font-semibold text-gray-900">{row.app}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", row.envColor)} />
                        <span className="font-medium text-gray-700">{row.env}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 font-medium">{row.team}</td>
                    <td className="px-5 py-4">
                      <div className={cn("flex items-center gap-1.5 font-bold", row.warning ? "text-[#B91C1C]" : "text-gray-600")}>
                        {row.date}
                        {row.warning && <TriangleAlert className="h-4 w-4" />}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        "inline-flex items-center justify-center rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wider",
                        isBooked && "bg-[#DCFCE7] text-[#166534]",
                        isConflict && "bg-[#FEF9C3] text-[#A16207]",
                        isReleased && "bg-gray-100 text-gray-600"
                      )}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button className="text-gray-400 hover:text-gray-900 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <MoreVertical className="h-5 w-5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
