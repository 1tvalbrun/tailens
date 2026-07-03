import type { Metadata } from "next";

export const metadata: Metadata = { title: "Applications" };

export default function ApplicationsPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
      <h2 className="text-lg font-medium text-ink">Coming soon</h2>
      <p className="mt-2 text-base text-ink-2">
        Every target you&rsquo;re pursuing, and how far along each one is, will
        live here.
      </p>
    </section>
  );
}
