import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Ownership model: every function derives the caller from ctx.auth — a
// userId is NEVER accepted as an argument. Mutations call requireUser,
// queries call currentUser, and every single-document read goes through
// getOwned so an ownership check can't be skipped.
//
// User rows are get-or-created here on first mutation. A Clerk webhook
// (user.updated/user.deleted sync) is a future follow-up; get-or-create
// keeps this self-contained until then.

async function requireIdentity(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Unauthenticated");
  }
  return identity;
}

function userByToken(ctx: QueryCtx, tokenIdentifier: string) {
  return ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier),
    )
    .unique();
}

/** For queries, which cannot insert. Throws if unauthenticated; returns null
 * for an authenticated caller whose row doesn't exist yet (they have no data
 * — treat as empty, don't error). */
export async function currentUser(
  ctx: QueryCtx,
): Promise<Doc<"users"> | null> {
  const identity = await requireIdentity(ctx);
  return await userByToken(ctx, identity.tokenIdentifier);
}

/** For mutations: resolves the caller to a users row, creating it on first
 * call. The returned _id is the internal user id every table references. */
export async function requireUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await requireIdentity(ctx);
  const existing = await userByToken(ctx, identity.tokenIdentifier);
  if (existing !== null) {
    return existing;
  }
  const userId = await ctx.db.insert("users", {
    tokenIdentifier: identity.tokenIdentifier,
    // The Clerk "convex" JWT template includes email; empty string only if a
    // misconfigured template omits the claim.
    email: identity.email ?? "",
    name: identity.name,
    imageUrl: identity.pictureUrl,
  });
  const created = await ctx.db.get("users", userId);
  if (created === null) {
    throw new Error("Failed to create user");
  }
  return created;
}

type OwnedTable =
  | "profiles"
  | "roles"
  | "achievements"
  | "skills"
  | "applications"
  | "tailoredResumes"
  | "supplementalAnswers";

/** Loads a document and proves the caller owns it. Missing and foreign-owned
 * both throw the same error so existence of other users' data can't leak. */
export async function getOwned<Table extends OwnedTable>(
  ctx: QueryCtx,
  user: Doc<"users">,
  table: Table,
  id: Id<Table>,
): Promise<Doc<Table>> {
  const doc = await ctx.db.get(table, id);
  if (doc === null || doc.userId !== user._id) {
    throw new Error("Not found");
  }
  return doc;
}
