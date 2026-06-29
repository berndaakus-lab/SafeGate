import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parentId = (session.user as any).id;
    const { studentId, authorizedPersonId } = await req.json();

    if (!studentId || !authorizedPersonId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify the student belongs to this parent
    const student = await prisma.student.findFirst({ where: { id: studentId, parentId } });
    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Verify the person belongs to this parent
    const person = await prisma.authorizedPerson.findFirst({ where: { id: authorizedPersonId, parentId } });
    if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Code expires end of today
    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999);

    const pickupCode = await prisma.pickupCode.create({
      data: { studentId, parentId, authorizedPersonId, expiresAt },
    });

    // Build the verification URL
    const verifyUrl = `${process.env.NEXTAUTH_URL}/guard/verify/${pickupCode.code}`;

    const qrUrl = await QRCode.toDataURL(verifyUrl, {
      width: 400,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    });

    return NextResponse.json({
      qrUrl,
      code: pickupCode.code,
      expiresAt: pickupCode.expiresAt,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
