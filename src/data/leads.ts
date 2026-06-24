import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LeadStatus = "New" | "Contacted" | "Qualified" | "Converted" | "Lost";

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: LeadStatus;
  created_at: string;
}

async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, email, phone, company, source, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Lead[];
}

export function useLeads() {
  return useQuery({ queryKey: ["leads"], queryFn: fetchLeads });
}

export function getKpis(leads: Lead[]) {
  const total = leads.length;
  const converted = leads.filter((l) => l.status === "Converted").length;
  const qualified = leads.filter((l) => l.status === "Qualified").length;
  const contacted = leads.filter((l) => l.status === "Contacted").length;
  const convRate = total ? Math.round((converted / total) * 100) : 0;
  return { total, converted, qualified, contacted, convRate };
}

export function leadsBySource(leads: Lead[]) {
  const m: Record<string, number> = {};
  leads.forEach((l) => {
    const k = l.source ?? "Unknown";
    m[k] = (m[k] ?? 0) + 1;
  });
  return Object.entries(m).map(([name, value]) => ({ name, value }));
}

export function leadsByStatus(leads: Lead[]) {
  const m: Record<string, number> = {};
  leads.forEach((l) => {
    m[l.status] = (m[l.status] ?? 0) + 1;
  });
  return Object.entries(m).map(([name, value]) => ({ name, value }));
}

export function leadsByMonth(leads: Lead[]) {
  const m: Record<string, { month: string; leads: number; converted: number }> = {};
  leads.forEach((l) => {
    const k = l.created_at.slice(0, 7);
    if (!m[k]) m[k] = { month: k, leads: 0, converted: 0 };
    m[k].leads++;
    if (l.status === "Converted") m[k].converted++;
  });
  return Object.values(m).sort((a, b) => a.month.localeCompare(b.month));
}
