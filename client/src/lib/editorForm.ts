import { z } from "zod";
import { startOfDay, subDays } from "date-fns";
import { datetimeValue, periods, weekdays } from "./planner";
import type { EditorRequest } from "@/components/material/PlannerEditor";

export const schema = z
  .object({
    kind: z.enum(["class", "task", "exam", "event"]),
    title: z.string().trim().min(1, "タイトルを入力してください"),
    description: z.string(),
    instructor: z.string(),
    room: z.string(),
    dayOfWeek: z.enum(weekdays).or(z.literal("")),
    period: z.string(),
    periodCount: z.string(),
    classId: z.string(),
    dueDate: z.string(),
    date: z.string(),
    endDate: z.string(),
    duration: z.string(),
    priority: z.enum(["low", "medium", "high"]),
    status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]),
    taskStatus: z.enum(["pending", "in_progress", "completed"]),
    eventType: z.enum(["reminder", "other"]),
    color: z.string(),
    allDay: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const error = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    for (const key of ["dueDate", "date", "endDate"] as const) {
      if (data[key] && !Number.isFinite(new Date(data[key]).getTime()))
        error(key, "有効な日時を入力してください");
    }
    if ((data.kind === "exam" || data.kind === "event") && !data.date)
      error("date", "日時を選択してください");
    if (
      data.kind === "event" &&
      data.endDate &&
      (data.allDay
        ? startOfDay(new Date(data.endDate)) < startOfDay(new Date(data.date))
        : new Date(data.endDate) <= new Date(data.date))
    )
      error("endDate", "終了は開始より後にしてください");
    if (
      data.kind === "class" &&
      data.period !== "" &&
      Number(data.period) + Number(data.periodCount) > 6
    )
      error("periodCount", "5限を超える授業は登録できません");
    if (
      data.kind === "exam" &&
      data.duration &&
      (!/^\d+$/.test(data.duration) || Number(data.duration) < 1)
    )
      error("duration", "1以上の整数を入力してください");
  });
export type Values = z.infer<typeof schema>;

export function defaults(request: EditorRequest): Values {
  const record = request.record;
  return {
    kind: request.kind,
    title:
      request.kind === "class"
        ? (request.record?.name ?? "")
        : (request.record?.title ?? ""),
    description:
      record && "description" in record ? (record.description ?? "") : "",
    instructor:
      request.kind === "class" ? (request.record?.instructor ?? "") : "",
    room: record && "room" in record ? (record.room ?? "") : "",
    dayOfWeek:
      request.kind === "class"
        ? request.record
          ? (request.record.dayOfWeek ?? "")
          : (request.day ?? "monday")
        : "monday",
    period: String(
      request.kind === "class"
        ? request.record
          ? (request.record.period ?? "")
          : (request.period ?? 1)
        : 1
    ),
    periodCount: String(
      request.kind === "class" ? (request.record?.periodCount ?? 1) : 1
    ),
    classId:
      record && "classId" in record && record.classId
        ? String(record.classId)
        : "",
    dueDate:
      request.kind === "task" ? datetimeValue(request.record?.dueDate) : "",
    date:
      request.kind === "exam"
        ? datetimeValue(request.record?.examDate)
        : request.kind === "event"
          ? datetimeValue(
              request.record?.startDate ?? request.date ?? new Date()
            )
          : "",
    endDate:
      request.kind === "event"
        ? datetimeValue(
            request.record?.allDay && request.record.endDate
              ? subDays(new Date(request.record.endDate), 1)
              : request.record?.endDate
          )
        : "",
    duration:
      request.kind === "exam"
        ? String(request.record ? (request.record.duration ?? "") : 90)
        : "",
    priority:
      request.kind === "task"
        ? (request.record?.priority ?? "medium")
        : "medium",
    status:
      request.kind === "exam"
        ? (request.record?.status ?? "scheduled")
        : "scheduled",
    taskStatus:
      request.kind === "task"
        ? (request.record?.status ?? "pending")
        : "pending",
    eventType:
      request.kind === "event" && request.record?.eventType === "reminder"
        ? "reminder"
        : "other",
    color:
      record?.color ??
      (request.kind === "task"
        ? "yellow"
        : request.kind === "exam"
          ? "pink"
          : "blue"),
    allDay:
      request.kind === "event" ? (request.record?.allDay ?? false) : false,
  };
}

export function classScheduleInput(
  values: Values,
  record?: import("@shared/schema").Class
) {
  const period = values.period ? Number(values.period) : null;
  const periodCount = Number(values.periodCount);
  const unchanged =
    record &&
    period === record.period &&
    periodCount === (record.periodCount ?? 1);
  return {
    dayOfWeek: values.dayOfWeek || null,
    period,
    periodCount: unchanged ? record.periodCount : periodCount,
    startTime: unchanged
      ? record.startTime
      : period
        ? periods[period - 1].start
        : null,
    endTime: unchanged
      ? record.endTime
      : period
        ? periods[period + periodCount - 2].end
        : null,
  };
}
