import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AddPersonForm from "./AddPersonForm";
import { UserCheck, Phone, Heart } from "lucide-react";

export default async function AuthorizedPage() {
  const session = await getServerSession(authOptions);
  const parentId = (session?.user as any)?.id;

  const people = await prisma.authorizedPerson.findMany({
    where: { parentId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pickup Persons</h1>
        <p className="text-slate-500 mt-1">People you trust to pick up your children.</p>
      </div>

      {people.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6">
          <div className="divide-y divide-slate-50">
            {people.map((person) => (
              <div key={person.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-11 h-11 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-700">
                  {person.name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{person.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {person.relation && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Heart className="w-3 h-3" /> {person.relation}
                      </span>
                    )}
                    {person.phone && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {person.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-900 mb-1">Add Authorized Person</h2>
        <p className="text-sm text-slate-400 mb-5">
          Add anyone you trust — uncle, grandparent, driver, family friend.
        </p>
        <AddPersonForm parentId={parentId} />
      </div>
    </div>
  );
}
