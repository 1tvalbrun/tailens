import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tailor" };

export default function TailorPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
      <h2 className="text-lg font-medium text-ink">Coming soon</h2>
      <p className="mt-2 text-base text-ink-2">
        Measuring your background against a target — covered, transferable,
        and gaps — will live here.
      </p>
    </section>
  );
}
