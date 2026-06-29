import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GenerateForm from "./GenerateForm";

export default async function GeneratePage() {
  const session = await getServerSession(authOptions);
  const parentId = (session?.user as any)?.id;

  const [children, authorizedPeople] = await Promise.all([
    prisma.student.findMany({ where: { parentId }, orderBy: { name: "asc" } }),
    prisma.authorizedPerson.findMany({ where: { parentId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-6 max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Generate Pickup QR</h1>
        <p className="text-slate-500 mt-1">
          Create a one-time QR code for today&apos;s pickup. Send it to the person collecting your child.
        </p>
      </div>

      <GenerateForm
        children={children}
        authorizedPeople={authorizedPeople}
      />
    </div>
  );
}
