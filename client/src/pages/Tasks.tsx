import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckSquare, Calendar, Pencil, Trash2, Check, Circle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

const pastelColors: Record<string, string> = {
  pink: "bg-[oklch(0.92_0.06_0/0.8)] border-l-4 border-l-[oklch(0.7_0.15_0)]",
  yellow: "bg-[oklch(0.95_0.06_90/0.8)] border-l-4 border-l-[oklch(0.75_0.15_90)]",
  blue: "bg-[oklch(0.92_0.06_240/0.8)] border-l-4 border-l-[oklch(0.6_0.15_240)]",
  green: "bg-[oklch(0.93_0.06_145/0.8)] border-l-4 border-l-[oklch(0.65_0.15_145)]",
  purple: "bg-[oklch(0.92_0.06_300/0.8)] border-l-4 border-l-[oklch(0.65_0.15_300)]",
};

type TaskFormData = {
  title: string;
  description: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  color: string;
};

const initialFormData: TaskFormData = {
  title: "",
  description: "",
  dueDate: "",
  priority: "medium",
  color: "yellow",
};

export default function TasksPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const utils = trpc.useUtils();
  const { data: tasks, isLoading } = trpc.tasks.list.useQuery();

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.stats.invalidate();
      setIsDialogOpen(false);
      setFormData(initialFormData);
      toast.success("Task created successfully");
    },
    onError: () => toast.error("Failed to create task"),
  });

  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.stats.invalidate();
      setIsDialogOpen(false);
      setEditingTask(null);
      setFormData(initialFormData);
      toast.success("Task updated successfully");
    },
    onError: () => toast.error("Failed to update task"),
  });

  const toggleStatus = trpc.tasks.toggleStatus.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: () => toast.error("Failed to update task status"),
  });

  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Task deleted successfully");
    },
    onError: () => toast.error("Failed to delete task"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("Please enter a task title");
      return;
    }

    const data = {
      title: formData.title,
      description: formData.description || undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      priority: formData.priority,
      color: formData.color,
    };

    if (editingTask) {
      updateTask.mutate({ id: editingTask, ...data });
    } else {
      createTask.mutate(data);
    }
  };

  const handleEdit = (task: NonNullable<typeof tasks>[number]) => {
    setEditingTask(task.id);
    setFormData({
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : "",
      priority: task.priority || "medium",
      color: task.color || "yellow",
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTask(null);
    setFormData(initialFormData);
  };

  const filteredTasks = tasks?.filter((task) => {
    if (filter === "all") return true;
    if (filter === "pending") return task.status !== "completed";
    return task.status === "completed";
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage your assignments and to-do items.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => open ? setIsDialogOpen(true) : handleDialogClose()}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Complete homework"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Add details..."
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: "low" | "medium" | "high") => setFormData((prev) => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
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
                <Button type="submit" className="rounded-xl" disabled={createTask.isPending || updateTask.isPending}>
                  {editingTask ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "pending", "completed"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="rounded-xl"
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : filteredTasks && filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <Card key={task.id} className={`soft-card overflow-hidden ${pastelColors[task.color || "yellow"]}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleStatus.mutate({
                      id: task.id,
                      status: task.status === "completed" ? "pending" : "completed",
                    })}
                    className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      task.status === "completed"
                        ? "bg-[oklch(0.65_0.15_145)] border-[oklch(0.65_0.15_145)] text-white"
                        : "border-muted-foreground/50 hover:border-primary"
                    }`}
                  >
                    {task.status === "completed" && <Check className="h-3 w-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </h3>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => handleEdit(task)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Task</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this task? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteTask.mutate({ id: task.id })}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(task.dueDate), "MMM d, HH:mm")}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full ${
                        task.priority === "high" ? "bg-[oklch(0.92_0.06_0/0.8)] text-[oklch(0.5_0.15_0)]" :
                        task.priority === "medium" ? "bg-[oklch(0.95_0.06_90/0.8)] text-[oklch(0.5_0.1_90)]" :
                        "bg-[oklch(0.93_0.06_145/0.8)] text-[oklch(0.4_0.1_145)]"
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="soft-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by adding your first task to stay organized.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Task
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
