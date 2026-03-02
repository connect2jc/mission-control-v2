import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Simple SHA-256 hash using Web Crypto API (available in Convex runtime)
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Set (or reset) the dashboard password
export const setPassword = mutation({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    const hash = await sha256(password);
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "passwordHash"))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value: hash });
    } else {
      await ctx.db.insert("settings", { key: "passwordHash", value: hash });
    }
  },
});

// Validate password and return a session token
export const validatePassword = mutation({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "passwordHash"))
      .first();
    if (!setting) {
      return { success: false, token: null };
    }
    const hash = await sha256(password);
    if (hash !== setting.value) {
      return { success: false, token: null };
    }
    // Create session token (valid for 7 days)
    const token = generateToken();
    const now = Date.now();
    await ctx.db.insert("sessions", {
      token,
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
    });
    return { success: true, token };
  },
});

// Check if a session token is valid
export const checkSession = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (!token) return { valid: false };
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (!session) return { valid: false };
    if (Date.now() > session.expiresAt) return { valid: false };
    return { valid: true };
  },
});

// Seed the initial password (run once via dashboard or console)
export const seedPassword = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "passwordHash"))
      .first();
    if (existing) return { status: "already_set" };
    const hash = await sha256("maveric2026");
    await ctx.db.insert("settings", { key: "passwordHash", value: hash });
    return { status: "seeded" };
  },
});
