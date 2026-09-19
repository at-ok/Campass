import { describe, expect, it } from "vitest";
import type { Class, Exam } from "@shared/schema";
import { classScheduleInput, defaults, schema } from "./editorForm";
import { classEvents } from "./planner";

const course: Class = {
  id: 1,
  userId: "student",
  name: "授業",
  instructor: null,
  room: null,
  dayOfWeek: null,
  period: null,
  periodCount: null,
  startTime: null,
  endTime: null,
  color: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const exam: Exam = {
  id: 1,
  userId: "student",
  title: "試験",
  description: null,
  classId: null,
  examDate: new Date(),
  duration: null,
  room: null,
  status: "scheduled",
  color: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("editor schedule preservation", () => {
  it.each([
    course,
    { ...course, dayOfWeek: "tuesday" as const },
    { ...course, period: 3 },
  ])(
    "keeps missing schedule fields when renaming an existing class",
    record => {
      const values = schema.parse({
        ...defaults({ kind: "class", record, day: "monday", period: 1 }),
        title: "変更後",
      });
      const data = classScheduleInput(values, record);
      expect(data).toEqual({
        dayOfWeek: record.dayOfWeek,
        period: record.period,
        periodCount: null,
        startTime: null,
        endTime: null,
      });
      expect(classEvents([{ ...record, ...data }], false)).toEqual([]);
    }
  );
  it("allows clearing the schedule and its times", () => {
    const record = {
      ...course,
      dayOfWeek: "monday" as const,
      period: 1,
      startTime: "08:45",
      endTime: "10:15",
      periodCount: 1,
    };
    const values = schema.parse({
      ...defaults({ kind: "class", record }),
      dayOfWeek: "",
      period: "",
    });
    expect(classScheduleInput(values, record)).toMatchObject({
      dayOfWeek: null,
      period: null,
      startTime: null,
      endTime: null,
    });
  });
  it("preserves legacy explicit times on unrelated edits", () => {
    const record = {
      ...course,
      period: 1,
      startTime: "09:00",
      endTime: "11:00",
    };
    expect(
      classScheduleInput(defaults({ kind: "class", record }), record)
    ).toMatchObject({ startTime: "09:00", endTime: "11:00" });
  });
  it("applies schedule defaults to new classes", () => {
    expect(classScheduleInput(defaults({ kind: "class" }))).toMatchObject({
      dayOfWeek: "monday",
      period: 1,
      startTime: "08:45",
      endTime: "10:15",
    });
  });
  it("keeps an existing exam duration empty after unrelated edits or reopening", () => {
    const values = schema.parse({
      ...defaults({ kind: "exam", record: exam }),
      title: "変更後",
    });
    expect(values.duration).toBe("");
    expect(
      defaults({ kind: "exam", record: { ...exam, duration: 60 } }).duration
    ).toBe("60");
    expect(defaults({ kind: "exam" }).duration).toBe("90");
  });
});
