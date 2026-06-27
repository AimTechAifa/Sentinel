"use client";

import { ChevronRight, Settings, Plus, RefreshCw, AlertTriangle, ChevronDown, Zap, Search, Link2 } from "lucide-react";

export default function ConnectorsPage() {
  return (
    <div className="max-w-[1200px] font-sans pb-24 relative">
      {/* Header Section */}
      <div className="mb-8 mt-2">
        <div className="flex items-center text-[13px] text-gray-500 font-medium mb-3">
          <span className="hover:text-gray-800 cursor-pointer">Settings</span>
          <ChevronRight className="h-3 w-3 mx-1.5" />
          <span className="text-[#2548C9] font-semibold">Connectors</span>
        </div>
        
        <div className="flex items-start justify-between">
          <div className="max-w-[700px]">
            <h1 className="text-[32px] font-bold text-[#111827] tracking-tight mb-2">System Connectors</h1>
            <p className="text-[15px] text-gray-500 font-medium leading-relaxed">
              Manage automated data synchronization between Release Manager and your enterprise stack. Real-time status for CI/CD, ITSM, and issue tracking systems.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[14px] font-semibold text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 transition-colors">
              <RefreshCw className="h-4 w-4 text-gray-600" /> Sync All
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-[#2548C9] px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-[#1E3A9F] transition-colors">
              <Plus className="h-4 w-4" /> Add Connector
            </button>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
        
        {/* Jira Software Card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 flex-1">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-100 bg-[#F4F5F7] shadow-sm">
                  {/* Fake Jira Icon */}
                  <div className="text-[#0052CC] font-bold text-xl">J</div>
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-gray-900 mb-0.5">Jira Software</h3>
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#16A34A]">
                    <div className="h-2 w-2 rounded-full bg-[#16A34A]" /> Healthy
                  </div>
                </div>
              </div>
              <Settings className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>

            <div className="space-y-3 font-mono text-[13px] text-gray-600">
              <div className="flex justify-between">
                <span>Last synced</span>
                <span className="font-medium text-gray-900">2 mins ago</span>
              </div>
              <div className="flex justify-between">
                <span>Active Webhooks</span>
                <span className="font-medium text-gray-900">14 active</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Project-Alpha, Tech-Ops</span>
            <button className="flex items-center gap-1.5 text-[13px] font-bold text-[#2548C9] hover:underline">
              <RefreshCw className="h-3.5 w-3.5" /> Sync now
            </button>
          </div>
        </div>

        {/* GitHub Enterprise Card */}
        <div className="rounded-xl border border-orange-200 border-l-4 border-l-orange-500 bg-white shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 flex-1">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-100 bg-gray-900 shadow-sm">
                  {/* Fake GitHub Icon */}
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.376.202 2.394.1 2.646.64.699 1.026 1.591 1.026 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path></svg>
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-gray-900 mb-0.5">GitHub Enterprise</h3>
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#D97706]">
                    <div className="h-2 w-2 rounded-full bg-[#D97706]" /> Latency Warning
                  </div>
                </div>
              </div>
              <Settings className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>

            <div className="space-y-3 font-mono text-[13px] text-gray-600 mb-4">
              <div className="flex justify-between">
                <span>Last synced</span>
                <span className="font-medium text-gray-900">45 mins ago</span>
              </div>
            </div>

            <div className="rounded-lg bg-[#FFF7ED] p-3 border border-[#FFEDD5]">
              <p className="text-[13px] text-[#C2410C] font-medium leading-relaxed">
                <AlertTriangle className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                Rate limit approaching (92%). Automated sync frequency temporarily reduced.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">86 REPOSITORIES</span>
            <button className="flex items-center gap-1.5 text-[13px] font-bold text-[#2548C9] hover:underline">
              <RefreshCw className="h-3.5 w-3.5" /> Sync now
            </button>
          </div>
        </div>

        {/* ServiceNow Card */}
        <div className="rounded-xl border border-red-200 border-l-4 border-l-red-500 bg-white shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 flex-1">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-100 bg-[#E8F5E9] shadow-sm">
                  {/* Fake ServiceNow Icon */}
                  <div className="text-[#2E7D32] font-bold text-xl">S</div>
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-gray-900 mb-0.5">ServiceNow</h3>
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#DC2626]">
                    <div className="h-2 w-2 rounded-full bg-[#DC2626]" /> Auth Failed
                  </div>
                </div>
              </div>
              <Settings className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>

            <div className="space-y-3 font-mono text-[13px] text-gray-600 mb-4">
              <div className="flex justify-between">
                <span>Last synced</span>
                <span className="font-medium text-gray-900">3 hours ago</span>
              </div>
            </div>

            <div className="rounded-lg bg-[#FEF2F2] px-3 py-2 border border-[#FEE2E2] flex items-center justify-between cursor-pointer hover:bg-red-50 transition-colors">
              <div className="flex items-center gap-2 text-[13px] text-[#DC2626] font-semibold">
                <AlertTriangle className="h-4 w-4" /> 3 Affected Releases
              </div>
              <ChevronDown className="h-4 w-4 text-[#DC2626]" />
            </div>
          </div>
          <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              PROD_ITSM_INSTANCE <Link2 className="h-3 w-3 text-red-400" />
            </span>
            <button className="flex items-center gap-1.5 text-[13px] font-bold text-[#DC2626] hover:underline text-right leading-tight">
              Update<br/>Credentials
            </button>
          </div>
        </div>

        {/* AWS CloudWatch Card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 flex-1">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-100 bg-[#232F3E] shadow-sm">
                  {/* Fake AWS Icon */}
                  <div className="text-[#FF9900] font-bold text-xl">AWS</div>
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-gray-900 mb-0.5">AWS CloudWatch</h3>
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#16A34A]">
                    <div className="h-2 w-2 rounded-full bg-[#16A34A]" /> Healthy
                  </div>
                </div>
              </div>
              <Settings className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>

            <div className="space-y-3 font-mono text-[13px] text-gray-600">
              <div className="flex justify-between">
                <span>Last synced</span>
                <span className="font-medium text-gray-900">8 mins ago</span>
              </div>
              <div className="flex justify-between">
                <span>Log Streams</span>
                <span className="font-medium text-gray-900">1,242 connected</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">US-EAST-1, US-WEST-2</span>
            <button className="flex items-center gap-1.5 text-[13px] font-bold text-[#2548C9] hover:underline">
              <RefreshCw className="h-3.5 w-3.5" /> Sync now
            </button>
          </div>
        </div>

        {/* Slack Ops Hub Card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 flex-1">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm">
                  {/* Fake Slack Icon */}
                  <div className="flex gap-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#E01E5A]" />
                    <div className="w-2 h-2 rounded-full bg-[#36C5F0]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-gray-900 mb-0.5">Slack Ops Hub</h3>
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#16A34A]">
                    <div className="h-2 w-2 rounded-full bg-[#16A34A]" /> Healthy
                  </div>
                </div>
              </div>
              <Settings className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>

            <div className="space-y-3 font-mono text-[13px] text-gray-600">
              <div className="flex justify-between">
                <span>Last heartbeat</span>
                <span className="font-medium text-gray-900">10s ago</span>
              </div>
              <div className="text-center pt-2">
                <span className="font-medium text-gray-900 block leading-tight">Channels #rel-notifs, #ops-incidents</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">RELEASE_BOT_USER</span>
            <button className="flex items-center gap-1.5 text-[13px] font-bold text-[#2548C9] hover:underline">
              <Zap className="h-3.5 w-3.5" fill="currentColor" /> Test Webhook
            </button>
          </div>
        </div>

        {/* Add Custom Source Card */}
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 shadow-sm flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors group min-h-[250px]">
          <div className="h-12 w-12 rounded-full border border-gray-300 bg-white flex items-center justify-center mb-4 group-hover:shadow-md transition-shadow">
            <Plus className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-[16px] font-bold text-gray-700 mb-1">Add Custom Source</h3>
          <p className="text-[13px] text-gray-500 text-center font-medium max-w-[200px]">
            Connect via REST, GraphQL or gRPC
          </p>
        </div>

      </div>

      {/* Real-time Sync Activity Footer */}
      <div className="rounded-xl border border-gray-200 dark:border-[var(--border)] bg-[#F8FAFC] dark:bg-[var(--card)] shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-[var(--border)]">
          <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Real-time Sync Activity</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#16A34A]">
              <div className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse" /> Live Monitoring
            </div>
            <button className="text-[13px] font-bold text-[#2548C9] dark:text-brand-400 hover:underline">
              View System Logs
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4 font-mono text-[13px]">
          {/* Row 1 */}
          <div className="flex items-center gap-4">
            <span className="text-gray-500 dark:text-white/60 w-[100px] shrink-0">10:45:02 AM</span>
            <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white font-bold text-[11px] w-[55px] text-center shrink-0">JIRA</span>
            <span className="text-gray-700 dark:text-white/85 flex-1">Successful sync: Imported 14 new tickets for Project ALPHA</span>
            <span className="text-[#16A34A] font-bold shrink-0">SUCCESS</span>
          </div>
          
          {/* Row 2 */}
          <div className="flex items-center gap-4">
            <span className="text-gray-500 dark:text-white/60 w-[100px] shrink-0">10:42:55 AM</span>
            <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white font-bold text-[11px] w-[55px] text-center shrink-0">SLACK</span>
            <span className="text-gray-700 dark:text-white/85 flex-1">Outbound webhook: Deployment notification sent to #rel-notifs</span>
            <span className="text-[#16A34A] font-bold shrink-0">SUCCESS</span>
          </div>
        </div>
      </div>

      {/* FAB Button */}
      <div className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-[#2548C9] shadow-lg shadow-blue-900/20 flex items-center justify-center cursor-pointer hover:bg-[#1E3A9F] hover:scale-105 transition-all z-50">
        <Plus className="h-6 w-6 text-white" />
      </div>

    </div>
  );
}
