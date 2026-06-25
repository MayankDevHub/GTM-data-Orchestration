// import { createFileRoute } from "@tanstack/react-router";
// import { useMemo, useState } from "react";
// import { Search } from "lucide-react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { useLeads, type LeadStatus } from "@/data/leads";

// export const Route = createFileRoute("/leads")({
//   head: () => ({ meta: [{ title: "Leads — GTM Orchestrator" }] }),
//   component: LeadsPage,
// });

// const statusColor: Record<LeadStatus, string> = {
//   New: "bg-blue-100 text-blue-700",
//   Contacted: "bg-amber-100 text-amber-700",
//   Qualified: "bg-purple-100 text-purple-700",
//   Converted: "bg-green-100 text-green-700",
//   Lost: "bg-red-100 text-red-700",
// };

// function LeadsPage() {
//   const { data: leads = [], isLoading, error } = useLeads();
//   const [q, setQ] = useState("");
//   const [status, setStatus] = useState<string>("all");
//   const [source, setSource] = useState<string>("all");

//   const filtered = useMemo(() => leads.filter(l => {
//     const matchQ = !q || `${l.name} ${l.email ?? ""} ${l.company ?? ""}`.toLowerCase().includes(q.toLowerCase());
//     const matchS = status === "all" || l.status === status;
//     const matchSrc = source === "all" || l.source === source;
//     return matchQ && matchS && matchSrc;
//   }), [leads, q, status, source]);

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
//         <p className="text-sm text-muted-foreground">Unified view of leads from all sources.</p>
//       </div>

//       <Card>
//         <CardContent className="p-4">
//           <div className="flex flex-wrap gap-3">
//             <div className="relative flex-1 min-w-[220px]">
//               <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//               <Input placeholder="Search name, email, company..." value={q} onChange={(e)=>setQ(e.target.value)} className="pl-8" />
//             </div>
//             <Select value={status} onValueChange={setStatus}>
//               <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Statuses</SelectItem>
//                 {["New","Contacted","Qualified","Converted","Lost"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}
//               </SelectContent>
//             </Select>
//             <Select value={source} onValueChange={setSource}>
//               <SelectTrigger className="w-[160px]"><SelectValue placeholder="Source" /></SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Sources</SelectItem>
//                 {["Website","LinkedIn","Referral","Cold Email","Event","Ads"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}
//               </SelectContent>
//             </Select>
//           </div>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardContent className="p-0">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Name</TableHead>
//                 <TableHead>Company</TableHead>
//                 <TableHead>Email</TableHead>
//                 <TableHead>Phone</TableHead>
//                 <TableHead>Source</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Created</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filtered.map(l => (
//                 <TableRow key={l.id}>
//                   <TableCell className="font-medium">{l.name}</TableCell>
//                   <TableCell>{l.company}</TableCell>
//                   <TableCell className="text-muted-foreground">{l.email}</TableCell>
//                   <TableCell className="text-muted-foreground">{l.phone}</TableCell>
//                   <TableCell>{l.source}</TableCell>
//                   <TableCell><Badge className={statusColor[l.status as LeadStatus] ?? ""} variant="secondary">{l.status}</Badge></TableCell>
//                   <TableCell className="text-muted-foreground">{l.created_at.slice(0,10)}</TableCell>
//                 </TableRow>
//               ))}
//               {filtered.length === 0 && (
//                 <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
//                   {error ? `Failed to load: ${(error as Error).message}` : isLoading ? "Loading…" : "No leads match your filters."}
//                 </TableCell></TableRow>
//               )}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>
//       <p className="text-xs text-muted-foreground">Showing {filtered.length} of {leads.length} leads</p>
//     </div>
//   );
// }


import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLeads, type LeadStatus } from "@/data/leads";

export const Route = createFileRoute("/leads")({
  head: () => ({ meta: [{ title: "Leads — GTM Orchestrator" }] }),
  component: LeadsPage,
});

const statusColor: Record<LeadStatus, string> = {
  New: "bg-blue-100 text-blue-700",
  Contacted: "bg-amber-100 text-amber-700",
  Qualified: "bg-purple-100 text-purple-700",
  Converted: "bg-green-100 text-green-700",
  Lost: "bg-red-100 text-red-700",
};

function LeadsPage() {
  const { data: leads = [], isLoading, error } = useLeads();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [source, setSource] = useState<string>("all");

  const sources = useMemo(() => {
    const unique = new Set(leads.map((l) => l.source).filter(Boolean) as string[]);
    return Array.from(unique).sort();
  }, [leads]);

  const filtered = useMemo(() => leads.filter(l => {
    const matchQ = !q || `${l.name} ${l.email ?? ""} ${l.company ?? ""}`.toLowerCase().includes(q.toLowerCase());
    const matchS = status === "all" || l.status === status;
    const matchSrc = source === "all" || l.source === source;
    return matchQ && matchS && matchSrc;
  }), [leads, q, status, source]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">Unified view of leads from all sources.</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search name, email, company..." value={q} onChange={(e)=>setQ(e.target.value)} className="pl-8" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {["New","Contacted","Qualified","Converted","Lost"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>{l.company}</TableCell>
                  <TableCell className="text-muted-foreground">{l.email}</TableCell>
                  <TableCell className="text-muted-foreground">{l.phone}</TableCell>
                  <TableCell>{l.source}</TableCell>
                  <TableCell><Badge className={statusColor[l.status as LeadStatus] ?? ""} variant="secondary">{l.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{l.created_at.slice(0,10)}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {error ? `Failed to load: ${(error as Error).message}` : isLoading ? "Loading…" : "No leads match your filters."}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Showing {filtered.length} of {leads.length} leads</p>
    </div>
  );
}
