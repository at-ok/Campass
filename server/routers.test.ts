import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./auth", () => ({
  auth: {
    api: {
      signOut: vi.fn().mockImplementation(
        async () =>
          new Response(null, {
            headers: {
              "set-cookie":
                "better-auth.session_token=; Max-Age=0; Path=/; HttpOnly",
            },
          })
      ),
    },
  },
}));

function createAuthContext(): { ctx: TrpcContext } {
  return {
    ctx: {
      user: {
        id: "test-user-123",
        email: "test@example.com",
        name: "Test User",
        role: "user",
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      req: new Request("https://example.com/api/trpc", {
        headers: { cookie: "better-auth.session_token=test" },
      }),
      resHeaders: new Headers(),
      session: null,
    },
  };
}
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: new Request("https://example.com/api/trpc"),
    resHeaders: new Headers(),
    session: null,
  };
}

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect(result?.id).toBe("test-user-123");
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
  it("uses Better Auth to invalidate the session and forwards its cookie", async () => {
    const { ctx } = createAuthContext();
    const result = await appRouter.createCaller(ctx).auth.logout();
    expect(result).toEqual({ success: true });
    expect(ctx.resHeaders.get("set-cookie")).toContain(
      "better-auth.session_token=; Max-Age=0"
    );
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
  it("persists explicitly unset class schedules on create and update", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const db = await import("./db");
    const data = {
      name: "Unscheduled class",
      dayOfWeek: null,
      period: null,
      periodCount: null,
      startTime: null,
      endTime: null,
    };
    await caller.classes.create(data);
    expect(db.createClass).toHaveBeenLastCalledWith({
      ...data,
      userId: ctx.user!.id,
    });
    await caller.classes.update({ id: 1, ...data });
    expect(db.updateClass).toHaveBeenLastCalledWith(1, ctx.user!.id, data);
  });

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
  it.each(["class", "task", "exam"])(
    "rejects %s as a general event type on create and update",
    async eventType => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      // Exercise runtime validation for stale clients using the old API values.
      const legacyType = eventType as "other";
      await expect(
        caller.events.create({
          title: "Legacy category",
          startDate: new Date(),
          eventType: legacyType,
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(
        caller.events.update({ id: 1, eventType: legacyType })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
  );

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

describe("clearing optional editor fields", () => {
  it("clears a task deadline and linked class without replacing them with an epoch date", async () => {
    const db = await import("./db");
    const { ctx } = createAuthContext();
    await appRouter
      .createCaller(ctx)
      .tasks.update({ id: 7, dueDate: null, classId: null, description: "" });
    expect(db.updateTask).toHaveBeenLastCalledWith(7, "test-user-123", {
      dueDate: null,
      classId: null,
      description: "",
    });
  });
  it("clears an event end date", async () => {
    const db = await import("./db");
    const { ctx } = createAuthContext();
    await appRouter.createCaller(ctx).events.update({ id: 9, endDate: null });
    expect(db.updateEvent).toHaveBeenLastCalledWith(9, "test-user-123", {
      endDate: null,
    });
  });
  it("rejects non-positive exam durations", async () => {
    const { ctx } = createAuthContext();
    await expect(
      appRouter
        .createCaller(ctx)
        .exams.create({ title: "Exam", examDate: new Date(), duration: -10 })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("does not allow unauthenticated changes", async () => {
    await expect(
      appRouter
        .createCaller(createPublicContext())
        .tasks.create({ title: "Task" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
