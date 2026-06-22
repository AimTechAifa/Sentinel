"use client";

import { Sidebar } from "./Sidebar";
import { AppHeader } from "./AppHeader";
import { Backdrop } from "./Backdrop";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { ReleaseStoreProvider } from "@/context/ReleaseStoreContext";
import { cn } from "@/lib/utils";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const wide = isExpanded || isHovered || isMobileOpen;
  const margin = isMobileOpen ? "ml-0" : wide ? "lg:ml-[290px]" : "lg:ml-[90px]";

  return (
    <ChatProvider>
      <div className="min-h-screen bg-gray-50 xl:flex">
        <Sidebar />
        <Backdrop />
        <div className={cn("flex flex-1 flex-col transition-all duration-300 ease-in-out", margin)}>
          <AppHeader />
          <main className="mx-auto w-full max-w-screen-2xl flex-1 p-4 md:p-6">{children}</main>
          <ChatPanel />
        </div>
      </div>
    </ChatProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ReleaseStoreProvider>
        <ShellInner>{children}</ShellInner>
      </ReleaseStoreProvider>
    </SidebarProvider>
  );
}
