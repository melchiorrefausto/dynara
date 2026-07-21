"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DynaraLogo } from "@/components/ui/logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setMessage("Password recovery requires Supabase to be configured for this workspace.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-soft">
          <Link href="/" className="mb-8 inline-flex">
            <DynaraLogo />
          </Link>

          <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-primary via-fuchsia-500 to-cyan-400 text-white shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-normal">Check your email</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            If an account exists for <span className="font-semibold text-slate-800">{email}</span>, a password
            reset link is on its way.
          </p>
          <div className="mt-6 rounded-lg border border-border bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            The link redirects back to <span className="font-semibold">/auth/callback</span> and then into a page
            where you can set a new password.
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
          <h1 className="text-2xl font-bold tracking-normal">Reset your password</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Enter the email on your account and we will send you a link to set a new password.
          </p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Email</span>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </label>

          {message ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p> : null}

          <Button className="w-full" size="lg" variant="dark" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link
            className="bg-gradient-to-r from-primary via-fuchsia-500 to-cyan-500 bg-clip-text font-semibold text-transparent"
            href="/login"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
