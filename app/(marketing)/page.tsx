import Link from "next/link";
import {
  ClerkLoading,
  ClerkLoaded,
  Show,
  SignInButton,
} from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-3">
          tailens
        </p>

        <ClerkLoading>
          <p className="mt-8 text-sm text-ink-2">Loading…</p>
        </ClerkLoading>

        <ClerkLoaded>
          <Show
            when="signed-in"
            fallback={
              <>
                <h1 className="mt-4 text-2xl font-semibold text-ink">
                  See how your background covers any target.
                </h1>
                <p className="mx-auto mt-4 max-w-xs text-base text-ink-2">
                  The facts of your real experience, measured against what a
                  role actually asks for.
                </p>
                <div className="mt-8 flex justify-center">
                  <SignInButton mode="modal">
                    <Button size="lg">Sign in</Button>
                  </SignInButton>
                </div>
              </>
            }
          >
            <h1 className="mt-4 text-2xl font-semibold text-ink">
              Welcome back.
            </h1>
            <p className="mx-auto mt-4 max-w-xs text-base text-ink-2">
              Pick up where you left off.
            </p>
            <div className="mt-8 flex justify-center">
              <Button asChild size="lg">
                <Link href="/applications">Open Tailens</Link>
              </Button>
            </div>
          </Show>
        </ClerkLoaded>
      </div>
    </main>
  );
}
