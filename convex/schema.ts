import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  incidents: defineTable({
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("fire"),
      v.literal("flood"),
      v.literal("earthquake"),
      v.literal("storm"),
      v.literal("accident"),
      v.literal("medical"),
      v.literal("other")
    ),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    status: v.union(
      v.literal("reported"),
      v.literal("investigating"),
      v.literal("responding"),
      v.literal("resolved")
    ),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.string(),
    }),
    reportedBy: v.id("users"),
    assignedTo: v.optional(v.id("users")),
    images: v.optional(v.array(v.id("_storage"))),
    tags: v.array(v.string()),
    contactInfo: v.optional(v.object({
      phone: v.string(),
      email: v.string(),
    })),
  })
    .index("by_type", ["type"])
    .index("by_severity", ["severity"])
    .index("by_status", ["status"])
    .index("by_reporter", ["reportedBy"])
    .searchIndex("search_incidents", {
      searchField: "description",
      filterFields: ["type", "severity", "status"],
    }),

  resources: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("personnel"),
      v.literal("vehicle"),
      v.literal("equipment"),
      v.literal("medical"),
      v.literal("shelter"),
      v.literal("food"),
      v.literal("water")
    ),
    quantity: v.number(),
    available: v.number(),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.string(),
    }),
    status: v.union(
      v.literal("available"),
      v.literal("deployed"),
      v.literal("maintenance"),
      v.literal("unavailable")
    ),
    assignedTo: v.optional(v.id("incidents")),
    contactPerson: v.string(),
    contactPhone: v.string(),
    description: v.optional(v.string()),
  })
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_incident", ["assignedTo"]),

  volunteers: defineTable({
    userId: v.id("users"),
    skills: v.array(v.string()),
    availability: v.union(
      v.literal("available"),
      v.literal("busy"),
      v.literal("unavailable")
    ),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.string(),
    }),
    phone: v.string(),
    emergencyContact: v.object({
      name: v.string(),
      phone: v.string(),
    }),
    certifications: v.array(v.string()),
    assignedIncident: v.optional(v.id("incidents")),
  })
    .index("by_user", ["userId"])
    .index("by_availability", ["availability"])
    .index("by_incident", ["assignedIncident"]),

  alerts: defineTable({
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("emergency"),
      v.literal("warning"),
      v.literal("info"),
      v.literal("update")
    ),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    targetArea: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      radius: v.number(), // in kilometers
    })),
    isActive: v.boolean(),
    expiresAt: v.optional(v.number()),
    createdBy: v.id("users"),
    relatedIncident: v.optional(v.id("incidents")),
  })
    .index("by_active", ["isActive"])
    .index("by_type", ["type"])
    .index("by_severity", ["severity"])
    .index("by_incident", ["relatedIncident"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("incident_assigned"),
      v.literal("resource_requested"),
      v.literal("alert_issued"),
      v.literal("status_update")
    ),
    isRead: v.boolean(),
    relatedId: v.optional(v.string()), // ID of related incident, resource, etc.
  })
    .index("by_user", ["userId"])
    .index("by_read_status", ["userId", "isRead"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
