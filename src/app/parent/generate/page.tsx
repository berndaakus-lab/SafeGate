import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
import GenerateForm from "./GenerateForm";
import { PageHeader } from "@/components/ui";

export default async function GeneratePage({ searchParams }: { searchParams: Promise<{ quick?: string }> }) {
  const { quick } = await searchParams;
  const session = await getServerSession(authOptions);
  const parentId = (session?.user as any)?.id;

  const [{ data: children }, { data: authorizedPeople }] = await Promise.all([
    supabaseAdmin.from("students").select("id, name, class_name").eq("parent_id", parentId).is("archived_at", null).order("name"),
    supabaseAdmin.from("authorized_persons").select("id, name, relation, is_usual").eq("parent_id", parentId).order("name"),
  ]);

  return (
    <div className="p-6 max-w-lg">
      <PageHeader
        title="Generate Pickup QR"
        subtitle="Make a one-time QR code for today's pickup, then send it to the person collecting. For someone who collects every day, a regular pickup pass is quicker."
      />
      <Link
        href="/parent/authorized"
        className="flex items-center gap-3 mb-4 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3.5 hover:bg-blue-100 transition-colors"
      >
        <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
          <Ticket className="w-5 h-5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-slate-900 text-sm">Set up a regular pickup pass</span>
          <span className="block text-xs text-slate-600">For someone who collects regularly: one pass for many days, no daily code.</span>
        </span>
        <ArrowRight className="w-4 h-4 text-blue-700 shrink-0" />
      </Link>
      <GenerateForm
        students={children ?? []}
        authorizedPeople={(authorizedPeople ?? []).map((p: any) => ({ id: p.id, name: p.name, relation: p.relation }))}
        usualPersonId={(authorizedPeople ?? []).find((p: any) => p.is_usual)?.id ?? null}
        quick={quick === "1"}
      />
    </div>
  );
}
