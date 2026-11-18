/**
 * The account a person signed in with, where their password lives. Usually the
 * same as the side they are on, but a teacher looking at their children (the
 * parent side) still signed in with, and has the password on, their staff account.
 */
export function loginAccount(user: any): { table: "staff" | "parents"; id: string } {
  return {
    table: user?.loginTable ?? (user?.role === "parent" ? "parents" : "staff"),
    id: user?.loginId ?? user?.id,
  };
}
