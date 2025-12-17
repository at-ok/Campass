import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Calendar, MapPin, Clock, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, formatDistanceToNow } from "date-fns";

const pastelColors: Record<string, string> = {
  pink: "bg-[oklch(0.92_0.06_0/0.8)] border-l-4 border-l-[oklch(0.7_0.15_0)]",
  yellow: "bg-[oklch(0.95_0.06_90/0.8)] border-l-4 border-l-[oklch(0.75_0.15_90)]",
  blue: "bg-[oklch(0.92_0.06_240/0.8)] border-l-4 border-l-[oklch(0.6_0.15_240)]",
  green: "bg-[oklch(0.93_0.06_145/0.8)] border-l-4 border-l-[oklch(0.65_0.15_145)]",
  purple: "bg-[oklch(0.92_0.06_300/0.8)] border-l-4 border-l-[oklch(0.65_0.15_300)]",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-[oklch(0.95_0.06_90/0.8)] text-[oklch(0.5_0.1_90)]",
  confirmed: "bg-[oklch(0.93_0.06_145/0.8)] text-[oklch(0.4_0.1_145)]",
  completed: "bg-[oklch(0.92_0.06_240/0.8)] text-[oklch(0.4_0.1_240)]",
  cancelled: "bg-[oklch(0.92_0.06_0/0.8)] text-[oklch(0.5_0.15_0)]",
};

type ExamFormData = {
  title: string;
  description: string;
  examDate: string;
  duration: string;
  room: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  color: string;
};

const initialFormData: ExamFormData = {
  title: "",
  description: "",
  examDate: "",
  duration: "",
  room: "",
  status: "scheduled",
  color: "pink",
};

export default function ExamsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<number | null>(null);
  const [formData, setFormData] = useState<ExamFormData>(initialFormData);

  const utils = trpc.useUtils();
  const { data: exams, isLoading } = trpc.exams.list.useQuery();

  const createExam = trpc.exams.create.useMutation({
    onSuccess: () => {
      utils.exams.list.invalidate();
      utils.dashboard.stats.invalidate();
      setIsDialogOpen(false);
      setFormData(initialFormData);
      toast.success("Exam created successfully");
    },
    onError: () => toast.error("Failed to create exam"),
  });

  const updateExam = trpc.exams.update.useMutation({
    onSuccess: () => {
      utils.exams.list.invalidate();
      utils.dashboard.stats.invalidate();
      setIsDialogOpen(false);
      setEditingExam(null);
      setFormData(initialFormData);
      toast.success("Exam updated successfully");
    },
    onError: () => toast.error("Failed to update exam"),
  });

  const deleteExam = trpc.exams.delete.useMutation({
    onSuccess: () => {
      utils.exams.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Exam deleted successfully");
    },
    onError: () => toast.error("Failed to delete exam"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.examDate) {
      toast.error("Please fill in required fields");
      return;
    }

    const data = {
      title: formData.title,
      description: formData.description || undefined,
      examDate: new Date(formData.examDate),
      duration: formData.duration ? parseInt(formData.duration) : undefined,
      room: formData.room || undefined,
      status: formData.status,
      color: formData.color,
    };

    if (editingExam) {
      updateExam.mutate({ id: editingExam, ...data });
    } else {
      createExam.mutate(data);
    }
  };

  const handleEdit = (exam: NonNullable<typeof exams>[number]) => {
    setEditingExam(exam.id);
    setFormData({
      title: exam.title,
      description: exam.description || "",
      examDate: format(new Date(exam.examDate), "yyyy-MM-dd'T'HH:mm"),
      duration: exam.duration?.toString() || "",
      room: exam.room || "",
      status: exam.status || "scheduled",
      color: exam.color || "pink",
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingExam(null);
    setFormData(initialFormData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exams</h1>
          <p className="text-muted-foreground">Track your upcoming exams and test schedules.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => open ? setIsDialogOpen(true) : handleDialogClose()}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingExam ? "Edit Exam" : "Add New Exam"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Midterm Exam"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Add details about the exam..."
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="examDate">Date & Time *</Label>
                  <Input
                    id="examDate"
                    type="datetime-local"
                    value={formData.examDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, examDate: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                    placeholder="90"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "scheduled" | "confirmed" | "completed" | "cancelled") =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
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
                <Button type="submit" className="rounded-xl" disabled={createExam.isPending || updateExam.isPending}>
                  {editingExam ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Exams List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : exams && exams.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {exams.map((exam) => {
            const examDate = new Date(exam.examDate);
            const isPast = examDate < new Date();
            
            return (
              <Card key={exam.id} className={`soft-card overflow-hidden ${pastelColors[exam.color || "pink"]}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{exam.title}</h3>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(exam)}>
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
                            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{exam.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deleteExam.mutate({ id: exam.id })}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  {exam.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{exam.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(examDate, "MMM d, yyyy 'at' HH:mm")}</span>
                    </div>
                    {exam.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{exam.duration} minutes</span>
                      </div>
                    )}
                    {exam.room && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{exam.room}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[exam.status || "scheduled"]}`}>
                      {(exam.status || "scheduled").charAt(0).toUpperCase() + (exam.status || "scheduled").slice(1)}
                    </span>
                    {!isPast && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(examDate, { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="soft-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No exams scheduled</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your upcoming exams to keep track of important dates.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Exam
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
