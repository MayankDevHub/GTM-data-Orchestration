import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";

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
          const wb = XLSX.read(e.target?.result, { type: "binary" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          resolve(XLSX.utils.sheet_to_json<RawRow>(sheet));
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    } else {
      reject(new Error("Unsupported file type. Use CSV or Excel."));
    }
  });
}

function ImportPage() {
  const qc = useQueryClient();
  const [preview, setPreview] = useState<CleanLead[]>([]);
  const [stats, setStats] = useState<{ total: number; clean: number; skipped: number; files: number }>({
    total: 0, clean: 0, skipped: 0, files: 0,
  });
  const [busy, setBusy] = useState(false);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    try {
      let all: RawRow[] = [];
      for (const f of files) all = all.concat(await parseFile(f));
      const { clean, skipped } = cleanRows(all);
      setPreview(clean);
      setStats({ total: all.length, clean: clean.length, skipped, files: files.length });
      toast.success(`Parsed ${all.length} rows from ${files.length} file(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setBusy(false);
      e.target.value = "";
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
    setStats({ total: 0, clean: 0, skipped: 0, files: 0 });
    qc.invalidateQueries({ queryKey: ["leads"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import Leads</h1>
        <p className="text-sm text-muted-foreground">Upload CSV or Excel files from multiple sources. Rows are cleaned and deduplicated before saving.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Upload files</CardTitle>
          <CardDescription>Supported columns: name, email, phone, company, source, status. Extra columns are ignored.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" accept=".csv,.xlsx,.xls" multiple onChange={onFiles} disabled={busy} />
          {stats.files > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Files" value={stats.files} />
              <Stat label="Rows parsed" value={stats.total} />
              <Stat label="Clean" value={stats.clean} icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} />
              <Stat label="Skipped" value={stats.skipped} icon={<AlertCircle className="h-4 w-4 text-amber-600" />} />
            </div>
          )}
        </CardContent>
      </Card>

      {preview.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Preview</CardTitle>
              <CardDescription>Showing first 10 of {preview.length} cleaned leads.</CardDescription>
            </div>
            <Button onClick={commit} disabled={busy}>Save {preview.length} leads</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.slice(0, 10).map((l, i) => (
                  <TableRow key={i}>
                    <TableCell>{l.name}</TableCell>
                    <TableCell>{l.email ?? "—"}</TableCell>
                    <TableCell>{l.phone ?? "—"}</TableCell>
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
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
