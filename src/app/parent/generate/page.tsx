import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
import GenerateForm from "./GenerateForm";
import { PageHeader } from "@/components/ui";
import { coveredChildren, standingPassValidity } from "@/lib/pickup-pass";

export default async function GeneratePage({ searchParams }: { searchParams: Promise<{ quick?: string }> }) {
  const { quick } = await searchParams;
  const session = await getServerSession(authOptions);
  const parentId = (session?.user as any)?.id;

  const [{ data: children }, { data: authorizedPeople }] = await Promise.all([
    supabaseAdmin.from("students").select("id, name, class_name").eq("parent_id", parentId).is("archived_at", null).order("name"),
    supabaseAdmin
      .from("authorized_persons")
      .select("id, name, relation, is_usual, standing_token, standing_until, standing_school_days")
      .eq("parent_id", parentId)
      .order("name"),
  ]);

  // Regular passes that work today, and the children each covers, so the form can
  // tell a parent the person they chose needs no daily code
  const holders = (authorizedPeople ?? []).filter((p: any) => p.standing_token && standingPassValidity(p).ok);
  const passCovers: Record<string, string[]> = {};
  await Promise.all(holders.map(async (p: any) => { passCovers[p.id] = await coveredChildren(p.id, parentId); }));

  return (
    <div className="p-6 max-w-lg">
      <PageHeader
        title="One-day pickup code"
        subtitle="For someone collecting today only. The code stops working tonight. Anyone who collects regularly should have a regular pickup pass instead."
      />
      <Link
        href="/parent/authorized"
        className="flex items-center gap-3 mb-5 bg-blue-600 text-white rounded-2xl px-4 py-4 shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-colors"
      >
        <span className="w-11 h-11 rounded-xl bg-white text-blue-700 flex items-center justify-center shrink-0">
          <Ticket className="w-6 h-6" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-base">Same person every day? Set up a regular pickup pass</span>
          <span className="block text-sm text-blue-100">One pass that works every day. No daily code.</span>
        </span>
        <ArrowRight className="w-5 h-5 shrink-0" />
      </Link>
      <GenerateForm
        students={children ?? []}
        authorizedPeople={(authorizedPeople ?? []).map((p: any) => ({ id: p.id, name: p.name, relation: p.relation }))}
        usualPersonId={(authorizedPeople ?? []).find((p: any) => p.is_usual)?.id ?? null}
        passCovers={passCovers}
        quick={quick === "1"}
      />
    </div>
  );
}
