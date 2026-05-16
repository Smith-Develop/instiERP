"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardContent } from "@insti/ui";
import { Button } from "@insti/ui";
import { Input } from "@insti/ui";
import { Plus, Send, BookOpen, Users, MessageSquare, Trash2 } from "lucide-react";
import Link from "next/link";

type Assignment = {
  id: string; title: string; type: string; status: string; due_date: Date | null;
  points: { toString: () => string } | null; subject: { name: string };
  submissions: { status: string; student_id: string }[];
};

type Post = {
  id: string; content: string; type: string; created_at: Date;
  authorName?: string; comments: { id: string; content: string; authorName?: string; created_at: Date }[];
};

type Props = {
  sectionId: string; sectionLabel: string; assignments: Assignment[];
  posts: Post[]; studentCount: number;
};

export function ClassroomView({ sectionId, sectionLabel, assignments, posts, studentCount }: Props) {
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState("");
  const [streamTab, setStreamTab] = useState<"posts" | "assignments">("posts");

  const postMutation = useMutation({
    mutationFn: async (content: string) => {
      await fetch("/api/classroom/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sectionId, content, type: "POST" }) });
    },
    onSuccess: () => { setNewPost(""); queryClient.invalidateQueries(); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/classroom/assignments/${id}`, { method: "DELETE" }); },
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const sortedAssignments = [...assignments].sort((a, b) => (a.due_date ? new Date(a.due_date).getTime() : Infinity) - (b.due_date ? new Date(b.due_date).getTime() : Infinity));

  const statusColor = (status: string) => status === "PUBLISHED" ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50";
  const typeLabel = (t: string) => ({ TAREA: "Tarea", EXAMEN: "Examen", PROYECTO: "Proyecto", MATERIAL: "Material" }[t] ?? t);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{sectionLabel}</h2>
          <p className="text-sm text-slate-500">{studentCount} estudiantes</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/classroom/${sectionId}/assignments/new`} className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A]"><Plus className="h-4 w-4"/> Nueva tarea</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <button onClick={() => setStreamTab("posts")} className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${streamTab === "posts" ? "bg-[#1E3A5F] text-white" : "text-slate-500 hover:bg-slate-100"}`}><MessageSquare className="h-4 w-4"/> Stream</button>
        <button onClick={() => setStreamTab("assignments")} className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${streamTab === "assignments" ? "bg-[#1E3A5F] text-white" : "text-slate-500 hover:bg-slate-100"}`}><BookOpen className="h-4 w-4"/> Tareas</button>
      </div>

      {streamTab === "posts" ? (
        <div className="space-y-4">
          {/* New post */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Input value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Comparte un anuncio con la clase..." />
                <Button onClick={() => postMutation.mutate(newPost)} disabled={!newPost.trim() || postMutation.isPending}><Send className="h-4 w-4"/></Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts timeline */}
          {posts.map(p => (
            <Card key={p.id}>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-900 whitespace-pre-wrap">{p.content}</p>
                <p className="mt-2 text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString("es-ES", { dateStyle: "long" })}</p>
                {p.comments.length > 0 && <div className="mt-3 pt-3 border-t space-y-1">{p.comments.map(c => <p key={c.id} className="text-sm text-slate-600">{c.content}</p>)}</div>}
              </CardContent>
            </Card>
          ))}
          {posts.length === 0 && <p className="text-sm text-slate-400 py-8 text-center">Sin publicaciones aún. Publica el primer anuncio.</p>}
        </div>
      ) : (
        /* Assignments Tab */
        <div className="space-y-3">
          {sortedAssignments.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-sm text-slate-400">No hay tareas aún. Crea la primera.</CardContent></Card>
          ) : sortedAssignments.map(a => {
            const submittedCount = a.submissions.filter(s => s.status !== "PENDIENTE").length;
            return (
              <Card key={a.id} className="hover:border-slate-300 transition-colors">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusColor(a.status)}`}>{a.status}</span>
                      <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{typeLabel(a.type)}</span>
                    </div>
                    <Link href={`/dashboard/classroom/assignments/${a.id}`} className="text-lg font-semibold text-slate-900 hover:text-[#2563EB] mt-1 block">{a.title}</Link>
                  </div>
                  <button onClick={() => deleteMutation.mutate(a.id)} disabled={deleteMutation.isPending} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>{a.subject.name}</span>
                    {a.due_date && <span>Entrega: {new Date(a.due_date).toLocaleDateString("es-ES")}</span>}
                    {a.points && <span>{String(a.points)} pts</span>}
                    <span className="ml-auto"><Users className="inline h-3.5 w-3.5"/> {submittedCount}/{studentCount} entregas</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
