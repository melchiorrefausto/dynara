"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DynaraLogo } from "@/components/ui/logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();

    if (supabase) {
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { name },
                emailRedirectTo: `${window.location.origin}/auth/callback`
              }
            });

      if (result.error) {
        setMessage(
          result.error.message.toLowerCase().includes("email not confirmed")
            ? "Please confirm your email before signing in."
            : result.error.message
        );
        setLoading(false);
        return;
      }

      if (mode === "signup" && !result.data.session) {
        setConfirmationEmail(email);
        setLoading(false);
        return;
      }
    } else {
      localStorage.setItem(
        "dynara-session",
        JSON.stringify({ email, name, createdAt: new Date().toISOString() })
      );
    }

    router.push("/dashboard");
  }

  if (confirmationEmail) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-soft">
          <Link href="/" className="mb-8 inline-flex">
            <DynaraLogo />
          </Link>

          <div className="grid h-12 w-12 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-normal">Check your email</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Supabase accepted the signup for <span className="font-semibold text-slate-800">{confirmationEmail}</span>.
            Open the confirmation email to finish creating your Dynara account.
          </p>
          <div className="mt-6 rounded-lg border border-border bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            The confirmation link redirects back to <span className="font-semibold">/auth/callback</span> and then
            into your dashboard.
          </div>
          <Button asChild className="mt-6 w-full" variant="secondary">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-soft">
        <Link href="/" className="mb-8 inline-flex">
          <DynaraLogo />
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-normal">
            {mode === "login" ? "Sign in to Dynara" : "Create your Dynara account"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {mode === "login"
              ? "Continue to your adaptive workspace dashboard."
              : "Connect your tools and generate your first adaptive interface."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          {mode === "signup" ? (
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Name</span>
              <div className="relative">
                <UserRound className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" value={name} onChange={(event) => setName(event.target.value)} />
              </div>
            </label>
          ) : null}
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Email</span>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Password</span>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>

          {message ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p> : null}

          <Button className="w-full" size="lg" disabled={loading}>
            {loading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "New to Dynara?" : "Already have an account?"}{" "}
          <Link className="font-semibold text-primary" href={mode === "login" ? "/signup" : "/login"}>
            {mode === "login" ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </div>
    </main>
  );
}
