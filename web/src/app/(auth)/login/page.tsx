import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in | TaskFlow" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const target = typeof next === "string" && next.startsWith("/") ? next : "/";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your TaskFlow account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoginForm next={target} />
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
