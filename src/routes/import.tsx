// import { createFileRoute } from "@tanstack/react-router";
// import { useState } from "react";
// import Papa from "papaparse";
// import * as XLSX from "xlsx";
// import { useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { toast } from "sonner";
// import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";

// export const Route = createFileRoute("/import")({
//   component: ImportPage,
// });

// type RawRow = Record<string, unknown>;
// type CleanLead = {
//   name: string;
//   email: string | null;
//   phone: string | null;
//   company: string | null;
//   source: string | null;
//   status: string;
// };

// const STATUS_SET = new Set(["New", "Contacted", "Qualified", "Converted", "Lost"]);

// function pick(row: RawRow, keys: string[]): string | null {
//   for (const k of Object.keys(row)) {
//     if (keys.includes(k.toLowerCase().trim())) {
//       const v = row[k];
//       if (v === null || v === undefined) return null;
//       const s = String(v).trim();
//       return s.length ? s : null;
//     }
//   }
//   return null;
// }

// function cleanRows(rows: RawRow[]): { clean: CleanLead[]; skipped: number } {
//   const seen = new Set<string>();
//   const clean: CleanLead[] = [];
//   let skipped = 0;
//   for (const row of rows) {
//     const name = pick(row, ["name", "full name", "lead name", "contact"]);
//     const email = pick(row, ["email", "e-mail", "email address"]);
//     const phone = pick(row, ["phone", "mobile", "contact number", "phone number"]);
//     const company = pick(row, ["company", "organization", "org", "account"]);
//     const source = pick(row, ["source", "lead source", "channel"]);
//     const statusRaw = pick(row, ["status", "stage", "lead status"]) ?? "New";
//     const status = STATUS_SET.has(statusRaw) ? statusRaw : "New";
//     if (!name) { skipped++; continue; }
//     const emailNorm = email ? email.toLowerCase() : null;
//     const key = (emailNorm ?? "") + "|" + name.toLowerCase();
//     if (seen.has(key)) { skipped++; continue; }
//     seen.add(key);
//     clean.push({ name, email: emailNorm, phone, company, source, status });
//   }
//   return { clean, skipped };
// }

// function parseFile(file: File): Promise<RawRow[]> {
//   return new Promise((resolve, reject) => {
//     const ext = file.name.split(".").pop()?.toLowerCase();
//     if (ext === "csv") {
//       Papa.parse<RawRow>(file, {
//         header: true, skipEmptyLines: true,
//         complete: (res) => resolve(res.data),
//         error: reject,
//       });
//     } else if (ext === "xlsx" || ext === "xls") {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         try {
//           const wb = XLSX.read(e.target?.result, { type: "binary" });
//           const sheet = wb.Sheets[wb.SheetNames[0]];
//           resolve(XLSX.utils.sheet_to_json<RawRow>(sheet));
//         } catch (err) { reject(err); }
//       };
//       reader.onerror = reject;
//       reader.readAsBinaryString(file);
//     } else {
//       reject(new Error("Unsupported file type. Use CSV or Excel."));
//     }
//   });
// }

// function ImportPage() {
//   const qc = useQueryClient();
//   const [preview, setPreview] = useState<CleanLead[]>([]);
//   const [stats, setStats] = useState<{ total: number; clean: number; skipped: number; files: number }>({
//     total: 0, clean: 0, skipped: 0, files: 0,
//   });
//   const [busy, setBusy] = useState(false);

//   async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
//     const files = Array.from(e.target.files ?? []);
//     if (!files.length) return;
//     setBusy(true);
//     try {
//       let all: RawRow[] = [];
//       for (const f of files) all = all.concat(await parseFile(f));
//       const { clean, skipped } = cleanRows(all);
//       setPreview(clean);
//       setStats({ total: all.length, clean: clean.length, skipped, files: files.length });
//       toast.success(`Parsed ${all.length} rows from ${files.length} file(s)`);
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : "Failed to parse file");
//     } finally {
//       setBusy(false);
//       e.target.value = "";
//     }
//   }

//   async function commit() {
//     if (!preview.length) return;
//     setBusy(true);
//     const { error } = await supabase.from("leads").insert(preview);
//     setBusy(false);
//     if (error) { toast.error(error.message); return; }
//     toast.success(`Imported ${preview.length} leads`);
//     setPreview([]);
//     setStats({ total: 0, clean: 0, skipped: 0, files: 0 });
//     qc.invalidateQueries({ queryKey: ["leads"] });
//   }

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-semibold tracking-tight">Import Leads</h1>
//         <p className="text-sm text-muted-foreground">Upload CSV or Excel files from multiple sources. Rows are cleaned and deduplicated before saving.</p>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Upload files</CardTitle>
//           <CardDescription>Supported columns: name, email, phone, company, source, status. Extra columns are ignored.</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <Input type="file" accept=".csv,.xlsx,.xls" multiple onChange={onFiles} disabled={busy} />
//           {stats.files > 0 && (
//             <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
//               <Stat label="Files" value={stats.files} />
//               <Stat label="Rows parsed" value={stats.total} />
//               <Stat label="Clean" value={stats.clean} icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} />
//               <Stat label="Skipped" value={stats.skipped} icon={<AlertCircle className="h-4 w-4 text-amber-600" />} />
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {preview.length > 0 && (
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between">
//             <div>
//               <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Preview</CardTitle>
//               <CardDescription>Showing first 10 of {preview.length} cleaned leads.</CardDescription>
//             </div>
//             <Button onClick={commit} disabled={busy}>Save {preview.length} leads</Button>
//           </CardHeader>
//           <CardContent>
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
//                   <TableHead>Company</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {preview.slice(0, 10).map((l, i) => (
//                   <TableRow key={i}>
//                     <TableCell>{l.name}</TableCell>
//                     <TableCell>{l.email ?? "—"}</TableCell>
//                     <TableCell>{l.phone ?? "—"}</TableCell>
//                     <TableCell>{l.company ?? "—"}</TableCell>
//                     <TableCell>{l.source ?? "—"}</TableCell>
//                     <TableCell><Badge variant="secondary">{l.status}</Badge></TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }

// function Stat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
//   return (
//     <div className="rounded-md border p-3">
//       <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
//       <div className="text-xl font-semibold">{value}</div>
//     </div>
//   );
// }




// this was the new code jisme upsert hai


// import { createFileRoute } from "@tanstack/react-router";
// import { useState } from "react";
// import Papa from "papaparse";
// import * as XLSX from "xlsx";
// import { useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { toast } from "sonner";
// import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";

// export const Route = createFileRoute("/import")({
//   component: ImportPage,
// });

// type RawRow = Record<string, unknown>;
// type CleanLead = {
//   name: string;
//   email: string | null;
//   phone: string | null;
//   company: string | null;
//   source: string | null;
//   status: string;
// };

// const STATUS_SET = new Set(["New", "Contacted", "Qualified", "Converted", "Lost"]);

// function pick(row: RawRow, keys: string[]): string | null {
//   for (const k of Object.keys(row)) {
//     if (keys.includes(k.toLowerCase().trim())) {
//       const v = row[k];
//       if (v === null || v === undefined) return null;
//       const s = String(v).trim();
//       return s.length ? s : null;
//     }
//   }
//   return null;
// }

// function cleanRows(rows: RawRow[]): { clean: CleanLead[]; skipped: number } {
//   const seen = new Set<string>();
//   const clean: CleanLead[] = [];
//   let skipped = 0;
//   for (const row of rows) {
//     const name = pick(row, ["name", "full name", "lead name", "contact"]);
//     const email = pick(row, ["email", "e-mail", "email address"]);
//     const phone = pick(row, ["phone", "mobile", "contact number", "phone number"]);
//     const company = pick(row, ["company", "organization", "org", "account"]);
//     const source = pick(row, ["source", "lead source", "channel"]);
//     const statusRaw = pick(row, ["status", "stage", "lead status"]) ?? "New";
//     const status = STATUS_SET.has(statusRaw) ? statusRaw : "New";
//     if (!name) { skipped++; continue; }
//     const emailNorm = email ? email.toLowerCase() : null;
//     const key = (emailNorm ?? "") + "|" + name.toLowerCase();
//     if (seen.has(key)) { skipped++; continue; }
//     seen.add(key);
//     clean.push({ name, email: emailNorm, phone, company, source, status });
//   }
//   return { clean, skipped };
// }

// function parseFile(file: File): Promise<RawRow[]> {
//   return new Promise((resolve, reject) => {
//     const ext = file.name.split(".").pop()?.toLowerCase();
//     if (ext === "csv") {
//       Papa.parse<RawRow>(file, {
//         header: true, skipEmptyLines: true,
//         complete: (res) => resolve(res.data),
//         error: reject,
//       });
//     } else if (ext === "xlsx" || ext === "xls") {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         try {
//           // FIX 1: Use readAsArrayBuffer + type:"array" (readAsBinaryString is deprecated)
//           const wb = XLSX.read(e.target?.result, { type: "array" });
//           const sheet = wb.Sheets[wb.SheetNames[0]];
//           resolve(XLSX.utils.sheet_to_json<RawRow>(sheet));
//         } catch (err) { reject(err); }
//       };
//       reader.onerror = reject;
//       reader.readAsArrayBuffer(file);
//     } else {
//       reject(new Error("Unsupported file type. Use CSV or Excel."));
//     }
//   });
// }

// function ImportPage() {
//   const qc = useQueryClient();
//   const [preview, setPreview] = useState<CleanLead[]>([]);
//   const [stats, setStats] = useState<{ total: number; clean: number; skipped: number; files: number }>({
//     total: 0, clean: 0, skipped: 0, files: 0,
//   });
//   const [busy, setBusy] = useState(false);

//   async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
//     const files = Array.from(e.target.files ?? []);
//     if (!files.length) return;
//     setBusy(true);
//     try {
//       let all: RawRow[] = [];
//       for (const f of files) all = all.concat(await parseFile(f));
//       const { clean, skipped: batchSkipped } = cleanRows(all);

//       // FIX 3: Fetch existing DB records so preview skipped count reflects reality
//       const { data: existing } = await supabase.from("leads").select("email, name");
//       const dbSeen = new Set(
//         (existing ?? []).map((r) => `${(r.email ?? "").toLowerCase()}|${r.name.toLowerCase()}`)
//       );
//       const newOnly = clean.filter(
//         (l) => !dbSeen.has(`${(l.email ?? "")}|${l.name.toLowerCase()}`)
//       );
//       const dbSkipped = clean.length - newOnly.length;

//       setPreview(newOnly);
//       setStats({ total: all.length, clean: newOnly.length, skipped: batchSkipped + dbSkipped, files: files.length });
//       toast.success(`Parsed ${all.length} rows — ${newOnly.length} new, ${batchSkipped + dbSkipped} skipped`);
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : "Failed to parse file");
//     } finally {
//       setBusy(false);
//       e.target.value = "";
//     }
//   }

//   async function commit() {
//     if (!preview.length) return;
//     setBusy(true);

//     // FIX 2: upsert instead of insert — relies on unique index (leads_dedupe_idx)
//     // If email+name already exists in DB, that row is safely ignored
//     const { error } = await supabase.from("leads").upsert(preview, {
//       onConflict: "email,name",
//       ignoreDuplicates: true,
//     });
//     setBusy(false);
//     if (error) { toast.error(error.message); return; }

//     toast.success(`Imported ${preview.length} leads`);
//     setPreview([]);
//     setStats({ total: 0, clean: 0, skipped: 0, files: 0 });
//     qc.invalidateQueries({ queryKey: ["leads"] });
//   }

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-semibold tracking-tight">Import Leads</h1>
//         <p className="text-sm text-muted-foreground">Upload CSV or Excel files from multiple sources. Rows are cleaned and deduplicated before saving.</p>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Upload files</CardTitle>
//           <CardDescription>Supported columns: name, email, phone, company, source, status. Extra columns are ignored.</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <Input type="file" accept=".csv,.xlsx,.xls" multiple onChange={onFiles} disabled={busy} />
//           {stats.files > 0 && (
//             <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
//               <Stat label="Files" value={stats.files} />
//               <Stat label="Rows parsed" value={stats.total} />
//               <Stat label="New" value={stats.clean} icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} />
//               <Stat label="Skipped" value={stats.skipped} icon={<AlertCircle className="h-4 w-4 text-amber-600" />} />
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {preview.length > 0 && (
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between">
//             <div>
//               <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Preview</CardTitle>
//               <CardDescription>Showing first 10 of {preview.length} new leads (already-existing leads excluded).</CardDescription>
//             </div>
//             <Button onClick={commit} disabled={busy}>Save {preview.length} leads</Button>
//           </CardHeader>
//           <CardContent>
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
//                   <TableHead>Company</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {preview.slice(0, 10).map((l, i) => (
//                   <TableRow key={i}>
//                     <TableCell>{l.name}</TableCell>
//                     <TableCell>{l.email ?? "—"}</TableCell>
//                     <TableCell>{l.phone ?? "—"}</TableCell>
//                     <TableCell>{l.company ?? "—"}</TableCell>
//                     <TableCell>{l.source ?? "—"}</TableCell>
//                     <TableCell><Badge variant="secondary">{l.status}</Badge></TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </CardContent>
//         </Card>
//       )}

//       {preview.length === 0 && stats.files > 0 && (
//         <Card>
//           <CardContent className="py-8 text-center text-sm text-muted-foreground">
//             All leads from this file already exist in the database. Nothing new to import.
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }

// function Stat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
//   return (
//     <div className="rounded-md border p-3">
//       <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
//       <div className="text-xl font-semibold">{value}</div>
//     </div>
//   );
// }


// code without upsert 

import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, FileText, X, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/import")({
  component: ImportPage,
});

type RawRow = Record<string, unknown>;
type CleanLead = {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: string;
};

const STATUS_SET = new Set(["New", "Contacted", "Qualified", "Converted", "Lost"]);
const STATUS_OPTIONS = ["New", "Contacted", "Qualified", "Converted", "Lost"];
const SOURCE_OPTIONS = ["Website", "LinkedIn", "Referral", "Cold Email", "Event", "Ads", "Other"];

function pick(row: RawRow, keys: string[]): string | null {
  for (const k of Object.keys(row)) {
    if (keys.includes(k.toLowerCase().trim())) {
      const v = row[k];
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return s.length ? s : null;
    }
  }
  return null;
}

function cleanRows(rows: RawRow[]): { clean: CleanLead[]; skipped: number } {
  const seen = new Set<string>();
  const clean: CleanLead[] = [];
  let skipped = 0;
  for (const row of rows) {
    const name = pick(row, ["name", "full name", "lead name", "contact"]);
    const email = pick(row, ["email", "e-mail", "email address"]);
    const phone = pick(row, ["phone", "mobile", "contact number", "phone number"]);
    const company = pick(row, ["company", "organization", "org", "account"]);
    const source = pick(row, ["source", "lead source", "channel"]);
    const statusRaw = pick(row, ["status", "stage", "lead status"]) ?? "New";
    const status = STATUS_SET.has(statusRaw) ? statusRaw : "New";
    if (!name) { skipped++; continue; }
    const emailNorm = email ? email.toLowerCase() : null;
    const key = (emailNorm ?? "") + "|" + name.toLowerCase();
    if (seen.has(key)) { skipped++; continue; }
    seen.add(key);
    clean.push({ name, email: emailNorm, phone, company, source, status });
  }
  return { clean, skipped };
}

function parseFile(file: File): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      Papa.parse<RawRow>(file, {
        header: true, skipEmptyLines: true,
        complete: (res) => resolve(res.data),
        error: reject,
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target?.result, { type: "array" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          resolve(XLSX.utils.sheet_to_json<RawRow>(sheet));
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("Unsupported file type. Use CSV or Excel."));
    }
  });
}

const emptyForm = (): CleanLead => ({
  name: "", email: null, phone: null, company: null, source: null, status: "New",
});

function ImportPage() {
  const qc = useQueryClient();
  const [preview, setPreview] = useState<CleanLead[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [stats, setStats] = useState<{ total: number; clean: number; skipped: number; files: number }>({
    total: 0, clean: 0, skipped: 0, files: 0,
  });
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Manual add state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CleanLead>(emptyForm());
  const [saving, setSaving] = useState(false);

  async function processFiles(files: File[]) {
    if (!files.length) return;
    setSelectedFiles(files);
    setBusy(true);
    try {
      let all: RawRow[] = [];
      for (const f of files) all = all.concat(await parseFile(f));
      const { clean, skipped: batchSkipped } = cleanRows(all);
      const { data: existing } = await supabase.from("leads").select("email, name");
      const dbSeen = new Set(
        (existing ?? []).map((r) => `${(r.email ?? "").toLowerCase()}|${r.name.toLowerCase()}`)
      );
      const newOnly = clean.filter(
        (l) => !dbSeen.has(`${(l.email ?? "")}|${l.name.toLowerCase()}`)
      );
      const dbSkipped = clean.length - newOnly.length;
      setPreview(newOnly);
      setStats({ total: all.length, clean: newOnly.length, skipped: batchSkipped + dbSkipped, files: files.length });
      toast.success(`Parsed ${all.length} rows — ${newOnly.length} new, ${batchSkipped + dbSkipped} skipped`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setBusy(false);
    }
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    await processFiles(files);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.name.endsWith(".csv") || f.name.endsWith(".xlsx") || f.name.endsWith(".xls")
    );
    if (files.length) processFiles(files);
    else toast.error("Only CSV or Excel files are supported.");
  }

  function removeFile(name: string) {
    const updated = selectedFiles.filter(f => f.name !== name);
    setSelectedFiles(updated);
    if (!updated.length) {
      setPreview([]);
      setStats({ total: 0, clean: 0, skipped: 0, files: 0 });
    }
  }

  async function commit() {
    if (!preview.length) return;
    setBusy(true);
    const { error } = await supabase.from("leads").insert(preview);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Imported ${preview.length} leads`);
    setPreview([]);
    setSelectedFiles([]);
    setStats({ total: 0, clean: 0, skipped: 0, files: 0 });
    qc.invalidateQueries({ queryKey: ["leads"] });
  }

  // Manual form handlers
  function setField(field: keyof CleanLead, value: string) {
    setForm(prev => ({ ...prev, [field]: value || null }));
  }

  async function saveManual() {
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    setSaving(true);
    const lead = {
      ...form,
      name: form.name.trim(),
      email: form.email ? form.email.toLowerCase().trim() : null,
    };
    const { error } = await supabase.from("leads").insert([lead]);
    setSaving(false);
    if (error) {
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        toast.error("This lead already exists in the database.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success(`Lead "${lead.name}" added successfully!`);
    setForm(emptyForm());
    setShowModal(false);
    qc.invalidateQueries({ queryKey: ["leads"] });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Import Leads</h1>
          <p className="text-sm text-muted-foreground">Upload CSV or Excel files, or add leads manually.</p>
        </div>
        <Button
          onClick={() => { setForm(emptyForm()); setShowModal(true); }}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <PlusCircle className="h-4 w-4" />
          Add Lead Manually
        </Button>
      </div>

      {/* Drag & Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-all duration-200 cursor-pointer ${
          dragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 scale-[1.01]"
            : "border-muted-foreground/25 hover:border-indigo-400 hover:bg-muted/40"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <div className={`rounded-full p-4 transition-colors ${dragging ? "bg-indigo-100 dark:bg-indigo-900" : "bg-muted"}`}>
            <Upload className={`h-8 w-8 transition-colors ${dragging ? "text-indigo-600" : "text-muted-foreground"}`} />
          </div>
          <div className="text-center">
            <p className="text-base font-medium">
              {dragging ? "Drop your files here!" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or <span className="text-indigo-600 font-medium underline underline-offset-2">click to browse</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-normal">CSV</Badge>
            <Badge variant="outline" className="font-normal">XLSX</Badge>
            <Badge variant="outline" className="font-normal">XLS</Badge>
            <span>• Multiple files supported</span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple
            onChange={onFiles}
            disabled={busy}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Selected Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedFiles.map((f) => (
              <div key={f.name} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-medium">{f.name}</span>
                  <span className="text-xs text-muted-foreground">({(f.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFile(f.name); }} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {stats.files > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Files" value={stats.files} color="blue" />
          <StatCard label="Rows Parsed" value={stats.total} color="purple" />
          <StatCard label="New Leads" value={stats.clean} color="green" icon={<CheckCircle2 className="h-4 w-4" />} />
          <StatCard label="Skipped" value={stats.skipped} color="amber" icon={<AlertCircle className="h-4 w-4" />} />
        </div>
      )}

      {/* Preview Table */}
      {preview.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-indigo-500" /> Preview
              </CardTitle>
              <CardDescription>Showing first 10 of {preview.length} new leads — duplicates already excluded.</CardDescription>
            </div>
            <Button onClick={commit} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Upload className="h-4 w-4" />
              Save {preview.length} leads
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.slice(0, 10).map((l, i) => (
                  <TableRow key={i} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell className="text-muted-foreground">{l.email ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{l.phone ?? "—"}</TableCell>
                    <TableCell>{l.company ?? "—"}</TableCell>
                    <TableCell>{l.source ?? "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{l.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All exists message */}
      {preview.length === 0 && stats.files > 0 && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="flex items-center justify-center gap-3 py-8">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              All leads from this file already exist in the database. Nothing new to import.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Manual Add Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-indigo-500" />
              Add Lead Manually
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                placeholder="e.g. Rahul Sharma"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. rahul@gmail.com"
                value={form.email ?? ""}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="e.g. 9876543210"
                  value={form.phone ?? ""}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="e.g. TCS"
                  value={form.company ?? ""}
                  onChange={(e) => setField("company", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={form.source ?? ""} onValueChange={(v) => setField("source", v)}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              onClick={saveManual}
              disabled={saving || !form.name.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? "Saving..." : "Save Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const colorMap = {
  blue:   { bg: "bg-blue-50 dark:bg-blue-950/30",   text: "text-blue-600",   border: "border-blue-200" },
  purple: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600", border: "border-purple-200" },
  green:  { bg: "bg-green-50 dark:bg-green-950/30",  text: "text-green-600",  border: "border-green-200" },
  amber:  { bg: "bg-amber-50 dark:bg-amber-950/30",  text: "text-amber-600",  border: "border-amber-200" },
};

function StatCard({ label, value, color, icon }: { label: string; value: number; color: keyof typeof colorMap; icon?: React.ReactNode }) {
  const c = colorMap[color];
  return (
    <div className={`rounded-lg border p-4 ${c.bg} ${c.border}`}>
      <div className={`flex items-center gap-1.5 text-xs font-medium ${c.text} mb-1`}>{icon}{label}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}
