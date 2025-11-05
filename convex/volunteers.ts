import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    availability: v.optional(v.union(
      v.literal("available"),
      v.literal("busy"),
      v.literal("unavailable")
    )),
    skills: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let query;
    
    if (args.availability !== undefined) {
      query = ctx.db.query("volunteers").withIndex("by_availability", (q) => q.eq("availability", args.availability!));
    } else {
      query = ctx.db.query("volunteers");
    }

    const volunteers = await query.collect();

    // Filter by skills if provided
    let filteredVolunteers = volunteers;
    if (args.skills && args.skills.length > 0) {
      filteredVolunteers = volunteers.filter(volunteer => 
        args.skills!.some(skill => volunteer.skills.includes(skill))
      );
    }

    // Get user info for each volunteer
    const volunteersWithUser = await Promise.all(
      filteredVolunteers.map(async (volunteer) => {
        const user = await ctx.db.get(volunteer.userId);
        const incident = volunteer.assignedIncident ? await ctx.db.get(volunteer.assignedIncident) : null;
        
        return {
          ...volunteer,
          user: user ? { name: user.name, email: user.email } : null,
          incident: incident ? { title: incident.title, status: incident.status } : null,
        };
      })
    );

    return volunteersWithUser;
  },
});

export const getByUserId = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const targetUserId = args.userId || currentUserId;
    
    const volunteer = await ctx.db
      .query("volunteers")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .unique();

    if (!volunteer) {
      return null;
    }

    const user = await ctx.db.get(volunteer.userId);
    const incident = volunteer.assignedIncident ? await ctx.db.get(volunteer.assignedIncident) : null;
    
    return {
      ...volunteer,
      user: user ? { name: user.name, email: user.email } : null,
      incident: incident ? { title: incident.title, status: incident.status } : null,
    };
  },
});

export const register = mutation({
  args: {
    skills: v.array(v.string()),
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is already registered as volunteer
    const existingVolunteer = await ctx.db
      .query("volunteers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingVolunteer) {
      throw new Error("User is already registered as a volunteer");
    }

    const volunteerId = await ctx.db.insert("volunteers", {
      userId,
      ...args,
      availability: "available",
    });

    return volunteerId;
  },
});

export const updateProfile = mutation({
  args: {
    skills: v.optional(v.array(v.string())),
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.string(),
    })),
    phone: v.optional(v.string()),
    emergencyContact: v.optional(v.object({
      name: v.string(),
      phone: v.string(),
    })),
    certifications: v.optional(v.array(v.string())),
    availability: v.optional(v.union(
      v.literal("available"),
      v.literal("busy"),
      v.literal("unavailable")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const volunteer = await ctx.db
      .query("volunteers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!volunteer) {
      throw new Error("Volunteer profile not found");
    }

    const updates: any = {};
    Object.keys(args).forEach(key => {
      if (args[key as keyof typeof args] !== undefined) {
        updates[key] = args[key as keyof typeof args];
      }
    });

    await ctx.db.patch(volunteer._id, updates);
    return volunteer._id;
  },
});

export const assignToIncident = mutation({
  args: {
    volunteerId: v.id("volunteers"),
    incidentId: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const volunteer = await ctx.db.get(args.volunteerId);
    if (!volunteer) {
      throw new Error("Volunteer not found");
    }

    const incident = await ctx.db.get(args.incidentId);
    if (!incident) {
      throw new Error("Incident not found");
    }

    await ctx.db.patch(args.volunteerId, {
      assignedIncident: args.incidentId,
      availability: "busy",
    });

    // Create notification for volunteer
    await ctx.db.insert("notifications", {
      userId: volunteer.userId,
      title: "Assigned to Incident",
      message: `You have been assigned to incident: ${incident.title}`,
      type: "incident_assigned",
      isRead: false,
      relatedId: args.incidentId,
    });

    return args.volunteerId;
  },
});

export const getAvailableBySkills = query({
  args: {
    skills: v.array(v.string()),
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

    const volunteers = await ctx.db
      .query("volunteers")
      .withIndex("by_availability", (q) => q.eq("availability", "available"))
      .collect();

    // Filter by skills
    const skillMatchedVolunteers = volunteers.filter(volunteer => 
      args.skills.some(skill => volunteer.skills.includes(skill))
    );

    // Filter by location if provided
    let filteredVolunteers = skillMatchedVolunteers;
    if (args.location) {
      filteredVolunteers = skillMatchedVolunteers.filter((volunteer) => {
        const distance = calculateDistance(
          args.location!.latitude,
          args.location!.longitude,
          volunteer.location.latitude,
          volunteer.location.longitude
        );
        return distance <= args.location!.radius;
      });
    }

    // Get user info for each volunteer
    const volunteersWithUser = await Promise.all(
      filteredVolunteers.map(async (volunteer) => {
        const user = await ctx.db.get(volunteer.userId);
        return {
          ...volunteer,
          user: user ? { name: user.name, email: user.email } : null,
        };
      })
    );

    return volunteersWithUser;
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const allVolunteers = await ctx.db.query("volunteers").collect();
    
    const stats = {
      total: allVolunteers.length,
      available: allVolunteers.filter(v => v.availability === "available").length,
      busy: allVolunteers.filter(v => v.availability === "busy").length,
      unavailable: allVolunteers.filter(v => v.availability === "unavailable").length,
      skillsDistribution: {} as Record<string, number>,
    };

    // Calculate skills distribution
    allVolunteers.forEach(volunteer => {
      volunteer.skills.forEach(skill => {
        stats.skillsDistribution[skill] = (stats.skillsDistribution[skill] || 0) + 1;
      });
    });

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
