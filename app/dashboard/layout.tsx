import { GroupProvider } from "@/lib/GroupContext";
import { Sidebar } from "@/app/dashboard/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GroupProvider>
      <div className="min-h-screen flex flex-col">
        <header className="w-full">
          <Sidebar />
        </header>
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </GroupProvider>
  );
}

