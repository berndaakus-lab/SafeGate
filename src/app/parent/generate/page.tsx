import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import GenerateForm from "./GenerateForm";
import { PageHeader } from "@/components/ui";

export default async function GeneratePage() {
  const session = await getServerSession(authOptions);
  const parentId = (session?.user as any)?.id;

  const [{ data: children }, { data: authorizedPeople }] = await Promise.all([
    supabaseAdmin.from("students").select("id, name, class_name").eq("parent_id", parentId).order("name"),
    supabaseAdmin.from("authorized_persons").select("id, name, relation").eq("parent_id", parentId).order("name"),
  ]);

  return (
    <div className="p-6 max-w-lg">
      <PageHeader
        title="Generate Pickup QR"
        subtitle="Make a one-time QR code for today's pickup, then send it to the person collecting."
      />
      <GenerateForm children={children ?? []} authorizedPeople={authorizedPeople ?? []} />
    </div>
  );
}
