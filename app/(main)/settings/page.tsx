"use client";

import { Avatar } from "@/components/ui/Avatar";
import { teamMembers } from "@/lib/dummy-data";
import { Users, Bell, Shield, Plug, Settings as SettingsIcon, MoreVertical, Plus, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("team");

  const sidebarNav = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "team", label: "Team Members", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "integrations", label: "Integrations", icon: Plug },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="max-w-[1200px] font-sans pb-24">
      {/* Header Section */}
      <div className="mb-10 mt-2">
        <h1 className="text-[32px] font-bold text-[#111827] tracking-tight mb-2">Settings</h1>
        <p className="text-[15px] text-gray-500 font-medium leading-relaxed">
          Manage your account settings, team configuration, and system preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-10">
        {/* Left Sidebar */}
        <div className="w-full md:w-[240px] shrink-0">
          <nav className="flex flex-col gap-1">
            {sidebarNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-colors text-left",
                    isActive
                      ? "bg-[#EFF3FF] text-[#2548C9]"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === "team" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-[20px] font-bold text-gray-900">Team Management</h2>
                  <p className="text-[14px] text-gray-500 mt-1">Manage who has access to this workspace.</p>
                </div>
                <button className="flex items-center gap-2 rounded-lg bg-[#2548C9] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-[#1E3A9F] transition-colors">
                  <Plus className="h-4 w-4" /> Invite Member
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                      <th className="px-6 py-4 text-[12px] font-bold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-[12px] font-bold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-[12px] font-bold text-gray-500 uppercase tracking-wider">Last Active</th>
                      <th className="px-6 py-4 text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {teamMembers.map((m, i) => (
                      <tr key={m.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={m.name} />
                            <div>
                              <div className="font-bold text-[14px] text-gray-900">{m.name}</div>
                              <div className="flex items-center gap-1.5 text-[13px] text-gray-500 mt-0.5">
                                <Mail className="h-3 w-3" /> {m.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border",
                            m.role.toLowerCase() === "admin" 
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          )}>
                            {m.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-gray-500 font-medium">
                          {i === 0 ? "Just now" : i === 1 ? "2 hours ago" : "3 days ago"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab !== "team" && (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
              <div className="h-12 w-12 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
                <SettingsIcon className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-[16px] font-bold text-gray-900">Module Coming Soon</h3>
              <p className="text-[14px] text-gray-500 mt-1 max-w-sm">
                This configuration section is currently under development. Please check back later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
