"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DynaraLogo } from "@/components/ui/logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        setMessage("Password recovery requires Supabase to be configured for this workspace.");
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setMessage("This reset link is invalid or has expired. Request a new one to continue.");
        return;
      }

      setReady(true);
    }

    checkSession();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    setTimeout(() => router.replace("/dashboard"), 1500);
  }

  if (done) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-soft">
          <Link href="/" className="mb-8 inline-flex">
            <DynaraLogo />
          </Link>

          <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-primary via-fuchsia-500 to-cyan-400 text-white shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-normal">Password updated</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Taking you to your dashboard...
          </p>
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
          <h1 className="text-2xl font-bold tracking-normal">Set a new password</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Choose a new password for your Dynara account.
          </p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">New password</span>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10 pr-10"
                type={showPassword ? "text" : "password"}
                required
                disabled={!ready}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Confirm new password</span>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                type={showPassword ? "text" : "password"}
                required
                disabled={!ready}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
          </label>

          {message ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p> : null}

          <Button className="w-full" size="lg" variant="dark" disabled={loading || !ready}>
            {loading ? "Updating..." : "Update password"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            className="bg-gradient-to-r from-primary via-fuchsia-500 to-cyan-500 bg-clip-text font-semibold text-transparent"
            href="/forgot-password"
          >
            Request a new reset link
          </Link>
        </p>
      </div>
    </main>
  );
}
