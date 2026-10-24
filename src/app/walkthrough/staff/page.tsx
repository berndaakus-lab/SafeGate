import type { Metadata } from "next";
import Walkthrough from "../Walkthrough";

export const metadata: Metadata = {
  title: "Pickup duty walkthrough",
  description: "A short walkthrough for guards and teachers on duty: scan, check and confirm a pickup.",
  robots: { index: false, follow: false },
};

// Open /walkthrough/staff?school=Your%20School%20Name to put the school's name on the first and last screens
export default async function StaffWalkthroughPage({ searchParams }: { searchParams: Promise<{ school?: string | string[] }> }) {
  const { school } = await searchParams;
  const name = (Array.isArray(school) ? school[0] : school)?.trim().slice(0, 80) ?? "";
  return <Walkthrough school={name} audience="staff" />;
}
