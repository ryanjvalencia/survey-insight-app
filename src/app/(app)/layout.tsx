import { redirect } from "next/navigation";
import Nav from "@/components/layout/Nav";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // proxy.ts already redirects signed-out users; this is defense in depth.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col flex-1">
      <Nav email={user.email} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
