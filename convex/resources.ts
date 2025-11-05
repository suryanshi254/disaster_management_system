import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    type: v.optional(v.union(
      v.literal("personnel"),
      v.literal("vehicle"),
      v.literal("equipment"),
      v.literal("medical"),
      v.literal("shelter"),
      v.literal("food"),
      v.literal("water")
    )),
    status: v.optional(v.union(
      v.literal("available"),
      v.literal("deployed"),
      v.literal("maintenance"),
      v.literal("unavailable")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let query;
    
    if (args.type !== undefined) {
      query = ctx.db.query("resources").withIndex("by_type", (q) => q.eq("type", args.type!));
    } else if (args.status !== undefined) {
      query = ctx.db.query("resources").withIndex("by_status", (q) => q.eq("status", args.status!));
    } else {
      query = ctx.db.query("resources");
    }

    const resources = await query.order("desc").collect();

    // Get incident info for deployed resources
    const resourcesWithIncident = await Promise.all(
      resources.map(async (resource) => {
        const incident = resource.assignedTo ? await ctx.db.get(resource.assignedTo) : null;
        return {
          ...resource,
          incident: incident ? { title: incident.title, status: incident.status } : null,
        };
      })
    );

    return resourcesWithIncident;
  },
});

export const getById = query({
  args: { id: v.id("resources") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resource = await ctx.db.get(args.id);
    if (!resource) {
      return null;
    }

    const incident = resource.assignedTo ? await ctx.db.get(resource.assignedTo) : null;
    
    return {
      ...resource,
      incident: incident ? { title: incident.title, status: incident.status } : null,
    };
  },
});

export const create = mutation({
  args: {
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
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.string(),
    }),
    contactPerson: v.string(),
    contactPhone: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resourceId = await ctx.db.insert("resources", {
      ...args,
      available: args.quantity,
      status: "available",
    });

    return resourceId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("resources"),
    status: v.union(
      v.literal("available"),
      v.literal("deployed"),
      v.literal("maintenance"),
      v.literal("unavailable")
    ),
    assignedTo: v.optional(v.id("incidents")),
    available: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resource = await ctx.db.get(args.id);
    if (!resource) {
      throw new Error("Resource not found");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      assignedTo: args.assignedTo,
      available: args.available ?? resource.available,
    });

    return args.id;
  },
});

export const getAvailableByType = query({
  args: {
    type: v.union(
      v.literal("personnel"),
      v.literal("vehicle"),
      v.literal("equipment"),
      v.literal("medical"),
      v.literal("shelter"),
      v.literal("food"),
      v.literal("water")
    ),
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      radius: v.number(), // in kilometers
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resources = await ctx.db
      .query("resources")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .filter((q) => q.eq(q.field("status"), "available"))
      .collect();

    // Filter by location if provided
    if (args.location) {
      const filteredResources = resources.filter((resource) => {
        const distance = calculateDistance(
          args.location!.latitude,
          args.location!.longitude,
          resource.location.latitude,
          resource.location.longitude
        );
        return distance <= args.location!.radius;
      });
      return filteredResources;
    }

    return resources;
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const allResources = await ctx.db.query("resources").collect();
    
    const stats = {
      total: allResources.length,
      available: allResources.filter(r => r.status === "available").length,
      deployed: allResources.filter(r => r.status === "deployed").length,
      maintenance: allResources.filter(r => r.status === "maintenance").length,
      unavailable: allResources.filter(r => r.status === "unavailable").length,
      byType: {
        personnel: allResources.filter(r => r.type === "personnel").length,
        vehicle: allResources.filter(r => r.type === "vehicle").length,
        equipment: allResources.filter(r => r.type === "equipment").length,
        medical: allResources.filter(r => r.type === "medical").length,
        shelter: allResources.filter(r => r.type === "shelter").length,
        food: allResources.filter(r => r.type === "food").length,
        water: allResources.filter(r => r.type === "water").length,
      },
    };

    return stats;
  },
});

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in kilometers
  return d;
}
