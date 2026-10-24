import type { Metadata } from "next";
import Walkthrough from "./Walkthrough";

export const metadata: Metadata = {
  title: "How pickup works",
  description: "A short walkthrough of how parents, guards and schools use VerifyGate.",
  robots: { index: false, follow: false },
};

// Open /walkthrough?school=Your%20School%20Name to put the school's name on the first and last screens
export default async function WalkthroughPage({ searchParams }: { searchParams: Promise<{ school?: string | string[] }> }) {
  const { school } = await searchParams;
  const name = (Array.isArray(school) ? school[0] : school)?.trim().slice(0, 80) ?? "";
  return <Walkthrough school={name} />;
}
