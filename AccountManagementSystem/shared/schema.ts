import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const UserRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
  SUPPORT: "SUPPORT",
  USER: "USER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

const ComplaintStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
} as const;

type ComplaintStatus = (typeof ComplaintStatus)[keyof typeof ComplaintStatus];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default(UserRole.USER),
  isPremium: boolean("is_premium").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  isBlocked: boolean("is_blocked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  isActive: boolean("is_active").notNull().default(true),
});

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  targetUserId: integer("target_user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default(ComplaintStatus.PENDING),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Добавляем таблицу для сообщений в чате репортов
export const complaintMessages = pgTable("complaint_messages", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").references(() => complaints.id),
  userId: integer("user_id").references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isSystemMessage: boolean("is_system_message").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  role: true,
});

export const updateUserProfileSchema = createInsertSchema(users).pick({
  displayName: true,
  avatarUrl: true,
});

export const insertSessionSchema = createInsertSchema(sessions);

export const insertComplaintSchema = createInsertSchema(complaints).pick({
  title: true,
  description: true,
  targetUserId: true,
});

export const insertComplaintMessageSchema = createInsertSchema(complaintMessages).pick({
  message: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type ComplaintMessage = typeof complaintMessages.$inferSelect;
export type InsertComplaintMessage = z.infer<typeof insertComplaintMessageSchema>;