import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import AddPersonForm from "./AddPersonForm";
import EditPersonButton from "./EditPersonButton";
import Link from "next/link";
import { Phone, Heart, UserPlus, UserCheck, QrCode } from "lucide-react";
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
                <div key={person.id} className="flex items-center gap-4 px-5 sm:px-6 py-4">
                  <div className="w-11 h-11 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-700 shrink-0">
                    {person.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{person.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {person.relation && (
                        <Badge tone="purple"><Heart className="w-3 h-3" /> {person.relation}</Badge>
                      )}
                      {person.phone && (
                        <span className="text-sm text-slate-600 inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {person.phone}
                        </span>
                      )}
                    </div>
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
