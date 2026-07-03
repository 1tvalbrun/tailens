// Set per deployment (issuer domains are public — this is env parity):
//   npx convex env set CLERK_ISSUER_URL https://<instance>.clerk.accounts.dev
const authConfig = {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_URL!,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
