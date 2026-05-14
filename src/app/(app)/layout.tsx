import Nav from "@/components/layout/Nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1">
      <Nav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
