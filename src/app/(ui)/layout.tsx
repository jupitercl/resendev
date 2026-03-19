export default function UILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight">
          <a href="/">Resendev</a>
        </h1>
        <span className="text-xs text-muted-foreground font-mono">localhost:3099</span>
      </header>
      <main className="flex-1 px-6 py-4">
        {children}
      </main>
    </div>
  );
}
