import { mutation, query } from "./_generated/server";
import { currentUser, requireUser } from "./auth";
import { profileFields } from "./schema";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    if (user === null) {
      return null;
    }
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
  },
});

export const upsert = mutation({
  args: profileFields,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (existing === null) {
      await ctx.db.insert("profiles", { userId: user._id, ...args });
    } else {
      // replace, not patch: upsert takes the full profile, so omitted
      // optional fields are cleared rather than silently kept.
      await ctx.db.replace("profiles", existing._id, {
        userId: user._id,
        ...args,
      });
    }
    return null;
  },
});
