import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { currentUser, getOwned, requireUser } from "./auth";
import { achievementFields } from "./schema";

const MAX_ACHIEVEMENTS_PER_ROLE = 100;

export const listByRole = query({
  args: { roleId: v.id("roles") },
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (user === null) {
      // Authenticated but owns nothing yet, so this role can't be theirs.
      throw new Error("Not found");
    }
    const role = await getOwned(ctx, user, "roles", args.roleId);
    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_roleId", (q) => q.eq("roleId", role._id))
      .take(MAX_ACHIEVEMENTS_PER_ROLE);
    return achievements.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: { roleId: v.id("roles"), ...achievementFields },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    // Proves the caller owns the parent role before attaching to it.
    await getOwned(ctx, user, "roles", args.roleId);
    return await ctx.db.insert("achievements", { userId: user._id, ...args });
  },
});

export const update = mutation({
  // roleId is deliberately not updatable — moving an achievement between
  // roles is a delete+create, not a patch.
  args: {
    id: v.id("achievements"),
    coreFact: v.optional(achievementFields.coreFact),
    centrality: v.optional(achievementFields.centrality),
    skills: v.optional(achievementFields.skills),
    domains: v.optional(achievementFields.domains),
    metrics: v.optional(achievementFields.metrics),
    evidenceNote: achievementFields.evidenceNote,
    phrasingVariants: v.optional(achievementFields.phrasingVariants),
    order: v.optional(achievementFields.order),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { id, ...fields } = args;
    await getOwned(ctx, user, "achievements", id);
    await ctx.db.patch("achievements", id, fields);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("achievements") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await getOwned(ctx, user, "achievements", args.id);
    await ctx.db.delete("achievements", args.id);
    return null;
  },
});
