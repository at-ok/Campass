import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
    expect(result?.email).toBe("test@example.com");
    expect(result?.name).toBe("Test User");
  });

  it("returns null when not authenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeNull();
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});

// Mock the database module for testing
vi.mock("./db", () => ({
  getClassesByUserId: vi.fn().mockResolvedValue([]),
  getTasksByUserId: vi.fn().mockResolvedValue([]),
  getExamsByUserId: vi.fn().mockResolvedValue([]),
  getEventsByUserId: vi.fn().mockResolvedValue([]),
  getDashboardStats: vi.fn().mockResolvedValue({
    totalClasses: 5,
    pendingTasks: 3,
    upcomingExams: 2,
  }),
  getUpcomingItems: vi.fn().mockResolvedValue({
    tasks: [],
    exams: [],
  }),
  createClass: vi.fn().mockResolvedValue({ id: 1 }),
  createTask: vi.fn().mockResolvedValue({ id: 1 }),
  createExam: vi.fn().mockResolvedValue({ id: 1 }),
  createEvent: vi.fn().mockResolvedValue({ id: 1 }),
  updateClass: vi.fn().mockResolvedValue(undefined),
  updateTask: vi.fn().mockResolvedValue(undefined),
  updateExam: vi.fn().mockResolvedValue(undefined),
  updateEvent: vi.fn().mockResolvedValue(undefined),
  deleteClass: vi.fn().mockResolvedValue(undefined),
  deleteTask: vi.fn().mockResolvedValue(undefined),
  deleteExam: vi.fn().mockResolvedValue(undefined),
  deleteEvent: vi.fn().mockResolvedValue(undefined),
}));

describe("dashboard", () => {
  it("returns stats for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.stats();

    expect(result).toEqual({
      totalClasses: 5,
      pendingTasks: 3,
      upcomingExams: 2,
    });
  });

  it("returns upcoming items for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.upcoming();

    expect(result).toEqual({
      tasks: [],
      exams: [],
    });
  });
});

describe("classes", () => {
  it("lists classes for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.classes.list();

    expect(result).toEqual([]);
  });

  it("creates a class for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.classes.create({
      name: "Computer Science 101",
      instructor: "Prof. Smith",
      room: "Room 101",
      dayOfWeek: "monday",
      period: 1,
      periodCount: 1,
      startTime: "09:00",
      endTime: "10:30",
      color: "blue",
    });

    expect(result).toEqual({ id: 1 });
  });
});

describe("tasks", () => {
  it("lists tasks for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.list();

    expect(result).toEqual([]);
  });

  it("creates a task for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.create({
      title: "Complete homework",
      description: "Chapter 5 exercises",
      priority: "high",
      color: "yellow",
    });

    expect(result).toEqual({ id: 1 });
  });
});

describe("exams", () => {
  it("lists exams for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.exams.list();

    expect(result).toEqual([]);
  });

  it("creates an exam for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.exams.create({
      title: "Midterm Exam",
      examDate: new Date("2025-01-15T10:00:00Z"),
      duration: 90,
      room: "Hall A",
      status: "scheduled",
      color: "pink",
    });

    expect(result).toEqual({ id: 1 });
  });
});

describe("events", () => {
  it("lists events for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.events.list();

    expect(result).toEqual([]);
  });

  it("creates an event for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.events.create({
      title: "Study Group",
      startDate: new Date("2025-01-10T14:00:00Z"),
      endDate: new Date("2025-01-10T16:00:00Z"),
      eventType: "other",
      color: "purple",
    });

    expect(result).toEqual({ id: 1 });
  });
});
