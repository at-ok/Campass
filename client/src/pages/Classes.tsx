import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Clock, MapPin, User, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const pastelColors: Record<string, string> = {
  pink: "bg-[oklch(0.92_0.06_0/0.8)]",
  yellow: "bg-[oklch(0.95_0.06_90/0.8)]",
  blue: "bg-[oklch(0.92_0.06_240/0.8)]",
  green: "bg-[oklch(0.93_0.06_145/0.8)]",
  purple: "bg-[oklch(0.92_0.06_300/0.8)]",
};

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const periods = [1, 2, 3, 4, 5] as const;
const periodCounts = [1, 2] as const;

// 時限の時間帯マッピング
const periodTimes: Record<number, { start: string; end: string }> = {
  1: { start: "8:45", end: "10:15" },
  2: { start: "10:30", end: "12:00" },
  3: { start: "13:00", end: "14:30" },
  4: { start: "14:45", end: "16:15" },
  5: { start: "16:30", end: "18:00" },
};

type ClassFormData = {
  name: string;
  instructor: string;
  room: string;
  dayOfWeek: typeof days[number] | "";
  period: number | null;
  periodCount: number;
  color: string;
};

const initialFormData: ClassFormData = {
  name: "",
  instructor: "",
  room: "",
  dayOfWeek: "",
  period: null,
  periodCount: 1,
  color: "blue",
};

export default function ClassesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<number | null>(null);
  const [formData, setFormData] = useState<ClassFormData>(initialFormData);

  const utils = trpc.useUtils();
  const { data: classes, isLoading } = trpc.classes.list.useQuery();

  const createClass = trpc.classes.create.useMutation({
    onSuccess: () => {
      utils.classes.list.invalidate();
      setIsDialogOpen(false);
      setFormData(initialFormData);
      toast.success("Class created successfully");
    },
    onError: () => toast.error("Failed to create class"),
  });

  const updateClass = trpc.classes.update.useMutation({
    onSuccess: () => {
      utils.classes.list.invalidate();
      setIsDialogOpen(false);
      setEditingClass(null);
      setFormData(initialFormData);
      toast.success("Class updated successfully");
    },
    onError: () => toast.error("Failed to update class"),
  });

  const deleteClass = trpc.classes.delete.useMutation({
    onSuccess: () => {
      utils.classes.list.invalidate();
      toast.success("Class deleted successfully");
    },
    onError: () => toast.error("Failed to delete class"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Please enter a class name");
      return;
    }

    // 時限から時間を計算
    let startTime: string | undefined;
    let endTime: string | undefined;
    
    if (formData.period) {
      const periodTime = periodTimes[formData.period];
      startTime = periodTime.start;
      
      // コマ数に応じて終了時間を計算
      if (formData.periodCount === 2 && formData.period < 5) {
        const nextPeriodTime = periodTimes[formData.period + 1];
        endTime = nextPeriodTime.end;
      } else {
        endTime = periodTime.end;
      }
    }

    const data = {
      name: formData.name,
      instructor: formData.instructor || undefined,
      room: formData.room || undefined,
      dayOfWeek: formData.dayOfWeek || undefined,
      period: formData.period || undefined,
      periodCount: formData.periodCount,
      startTime,
      endTime,
      color: formData.color,
    };

    if (editingClass) {
      updateClass.mutate({ id: editingClass, ...data });
    } else {
      createClass.mutate(data);
    }
  };

  const handleEdit = (cls: NonNullable<typeof classes>[number]) => {
    setEditingClass(cls.id);
    setFormData({
      name: cls.name,
      instructor: cls.instructor || "",
      room: cls.room || "",
      dayOfWeek: cls.dayOfWeek || "",
      period: cls.period || null,
      periodCount: cls.periodCount || 1,
      color: cls.color || "blue",
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingClass(null);
    setFormData(initialFormData);
  };

  const formatPeriod = (period: number | null, periodCount: number | null) => {
    if (!period) return null;
    if (periodCount === 2) {
      return `${period}〜${period + 1}限`;
    }
    return `${period}限`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground">Manage your course schedule and class information.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => open ? setIsDialogOpen(true) : handleDialogClose()}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Class Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, instructor: e.target.value }))}
                    placeholder="Prof. Smith"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room</Label>
                  <Input
                    id="room"
                    value={formData.room}
                    onChange={(e) => setFormData((prev) => ({ ...prev, room: e.target.value }))}
                    placeholder="Room 101"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  value={formData.dayOfWeek}
                  onValueChange={(value: typeof days[number]) => setFormData((prev) => ({ ...prev, dayOfWeek: value }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Period (時限)</Label>
                  <Select
                    value={formData.period?.toString() || ""}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, period: value ? parseInt(value) : null }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((p) => (
                        <SelectItem key={p} value={p.toString()}>
                          {p}限 ({periodTimes[p].start}〜{periodTimes[p].end})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration (コマ数)</Label>
                  <Select
                    value={formData.periodCount.toString()}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, periodCount: parseInt(value) }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periodCounts.map((c) => (
                        <SelectItem key={c} value={c.toString()}>
                          {c}コマ
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, color: value }))}
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
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl" disabled={createClass.isPending || updateClass.isPending}>
                  {editingClass ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : classes && classes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id} className={`soft-card overflow-hidden ${pastelColors[cls.color || "blue"]}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">{cls.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(cls)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Class</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{cls.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteClass.mutate({ id: cls.id })}
                            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {cls.instructor && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{cls.instructor}</span>
                    </div>
                  )}
                  {cls.room && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{cls.room}</span>
                    </div>
                  )}
                  {cls.dayOfWeek && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {cls.dayOfWeek.charAt(0).toUpperCase() + cls.dayOfWeek.slice(1)}
                        {cls.period && ` · ${formatPeriod(cls.period, cls.periodCount)}`}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="soft-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No classes yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first class to start managing your schedule.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
