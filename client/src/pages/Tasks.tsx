import { useState } from "react";
import {
  Box,
  Checkbox,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { format, isBefore } from "date-fns";
import { ja } from "date-fns/locale";
import FlagOutlined from "@mui/icons-material/FlagOutlined";
import { trpc } from "@/lib/trpc";
import { priorityLabels } from "@/lib/planner";
import { useTaskToggle } from "@/hooks/useTaskToggle";
import { usePlannerEditor } from "@/components/material/PlannerEditor";
import {
  AddButton,
  EmptyState,
  PageHeading,
  PageLoading,
  QueryError,
} from "@/components/material/Page";
export default function TasksPage() {
  const query = trpc.tasks.list.useQuery();
  const classes = trpc.classes.list.useQuery();
  const edit = usePlannerEditor();
  const toggle = useTaskToggle();
  const [filter, setFilter] = useState("pending");
  const [sort, setSort] = useState("date");
  const all = query.data ?? [];
  const pending = all.filter(task => task.status !== "completed");
  const filtered = all
    .filter(
      task =>
        filter === "all" ||
        (filter === "completed"
          ? task.status === "completed"
          : task.status !== "completed")
    )
    .sort((a, b) => {
      if (sort === "priority")
        return (
          { high: 0, medium: 1, low: 2 }[a.priority ?? "medium"] -
          { high: 0, medium: 1, low: 2 }[b.priority ?? "medium"]
        );
      return (
        (a.dueDate ? +new Date(a.dueDate) : Infinity) -
        (b.dueDate ? +new Date(b.dueDate) : Infinity)
      );
    });
  return (
    <>
      <PageHeading
        title="課題"
        action={
          <AddButton onClick={() => edit({ kind: "task" })}>
            課題を追加
          </AddButton>
        }
      />
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            alignItems: { sm: "center" },
            justifyContent: "space-between",
            borderBottom: 1,
            borderColor: "divider",
            px: 2,
            gap: 1,
          }}
        >
          <Tabs
            value={filter}
            onChange={(_, value) => setFilter(value)}
            aria-label="課題の絞り込み"
          >
            <Tab value="pending" label={`未完了 ${pending.length}`} />
            <Tab
              value="completed"
              label={`完了 ${all.length - pending.length}`}
            />
            <Tab value="all" label="すべて" />
          </Tabs>
          <TextField
            select
            size="small"
            label="並び順"
            value={sort}
            onChange={event => setSort(event.target.value)}
            sx={{ width: 150, my: 1.5 }}
          >
            <MenuItem value="date">期限が近い順</MenuItem>
            <MenuItem value="priority">優先度が高い順</MenuItem>
          </TextField>
        </Stack>
        {query.isLoading ? (
          <Box sx={{ p: 3 }}>
            <PageLoading />
          </Box>
        ) : query.isError ? (
          <QueryError retry={() => void query.refetch()} />
        ) : filtered.length ? (
          <List disablePadding>
            {filtered.map((task, index) => {
              const completed = task.status === "completed";
              const overdue =
                !completed &&
                task.dueDate &&
                isBefore(new Date(task.dueDate), new Date());
              const course = classes.data?.find(
                course => course.id === task.classId
              );
              return (
                <Box key={task.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    disablePadding
                    sx={{ pl: { xs: 0.5, sm: 2 }, pr: 1 }}
                  >
                    <Checkbox
                      checked={completed}
                      disabled={toggle.isPending}
                      onChange={() =>
                        toggle.mutate({
                          id: task.id,
                          status: completed ? "pending" : "completed",
                        })
                      }
                      slotProps={{
                        input: {
                          "aria-label": `${task.title}を${completed ? "未完了に戻す" : "完了にする"}`,
                        },
                      }}
                    />
                    <ListItemButton
                      onClick={() => edit({ kind: "task", record: task })}
                      sx={{ borderRadius: 2, px: { xs: 1, sm: 2 }, py: 2.5 }}
                    >
                      <Box sx={{ minWidth: 0, width: "100%" }}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          sx={{ gap: 1, justifyContent: "space-between" }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 500,
                              textDecoration: completed
                                ? "line-through"
                                : "none",
                              color: completed
                                ? "text.secondary"
                                : "text.primary",
                            }}
                          >
                            {task.title}
                          </Typography>
                          <Stack direction="row" sx={{ gap: 1, flexShrink: 0 }}>
                            {task.status === "in_progress" && (
                              <Chip
                                label="進行中"
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                            {task.priority === "high" && !completed && (
                              <Chip
                                icon={<FlagOutlined />}
                                label="優先度 高"
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        </Stack>
                        {task.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ mt: 0.5 }}
                          >
                            {task.description}
                          </Typography>
                        )}
                        <Stack
                          direction="row"
                          sx={{
                            alignItems: "center",
                            gap: 1.5,
                            mt: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography
                            variant="body2"
                            color={overdue ? "error.main" : "text.secondary"}
                          >
                            {overdue ? "期限超過 · " : ""}
                            {task.dueDate
                              ? format(
                                  new Date(task.dueDate),
                                  "M月d日（E）HH:mm",
                                  { locale: ja }
                                )
                              : "期限なし"}
                          </Typography>
                          {course && (
                            <Chip
                              label={course.name}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {task.priority !== "high" && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              優先度 {priorityLabels[task.priority ?? "medium"]}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                </Box>
              );
            })}
          </List>
        ) : (
          <EmptyState
            title={
              filter === "completed"
                ? "完了した課題はまだありません"
                : filter === "all"
                  ? "課題はありません"
                  : "未完了の課題はありません"
            }
            action={
              <AddButton onClick={() => edit({ kind: "task" })}>
                課題を追加
              </AddButton>
            }
          />
        )}
      </Paper>
    </>
  );
}
