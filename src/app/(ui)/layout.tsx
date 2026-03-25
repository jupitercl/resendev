import { Sidebar } from "@/components/sidebar";

export default function UILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="px-8 py-6 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
