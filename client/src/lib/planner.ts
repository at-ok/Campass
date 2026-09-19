import { addDays, format, startOfDay } from "date-fns";
import type { Class } from "@shared/schema";

export const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export const dayLabels = ["月", "火", "水", "木", "金", "土", "日"];
export const periods = [
  { start: "08:45", end: "10:15" },
  { start: "10:30", end: "12:00" },
  { start: "13:00", end: "14:30" },
  { start: "14:45", end: "16:15" },
  { start: "16:30", end: "18:00" },
];
export const courseColors = {
  blue: {
    label: "ブルー",
    main: "#1967d2",
    light: "#d3e3fd",
    dark: "#183b66",
    ink: "#0842a0",
  },
  green: {
    label: "グリーン",
    main: "#188038",
    light: "#ceead6",
    dark: "#203f2d",
    ink: "#0d5425",
  },
  purple: {
    label: "ラベンダー",
    main: "#8430ce",
    light: "#e9ddff",
    dark: "#3e2b54",
    ink: "#6021a0",
  },
  pink: {
    label: "ローズ",
    main: "#b3261e",
    light: "#fce2e0",
    dark: "#552e32",
    ink: "#8c1d18",
  },
  yellow: {
    label: "イエロー",
    main: "#a66300",
    light: "#feefc3",
    dark: "#493d20",
    ink: "#754600",
  },
};
export function getColor(color?: string | null) {
  return courseColors[color as keyof typeof courseColors] ?? courseColors.blue;
}
export function classTime(
  course: Pick<Class, "period" | "periodCount" | "startTime" | "endTime">
) {
  const first = periods[(course.period ?? 1) - 1] ?? periods[0];
  const last =
    periods[
      Math.min((course.period ?? 1) + (course.periodCount ?? 1) - 2, 4)
    ] ?? first;
  return {
    start: (course.startTime || first.start).slice(0, 5),
    end: (course.endTime || last.end).slice(0, 5),
  };
}
export function classSchedule(course: Class) {
  if (!course.dayOfWeek) return "曜日未設定";
  const label = `${dayLabels[weekdays.indexOf(course.dayOfWeek)]}曜日`;
  return course.period
    ? `${label} · ${course.period}${course.periodCount === 2 ? `–${course.period + 1}` : ""}限`
    : label;
}
export function classEvents(classes: Class[], dark: boolean) {
  return classes
    .filter(
      course =>
        course.dayOfWeek &&
        (course.period || (course.startTime && course.endTime))
    )
    .map(course => {
      const color = getColor(course.color);
      const time = classTime(course);
      return {
        id: `class-${course.id}`,
        title: course.name,
        daysOfWeek: [(weekdays.indexOf(course.dayOfWeek!) + 1) % 7],
        startTime: time.start,
        endTime: time.end,
        backgroundColor: dark ? color.dark : color.light,
        borderColor: color.main,
        textColor: dark ? color.light : color.ink,
        extendedProps: { kind: "class", record: course },
      };
    });
}
export function datetimeValue(value?: Date | string | null) {
  return value ? format(new Date(value), "yyyy-MM-dd'T'HH:mm") : "";
}
export const priorityLabels = { low: "低", medium: "標準", high: "高" };
export const examStatusLabels = {
  scheduled: "予定",
  confirmed: "確定",
  completed: "終了",
  cancelled: "中止",
};

// FullCalendar uses an exclusive end date for all-day events.
export function eventDates(start: string, end: string, allDay: boolean) {
  return {
    startDate: allDay ? startOfDay(new Date(start)) : new Date(start),
    endDate: end
      ? allDay
        ? addDays(startOfDay(new Date(end)), 1)
        : new Date(end)
      : null,
  };
}
