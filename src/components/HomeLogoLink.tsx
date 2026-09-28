"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { signOutUser } from "@/lib/sign-out";
import type { ReactNode } from "react";

export default function HomeLogoLink({
  size = 32,
  textClassName = "font-bold text-lg text-slate-900",
  className = "flex items-center gap-2",
  children,
}: {
  size?: number;
  textClassName?: string;
  className?: string;
  children?: ReactNode;
}) {
  const { data: session } = useSession();

  function handleClick(e: React.MouseEvent) {
    if (!session) return; // plain navigation, let the Link/anchor behavior happen

    e.preventDefault();
    const confirmed = window.confirm(
      "You're signed in. Going to the homepage will sign you out. Continue?"
    );
    if (confirmed) {
      signOutUser("/");
    }
  }

  return (
    <a href="/" onClick={handleClick} className={className}>
      <Image src="/icon-192.png" alt="VerifyGate" width={size} height={size} className="rounded-lg" />
      <span className={textClassName}>VerifyGate</span>
      {children}
    </a>
  );
}
