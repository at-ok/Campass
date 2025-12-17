import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  time,
  date,
} from "drizzle-orm/pg-core";

/**
 * Better Auth Tables
 */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  // Application specific fields
  role: text("role").default("user").notNull(), // kept as text for simplicity, was enum
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

/**
 * Application Tables
 * Adapted to use text ID for userId reference
 */

// Enums
export const dayOfWeekEnum = pgEnum("dayOfWeek", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const statusEnum = pgEnum("status", [
  "pending",
  "in_progress",
  "completed",
]);
export const examStatusEnum = pgEnum("examStatus", [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
]);
export const eventTypeEnum = pgEnum("eventType", [
  "class",
  "task",
  "exam",
  "reminder",
  "other",
]);

export const classes = pgTable("classes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("userId")
    .notNull()
    .references(() => user.id), // Changed to text
  name: text("name").notNull(), // varchar -> text
  instructor: text("instructor"),
  room: text("room"),
  dayOfWeek: dayOfWeekEnum("dayOfWeek"),
  period: integer("period"),
  periodCount: integer("periodCount").default(1),
  startTime: time("startTime"),
  endTime: time("endTime"),
  color: text("color").default("blue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("userId")
    .notNull()
    .references(() => user.id), // Changed to text
  classId: integer("classId").references(() => classes.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate"),
  priority: priorityEnum("priority").default("medium"),
  status: statusEnum("status").default("pending"),
  color: text("color").default("yellow"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const exams = pgTable("exams", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("userId")
    .notNull()
    .references(() => user.id), // Changed to text
  classId: integer("classId").references(() => classes.id),
  title: text("title").notNull(),
  description: text("description"),
  examDate: timestamp("examDate").notNull(),
  duration: integer("duration"), // in minutes
  room: text("room"),
  status: examStatusEnum("status").default("scheduled"),
  color: text("color").default("pink"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("userId")
    .notNull()
    .references(() => user.id), // Changed to text
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  allDay: boolean("allDay").default(false),
  eventType: eventTypeEnum("eventType").default("other"),
  color: text("color").default("purple"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Export types
export type User = typeof user.$inferSelect;
export type InsertUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type InsertSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type InsertAccount = typeof account.$inferInsert;

export type Verification = typeof verification.$inferSelect;
export type InsertVerification = typeof verification.$inferInsert;

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

export type Exam = typeof exams.$inferSelect;
export type InsertExam = typeof exams.$inferInsert;

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
