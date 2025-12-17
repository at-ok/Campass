import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, classes, tasks, exams, events, InsertClass, InsertTask, InsertExam, InsertEvent } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User queries
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Classes queries
export async function getClassesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(classes).where(eq(classes.userId, userId)).orderBy(asc(classes.name));
}

export async function getClassById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(classes).where(and(eq(classes.id, id), eq(classes.userId, userId))).limit(1);
  return result[0];
}

export async function createClass(data: InsertClass) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(classes).values(data);
  return { id: result[0].insertId };
}

export async function updateClass(id: number, userId: number, data: Partial<InsertClass>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(classes).set(data).where(and(eq(classes.id, id), eq(classes.userId, userId)));
}

export async function deleteClass(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(classes).where(and(eq(classes.id, id), eq(classes.userId, userId)));
}

// Tasks queries
export async function getTasksByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(asc(tasks.dueDate));
}

export async function getTaskById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1);
  return result[0];
}

export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tasks).values(data);
  return { id: result[0].insertId };
}

export async function updateTask(id: number, userId: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(tasks).set(data).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

export async function deleteTask(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

// Exams queries
export async function getExamsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(exams).where(eq(exams.userId, userId)).orderBy(asc(exams.examDate));
}

export async function getExamById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(exams).where(and(eq(exams.id, id), eq(exams.userId, userId))).limit(1);
  return result[0];
}

export async function createExam(data: InsertExam) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(exams).values(data);
  return { id: result[0].insertId };
}

export async function updateExam(id: number, userId: number, data: Partial<InsertExam>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(exams).set(data).where(and(eq(exams.id, id), eq(exams.userId, userId)));
}

export async function deleteExam(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(exams).where(and(eq(exams.id, id), eq(exams.userId, userId)));
}

// Events queries
export async function getEventsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(events).where(eq(events.userId, userId)).orderBy(asc(events.startDate));
}

export async function getEventsByDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(events).where(
    and(
      eq(events.userId, userId),
      gte(events.startDate, startDate),
      lte(events.startDate, endDate)
    )
  ).orderBy(asc(events.startDate));
}

export async function createEvent(data: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(events).values(data);
  return { id: result[0].insertId };
}

export async function updateEvent(id: number, userId: number, data: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(events).set(data).where(and(eq(events.id, id), eq(events.userId, userId)));
}

export async function deleteEvent(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(events).where(and(eq(events.id, id), eq(events.userId, userId)));
}

// Dashboard stats
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalClasses: 0, pendingTasks: 0, upcomingExams: 0 };
  
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const [classesResult, tasksResult, examsResult] = await Promise.all([
    db.select().from(classes).where(eq(classes.userId, userId)),
    db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.status, "pending"))),
    db.select().from(exams).where(
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

export async function getUpcomingItems(userId: number) {
  const db = await getDb();
  if (!db) return { tasks: [], exams: [] };
  
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const [upcomingTasks, upcomingExams] = await Promise.all([
    db.select().from(tasks).where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.status, "pending"),
        gte(tasks.dueDate, now),
        lte(tasks.dueDate, weekFromNow)
      )
    ).orderBy(asc(tasks.dueDate)).limit(5),
    db.select().from(exams).where(
      and(
        eq(exams.userId, userId),
        gte(exams.examDate, now),
        lte(exams.examDate, weekFromNow)
      )
    ).orderBy(asc(exams.examDate)).limit(5),
  ]);
  
  return { tasks: upcomingTasks, exams: upcomingExams };
}
