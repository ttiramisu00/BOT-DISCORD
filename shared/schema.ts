import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const jobCompletions = pgTable("job_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  serverId: text("server_id").notNull(),
  serverName: text("server_name").notNull(),
  channelId: text("channel_id").notNull(),
  channelName: text("channel_name").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const userLevels = pgTable("user_levels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  level: integer("level").notNull().default(1),
  totalJobs: integer("total_jobs").notNull().default(0),
  lastLevelUpAt: timestamp("last_level_up_at").defaultNow(),
});

export const jobTaken = pgTable("job_taken", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  serverId: text("server_id").notNull(),
  serverName: text("server_name").notNull(),
  channelId: text("channel_id").notNull(),
  status: text("status").notNull().default("taken"), // taken, in_progress, completed
  takenAt: timestamp("taken_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: text("client_id").notNull(),
  clientUsername: text("client_username").notNull(),
  artistId: text("artist_id"),
  artistUsername: text("artist_username"),
  model: text("model").notNull(),
  status: text("status").notNull().default("waiting"), // waiting, progress, done
  deadline: timestamp("deadline"),
  price: text("price"),
  serverId: text("server_id").notNull(),
  channelId: text("channel_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const clientFeedback = pgTable("client_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: text("client_id").notNull(),
  clientUsername: text("client_username").notNull(),
  feedback: text("feedback").notNull(),
  rating: integer("rating").default(5),
  serverId: text("server_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const botStats = pgTable("bot_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serverCount: integer("server_count").notNull().default(0),
  activeUsers: integer("active_users").notNull().default(0),
  streakChannels: integer("streak_channels").notNull().default(0),
  uptime: text("uptime").notNull().default("99.8%"),
  responseTime: text("response_time").notNull().default("142ms"),
  memoryUsage: text("memory_usage").notNull().default("34.2 MB"),
  lastRestart: timestamp("last_restart").notNull().defaultNow(),
  isOnline: boolean("is_online").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertJobCompletionSchema = createInsertSchema(jobCompletions).omit({
  id: true,
  completedAt: true,
});

export const insertBotStatsSchema = createInsertSchema(botStats).omit({
  id: true,
  updatedAt: true,
});

export const insertUserLevelSchema = createInsertSchema(userLevels).omit({
  id: true,
  lastLevelUpAt: true,
});

export const insertJobTakenSchema = createInsertSchema(jobTaken).omit({
  id: true,
  takenAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientFeedbackSchema = createInsertSchema(clientFeedback).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type JobCompletion = typeof jobCompletions.$inferSelect;
export type InsertJobCompletion = z.infer<typeof insertJobCompletionSchema>;
export type JobTaken = typeof jobTaken.$inferSelect;
export type InsertJobTaken = z.infer<typeof insertJobTakenSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type ClientFeedback = typeof clientFeedback.$inferSelect;
export type InsertClientFeedback = z.infer<typeof insertClientFeedbackSchema>;
export type BotStats = typeof botStats.$inferSelect;
export type InsertBotStats = z.infer<typeof insertBotStatsSchema>;
export type UserLevel = typeof userLevels.$inferSelect;
export type InsertUserLevel = z.infer<typeof insertUserLevelSchema>;
