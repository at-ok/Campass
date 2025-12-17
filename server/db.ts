import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  classes,
  tasks,
  exams,
  events,
  InsertClass,
  InsertTask,
  InsertExam,
  InsertEvent,
} from "../drizzle/schema";

// Initialize DB Synchronously
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

// Classes queries
export async function getClassesByUserId(userId: string) {
  return db
    .select()
    .from(classes)
    .where(eq(classes.userId, userId))
    .orderBy(asc(classes.name));
}

export async function getClassById(id: number, userId: string) {
  const result = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, id), eq(classes.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createClass(data: InsertClass) {
  const [result] = await db
    .insert(classes)
    .values(data)
    .returning({ id: classes.id });
  return result;
}

export async function updateClass(
  id: number,
  userId: string,
  data: Partial<InsertClass>
) {
  await db
    .update(classes)
    .set(data)
    .where(and(eq(classes.id, id), eq(classes.userId, userId)));
}

export async function deleteClass(id: number, userId: string) {
  await db
    .delete(classes)
    .where(and(eq(classes.id, id), eq(classes.userId, userId)));
}

// Tasks queries
export async function getTasksByUserId(userId: string) {
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(asc(tasks.dueDate));
}

export async function getTaskById(id: number, userId: string) {
  const result = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createTask(data: InsertTask) {
  const [result] = await db
    .insert(tasks)
    .values(data)
    .returning({ id: tasks.id });
  return result;
}

export async function updateTask(
  id: number,
  userId: string,
  data: Partial<InsertTask>
) {
  await db
    .update(tasks)
    .set(data)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

export async function deleteTask(id: number, userId: string) {
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

// Exams queries
export async function getExamsByUserId(userId: string) {
  return db
    .select()
    .from(exams)
    .where(eq(exams.userId, userId))
    .orderBy(asc(exams.examDate));
}

export async function getExamById(id: number, userId: string) {
  const result = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, id), eq(exams.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createExam(data: InsertExam) {
  const [result] = await db
    .insert(exams)
    .values(data)
    .returning({ id: exams.id });
  return result;
}

export async function updateExam(
  id: number,
  userId: string,
  data: Partial<InsertExam>
) {
  await db
    .update(exams)
    .set(data)
    .where(and(eq(exams.id, id), eq(exams.userId, userId)));
}

export async function deleteExam(id: number, userId: string) {
  await db.delete(exams).where(and(eq(exams.id, id), eq(exams.userId, userId)));
}

// Events queries
export async function getEventsByUserId(userId: string) {
  return db
    .select()
    .from(events)
    .where(eq(events.userId, userId))
    .orderBy(asc(events.startDate));
}

export async function getEventsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return db
    .select()
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        gte(events.startDate, startDate),
        lte(events.startDate, endDate)
      )
    )
    .orderBy(asc(events.startDate));
}

export async function createEvent(data: InsertEvent) {
  const [result] = await db
    .insert(events)
    .values(data)
    .returning({ id: events.id });
  return result;
}

export async function updateEvent(
  id: number,
  userId: string,
  data: Partial<InsertEvent>
) {
  await db
    .update(events)
    .set(data)
    .where(and(eq(events.id, id), eq(events.userId, userId)));
}

export async function deleteEvent(id: number, userId: string) {
  await db
    .delete(events)
    .where(and(eq(events.id, id), eq(events.userId, userId)));
}

// Dashboard stats
export async function getDashboardStats(userId: string) {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [classesResult, tasksResult, examsResult] = await Promise.all([
    db.select().from(classes).where(eq(classes.userId, userId)),
    db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.status, "pending"))),
    db
      .select()
      .from(exams)
      .where(
        and(
          eq(exams.userId, userId),
          gte(exams.examDate, now),
          lte(exams.examDate, weekFromNow)
        )
      ),
  ]);

  return {
    totalClasses: classesResult.length,
    pendingTasks: tasksResult.length,
    upcomingExams: examsResult.length,
  };
}

export async function getUpcomingItems(userId: string) {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [upcomingTasks, upcomingExams] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.status, "pending"),
          gte(tasks.dueDate, now),
          lte(tasks.dueDate, weekFromNow)
        )
      )
      .orderBy(asc(tasks.dueDate))
      .limit(5),
    db
      .select()
      .from(exams)
      .where(
        and(
          eq(exams.userId, userId),
          gte(exams.examDate, now),
          lte(exams.examDate, weekFromNow)
        )
      )
      .orderBy(asc(exams.examDate))
      .limit(5),
  ]);

  return { tasks: upcomingTasks, exams: upcomingExams };
}
