import React, { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  CheckSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";

const days = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const dayLabelsJa = ["月", "火", "水", "木", "金"];
const periods = [1, 2, 3, 4, 5] as const;

// 時限の時間帯マッピング（指定された時間）
const periodTimes: Record<
  number,
  { start: string; end: string; startMinutes: number; endMinutes: number }
> = {
  1: {
    start: "8:45",
    end: "10:15",
    startMinutes: 8 * 60 + 45,
    endMinutes: 10 * 60 + 15,
  },
  2: {
    start: "10:30",
    end: "12:00",
    startMinutes: 10 * 60 + 30,
    endMinutes: 12 * 60,
  },
  3: {
    start: "13:00",
    end: "14:30",
    startMinutes: 13 * 60,
    endMinutes: 14 * 60 + 30,
  },
  4: {
    start: "14:45",
    end: "16:15",
    startMinutes: 14 * 60 + 45,
    endMinutes: 16 * 60 + 15,
  },
  5: {
    start: "16:30",
    end: "18:00",
    startMinutes: 16 * 60 + 30,
    endMinutes: 18 * 60,
  },
};

const pastelBgColors: Record<string, string> = {
  pink: "bg-[oklch(0.92_0.06_0/0.9)]",
  yellow: "bg-[oklch(0.95_0.06_90/0.9)]",
  blue: "bg-[oklch(0.92_0.06_240/0.9)]",
  green: "bg-[oklch(0.93_0.06_145/0.9)]",
  purple: "bg-[oklch(0.92_0.06_300/0.9)]",
};

type ClassFormData = {
  name: string;
  instructor: string;
  room: string;
  color: string;
};

const initialFormData: ClassFormData = {
  name: "",
  instructor: "",
  room: "",
  color: "blue",
};

// 今日の曜日を取得
const getTodayDayIndex = () => {
  const today = new Date().getDay();
  // 0=Sunday, 1=Monday, ... 6=Saturday
  // days配列は月〜金なので、1-5を0-4にマッピング
  if (today >= 1 && today <= 5) {
    return today - 1;
  }
  return 0; // 土日は月曜を表示
};

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    day: (typeof days)[number];
    period: number;
  } | null>(null);
  const [formData, setFormData] = useState<ClassFormData>(initialFormData);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: classes, isLoading: classesLoading } =
    trpc.classes.list.useQuery();
  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery();
  const { data: exams, isLoading: examsLoading } = trpc.exams.list.useQuery();
  const { data: events, isLoading: eventsLoading } =
    trpc.events.list.useQuery();

  const createClass = trpc.classes.create.useMutation({
    onSuccess: () => {
      utils.classes.list.invalidate();
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setSelectedCell(null);
      toast.success("Class created successfully");
    },
    onError: () => toast.error("Failed to create class"),
  });

  const updateClass = trpc.classes.update.useMutation({
    onSuccess: () => {
      utils.classes.list.invalidate();
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setSelectedCell(null);
      setEditingClassId(null);
      toast.success("Class updated successfully");
    },
    onError: () => toast.error("Failed to update class"),
  });

  const deleteClass = trpc.classes.delete.useMutation({
    onSuccess: () => {
      utils.classes.list.invalidate();
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setSelectedCell(null);
      setEditingClassId(null);
      toast.success("Class deleted successfully");
    },
    onError: () => toast.error("Failed to delete class"),
  });

  // 現在時刻を1分ごとに更新
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // 現在の時限状態を計算
  const currentPeriodState = useMemo(() => {
    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const todayDayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...

    // 平日かどうか
    if (todayDayOfWeek < 1 || todayDayOfWeek > 5) {
      return { type: "outside" as const, period: null, dayIndex: null };
    }

    const dayIndex = todayDayOfWeek - 1;

    // 各時限をチェック
    for (const period of periods) {
      const pt = periodTimes[period];
      if (currentMinutes >= pt.startMinutes && currentMinutes < pt.endMinutes) {
        return { type: "during" as const, period, dayIndex };
      }
    }

    // 時限間のチェック
    for (let i = 0; i < periods.length - 1; i++) {
      const currentPeriod = periods[i];
      const nextPeriod = periods[i + 1];
      const currentEnd = periodTimes[currentPeriod].endMinutes;
      const nextStart = periodTimes[nextPeriod].startMinutes;

      if (currentMinutes >= currentEnd && currentMinutes < nextStart) {
        return {
          type: "between" as const,
          afterPeriod: currentPeriod,
          beforePeriod: nextPeriod,
          dayIndex,
        };
      }
    }

    // 授業時間外
    return { type: "outside" as const, period: null, dayIndex };
  }, [currentTime]);

  // 時間割表のデータを構築
  const timetableData = useMemo(() => {
    const table: Record<
      string,
      Record<number, NonNullable<typeof classes>[number] | null>
    > = {};

    days.forEach(day => {
      table[day] = {};
      periods.forEach(period => {
        table[day][period] = null;
      });
    });

    classes?.forEach(cls => {
      if (cls.dayOfWeek && cls.period) {
        table[cls.dayOfWeek][cls.period] = cls;
        if (cls.periodCount === 2 && cls.period < 5) {
          table[cls.dayOfWeek][cls.period + 1] = cls;
        }
      }
    });

    return table;
  }, [classes]);

  // カレンダーの日付を生成
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // 選択した日のタスクと試験を取得
  const selectedDayItems = useMemo(() => {
    const selectedTasks =
      tasks?.filter(task => {
        if (!task.dueDate) return false;
        return isSameDay(new Date(task.dueDate), selectedDate);
      }) || [];

    const selectedExams =
      exams?.filter(exam => {
        return isSameDay(new Date(exam.examDate), selectedDate);
      }) || [];

    return { tasks: selectedTasks, exams: selectedExams };
  }, [tasks, exams, selectedDate]);

  // 日付にイベントがあるかチェック
  const getEventsOnDate = (date: Date) => {
    const hasTasks = tasks?.some(
      task => task.dueDate && isSameDay(new Date(task.dueDate), date)
    );
    const hasExams = exams?.some(exam =>
      isSameDay(new Date(exam.examDate), date)
    );
    const hasEvents = events?.some(event =>
      isSameDay(new Date(event.startDate), date)
    );
    return { hasTasks, hasExams, hasEvents };
  };

  const handleCellClick = (day: (typeof days)[number], period: number) => {
    const existingClass = timetableData[day][period];
    setSelectedCell({ day, period });

    if (existingClass && existingClass.period === period) {
      // 既存の講義を編集
      setEditingClassId(existingClass.id);
      setFormData({
        name: existingClass.name,
        instructor: existingClass.instructor || "",
        room: existingClass.room || "",
        color: existingClass.color || "blue",
      });
    } else {
      // 新規作成
      setEditingClassId(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !selectedCell) {
      toast.error("Please enter a class name");
      return;
    }

    const pt = periodTimes[selectedCell.period];
    const data = {
      name: formData.name,
      instructor: formData.instructor || undefined,
      room: formData.room || undefined,
      dayOfWeek: selectedCell.day,
      period: selectedCell.period,
      periodCount: 1,
      startTime: pt.start.replace(":", ""),
      endTime: pt.end.replace(":", ""),
      color: formData.color,
    };

    if (editingClassId) {
      updateClass.mutate({ id: editingClassId, ...data });
    } else {
      createClass.mutate(data);
    }
  };

  const handleDelete = () => {
    if (editingClassId) {
      deleteClass.mutate({ id: editingClassId });
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedCell(null);
    setEditingClassId(null);
    setFormData(initialFormData);
  };

  const isLoading =
    classesLoading || tasksLoading || examsLoading || eventsLoading;
  const todayDayIndex = getTodayDayIndex();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-5">
          <Skeleton className="h-96 lg:col-span-3 rounded-2xl" />
          <Skeleton className="h-96 lg:col-span-2 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your academic overview.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Timetable - Left Side */}
        <Card className="soft-card lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              <span className="hidden sm:inline">Weekly Timetable</span>
              <span className="sm:hidden">Today's Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr>
                    <th className="p-2 text-xs font-medium text-muted-foreground text-left w-16 sm:w-20">
                      Time
                    </th>
                    {/* PC: 全曜日表示, Mobile: 今日のみ */}
                    {days.map((day, idx) => (
                      <th
                        key={day}
                        className={`p-2 text-xs font-medium text-muted-foreground text-center ${
                          idx !== todayDayIndex ? "hidden sm:table-cell" : ""
                        } ${currentPeriodState.dayIndex === idx ? "text-primary font-bold" : ""}`}
                      >
                        <span className="hidden sm:inline">
                          {dayLabels[idx]}
                        </span>
                        <span className="sm:hidden">{dayLabelsJa[idx]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period, periodIdx) => {
                    const pt = periodTimes[period];
                    const isDuringThisPeriod =
                      currentPeriodState.type === "during" &&
                      currentPeriodState.period === period;
                    const isAfterThisPeriod =
                      currentPeriodState.type === "between" &&
                      currentPeriodState.afterPeriod === period;

                    return (
                      <React.Fragment key={period}>
                        <tr>
                          <td className="p-1 sm:p-2 text-xs text-muted-foreground align-middle">
                            <div className="font-medium text-lg">{period}</div>
                            <div className="text-[10px] hidden sm:block">
                              {pt.start}~{pt.end}
                            </div>
                          </td>
                          {days.map((day, dayIdx) => {
                            const cls = timetableData[day][period];
                            const isToday =
                              currentPeriodState.dayIndex === dayIdx;
                            const isCurrentCell = isDuringThisPeriod && isToday;

                            // 2コマ目の場合はスキップ
                            if (
                              cls &&
                              cls.period !== period &&
                              cls.periodCount === 2
                            ) {
                              return null;
                            }

                            return (
                              <td
                                key={day}
                                className={`p-0.5 align-top ${dayIdx !== todayDayIndex ? "hidden sm:table-cell" : ""}`}
                                rowSpan={cls?.periodCount === 2 ? 2 : 1}
                              >
                                <button
                                  onClick={() => handleCellClick(day, period)}
                                  className={`w-full h-full p-2 rounded-lg min-h-[60px] sm:min-h-[70px] text-left transition-all flex flex-col ${
                                    cls
                                      ? `${pastelBgColors[cls.color || "blue"]} hover:opacity-80`
                                      : "bg-muted/30 hover:bg-muted/50 group"
                                  } ${isCurrentCell ? "ring-2 ring-primary ring-offset-2" : ""}`}
                                >
                                  {cls ? (
                                    <>
                                      <div className="font-medium text-xs sm:text-sm truncate">
                                        {cls.name}
                                      </div>
                                      {cls.room && (
                                        <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
                                          {cls.room}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="flex items-center justify-center flex-1 opacity-0 group-hover:opacity-50 transition-opacity">
                                      <Plus className="h-4 w-4" />
                                    </div>
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                        {/* 時限間のインジケーター */}
                        {isAfterThisPeriod && (
                          <tr
                            key={`gap-${period}`}
                            className="hidden sm:table-row"
                          >
                            <td colSpan={6} className="p-0">
                              <div className="h-1 bg-primary/50 mx-2 rounded-full" />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Calendar and Selected Day Items - Right Side */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mini Calendar */}
          <Card className="soft-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  {format(currentMonth, "MMMM yyyy")}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div
                    key={i}
                    className="text-xs font-medium text-muted-foreground p-2"
                  >
                    {d}
                  </div>
                ))}
                {/* 月初の空白 */}
                {Array.from({ length: calendarDays[0].getDay() }).map(
                  (_, i) => (
                    <div key={`empty-${i}`} className="p-2" />
                  )
                )}
                {calendarDays.map(day => {
                  const isSelected = isSameDay(day, selectedDate);
                  const { hasTasks, hasExams, hasEvents } =
                    getEventsOnDate(day);
                  const today = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        p-2 text-sm rounded-lg transition-colors relative
                        ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                        ${today && !isSelected ? "font-bold text-primary" : ""}
                        ${!isSameMonth(day, currentMonth) ? "text-muted-foreground/50" : ""}
                      `}
                    >
                      {format(day, "d")}
                      {/* イベントドット */}
                      {(hasTasks || hasExams || hasEvents) && !isSelected && (
                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {hasExams && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.65_0.15_0)]" />
                          )}
                          {hasTasks && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.7_0.15_90)]" />
                          )}
                          {hasEvents && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[oklch(0.6_0.15_240)]" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Items */}
          <Card className="soft-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {format(selectedDate, "EEEE, MMM d")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDayItems.tasks.length === 0 &&
              selectedDayItems.exams.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks or exams on this day
                </p>
              ) : (
                <>
                  {selectedDayItems.exams.map(exam => (
                    <div
                      key={`exam-${exam.id}`}
                      className={`p-3 rounded-xl ${pastelBgColors[exam.color || "pink"]}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium text-sm">
                          {exam.title}
                        </span>
                      </div>
                      {exam.room && (
                        <p className="text-xs text-muted-foreground ml-6">
                          {exam.room}
                        </p>
                      )}
                    </div>
                  ))}
                  {selectedDayItems.tasks.map(task => (
                    <div
                      key={`task-${task.id}`}
                      className={`p-3 rounded-xl ${pastelBgColors[task.color || "yellow"]}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CheckSquare className="h-4 w-4" />
                        <span className="font-medium text-sm">
                          {task.title}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        {task.priority && `Priority: ${task.priority}`}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Class Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={open => !open && handleDialogClose()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingClassId ? "Edit Class" : "Add Class"} -{" "}
              {selectedCell &&
                `${dayLabels[days.indexOf(selectedCell.day)]} ${selectedCell.period}限`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Introduction to Computer Science"
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor</Label>
                <Input
                  id="instructor"
                  value={formData.instructor}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      instructor: e.target.value,
                    }))
                  }
                  placeholder="Prof. Smith"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Room</Label>
                <Input
                  id="room"
                  value={formData.room}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, room: e.target.value }))
                  }
                  placeholder="Room 101"
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Select
                value={formData.color}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, color: value }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pink">Pink</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between pt-4">
              <div>
                {editingClassId && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    className="rounded-xl"
                    disabled={deleteClass.isPending}
                  >
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl"
                  disabled={createClass.isPending || updateClass.isPending}
                >
                  {editingClassId ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
