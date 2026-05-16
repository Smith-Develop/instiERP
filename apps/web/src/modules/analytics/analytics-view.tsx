"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts";
import { TrendingUp, Users, GraduationCap, Banknote, ClipboardCheck } from "lucide-react";

type Props = {
  gradeData: { name: string; students: number }[];
  attendanceData: { date: string; presente: number; ausente: number }[];
  financeData: { month: string; ingresos: number; pendiente: number }[];
  performanceData: { name: string; promedio: number }[];
  kpis: { totalStudents: number; totalTeachers: number; pendingInvoicesCount: number; activeEnrollments: number; attendanceRate: number };
};

const COLORS = ["#1E3A5F", "#2D5A8A", "#2563EB", "#059669", "#D97706", "#DC2626"];

export function AnalyticsView({ gradeData, attendanceData, financeData, performanceData, kpis }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Estudiantes", value: kpis.totalStudents, icon: Users, color: "text-blue-600" },
          { label: "Profesores", value: kpis.totalTeachers, icon: GraduationCap, color: "text-emerald-600" },
          { label: "Matrículas", value: kpis.activeEnrollments, icon: TrendingUp, color: "text-purple-600" },
          { label: "Asistencia hoy", value: `${kpis.attendanceRate}%`, icon: ClipboardCheck, color: "text-amber-600" },
          { label: "Pagos pendientes", value: kpis.pendingInvoicesCount, icon: Banknote, color: "text-red-600" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 flex items-center gap-3">
              <kpi.icon className={`h-5 w-5 ${kpi.color}`}/>
              <div><p className="text-2xl font-bold text-slate-900">{kpi.value}</p><p className="text-xs text-slate-500">{kpi.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Grade distribution */}
        <Card>
          <CardHeader><CardTitle>Estudiantes por Grado</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
                <XAxis dataKey="name" tick={{fontSize:12}}/>
                <YAxis tick={{fontSize:12}}/>
                <Tooltip/>
                <Bar dataKey="students" fill="#1E3A5F" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance trend */}
        <Card>
          <CardHeader><CardTitle>Asistencia (7 días)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
                <XAxis dataKey="date" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:12}}/>
                <Tooltip/>
                <Line type="monotone" dataKey="presente" stroke="#059669" strokeWidth={2} dot={{r:3}}/>
                <Line type="monotone" dataKey="ausente" stroke="#DC2626" strokeWidth={2} dot={{r:3}}/>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Finance */}
        <Card>
          <CardHeader><CardTitle>Finanzas (6 meses)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={financeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
                <XAxis dataKey="month" tick={{fontSize:12}}/>
                <YAxis tick={{fontSize:12}}/>
                <Tooltip/>
                <Bar dataKey="ingresos" fill="#059669" radius={[4,4,0,0]} stackId="a"/>
                <Bar dataKey="pendiente" fill="#DC2626" radius={[4,4,0,0]} stackId="a"/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance by grade */}
        <Card>
          <CardHeader><CardTitle>Rendimiento por Grado</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
                <XAxis dataKey="name" tick={{fontSize:12}}/>
                <YAxis domain={[0,10]} tick={{fontSize:12}}/>
                <Tooltip/>
                <Bar dataKey="promedio" fill="#2563EB" radius={[4,4,0,0]}>
                  {performanceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
