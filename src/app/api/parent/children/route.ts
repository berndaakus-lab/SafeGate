import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, className, parentId, schoolId } = await req.json();

    if (!name || !parentId || !schoolId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const student = await prisma.student.create({
      data: { name, className: className || null, parentId, schoolId },
    });

    return NextResponse.json(student, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
