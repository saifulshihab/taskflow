import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        The page you are looking for does not exist or you do not have access.
      </p>
      <Link href="/" className={buttonVariants()}>
        Go home
      </Link>
    </main>
  );
}
