import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("reported"),
      v.literal("investigating"),
      v.literal("responding"),
      v.literal("resolved")
    )),
    type: v.optional(v.union(
      v.literal("fire"),
      v.literal("flood"),
      v.literal("earthquake"),
      v.literal("storm"),
      v.literal("accident"),
      v.literal("medical"),
      v.literal("other")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let query;
    
    if (args.status !== undefined) {
      query = ctx.db.query("incidents").withIndex("by_status", (q) => q.eq("status", args.status!));
    } else if (args.type !== undefined) {
      query = ctx.db.query("incidents").withIndex("by_type", (q) => q.eq("type", args.type!));
    } else {
      query = ctx.db.query("incidents");
    }

    const incidents = await query
      .order("desc")
      .take(args.limit || 50);

    // Get reporter info for each incident
    const incidentsWithReporter = await Promise.all(
      incidents.map(async (incident) => {
        const reporter = await ctx.db.get(incident.reportedBy);
        const assignee = incident.assignedTo ? await ctx.db.get(incident.assignedTo) : null;
        
        // Get image URLs
        const imageUrls = incident.images ? await Promise.all(
          incident.images.map(async (imageId) => {
            const url = await ctx.storage.getUrl(imageId);
            return url;
          })
        ) : [];

        return {
          ...incident,
          reporter: reporter ? { name: reporter.name, email: reporter.email } : null,
          assignee: assignee ? { name: assignee.name, email: assignee.email } : null,
          imageUrls: imageUrls.filter(Boolean),
        };
      })
    );

    return incidentsWithReporter;
  },
});

export const getById = query({
  args: { id: v.id("incidents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const incident = await ctx.db.get(args.id);
    if (!incident) {
      return null;
    }

    const reporter = await ctx.db.get(incident.reportedBy);
    const assignee = incident.assignedTo ? await ctx.db.get(incident.assignedTo) : null;
    
    // Get image URLs
    const imageUrls = incident.images ? await Promise.all(
      incident.images.map(async (imageId) => {
        const url = await ctx.storage.getUrl(imageId);
        return url;
      })
    ) : [];

    return {
      ...incident,
      reporter: reporter ? { name: reporter.name, email: reporter.email } : null,
      assignee: assignee ? { name: assignee.name, email: assignee.email } : null,
      imageUrls: imageUrls.filter(Boolean),
    };
  },
});

export const create = mutation({
  args: {
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
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.string(),
    }),
    images: v.optional(v.array(v.id("_storage"))),
    contactInfo: v.optional(v.object({
      phone: v.string(),
      email: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Auto-generate tags based on type and description
    const tags: string[] = [args.type];
    const description = args.description.toLowerCase();
    
    // Add severity-based tags
    if (args.severity === "critical" || args.severity === "high") {
      tags.push("urgent");
    }
    
    // Add keyword-based tags
    if (description.includes("injury") || description.includes("hurt")) {
      tags.push("medical-emergency");
    }
    if (description.includes("evacuation") || description.includes("evacuate")) {
      tags.push("evacuation-needed");
    }
    if (description.includes("road") || description.includes("traffic")) {
      tags.push("traffic-related");
    }

    const incidentId = await ctx.db.insert("incidents", {
      ...args,
      status: "reported",
      reportedBy: userId,
      tags,
    });

    return incidentId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("incidents"),
    status: v.union(
      v.literal("reported"),
      v.literal("investigating"),
      v.literal("responding"),
      v.literal("resolved")
    ),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const incident = await ctx.db.get(args.id);
    if (!incident) {
      throw new Error("Incident not found");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      assignedTo: args.assignedTo,
    });

    // Create notification for assigned user
    if (args.assignedTo && args.assignedTo !== incident.assignedTo) {
      await ctx.db.insert("notifications", {
        userId: args.assignedTo,
        title: "Incident Assigned",
        message: `You have been assigned to incident: ${incident.title}`,
        type: "incident_assigned",
        isRead: false,
        relatedId: args.id,
      });
    }

    return args.id;
  },
});

export const search = query({
  args: {
    query: v.string(),
    type: v.optional(v.union(
      v.literal("fire"),
      v.literal("flood"),
      v.literal("earthquake"),
      v.literal("storm"),
      v.literal("accident"),
      v.literal("medical"),
      v.literal("other")
    )),
    severity: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let searchQuery = ctx.db
      .query("incidents")
      .withSearchIndex("search_incidents", (q) => q.search("description", args.query));

    if (args.type) {
      searchQuery = searchQuery.filter((q) => q.eq(q.field("type"), args.type));
    }

    if (args.severity) {
      searchQuery = searchQuery.filter((q) => q.eq(q.field("severity"), args.severity));
    }

    const results = await searchQuery.take(20);

    // Get reporter info for each incident
    const incidentsWithReporter = await Promise.all(
      results.map(async (incident) => {
        const reporter = await ctx.db.get(incident.reportedBy);
        const assignee = incident.assignedTo ? await ctx.db.get(incident.assignedTo) : null;
        
        return {
          ...incident,
          reporter: reporter ? { name: reporter.name, email: reporter.email } : null,
          assignee: assignee ? { name: assignee.name, email: assignee.email } : null,
        };
      })
    );

    return incidentsWithReporter;
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const allIncidents = await ctx.db.query("incidents").collect();
    
    const stats = {
      total: allIncidents.length,
      byStatus: {
        reported: allIncidents.filter(i => i.status === "reported").length,
        investigating: allIncidents.filter(i => i.status === "investigating").length,
        responding: allIncidents.filter(i => i.status === "responding").length,
        resolved: allIncidents.filter(i => i.status === "resolved").length,
      },
      bySeverity: {
        low: allIncidents.filter(i => i.severity === "low").length,
        medium: allIncidents.filter(i => i.severity === "medium").length,
        high: allIncidents.filter(i => i.severity === "high").length,
        critical: allIncidents.filter(i => i.severity === "critical").length,
      },
      byType: {
        fire: allIncidents.filter(i => i.type === "fire").length,
        flood: allIncidents.filter(i => i.type === "flood").length,
        earthquake: allIncidents.filter(i => i.type === "earthquake").length,
        storm: allIncidents.filter(i => i.type === "storm").length,
        accident: allIncidents.filter(i => i.type === "accident").length,
        medical: allIncidents.filter(i => i.type === "medical").length,
        other: allIncidents.filter(i => i.type === "other").length,
      },
    };

    return stats;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});
