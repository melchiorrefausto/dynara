"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DynaraLogo } from "@/components/ui/logo";

function ErrorMessage() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "Something went wrong confirming your account.";

  return (
    <>
      <h1 className="text-2xl font-bold tracking-normal">Confirmation needs attention</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>
    </>
  );
}

export default function AuthCallbackErrorPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 text-center shadow-soft">
        <Link href="/" className="mb-8 inline-flex">
          <DynaraLogo />
        </Link>

        <Suspense fallback={<h1 className="text-2xl font-bold tracking-normal">Confirmation needs attention</h1>}>
          <ErrorMessage />
        </Suspense>

        <Button asChild className="mt-6" variant="secondary">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    </main>
  );
}
