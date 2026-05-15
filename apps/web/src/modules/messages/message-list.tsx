"use client";

import Link from "next/link";
import { MessageSquare, User, Users } from "lucide-react";

type Conversation = {
  id: string;
  title: string;
  participants: string[];
  lastMessage: { content: string; created_at: Date; sender_id: string } | null;
  unreadCount: number;
  updatedAt: Date;
};

export function MessageList({
  conversations,
  currentUserId,
  currentUserRole,
}: {
  conversations: Conversation[];
  currentUserId: string;
  currentUserRole: string;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="rounded-full bg-slate-100 p-4">
          <MessageSquare className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">No hay conversaciones</h3>
        <p className="max-w-sm text-sm text-slate-500">
          {currentUserRole === "PADRE"
            ? "Los profesores te contactarán cuando sea necesario."
            : "Inicia una conversación con otro miembro del colegio."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((c) => (
        <Link
          key={c.id}
          href={`/dashboard/messages/${c.id}`}
          className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors"
        >
          <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#1E3A5F]/10">
            {c.participants.length > 2 ? (
              <Users className="h-5 w-5 text-[#1E3A5F]" />
            ) : (
              <User className="h-5 w-5 text-[#1E3A5F]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-slate-900 truncate">{c.title}</h3>
              {c.unreadCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563EB] px-1.5 text-xs font-medium text-white">
                  {c.unreadCount}
                </span>
              )}
            </div>
            {c.lastMessage ? (
              <p className="mt-0.5 text-sm text-slate-500 truncate">
                {c.lastMessage.sender_id === currentUserId ? "Tú: " : ""}
                {c.lastMessage.content}
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-slate-400 italic">Sin mensajes</p>
            )}
            <p className="mt-1 text-xs text-slate-400">{c.participants.join(", ")}</p>
          </div>
          <span className="shrink-0 text-xs text-slate-400">
            {new Date(c.updatedAt).toLocaleDateString("es-ES")}
          </span>
        </Link>
      ))}
    </div>
  );
}
