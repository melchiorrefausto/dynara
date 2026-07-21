"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynaraLogo } from "@/components/ui/logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function finishAuth() {
      const supabase = createSupabaseBrowserClient();
      const params = new URLSearchParams(window.location.search);
      const next = (params.get("next") || "/dashboard") as Route;

      if (!supabase) {
        router.replace(next);
        return;
      }

      const code = params.get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
      }

      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (!data.session) {
        setError("No confirmed session was found. Try signing in after confirming your email.");
        return;
      }

      router.replace(next);
    }

    finishAuth();
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 text-center shadow-soft">
        <Link href="/" className="mb-8 inline-flex">
          <DynaraLogo />
        </Link>

        {error ? (
          <>
            <h1 className="text-2xl font-bold tracking-normal">Confirmation needs attention</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{error}</p>
            <Button asChild className="mt-6" variant="secondary">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </>
        ) : (
          <>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <h1 className="mt-6 text-2xl font-bold tracking-normal">Confirming your account</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              We are finishing your Dynara session and redirecting you to the dashboard.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
