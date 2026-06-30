import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function GuardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  // Admins and superadmins can also access guard pages (for testing)
  if (!session || !["guard", "teacher", "admin", "superadmin"].includes(role)) {
    redirect("/login");
  }

  return <>{children}</>;
}
