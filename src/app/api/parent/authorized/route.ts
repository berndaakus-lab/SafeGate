import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, relation, parentId } = await req.json();

    if (!name || !parentId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const person = await prisma.authorizedPerson.create({
      data: { name, phone: phone || null, relation: relation || null, parentId },
    });

    return NextResponse.json(person, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
