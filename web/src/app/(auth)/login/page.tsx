import { Suspense } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Sign in | TaskFlow" };

async function LoginFormWithNext({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const { next } = await searchParams;
  const target = typeof next === "string" && next.startsWith("/") ? next : "/";

  return <LoginForm next={target} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your TaskFlow account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <LoginFormWithNext searchParams={searchParams} />
        </Suspense>
        <p className="text-muted-foreground text-center text-sm">
          No account?{" "}
          <Link href="/register" className="text-foreground underline">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
