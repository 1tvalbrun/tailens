import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { currentUser, getOwned, requireUser } from "./auth";
import { roleFields } from "./schema";

// Generous cap on a bounded-by-reality set (a career's worth of roles);
// guidelines require bounded reads over .collect().
const MAX_ROLES = 100;

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    if (user === null) {
      return [];
    }
    const roles = await ctx.db
      .query("roles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(MAX_ROLES);
    return roles.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: roleFields,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("roles", { userId: user._id, ...args });
  },
});

export const update = mutation({
  args: {
    id: v.id("roles"),
    company: v.optional(roleFields.company),
    companyAka: v.optional(roleFields.companyAka),
    title: v.optional(roleFields.title),
    titleVariants: v.optional(roleFields.titleVariants),
    location: roleFields.location,
    startDate: v.optional(roleFields.startDate),
    endDate: v.optional(roleFields.endDate),
    context: roleFields.context,
    order: v.optional(roleFields.order),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { id, ...fields } = args;
    await getOwned(ctx, user, "roles", id);
    await ctx.db.patch("roles", id, fields);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("roles") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await getOwned(ctx, user, "roles", args.id);
    // Cascade: achievements belong to their role; orphaned rows would leak
    // into by_userId listings forever.
    for (;;) {
      const batch = await ctx.db
        .query("achievements")
        .withIndex("by_roleId", (q) => q.eq("roleId", args.id))
        .take(100);
      if (batch.length === 0) {
        break;
      }
      for (const achievement of batch) {
        await ctx.db.delete("achievements", achievement._id);
      }
    }
    await ctx.db.delete("roles", args.id);
    return null;
  },
});
