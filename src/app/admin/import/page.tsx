import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ImportClient from "./ImportClient";

export default async function ImportPage() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;
  return <ImportClient schoolId={schoolId} />;
}
