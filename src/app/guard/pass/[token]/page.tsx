import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, XCircle } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { PASS_PROBLEM, coveredChildren, ensureStandingCode, sharedPassPeople, standingPassValidity } from "@/lib/pickup-pass";
import { loadPickupCode } from "@/lib/pickup-codes";
import CombinedPickup, { type Family } from "./CombinedPickup";

export const dynamic = "force-dynamic";

function Problem({ title, text, icon = "x" }: { title: string; text: string; icon?: "x" | "shield" }) {
  return (
    <div className="flex-1 bg-slate-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link href="/guard/scan" className="flex items-center gap-2">
          <Image src="/icon-192.png" alt="VerifyGate" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-white">VerifyGate</span>
        </Link>
        <Link href="/guard/scan" className="text-slate-400 text-sm hover:text-white">← Scan again</Link>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm bg-red-900/30 border border-red-700/50 rounded-2xl p-6 text-center">
          {icon === "shield" ? <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3" /> : <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />}
          <h2 className="text-xl font-bold text-red-300 mb-2">{title}</h2>
          <p className="text-red-300/80 text-sm">{text}</p>
          <p className="text-slate-400 text-xs mt-4">Do not release a child on this pass. Send the person to the school office.</p>
        </div>
      </main>
    </div>
  );
}

// A standing pass is scanned like any code. It makes (or finds) today's code for
// that person, then the normal verify screen takes over, so the photo check, the
// one-pickup-per-child rule and the message to the parent all still apply.
export default async function StandingPassPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const guardSchoolId = (session?.user as any)?.schoolId as string | null;
  if (!session || !["guard", "teacher", "admin"].includes(role) || !guardSchoolId) redirect("/login?reason=signin&for=scanner");

  const { data: person } = await supabaseAdmin
    .from("authorized_persons")
    .select("id, parent_id, name, phone, photo_url, standing_token, standing_until, standing_school_days, parents(school_id)")
    .eq("standing_token", token)
    .maybeSingle();
  if (!person) return <Problem title="Pass not recognised" text="This pass doesn't exist or has been cancelled." />;

  const parent: any = Array.isArray(person.parents) ? person.parents[0] : person.parents;
  if (parent?.school_id !== guardSchoolId) {
    return <Problem icon="shield" title="Different school" text="This pass belongs to another school." />;
  }

  const validity = standingPassValidity(person);
  if (!validity.ok) return <Problem title="Pass not valid today" text={PASS_PROBLEM[validity.reason]} />;

  if (!person.photo_url) {
    return <Problem icon="shield" title="No photo on this pass" text="The parent must add a photo of the person collecting before this pass can be used." />;
  }

  const school = await supabaseAdmin.from("schools").select("is_active").eq("id", guardSchoolId).maybeSingle();
  if (school.data?.is_active === false) redirect("/offline");

  const children = await coveredChildren(person.id, person.parent_id);
  if (!children.length) return <Problem title="No children on this pass" text="The parent has not chosen any children for this pass." />;

  const result = await ensureStandingCode({ id: person.id, parent_id: person.parent_id }, children);
  if (!result) return <Problem title="Could not open the pass" text="Please scan again, or enter the code from the parent's phone." />;

  // A driver hired by several families: the same phone number on other families'
  // passes at this school brings them all up together. Anything that isn't a
  // working pass (cancelled, expired, no photo, no children) is simply left out.
  const others = await sharedPassPeople({ id: person.id, phone: person.phone }, guardSchoolId);
  const codes = [result.code];
  for (const other of others) {
    if (!other.photo_url || !standingPassValidity(other as any).ok) continue;
    const otherChildren = await coveredChildren(other.id, other.parent_id);
    if (!otherChildren.length) continue;
    const otherCode = await ensureStandingCode({ id: other.id, parent_id: other.parent_id }, otherChildren);
    if (otherCode) codes.push(otherCode.code);
  }
  if (codes.length === 1) redirect(`/guard/verify/${result.code}`);

  const families: Family[] = [];
  for (const code of codes) {
    const loaded = await loadPickupCode({ code });
    if (!loaded) continue;
    const kids = loaded.children.filter((c) => c.school_id === guardSchoolId);
    if (!kids.length) continue;
    const p = loaded.pickupCode.authorizedPerson;
    families.push({
      pickupCodeId: loaded.pickupCode.id,
      parentName: loaded.pickupCode.parent?.name ?? "",
      personName: p?.name ?? "",
      relation: p?.relation ?? null,
      vehicle: p?.vehicle_number ?? null,
      photoUrl: p?.photo_url ?? null,
      children: kids,
    });
  }
  if (families.length === 0) return <Problem title="Could not open the pass" text="Please scan again, or enter the code from the parent's phone." />;
  if (families.length === 1) redirect(`/guard/verify/${codes[0]}`);

  return <CombinedPickup families={families} personName={person.name} />;
}
