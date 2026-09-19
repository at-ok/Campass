import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import CloseRounded from "@mui/icons-material/CloseRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import { trpc } from "@/lib/trpc";
import {
  courseColors,
  dayLabels,
  datetimeValue,
  eventDates,
  examStatusLabels,
  periods,
  priorityLabels,
  weekdays,
} from "@/lib/planner";
import { useFeedback } from "./Feedback";

import {
  schema,
  defaults,
  classScheduleInput,
  type Values,
} from "@/lib/editorForm";

import type { EditorRequest } from "./PlannerEditor";
const labels = { class: "授業", task: "課題", exam: "試験", event: "予定" };

export default function Editor({
  request,
  onClose,
}: {
  request: EditorRequest;
  onClose: () => void;
}) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const notify = useFeedback();
  const utils = trpc.useUtils();
  const classes = trpc.classes.list.useQuery();
  const createClass = trpc.classes.create.useMutation();
  const updateClass = trpc.classes.update.useMutation();
  const deleteClass = trpc.classes.delete.useMutation();
  const createTask = trpc.tasks.create.useMutation();
  const updateTask = trpc.tasks.update.useMutation();
  const deleteTask = trpc.tasks.delete.useMutation();
  const createExam = trpc.exams.create.useMutation();
  const updateExam = trpc.exams.update.useMutation();
  const deleteExam = trpc.exams.delete.useMutation();
  const createEvent = trpc.events.create.useMutation();
  const updateEvent = trpc.events.update.useMutation();
  const deleteEvent = trpc.events.delete.useMutation();
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults(request),
  });
  useEffect(() => {
    if (!isDirty && !busy) return;
    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventUnload);
    return () => window.removeEventListener("beforeunload", preventUnload);
  }, [isDirty, busy]);
  const requestClose = () => {
    if (busy) return;
    if (isDirty) setConfirmDiscard(true);
    else onClose();
  };
  const kind = request.kind;
  const field = (name: keyof Values) => {
    const { ref, ...input } = register(name);
    return {
      ...input,
      inputRef: ref,
      error: !!errors[name],
      helperText: errors[name]?.message,
      disabled: busy,
    };
  };
  const refresh = () =>
    Promise.all([
      utils.classes.list.invalidate(),
      utils.tasks.list.invalidate(),
      utils.exams.list.invalidate(),
      utils.events.list.invalidate(),
      utils.dashboard.invalidate(),
    ]);
  const submit = handleSubmit(async values => {
    if (busy) return;
    setBusy(true);
    setFailure("");
    try {
      const id = request.record?.id;
      const classId = values.classId ? Number(values.classId) : null;
      if (kind === "class") {
        const data = {
          name: values.title,
          instructor: values.instructor.trim(),
          room: values.room.trim(),
          ...classScheduleInput(
            values,
            request.kind === "class" ? request.record : undefined
          ),
          color: values.color,
        };
        if (id) await updateClass.mutateAsync({ id, ...data });
        else await createClass.mutateAsync(data);
      } else if (kind === "task") {
        const data = {
          title: values.title,
          description: values.description.trim(),
          classId,
          dueDate: values.dueDate ? new Date(values.dueDate) : null,
          priority: values.priority,
          status: values.taskStatus,
          color: values.color,
        };
        if (id) await updateTask.mutateAsync({ id, ...data });
        else await createTask.mutateAsync(data);
      } else if (kind === "exam") {
        const data = {
          title: values.title,
          description: values.description.trim(),
          classId,
          examDate: new Date(values.date),
          duration: values.duration ? Number(values.duration) : null,
          room: values.room.trim(),
          status: values.status,
          color: values.color,
        };
        if (id) await updateExam.mutateAsync({ id, ...data });
        else await createExam.mutateAsync(data);
      } else {
        const data = {
          title: values.title,
          description: values.description.trim(),
          ...eventDates(values.date, values.endDate, values.allDay),
          allDay: values.allDay,
          eventType: values.eventType,
          color: values.color,
        };
        if (id) await updateEvent.mutateAsync({ id, ...data });
        else await createEvent.mutateAsync(data);
      }
      await refresh();
      notify(`${labels[kind]}を${id ? "更新" : "追加"}しました`);
      onClose();
    } catch {
      setFailure(
        "保存できませんでした。入力内容は保持されています。もう一度お試しください。"
      );
    } finally {
      setBusy(false);
    }
  });
  const remove = async () => {
    if (!request.record) return;
    setBusy(true);
    setFailure("");
    try {
      const data = { id: request.record.id };
      if (kind === "class") await deleteClass.mutateAsync(data);
      if (kind === "task") await deleteTask.mutateAsync(data);
      if (kind === "exam") await deleteExam.mutateAsync(data);
      if (kind === "event") await deleteEvent.mutateAsync(data);
      await refresh();
      notify(`${labels[kind]}を削除しました`);
      onClose();
    } catch {
      setConfirmDelete(false);
      setFailure(
        "削除できませんでした。関連するデータや接続を確認して、もう一度お試しください。"
      );
    } finally {
      setBusy(false);
    }
  };
  const select = (
    name: keyof Values,
    label: string,
    options: { value: string; label: string }[]
  ) => (
    <Controller
      name={name}
      control={control}
      render={({ field: input }) => (
        <TextField
          {...input}
          select
          label={label}
          error={!!errors[name]}
          helperText={errors[name]?.message}
        >
          {options.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
  const allDay = watch("allDay");
  const dateField = (name: "date" | "dueDate" | "endDate", label: string) => (
    <Controller
      name={name}
      control={control}
      render={({ field: input }) => {
        const common = {
          label,
          value: input.value ? new Date(input.value) : null,
          onChange: (value: Date | null) =>
            input.onChange(
              value && Number.isFinite(value.getTime())
                ? datetimeValue(value)
                : value
                  ? "invalid"
                  : ""
            ),
          slotProps: {
            textField: {
              error: !!errors[name],
              helperText: errors[name]?.message,
              fullWidth: true,
              required: name === "date",
            },
            actionBar: {
              actions: ["clear", "cancel", "accept"] as (
                | "clear"
                | "cancel"
                | "accept"
              )[],
            },
          },
        };
        return kind === "event" && allDay ? (
          <DatePicker {...common} format="yyyy/MM/dd" />
        ) : (
          <DateTimePicker {...common} ampm={false} format="yyyy/MM/dd HH:mm" />
        );
      }}
    />
  );
  return (
    <>
      <Dialog
        open
        onClose={requestClose}
        fullWidth
        maxWidth="sm"
        fullScreen={mobile}
        aria-labelledby="editor-title"
      >
        <DialogTitle id="editor-title" sx={{ pr: 8 }}>
          {labels[kind]}を{request.record ? "編集" : "追加"}
          <IconButton
            aria-label="閉じる"
            disabled={busy}
            onClick={requestClose}
            sx={{ position: "absolute", right: 16, top: 16 }}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>
        <Box
          component="form"
          onSubmit={submit}
          noValidate
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            flex: 1,
          }}
        >
          <DialogContent sx={{ pt: "12px !important" }}>
            <Stack spacing={2.5}>
              {failure && <Alert severity="error">{failure}</Alert>}
              <TextField
                label={kind === "class" ? "授業名" : "タイトル"}
                autoFocus
                required
                {...field("title")}
                placeholder={kind === "class" ? "例：情報科学概論" : undefined}
              />
              {kind === "class" ? (
                <>
                  {select("dayOfWeek", "曜日", [
                    { value: "", label: "未設定" },
                    ...weekdays.map((day, index) => ({
                      value: day,
                      label: `${dayLabels[index]}曜日`,
                    })),
                  ])}
                  <Stack direction="row" spacing={2}>
                    {select("period", "開始時限", [
                      { value: "", label: "未設定" },
                      ...periods.map((p, i) => ({
                        value: String(i + 1),
                        label: `${i + 1}限 · ${p.start}`,
                      })),
                    ])}
                    {select("periodCount", "コマ数", [
                      { value: "1", label: "1コマ" },
                      { value: "2", label: "2コマ連続" },
                    ])}
                  </Stack>
                  {watch("period") && (
                    <Typography variant="body2" color="text.secondary">
                      {periods[Number(watch("period")) - 1]?.start} –{" "}
                      {
                        periods[
                          Math.min(
                            Number(watch("period")) +
                              Number(watch("periodCount")) -
                              2,
                            4
                          )
                        ]?.end
                      }
                    </Typography>
                  )}
                  <TextField
                    label="教室"
                    {...field("room")}
                    placeholder="例：1号館 201"
                  />
                  <TextField label="担当教員" {...field("instructor")} />
                </>
              ) : (
                <>
                  {kind !== "event" &&
                    select("classId", "関連する授業", [
                      { value: "", label: "指定なし" },
                      ...(classes.data ?? []).map(c => ({
                        value: String(c.id),
                        label: c.name,
                      })),
                    ])}
                  {kind === "task" ? (
                    <>
                      {dateField("dueDate", "提出期限（任意）")}
                      <Stack direction="row" spacing={2}>
                        {select(
                          "priority",
                          "優先度",
                          Object.entries(priorityLabels).map(
                            ([value, label]) => ({ value, label })
                          )
                        )}
                        {select("taskStatus", "進捗", [
                          { value: "pending", label: "未着手" },
                          { value: "in_progress", label: "進行中" },
                          { value: "completed", label: "完了" },
                        ])}
                      </Stack>
                    </>
                  ) : (
                    dateField("date", kind === "exam" ? "試験日時" : "開始日時")
                  )}
                  {kind === "exam" && (
                    <>
                      <Stack direction="row" spacing={2}>
                        <TextField
                          label="試験時間（分）"
                          type="number"
                          {...field("duration")}
                          slotProps={{ htmlInput: { min: 1 } }}
                        />
                        {select(
                          "status",
                          "状態",
                          Object.entries(examStatusLabels).map(
                            ([value, label]) => ({ value, label })
                          )
                        )}
                      </Stack>
                      <TextField label="試験会場" {...field("room")} />
                    </>
                  )}
                  {kind === "event" && (
                    <>
                      {dateField("endDate", "終了日時（任意）")}
                      <Controller
                        name="allDay"
                        control={control}
                        render={({ field: input }) => (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={input.value}
                                onChange={(_, checked) =>
                                  input.onChange(checked)
                                }
                              />
                            }
                            label="終日の予定"
                          />
                        )}
                      />
                      {select("eventType", "種類", [
                        { value: "other", label: "その他" },
                        { value: "reminder", label: "リマインダー" },
                      ])}
                    </>
                  )}
                  <TextField
                    label="メモ"
                    multiline
                    minRows={3}
                    {...field("description")}
                  />
                </>
              )}
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  表示色
                </Typography>
                <Controller
                  name="color"
                  control={control}
                  render={({ field: input }) => (
                    <ToggleButtonGroup
                      exclusive
                      value={input.value}
                      onChange={(_, value) => value && input.onChange(value)}
                      aria-label="表示色"
                      sx={{
                        gap: 1,
                        "& .MuiToggleButtonGroup-grouped": {
                          border: "0 !important",
                          borderRadius: "50% !important",
                          p: 0,
                          width: 40,
                          height: 40,
                        },
                      }}
                    >
                      {Object.entries(courseColors).map(([key, color]) => (
                        <ToggleButton
                          key={key}
                          value={key}
                          aria-label={color.label}
                          sx={{
                            bgcolor: `${color.light} !important`,
                            color: `${color.ink} !important`,
                            "&.Mui-selected": {
                              outline: `2px solid ${color.main}`,
                              outlineOffset: 2,
                            },
                          }}
                        >
                          <Tooltip title={color.label}>
                            <Box
                              sx={{
                                display: "grid",
                                placeItems: "center",
                                width: 40,
                                height: 40,
                              }}
                            >
                              {input.value === key && (
                                <CheckRounded fontSize="small" />
                              )}
                            </Box>
                          </Tooltip>
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  )}
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            {request.record && (
              <Button
                color="error"
                startIcon={<DeleteOutlineRounded />}
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                sx={{ mr: "auto", px: 1.5 }}
              >
                削除
              </Button>
            )}
            <Button onClick={requestClose} disabled={busy}>
              キャンセル
            </Button>
            <Button type="submit" variant="contained" disabled={busy}>
              {busy ? "保存中…" : "保存"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      <Dialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="discard-title"
        aria-describedby="discard-description"
      >
        <DialogTitle id="discard-title">変更を破棄しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText id="discard-description">
            入力した変更は保存されていません。閉じると変更が失われます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDiscard(false)} autoFocus>
            編集を続ける
          </Button>
          <Button color="error" variant="contained" onClick={onClose}>
            変更を破棄
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={confirmDelete}
        onClose={() => !busy && setConfirmDelete(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="delete-title"
      >
        <DialogTitle id="delete-title">
          {labels[kind]}を削除しますか？
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{watch("title")}」を削除します。この操作は取り消せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDelete(false)}
            disabled={busy}
            autoFocus
          >
            キャンセル
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={remove}
            disabled={busy}
          >
            {busy ? "削除中…" : "削除"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
