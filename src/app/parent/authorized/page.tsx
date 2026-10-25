import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import AddPersonForm from "./AddPersonForm";
import EditPersonButton from "./EditPersonButton";
import PersonPassControls from "./PersonPassControls";
import { passQrDataUrl } from "@/lib/pickup-pass";
import Link from "next/link";
import Image from "next/image";
import { Phone, Heart, UserPlus, UserCheck, QrCode, Car } from "lucide-react";
import { Badge, EmptyState, InfoNote, PageHeader, Section, btnPrimary, btnSecondary } from "@/components/ui";

export default async function AuthorizedPage() {
  const session = await getServerSession(authOptions);
  const parentId = (session?.user as any)?.id;

  const { data: people } = await supabaseAdmin
    .from("authorized_persons")
    .select("*")
    .eq("parent_id", parentId)
    .order("name");

  const list = people ?? [];

  const { data: usedCodes } = await supabaseAdmin
    .from("pickup_codes")
    .select("authorized_person_id")
    .eq("parent_id", parentId)
    .not("used_at", "is", null);
  const usedPersonIds = new Set((usedCodes ?? []).map((c: any) => c.authorized_person_id));

  // Standing passes: the children each pass covers, and a QR for every active pass
  const { data: kids } = await supabaseAdmin.from("students").select("id, name").eq("parent_id", parentId).is("archived_at", null).order("name");
  const children = kids ?? [];
  const personIds = list.map((p: any) => p.id);
  const { data: links } = personIds.length
    ? await supabaseAdmin.from("standing_pass_children").select("person_id, student_id").in("person_id", personIds)
    : { data: [] as any[] };
  const coveredBy = new Map<string, string[]>();
  for (const l of links ?? []) coveredBy.set(l.person_id, [...(coveredBy.get(l.person_id) ?? []), l.student_id]);
  const qrFor = new Map<string, string>();
  await Promise.all(list.filter((p: any) => p.standing_token).map(async (p: any) => qrFor.set(p.id, await passQrDataUrl(p.standing_token))));

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader
        title="Pickup Persons"
        subtitle="People you trust to collect your children. You choose one of them each time you make a pickup QR code."
        actions={
          <a href="#add-person" className={btnPrimary}>
            <UserPlus className="w-4 h-4" /> Add person
          </a>
        }
      />

      {list.length === 0 ? (
        <div className="mb-6">
          <EmptyState
            icon={UserCheck}
            title="No pickup persons yet"
            text="Add at least one person, even yourself, before you can generate a pickup QR code."
          />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
            <div className="divide-y divide-slate-100">
              {list.map((person: any) => (
                <div key={person.id} className="flex items-start gap-4 px-5 sm:px-6 py-4">
                  <div className="relative w-12 h-12 bg-purple-100 rounded-full overflow-hidden flex items-center justify-center font-bold text-purple-700 shrink-0">
                    {person.photo_url ? (
                      <Image src={person.photo_url} alt={person.name} width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      person.name[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{person.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {person.relation && (
                        <Badge tone="purple"><Heart className="w-3 h-3" /> {person.relation}</Badge>
                      )}
                      {person.vehicle_number && (
                        <span className="text-sm text-slate-600 inline-flex items-center gap-1">
                          <Car className="w-3.5 h-3.5" /> {person.vehicle_number}
                        </span>
                      )}
                      {person.phone && (
                        <span className="text-sm text-slate-600 inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {person.phone}
                        </span>
                      )}
                    </div>
                    {children.length > 0 && (
                      <PersonPassControls
                        person={{
                          id: person.id,
                          name: person.name,
                          relation: person.relation,
                          hasPhoto: !!person.photo_url,
                          isUsual: !!person.is_usual,
                          token: person.standing_token ?? null,
                          until: person.standing_until ?? null,
                          schoolDays: !!person.standing_school_days,
                          coveredIds: coveredBy.get(person.id) ?? [],
                        }}
                        children={children}
                        qrUrl={qrFor.get(person.id) ?? null}
                      />
                    )}
                  </div>
                  <EditPersonButton person={person} nameLocked={usedPersonIds.has(person.id)} />
                </div>
              ))}
            </div>
          </div>
          <div className="mb-6 flex justify-end">
            <Link href="/parent/generate" className={btnSecondary}>
              <QrCode className="w-4 h-4" /> Generate a pickup QR
            </Link>
          </div>
        </>
      )}

      <Section id="add-person" icon={UserPlus} title="Add a pickup person" hint="An uncle, grandparent, driver or family friend.">
        <AddPersonForm parentId={parentId} />
        <div className="mt-5">
          <InfoNote>The guard at the gate sees this name on the QR code, so use the name on their ID.</InfoNote>
        </div>
      </Section>
    </div>
  );
}
