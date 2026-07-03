import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const centrality = v.union(v.literal("primary"), v.literal("secondary"));

// Shared between the table definitions and the CRUD function arg validators
// (convex/profiles.ts etc.) so the two can't drift. userId is never part of
// these: it is always derived from ctx.auth, never accepted from the client.
export const profileFields = {
  headline: v.optional(v.string()),
  location: v.optional(v.string()),
  links: v.optional(
    v.array(v.object({ label: v.string(), url: v.string() })),
  ),
  contact: v.optional(
    v.object({
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
    }),
  ),
  primaryIdentity: v.string(),
  canonicalYearsExperience: v.optional(v.number()),
  education: v.optional(
    v.array(
      v.object({
        institution: v.string(),
        credential: v.string(),
        field: v.optional(v.string()),
        year: v.optional(v.number()),
      }),
    ),
  ),
};

export const roleFields = {
  company: v.string(),
  companyAka: v.array(v.string()),
  title: v.string(),
  titleVariants: v.array(v.string()),
  location: v.optional(v.string()),
  startDate: v.string(), // "YYYY-MM"
  endDate: v.union(v.string(), v.null()), // null = present role
  context: v.optional(v.string()),
  order: v.number(), // manual sort — _creationTime is not the display order
};

export const achievementFields = {
  coreFact: v.string(),
  centrality,
  skills: v.array(v.string()),
  domains: v.array(v.string()),
  metrics: v.array(
    v.object({
      value: v.string(),
      meaning: v.string(),
      verified: v.boolean(),
    }),
  ),
  evidenceNote: v.optional(v.string()),
  phrasingVariants: v.array(v.string()),
  order: v.number(),
};

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),

  profiles: defineTable({
    userId: v.id("users"),
    ...profileFields,
  }).index("by_userId", ["userId"]),

  roles: defineTable({
    userId: v.id("users"),
    ...roleFields,
  }).index("by_userId", ["userId"]),

  achievements: defineTable({
    userId: v.id("users"),
    roleId: v.id("roles"),
    ...achievementFields,
  })
    .index("by_userId", ["userId"])
    .index("by_roleId", ["roleId"]),

  skills: defineTable({
    userId: v.id("users"),
    name: v.string(),
    aliases: v.array(v.string()),
    centrality,
    proficiency: v.optional(v.string()),
    lastUsed: v.optional(v.string()), // "YYYY-MM"
    backedByAchievementIds: v.array(v.id("achievements")),
  }).index("by_userId", ["userId"]),

  applications: defineTable({
    userId: v.id("users"),
    company: v.string(),
    roleTitle: v.string(),
    sourceUrl: v.optional(v.string()),
    jdCaptureMethod: v.union(
      v.literal("url"),
      v.literal("paste"),
      v.literal("image"),
    ),
    jdSnapshot: v.string(),
    jdArchivedUrl: v.optional(v.string()),
    // Shape is defined by the OpenAI parsing PR; typing it now would be a
    // guess we'd have to migrate. Tightened when that PR lands.
    jdParsed: v.optional(v.any()),
    status: v.union(
      v.literal("draft"),
      v.literal("applied"),
      v.literal("interviewing"),
      v.literal("rejected"),
      v.literal("offer"),
    ),
    appliedAt: v.optional(v.number()),
    // Same as jdParsed — shape owned by the coverage-engine PR.
    coverageReport: v.optional(v.any()),
    notes: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_status", ["userId", "status"]),

  tailoredResumes: defineTable({
    userId: v.id("users"),
    applicationId: v.id("applications"),
    selectedAchievementIds: v.array(v.id("achievements")),
    chosenPhrasings: v.array(
      v.object({
        achievementId: v.id("achievements"),
        phrasing: v.string(),
      }),
    ),
    chosenTitle: v.optional(v.string()),
    chosenSummary: v.optional(v.string()),
    educationIncluded: v.boolean(),
    skillsOrder: v.array(v.id("skills")),
    docxStorageId: v.optional(v.id("_storage")),
    pdfStorageId: v.optional(v.id("_storage")),
    generatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_applicationId", ["applicationId"]),

  supplementalAnswers: defineTable({
    userId: v.id("users"),
    applicationId: v.id("applications"),
    question: v.string(),
    answer: v.string(),
    groundedInAchievementIds: v.array(v.id("achievements")),
  })
    .index("by_userId", ["userId"])
    .index("by_applicationId", ["applicationId"]),
});
