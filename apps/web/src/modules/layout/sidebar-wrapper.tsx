"use client";

import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

export function SidebarWrapper({
  children,
  sidebar,
  headerContent,
}: {
  children: ReactNode;
  sidebar: ReactNode;
  headerContent: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Overlay for mobile */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-[#1E3A5F] text-white transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 lg:px-6">
          <button
            onClick={() => setOpen(!open)}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          {headerContent}
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
