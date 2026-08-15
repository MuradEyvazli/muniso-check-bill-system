import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import PosShell from "@/components/layout/PosShell";

export default function PosLayout({ children }) {
  const session = getSession();
  if (!session) {
    redirect("/login");
  }

  return <PosShell user={session}>{children}</PosShell>;
}
