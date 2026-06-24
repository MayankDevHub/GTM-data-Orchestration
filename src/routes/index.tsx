import { createFileRoute } from "@tanstack/react-router";
import { Users, Target, CheckCircle2, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/KpiCard";
import { useLeads, getKpis, leadsBySource, leadsByStatus, leadsByMonth } from "@/data/leads";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — GTM Orchestrator" }] }),
  component: Dashboard,
});

const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];

function Dashboard() {
  const { data: leads = [], isLoading, error } = useLeads();
  const kpis = getKpis(leads);
  const bySource = leadsBySource(leads);
  const byStatus = leadsByStatus(leads);
  const byMonth = leadsByMonth(leads);
  const recent = leads.slice(0, 6);

  if (error) return <p className="text-sm text-destructive">Failed to load: {(error as Error).message}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading…" : "Overview of leads and conversion across sources."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Leads" value={String(kpis.total)} icon={Users} hint="Across all sources" />
        <KpiCard label="Contacted" value={String(kpis.contacted)} icon={Activity} />
        <KpiCard label="Qualified" value={String(kpis.qualified)} icon={Target} />
        <KpiCard label="Converted" value={String(kpis.converted)} icon={CheckCircle2} hint={`${kpis.convRate}% conv. rate`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Leads & Conversions Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={byMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={2} />
                <Line type="monotone" dataKey="converted" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Leads by Source</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={bySource} dataKey="value" nameKey="name" outerRadius={80} label>
                  {bySource.map((_,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Recent Leads</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent.map(l => (
                <div key={l.id} className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{l.company} · {l.source}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{l.status}</Badge>
                    <span className="text-xs text-muted-foreground">{l.created_at.slice(0,10)}</span>
                  </div>
                </div>
              ))}
              {recent.length === 0 && !isLoading && (
                <p className="text-sm text-muted-foreground">No leads yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
