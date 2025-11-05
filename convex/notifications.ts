import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    isRead: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let query;
    
    if (args.isRead !== undefined) {
      query = ctx.db.query("notifications").withIndex("by_read_status", (q) => 
        q.eq("userId", userId).eq("isRead", args.isRead!)
      );
    } else {
      query = ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", userId));
    }

    const notifications = await query
      .order("desc")
      .take(args.limit || 50);

    return notifications;
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_read_status", (q) => 
        q.eq("userId", userId).eq("isRead", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const notification = await ctx.db.get(args.id);
    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new Error("Not authorized to update this notification");
    }

    await ctx.db.patch(args.id, {
      isRead: true,
    });

    return args.id;
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_read_status", (q) => 
        q.eq("userId", userId).eq("isRead", false)
      )
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
      });
    }

    return unreadNotifications.length;
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("incident_assigned"),
      v.literal("resource_requested"),
      v.literal("alert_issued"),
      v.literal("status_update")
    ),
    relatedId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const notificationId = await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
    });

    return notificationId;
  },
});
