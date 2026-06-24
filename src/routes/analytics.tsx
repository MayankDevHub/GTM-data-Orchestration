import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeads, leadsBySource, leadsByStatus, leadsByMonth, type Lead } from "@/data/leads";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — GTM Orchestrator" }] }),
  component: AnalyticsPage,
});

const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];

function AnalyticsPage() {
  const { data: leads = [], isLoading, error } = useLeads();
  const bySource = leadsBySource(leads);
  const byStatus = leadsByStatus(leads);
  const byMonth = leadsByMonth(leads);

  const convBySource = Object.values(
    leads.reduce<Record<string, { name: string; total: number; conv: number; rate: number }>>((acc, l: Lead) => {
      const k = l.source ?? "Unknown";
      acc[k] = acc[k] ?? { name: k, total: 0, conv: 0, rate: 0 };
      acc[k].total++;
      if (l.status === "Converted") acc[k].conv++;
      return acc;
    }, {})
  ).map((x) => ({ ...x, rate: x.total ? Math.round((x.conv / x.total) * 100) : 0 }));

  if (error) return <p className="text-sm text-destructive">Failed to load: {(error as Error).message}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading…" : "Performance breakdown by source, status and time."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Lead Volume Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={byMonth}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="leads" stroke="#6366f1" fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Leads by Source</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bySource}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={90} label>
                  {byStatus.map((_,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]} />))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Conversion Rate by Source</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={convBySource}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={12} unit="%" />
                <Tooltip formatter={(v: number)=>`${v}%`} />
                <Bar dataKey="rate" fill="#8b5cf6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Source Performance</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            {bySource.map((s,i) => (
              <div key={s.name} className="rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{background: COLORS[i%COLORS.length]}} />
                  <span className="text-xs text-muted-foreground">{s.name}</span>
                </div>
                <div className="mt-1 text-xl font-semibold">{s.value}</div>
                <div className="text-xs text-muted-foreground">leads</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
