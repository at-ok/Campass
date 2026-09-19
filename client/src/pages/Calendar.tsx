import { useMemo, useState } from "react";
import { Box, Chip, Stack } from "@mui/material";
import { addMinutes } from "date-fns";
import type { EventInput } from "@fullcalendar/core";
import { trpc } from "@/lib/trpc";
import { classEvents, getColor } from "@/lib/planner";
import { useTheme } from "@/contexts/ThemeContext";
import {
  usePlannerEditor,
  type EditorRequest,
} from "@/components/material/PlannerEditor";
import {
  AddButton,
  PageHeading,
  PageLoading,
  QueryError,
} from "@/components/material/Page";
import { ScheduleCalendar } from "@/components/material/ScheduleCalendar";
const filters = [
  { kind: "class", label: "授業", color: "blue" },
  { kind: "task", label: "課題", color: "yellow" },
  { kind: "exam", label: "試験", color: "pink" },
  { kind: "event", label: "予定", color: "green" },
];
export default function CalendarPage() {
  const events = trpc.events.list.useQuery();
  const classes = trpc.classes.list.useQuery();
  const tasks = trpc.tasks.list.useQuery();
  const exams = trpc.exams.list.useQuery();
  const { theme } = useTheme();
  const edit = usePlannerEditor();
  const [visible, setVisible] = useState(["class", "task", "exam", "event"]);
  const calendarEvents = useMemo(() => {
    const paint = (color: string | null) => {
      const palette = getColor(color);
      return {
        backgroundColor: theme === "dark" ? palette.dark : palette.light,
        textColor: theme === "dark" ? palette.light : palette.ink,
        borderColor: palette.main,
      };
    };
    const result: EventInput[] = [
      ...classEvents(classes.data ?? [], theme === "dark"),
      ...(events.data ?? []).map(record => ({
        id: `event-${record.id}`,
        title: record.title,
        start: new Date(record.startDate),
        end: record.endDate ? new Date(record.endDate) : undefined,
        allDay: record.allDay ?? false,
        ...paint(record.color),
        extendedProps: { kind: "event", record },
      })),
      ...(tasks.data ?? [])
        .filter(record => record.dueDate && record.status !== "completed")
        .map(record => ({
          id: `task-${record.id}`,
          title: `提出 · ${record.title}`,
          start: new Date(record.dueDate!),
          ...paint(record.color),
          extendedProps: { kind: "task", record },
        })),
      ...(exams.data ?? [])
        .filter(record => record.status !== "cancelled")
        .map(record => ({
          id: `exam-${record.id}`,
          title: `試験 · ${record.title}`,
          start: new Date(record.examDate),
          end: record.duration
            ? addMinutes(new Date(record.examDate), record.duration)
            : undefined,
          ...paint(record.color),
          extendedProps: { kind: "exam", record },
        })),
    ];
    return result.filter(event => visible.includes(event.extendedProps!.kind));
  }, [classes.data, tasks.data, exams.data, events.data, theme, visible]);
  const queries = [events, classes, tasks, exams];
  return (
    <>
      <PageHeading
        title="カレンダー"
        action={
          <AddButton onClick={() => edit({ kind: "event" })}>
            予定を追加
          </AddButton>
        }
      />
      <Stack
        direction="row"
        aria-label="表示する予定"
        sx={{ gap: 1, mb: 2.5, flexWrap: "wrap" }}
      >
        {filters.map(filter => (
          <Chip
            key={filter.kind}
            label={filter.label}
            onClick={() =>
              setVisible(prev =>
                prev.includes(filter.kind)
                  ? prev.filter(kind => kind !== filter.kind)
                  : [...prev, filter.kind]
              )
            }
            aria-pressed={visible.includes(filter.kind)}
            variant={visible.includes(filter.kind) ? "filled" : "outlined"}
            icon={
              <Box
                component="span"
                sx={{
                  width: "10px !important",
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: getColor(filter.color).main,
                  ml: "12px !important",
                }}
              />
            }
            sx={{ px: 0.5, opacity: visible.includes(filter.kind) ? 1 : 0.65 }}
          />
        ))}
      </Stack>
      {queries.some(query => query.isError) ? (
        <QueryError
          retry={() => queries.forEach(query => void query.refetch())}
        />
      ) : queries.some(query => query.isLoading) ? (
        <PageLoading />
      ) : (
        <ScheduleCalendar
          events={calendarEvents}
          onDateClick={arg => {
            const date = new Date(arg.date);
            if (arg.allDay) date.setHours(9);
            edit({ kind: "event", date });
          }}
          onEventClick={arg => edit(arg.event.extendedProps as EditorRequest)}
        />
      )}
    </>
  );
}
