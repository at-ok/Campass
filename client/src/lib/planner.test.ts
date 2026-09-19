import { describe, expect, it } from "vitest";
import { classEvents, classTime, eventDates, getColor } from "./planner";
import type { Class } from "@shared/schema";

const course: Class = {
  id: 1,
  userId: "student",
  name: "情報科学",
  instructor: null,
  room: "201",
  dayOfWeek: "monday",
  period: 2,
  periodCount: 2,
  startTime: null,
  endTime: null,
  color: "blue",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("weekly class scheduling", () => {
  it("spans consecutive periods including the lunch break", () => {
    expect(classTime(course)).toEqual({ start: "10:30", end: "14:30" });
  });
  it("preserves explicit times from existing data", () => {
    expect(
      classTime({ ...course, startTime: "09:15:00", endTime: "12:30:00" })
    ).toEqual({ start: "09:15", end: "12:30" });
  });
  it("maps weekend courses to FullCalendar without dropping them", () => {
    expect(
      classEvents(
        [
          { ...course, dayOfWeek: "saturday" },
          { ...course, id: 2, dayOfWeek: "sunday" },
        ],
        false
      ).map(event => event.daysOfWeek)
    ).toEqual([[6], [0]]);
  });
  it("does not invent a schedule for courses with no day or time", () => {
    expect(
      classEvents(
        [
          { ...course, dayOfWeek: null },
          { ...course, period: null, startTime: null, endTime: null },
        ],
        false
      )
    ).toEqual([]);
  });
  it("handles an unknown legacy color", () => {
    expect(getColor("old-custom-color")).toEqual(getColor("blue"));
  });
});

describe("event editor date conversion", () => {
  it("converts an inclusive all-day range to an exclusive calendar end", () => {
    expect(eventDates("2026-09-14T09:00", "2026-09-14T10:00", true)).toEqual({
      startDate: new Date(2026, 8, 14),
      endDate: new Date(2026, 8, 15),
    });
  });
  it("preserves the time of timed events", () => {
    expect(eventDates("2026-09-14T09:00", "2026-09-14T10:00", false)).toEqual({
      startDate: new Date(2026, 8, 14, 9),
      endDate: new Date(2026, 8, 14, 10),
    });
  });
  it("keeps a cleared end date null", () => {
    expect(eventDates("2026-09-14T09:00", "", false).endDate).toBeNull();
  });
});
