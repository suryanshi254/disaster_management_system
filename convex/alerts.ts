import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    isActive: v.optional(v.boolean()),
    type: v.optional(v.union(
      v.literal("emergency"),
      v.literal("warning"),
      v.literal("info"),
      v.literal("update")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let query;
    
    if (args.isActive !== undefined) {
      query = ctx.db.query("alerts").withIndex("by_active", (q) => q.eq("isActive", args.isActive!));
    } else if (args.type !== undefined) {
      query = ctx.db.query("alerts").withIndex("by_type", (q) => q.eq("type", args.type!));
    } else {
      query = ctx.db.query("alerts");
    }

    const alerts = await query.order("desc").collect();

    // Get creator info for each alert
    const alertsWithCreator = await Promise.all(
      alerts.map(async (alert) => {
        const creator = await ctx.db.get(alert.createdBy);
        const incident = alert.relatedIncident ? await ctx.db.get(alert.relatedIncident) : null;
        
        return {
          ...alert,
          creator: creator ? { name: creator.name, email: creator.email } : null,
          incident: incident ? { title: incident.title, status: incident.status } : null,
        };
      })
    );

    return alertsWithCreator;
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => 
        q.or(
          q.eq(q.field("expiresAt"), undefined),
          q.gt(q.field("expiresAt"), now)
        )
      )
      .order("desc")
      .collect();

    // Get creator info for each alert
    const alertsWithCreator = await Promise.all(
      alerts.map(async (alert) => {
        const creator = await ctx.db.get(alert.createdBy);
        const incident = alert.relatedIncident ? await ctx.db.get(alert.relatedIncident) : null;
        
        return {
          ...alert,
          creator: creator ? { name: creator.name, email: creator.email } : null,
          incident: incident ? { title: incident.title, status: incident.status } : null,
        };
      })
    );

    return alertsWithCreator;
  },
});

export const create = mutation({
  args: {
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
    expiresAt: v.optional(v.number()),
    relatedIncident: v.optional(v.id("incidents")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const alertId = await ctx.db.insert("alerts", {
      ...args,
      isActive: true,
      createdBy: userId,
    });

    // Create notifications for all users in the target area
    if (args.targetArea) {
      const volunteers = await ctx.db.query("volunteers").collect();
      const usersInArea = volunteers.filter(volunteer => {
        const distance = calculateDistance(
          args.targetArea!.latitude,
          args.targetArea!.longitude,
          volunteer.location.latitude,
          volunteer.location.longitude
        );
        return distance <= args.targetArea!.radius;
      });

      // Create notifications for users in the target area
      for (const volunteer of usersInArea) {
        await ctx.db.insert("notifications", {
          userId: volunteer.userId,
          title: `${args.type.toUpperCase()}: ${args.title}`,
          message: args.message,
          type: "alert_issued",
          isRead: false,
          relatedId: alertId,
        });
      }
    } else {
      // Create notifications for all users if no target area specified
      const allUsers = await ctx.db.query("users").collect();
      for (const user of allUsers) {
        await ctx.db.insert("notifications", {
          userId: user._id,
          title: `${args.type.toUpperCase()}: ${args.title}`,
          message: args.message,
          type: "alert_issued",
          isRead: false,
          relatedId: alertId,
        });
      }
    }

    return alertId;
  },
});

export const deactivate = mutation({
  args: { id: v.id("alerts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const alert = await ctx.db.get(args.id);
    if (!alert) {
      throw new Error("Alert not found");
    }

    await ctx.db.patch(args.id, {
      isActive: false,
    });

    return args.id;
  },
});

export const getByLocation = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radius: v.optional(v.number()), // in kilometers, default 50km
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const radius = args.radius || 50;
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Filter alerts by location
    const alertsInArea = alerts.filter(alert => {
      if (!alert.targetArea) return true; // Global alerts
      
      const distance = calculateDistance(
        args.latitude,
        args.longitude,
        alert.targetArea.latitude,
        alert.targetArea.longitude
      );
      return distance <= Math.max(alert.targetArea.radius, radius);
    });

    // Get creator info for each alert
    const alertsWithCreator = await Promise.all(
      alertsInArea.map(async (alert) => {
        const creator = await ctx.db.get(alert.createdBy);
        const incident = alert.relatedIncident ? await ctx.db.get(alert.relatedIncident) : null;
        
        return {
          ...alert,
          creator: creator ? { name: creator.name, email: creator.email } : null,
          incident: incident ? { title: incident.title, status: incident.status } : null,
        };
      })
    );

    return alertsWithCreator;
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
