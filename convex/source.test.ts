/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const roleInput = {
  company: "Acme",
  companyAka: ["Acme Corp"],
  title: "Staff Engineer",
  titleVariants: ["Principal Engineer"],
  startDate: "2021-03",
  endDate: null,
  order: 1,
};

const achievementInput = {
  coreFact: "Cut p95 latency 40% by rewriting the query planner",
  centrality: "primary" as const,
  skills: ["profiling"],
  domains: ["infrastructure"],
  metrics: [
    { value: "40%", meaning: "p95 latency reduction", verified: true },
  ],
  phrasingVariants: [],
  order: 1,
};

function setup() {
  const t = convexTest(schema, modules);
  const asA = t.withIdentity({
    subject: "user_a",
    tokenIdentifier: "test|user_a",
    email: "a@test.dev",
  });
  const asB = t.withIdentity({
    subject: "user_b",
    tokenIdentifier: "test|user_b",
    email: "b@test.dev",
  });
  return { t, asA, asB };
}

describe("cross-user isolation", () => {
  test("user B cannot read, modify, or attach to user A's data", async () => {
    const { asA, asB } = setup();
    const roleId = await asA.mutation(api.roles.create, roleInput);
    const achievementId = await asA.mutation(api.achievements.create, {
      roleId,
      ...achievementInput,
    });
    await asA.mutation(api.profiles.upsert, {
      primaryIdentity: "Platform engineer",
    });

    // Reads: B sees emptiness, never A's data.
    expect(await asB.query(api.roles.list, {})).toEqual([]);
    expect(await asB.query(api.profiles.get, {})).toBeNull();
    await expect(
      asB.query(api.achievements.listByRole, { roleId }),
    ).rejects.toThrow("Not found");

    // Writes against A's documents: every one refuses.
    await expect(
      asB.mutation(api.roles.update, { id: roleId, title: "Hijacked" }),
    ).rejects.toThrow("Not found");
    await expect(
      asB.mutation(api.roles.remove, { id: roleId }),
    ).rejects.toThrow("Not found");
    await expect(
      asB.mutation(api.achievements.update, {
        id: achievementId,
        coreFact: "Hijacked",
      }),
    ).rejects.toThrow("Not found");
    await expect(
      asB.mutation(api.achievements.remove, { id: achievementId }),
    ).rejects.toThrow("Not found");
    await expect(
      asB.mutation(api.achievements.create, { roleId, ...achievementInput }),
    ).rejects.toThrow("Not found");

    // A's data survived every attempt, unchanged.
    expect(await asA.query(api.roles.list, {})).toMatchObject([
      { title: "Staff Engineer" },
    ]);
    expect(
      await asA.query(api.achievements.listByRole, { roleId }),
    ).toMatchObject([{ coreFact: achievementInput.coreFact }]);
  });

  test("unauthenticated callers are rejected outright", async () => {
    const { t } = setup();
    await expect(t.query(api.roles.list, {})).rejects.toThrow(
      "Unauthenticated",
    );
    await expect(t.mutation(api.roles.create, roleInput)).rejects.toThrow(
      "Unauthenticated",
    );
  });
});

describe("source CRUD", () => {
  test("roles round-trip: ordered by order field, patchable, cascade on remove", async () => {
    const { t, asA } = setup();
    // Created out of order on purpose: list must sort by `order`, not
    // creation time.
    const laterRole = await asA.mutation(api.roles.create, {
      ...roleInput,
      company: "Beta Labs",
      order: 2,
    });
    const earlierRole = await asA.mutation(api.roles.create, roleInput);

    const listed = await asA.query(api.roles.list, {});
    expect(listed.map((role) => role._id)).toEqual([earlierRole, laterRole]);

    await asA.mutation(api.roles.update, {
      id: laterRole,
      title: "Director of Engineering",
      endDate: "2024-06",
    });
    const updated = (await asA.query(api.roles.list, {})).find(
      (role) => role._id === laterRole,
    );
    expect(updated).toMatchObject({
      title: "Director of Engineering",
      endDate: "2024-06",
      company: "Beta Labs", // untouched fields survive a patch
    });

    const achievementId = await asA.mutation(api.achievements.create, {
      roleId: laterRole,
      ...achievementInput,
    });
    expect(
      await asA.query(api.achievements.listByRole, { roleId: laterRole }),
    ).toMatchObject([{ _id: achievementId, centrality: "primary" }]);

    await asA.mutation(api.roles.remove, { id: laterRole });
    expect(await asA.query(api.roles.list, {})).toMatchObject([
      { company: "Acme" },
    ]);
    // Cascade left no orphaned achievements behind.
    const remaining = await t.run(
      async (ctx) => await ctx.db.query("achievements").collect(),
    );
    expect(remaining).toEqual([]);
  });

  test("profile upsert replaces: omitted optional fields are cleared", async () => {
    const { asA } = setup();
    await asA.mutation(api.profiles.upsert, {
      primaryIdentity: "Platform engineer",
      headline: "Builds data platforms",
    });
    await asA.mutation(api.profiles.upsert, {
      primaryIdentity: "Staff platform engineer",
    });
    const profile = await asA.query(api.profiles.get, {});
    expect(profile?.primaryIdentity).toBe("Staff platform engineer");
    expect(profile?.headline).toBeUndefined();
  });
});
