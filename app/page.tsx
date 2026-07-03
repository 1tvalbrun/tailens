import {
  ClerkLoading,
  ClerkLoaded,
  Show,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-3">
          tailens
        </p>

        <ClerkLoading>
          <p className="mt-8 font-sans text-sm text-ink-3">Loading…</p>
        </ClerkLoading>

        <ClerkLoaded>
          <Show
            when="signed-in"
            fallback={
              <>
                <h1 className="mt-4 font-display text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
                  See how your background covers any target.
                </h1>
                <p className="mx-auto mt-4 max-w-xs font-sans text-base leading-7 text-ink-2">
                  The facts of your real experience, measured against what a role
                  actually asks for.
                </p>
                <div className="mt-8 flex justify-center">
                  <SignInButton mode="modal">
                    <button className="rounded-lg bg-brand px-5 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-brand-hover">
                      Sign in
                    </button>
                  </SignInButton>
                </div>
              </>
            }
          >
            <h1 className="mt-4 font-display text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
              You&rsquo;re in.
            </h1>
            <p className="mx-auto mt-4 max-w-xs font-sans text-base leading-7 text-ink-2">
              You&rsquo;re signed in with Clerk, and Convex is wired to your
              identity — ready for the app&rsquo;s data.
            </p>
            <div className="mt-8 flex justify-center">
              <UserButton showName />
            </div>
          </Show>
        </ClerkLoaded>
      </div>
    </main>
  );
}
