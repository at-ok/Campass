import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import WbSunnyOutlined from "@mui/icons-material/WbSunnyOutlined";
import ScheduleRounded from "@mui/icons-material/ScheduleRounded";
import { format, isBefore, isSameDay, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";
import { trpc } from "@/lib/trpc";
import {
  classEvents,
  classTime,
  getColor,
  periods,
  weekdays,
} from "@/lib/planner";
import { useTheme } from "@/contexts/ThemeContext";
import { usePlannerDate } from "@/contexts/PlannerDateContext";
import { usePlannerEditor } from "@/components/material/PlannerEditor";
import {
  AddButton,
  PageHeading,
  PageLoading,
  QueryError,
} from "@/components/material/Page";
import { ScheduleCalendar } from "@/components/material/ScheduleCalendar";
import { useTaskToggle } from "@/hooks/useTaskToggle";
export default function Home() {
  const { date } = usePlannerDate();
  const { theme } = useTheme();
  const edit = usePlannerEditor();
  const classes = trpc.classes.list.useQuery();
  const tasks = trpc.tasks.list.useQuery();
  const exams = trpc.exams.list.useQuery();
  const toggle = useTaskToggle();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  if (classes.isLoading) return <PageLoading />;
  if (classes.isError)
    return <QueryError retry={() => void classes.refetch()} />;
  const courses = classes.data ?? [];
  const day = weekdays[(date.getDay() + 6) % 7];
  const todayClasses = courses
    .filter(course => course.dayOfWeek === day)
    .sort((a, b) => classTime(a).start.localeCompare(classTime(b).start));
  const pending = (tasks.data ?? [])
    .filter(task => task.status !== "completed")
    .sort(
      (a, b) =>
        (a.dueDate ? +new Date(a.dueDate) : Infinity) -
        (b.dueDate ? +new Date(b.dueDate) : Infinity)
    );
  const nextExam = (exams.data ?? [])
    .filter(
      exam =>
        exam.status !== "cancelled" &&
        exam.status !== "completed" &&
        new Date(exam.examDate) >= startOfDay(now)
    )
    .sort((a, b) => +new Date(a.examDate) - +new Date(b.examDate))[0];
  return (
    <>
      <PageHeading
        title="時間割"
        action={
          <AddButton onClick={() => edit({ kind: "class" })}>
            授業を追加
          </AddButton>
        }
      />
      <Stack
        direction="row"
        spacing={1}
        sx={{ mb: 2.5, flexWrap: "wrap", gap: 1 }}
      >
        <Chip
          icon={<ScheduleRounded />}
          label={`週 ${courses.reduce((sum, course) => sum + (course.periodCount ?? 1), 0)} コマ`}
          variant="outlined"
        />
        <Chip label={`${courses.length} 科目`} variant="outlined" />
        {pending.length > 0 && (
          <Chip
            label={`未完了の課題 ${pending.length} 件`}
            component={Link}
            href="/tasks"
            clickable
            sx={{ bgcolor: "action.selected", color: "primary.main" }}
          />
        )}
      </Stack>
      {courses.length === 0 && (
        <Alert
          severity="info"
          sx={{ mb: 2.5 }}
          action={
            <Button onClick={() => edit({ kind: "class" })}>授業を追加</Button>
          }
        >
          時間割の空き枠を選んで授業を追加できます。
        </Alert>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            lg: "minmax(0, 1fr) 292px",
          },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <ScheduleCalendar
            timetable
            events={classEvents(courses, theme === "dark")}
            hasWeekendClasses={courses.some(
              course =>
                course.dayOfWeek === "saturday" || course.dayOfWeek === "sunday"
            )}
            onEventClick={arg =>
              edit({ kind: "class", record: arg.event.extendedProps.record })
            }
            onDateClick={arg => {
              const minutes = arg.date.getHours() * 60 + arg.date.getMinutes();
              const index = periods.findIndex(p => {
                const [h, m] = p.end.split(":").map(Number);
                return minutes < h * 60 + m;
              });
              edit({
                kind: "class",
                day: weekdays[(arg.date.getDay() + 6) % 7],
                period: index < 0 ? 5 : index + 1,
              });
            }}
          />
        </Box>
        <Stack
          spacing={2.5}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr" },
            alignItems: "start",
          }}
        >
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack
              direction="row"
              spacing={1.25}
              sx={{ alignItems: "center", mb: 0.75 }}
            >
              <WbSunnyOutlined sx={{ color: "#a66300", fontSize: 21 }} />
              <Typography variant="h6">
                {isSameDay(date, now) ? "今日の授業" : "この日の授業"}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {format(date, "M月d日 EEEE", { locale: ja })}
            </Typography>
            {todayClasses.length ? (
              <Stack spacing={1.25}>
                {todayClasses.map(course => {
                  const color = getColor(course.color);
                  const time = classTime(course);
                  const active =
                    isSameDay(date, now) &&
                    format(now, "HH:mm") >= time.start &&
                    format(now, "HH:mm") < time.end;
                  return (
                    <ListItemButton
                      key={course.id}
                      onClick={() => edit({ kind: "class", record: course })}
                      sx={{
                        borderRadius: 2,
                        p: 1.5,
                        alignItems: "start",
                        borderLeft: `3px solid ${color.main}`,
                        bgcolor: active ? "action.selected" : "action.hover",
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Stack
                          direction="row"
                          sx={{ alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {time.start} – {time.end}
                          </Typography>
                          {active && (
                            <Typography variant="caption" color="primary">
                              授業中
                            </Typography>
                          )}
                        </Stack>
                        <Typography
                          sx={{ fontSize: 14, fontWeight: 500, mt: 0.5 }}
                        >
                          {course.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {course.room || "教室未設定"}
                        </Typography>
                      </Box>
                    </ListItemButton>
                  );
                })}
              </Stack>
            ) : (
              <Box sx={{ py: 2 }}>
                <Typography sx={{ fontSize: 14, mb: 1 }}>
                  この日の授業はありません
                </Typography>
              </Box>
            )}
          </Paper>
          <Paper variant="outlined" sx={{ overflow: "hidden" }}>
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                px: 2.5,
                pt: 2.5,
                pb: 1,
              }}
            >
              <Typography variant="h6">次の締め切り</Typography>
              <Typography variant="caption" color="text.secondary">
                {pending.length} 件
              </Typography>
            </Stack>
            {tasks.isError ? (
              <QueryError retry={() => void tasks.refetch()} />
            ) : (
              <List disablePadding>
                {pending.slice(0, 4).map(task => (
                  <ListItem key={task.id} disablePadding sx={{ px: 1 }}>
                    <Checkbox
                      checked={false}
                      disabled={toggle.isPending}
                      onChange={() =>
                        toggle.mutate({ id: task.id, status: "completed" })
                      }
                      slotProps={{
                        input: { "aria-label": `${task.title}を完了にする` },
                      }}
                    />
                    <ListItemButton
                      sx={{ borderRadius: 1.5, px: 0.5, py: 1.5 }}
                      onClick={() => edit({ kind: "task", record: task })}
                    >
                      <ListItemText
                        primary={task.title}
                        secondary={
                          task.dueDate
                            ? format(new Date(task.dueDate), "M/d（E）HH:mm", {
                                locale: ja,
                              })
                            : "期限なし"
                        }
                        slotProps={{
                          primary: { sx: { fontSize: 13, fontWeight: 500 } },
                          secondary: {
                            sx: {
                              fontSize: 11,
                              color:
                                task.dueDate &&
                                isBefore(new Date(task.dueDate), now)
                                  ? "error.main"
                                  : "text.secondary",
                            },
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
            {!tasks.isLoading && !tasks.isError && pending.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ px: 2.5, py: 2 }}
              >
                未完了の課題はありません。
              </Typography>
            )}
            <Divider />
            <Button
              component={Link}
              href="/tasks"
              endIcon={<ArrowForwardRounded />}
              sx={{ m: 1 }}
            >
              課題をすべて見る
            </Button>
          </Paper>
          {nextExam && (
            <Paper
              sx={{ p: 2.5, bgcolor: theme === "dark" ? "#3e2b54" : "#f0e9ff" }}
            >
              <Typography
                variant="overline"
                sx={{ color: theme === "dark" ? "#e9ddff" : "#6021a0" }}
              >
                次の試験
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {nextExam.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {format(new Date(nextExam.examDate), "M月d日（E）HH:mm", {
                  locale: ja,
                })}
              </Typography>
              <Button
                onClick={() => edit({ kind: "exam", record: nextExam })}
                sx={{ ml: -2, mt: 1 }}
              >
                詳細を確認
              </Button>
            </Paper>
          )}
        </Stack>
      </Box>
    </>
  );
}
