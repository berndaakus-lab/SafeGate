"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import IdleSessionGuard from "./IdleSessionGuard";

export default function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <NextAuthSessionProvider session={session}>
      {session && <IdleSessionGuard />}
      {children}
    </NextAuthSessionProvider>
  );
}
