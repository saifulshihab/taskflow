export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">TaskFlow</h1>
          <p className="text-muted-foreground text-sm">
            Plan work, track tasks, keep the trail.
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
