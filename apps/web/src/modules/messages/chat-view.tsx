"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@insti/ui";
import { Input } from "@insti/ui";
import { ArrowLeft, Send, CheckCheck } from "lucide-react";
import Link from "next/link";

type Message = {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
  isRead: boolean;
};

export function ChatView({
  conversationId,
  title,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  title: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (!res.ok) throw new Error("Error");
      const d = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: d.data.id,
          content: d.data.content,
          senderId: d.data.senderId,
          senderName: "Tú",
          senderRole: "",
          createdAt: d.data.createdAt,
          isRead: false,
        },
      ]);
      setText("");
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}`);
        const d = await res.json();
        if (d.data?.messages) {
          setMessages(
            d.data.messages.map((m: Message) => ({
              ...m,
              createdAt: m.createdAt,
            })),
          );
        }
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-white px-4 py-3">
        <Link href="/dashboard/messages" className="rounded-md p-1 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-lg px-4 py-2 ${
                isMine ? "bg-[#1E3A5F] text-white" : "bg-white border border-slate-200 text-slate-900"
              }`}>
                {!isMine && (
                  <p className="text-xs font-medium text-slate-500 mb-0.5">{msg.senderName}</p>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : ""}`}>
                  <span className={`text-xs ${isMine ? "text-white/70" : "text-slate-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {isMine && msg.isRead && <CheckCheck className="h-3 w-3 text-white/70" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white p-3">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex gap-2"
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          />
          <Button type="submit" disabled={sending || !text.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
