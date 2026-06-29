import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { pickupCodeId, studentId, authorizedPersonId } = await req.json();

    if (!pickupCodeId || !studentId || !authorizedPersonId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check not already used
    const existing = await prisma.pickupLog.findFirst({ where: { pickupCodeId } });
    if (existing) {
      return NextResponse.json({ error: "Already used" }, { status: 409 });
    }

    const [log] = await prisma.$transaction([
      prisma.pickupLog.create({
        data: { pickupCodeId, studentId, authorizedPersonId },
      }),
      prisma.pickupCode.update({
        where: { id: pickupCodeId },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json(log, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
