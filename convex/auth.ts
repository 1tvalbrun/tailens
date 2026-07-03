import { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";

type AuthenticatedCtx = QueryCtx | MutationCtx | ActionCtx;

// Call at the top of every user-owned query/mutation/action, then filter every
// read/write by the returned userId — never trust a userId passed as an arg.
export async function requireUser(ctx: AuthenticatedCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Unauthenticated");
  }
  return identity.tokenIdentifier;
}
