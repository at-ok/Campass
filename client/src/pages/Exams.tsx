import { useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import ScheduleRounded from "@mui/icons-material/ScheduleRounded";
import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";
import { trpc } from "@/lib/trpc";
import { examStatusLabels, getColor } from "@/lib/planner";
import { useTheme } from "@/contexts/ThemeContext";
import { usePlannerEditor } from "@/components/material/PlannerEditor";
import {
  AddButton,
  EmptyState,
  PageHeading,
  PageLoading,
  QueryError,
} from "@/components/material/Page";
export default function ExamsPage() {
  const query = trpc.exams.list.useQuery();
  const edit = usePlannerEditor();
  const { theme } = useTheme();
  const [filter, setFilter] = useState("upcoming");
  const now = new Date();
  const exams = (query.data ?? [])
    .filter(
      exam =>
        filter === "all" ||
        (exam.status !== "completed" &&
          exam.status !== "cancelled" &&
          new Date(exam.examDate) >= startOfDay(now))
    )
    .sort((a, b) => +new Date(a.examDate) - +new Date(b.examDate));
  return (
    <>
      <PageHeading
        title="試験"
        action={
          <AddButton onClick={() => edit({ kind: "exam" })}>
            試験を追加
          </AddButton>
        }
      />
      <Tabs
        value={filter}
        onChange={(_, value) => setFilter(value)}
        aria-label="試験の絞り込み"
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        <Tab value="upcoming" label="これからの試験" />
        <Tab value="all" label="すべて" />
      </Tabs>
      {query.isLoading ? (
        <PageLoading />
      ) : query.isError ? (
        <QueryError retry={() => void query.refetch()} />
      ) : exams.length ? (
        <Stack spacing={2}>
          {exams.map(exam => {
            const date = new Date(exam.examDate);
            const days = differenceInCalendarDays(date, now);
            const color = getColor(exam.color);
            return (
              <Card key={exam.id} variant="outlined">
                <CardActionArea
                  onClick={() => edit({ kind: "exam", record: exam })}
                  aria-label={`${exam.title}を編集`}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: 2, sm: 3 },
                  }}
                >
                  <Box
                    sx={{
                      width: 72,
                      flexShrink: 0,
                      py: 1.5,
                      borderRadius: 3,
                      textAlign: "center",
                      bgcolor: theme === "dark" ? color.dark : color.light,
                      color: theme === "dark" ? color.light : color.ink,
                    }}
                  >
                    <Typography variant="caption">
                      {format(date, "M月")}
                    </Typography>
                    <Typography sx={{ fontSize: 32, lineHeight: 1.3 }}>
                      {format(date, "d")}
                    </Typography>
                    <Typography variant="caption">
                      {format(date, "EEEE", { locale: ja })}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      sx={{
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                        mb: 0.75,
                      }}
                    >
                      <Chip
                        label={examStatusLabels[exam.status ?? "scheduled"]}
                        size="small"
                        variant="outlined"
                      />
                      {days >= 0 &&
                        exam.status !== "cancelled" &&
                        exam.status !== "completed" && (
                          <Typography
                            variant="caption"
                            color={days <= 3 ? "error.main" : "text.secondary"}
                          >
                            {days === 0 ? "今日" : `あと${days}日`}
                          </Typography>
                        )}
                    </Stack>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {exam.title}
                    </Typography>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      sx={{ gap: { xs: 0.5, sm: 3 } }}
                    >
                      <Stack
                        direction="row"
                        sx={{ gap: 0.75, alignItems: "center" }}
                      >
                        <ScheduleRounded
                          sx={{ fontSize: 16, color: "text.secondary" }}
                        />
                        <Typography variant="body2">
                          {format(date, "HH:mm")}
                          {exam.duration ? ` · ${exam.duration}分` : ""}
                        </Typography>
                      </Stack>
                      <Stack
                        direction="row"
                        sx={{ gap: 0.75, alignItems: "center" }}
                      >
                        <PlaceOutlined
                          sx={{ fontSize: 16, color: "text.secondary" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {exam.room || "会場未設定"}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </CardActionArea>
              </Card>
            );
          })}
        </Stack>
      ) : (
        <EmptyState
          title="予定されている試験はありません"
          action={
            <AddButton onClick={() => edit({ kind: "exam" })}>
              試験を追加
            </AddButton>
          }
        />
      )}
    </>
  );
}
