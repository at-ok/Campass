import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc.js";
import { z } from "zod";
import * as db from "./db.js";
import { auth } from "./auth.js";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const response = await auth.api.signOut({
        headers: ctx.req.headers,
        asResponse: true,
      });
      if (!response.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "ログアウトできませんでした",
        });
      }
      for (const cookie of response.headers.getSetCookie()) {
        ctx.resHeaders.append("set-cookie", cookie);
      }
      return { success: true };
    }),
  }),

  // Classes router
  classes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getClassesByUserId(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getClassById(input.id, ctx.user.id);
      }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          instructor: z.string().optional(),
          room: z.string().optional(),
          dayOfWeek: z
            .enum([
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ])
            .nullish(),
          period: z.number().min(1).max(5).nullish(),
          periodCount: z.number().min(1).max(2).nullish(),
          startTime: z.string().nullish(),
          endTime: z.string().nullish(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createClass({ ...input, userId: ctx.user.id });
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          instructor: z.string().optional(),
          room: z.string().optional(),
          dayOfWeek: z
            .enum([
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ])
            .nullish(),
          period: z.number().min(1).max(5).nullish(),
          periodCount: z.number().min(1).max(2).nullish(),
          startTime: z.string().nullish(),
          endTime: z.string().nullish(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateClass(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteClass(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Tasks router
  tasks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getTasksByUserId(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getTaskById(input.id, ctx.user.id);
      }),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          classId: z.number().nullable().optional(),
          dueDate: z.coerce.date().nullable().optional(), // coerce date strings if needed
          priority: z.enum(["low", "medium", "high"]).optional(),
          status: z.enum(["pending", "in_progress", "completed"]).optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createTask({ ...input, userId: ctx.user.id });
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          classId: z.number().nullable().optional(),
          dueDate: z.coerce.date().nullable().optional(),
          priority: z.enum(["low", "medium", "high"]).optional(),
          status: z.enum(["pending", "in_progress", "completed"]).optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateTask(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTask(input.id, ctx.user.id);
        return { success: true };
      }),
    toggleStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "in_progress", "completed"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateTask(input.id, ctx.user.id, { status: input.status });
        return { success: true };
      }),
  }),

  // Exams router
  exams: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getExamsByUserId(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getExamById(input.id, ctx.user.id);
      }),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          classId: z.number().nullable().optional(),
          examDate: z.coerce.date(),
          duration: z.number().int().positive().nullable().optional(),
          room: z.string().optional(),
          status: z
            .enum(["scheduled", "confirmed", "completed", "cancelled"])
            .optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createExam({ ...input, userId: ctx.user.id });
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          classId: z.number().nullable().optional(),
          examDate: z.coerce.date().optional(),
          duration: z.number().int().positive().nullable().optional(),
          room: z.string().optional(),
          status: z
            .enum(["scheduled", "confirmed", "completed", "cancelled"])
            .optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateExam(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteExam(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Events router
  events: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getEventsByUserId(ctx.user.id);
    }),
    listByDateRange: protectedProcedure
      .input(
        z.object({
          startDate: z.coerce.date(),
          endDate: z.coerce.date(),
        })
      )
      .query(async ({ ctx, input }) => {
        return db.getEventsByDateRange(
          ctx.user.id,
          input.startDate,
          input.endDate
        );
      }),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          startDate: z.coerce.date(),
          endDate: z.coerce.date().nullable().optional(),
          allDay: z.boolean().optional(),
          eventType: z.enum(["reminder", "other"]).optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createEvent({ ...input, userId: ctx.user.id });
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          startDate: z.coerce.date().optional(),
          endDate: z.coerce.date().nullable().optional(),
          allDay: z.boolean().optional(),
          eventType: z.enum(["reminder", "other"]).optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateEvent(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteEvent(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Dashboard router
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getDashboardStats(ctx.user.id);
    }),
    upcoming: protectedProcedure.query(async ({ ctx }) => {
      return db.getUpcomingItems(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
