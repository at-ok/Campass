import { useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchRounded from "@mui/icons-material/SearchRounded";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import { trpc } from "@/lib/trpc";
import { classSchedule, classTime, getColor, weekdays } from "@/lib/planner";
import { useTheme } from "@/contexts/ThemeContext";
import { usePlannerEditor } from "@/components/material/PlannerEditor";
import {
  AddButton,
  EmptyState,
  PageHeading,
  PageLoading,
  QueryError,
} from "@/components/material/Page";
export default function ClassesPage() {
  const query = trpc.classes.list.useQuery();
  const edit = usePlannerEditor();
  const { theme } = useTheme();
  const [search, setSearch] = useState("");
  const courses = (query.data ?? [])
    .filter(course =>
      `${course.name} ${course.instructor ?? ""} ${course.room ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort(
      (a, b) =>
        weekdays.indexOf(a.dayOfWeek!) - weekdays.indexOf(b.dayOfWeek!) ||
        (a.period ?? 0) - (b.period ?? 0)
    );
  return (
    <>
      <PageHeading
        title="授業一覧"
        description="授業の情報を、ひとつの場所に。"
        action={
          <AddButton onClick={() => edit({ kind: "class" })}>
            授業を追加
          </AddButton>
        }
      />
      <TextField
        label="授業を検索"
        size="small"
        value={search}
        onChange={e => setSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded />
              </InputAdornment>
            ),
          },
        }}
        sx={{ maxWidth: 400, mb: 3 }}
      />
      {query.isLoading ? (
        <PageLoading />
      ) : query.isError ? (
        <QueryError retry={() => void query.refetch()} />
      ) : courses.length ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2.5,
          }}
        >
          {courses.map(course => {
            const color = getColor(course.color);
            const time = classTime(course);
            return (
              <Card key={course.id} variant="outlined" sx={{ borderRadius: 3 }}>
                <CardActionArea
                  onClick={() => edit({ kind: "class", record: course })}
                  aria-label={`${course.name}を編集`}
                  sx={{ p: 3, height: "100%", display: "block" }}
                >
                  <Stack
                    direction="row"
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2.5,
                    }}
                  >
                    <Chip
                      size="small"
                      label={classSchedule(course)}
                      sx={{
                        bgcolor: theme === "dark" ? color.dark : color.light,
                        color: theme === "dark" ? color.light : color.ink,
                      }}
                    />
                    <ArrowForwardRounded
                      sx={{ color: "text.secondary", fontSize: 20 }}
                    />
                  </Stack>
                  <Typography variant="h6" sx={{ mb: 0.75 }}>
                    {course.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    {time.start} – {time.end}
                  </Typography>
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      sx={{ gap: 1, alignItems: "center" }}
                    >
                      <PlaceOutlined
                        sx={{ fontSize: 18, color: "text.secondary" }}
                      />
                      <Typography variant="body2">
                        {course.room || "教室未設定"}
                      </Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      sx={{ gap: 1, alignItems: "center" }}
                    >
                      <PersonOutlineRounded
                        sx={{ fontSize: 18, color: "text.secondary" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {course.instructor || "担当教員未設定"}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      ) : (
        <EmptyState
          title={search ? "授業が見つかりません" : "授業を登録しましょう"}
          description={
            search
              ? "授業名、教員名、教室で検索できます。"
              : "曜日と時限を選ぶだけで、時間割にも自動で反映されます。"
          }
          action={
            !search && (
              <AddButton onClick={() => edit({ kind: "class" })}>
                最初の授業を追加
              </AddButton>
            )
          }
        />
      )}
    </>
  );
}
