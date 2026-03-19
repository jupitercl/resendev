export default function UILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold tracking-tight">
            <a href="/">Resendev</a>
          </h1>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/" className="text-muted-foreground hover:text-foreground">Emails</a>
            <a href="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</a>
            <a href="/settings" className="text-muted-foreground hover:text-foreground">Settings</a>
          </nav>
        </div>
        <span className="text-xs text-muted-foreground font-mono">localhost:3099</span>
      </header>
      <main className="flex-1 px-6 py-4">
        {children}
      </main>
    </div>
  );
}
