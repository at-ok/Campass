import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

const colorMap: Record<string, string> = {
  pink: "oklch(0.85 0.08 0)",
  yellow: "oklch(0.88 0.08 90)",
  blue: "oklch(0.8 0.08 240)",
  green: "oklch(0.85 0.08 145)",
  purple: "oklch(0.82 0.08 300)",
};

export default function CalendarPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<{
    title: string;
    startDate: string;
    endDate: string;
    eventType: "class" | "task" | "exam" | "reminder" | "other";
    color: string;
  }>({
    title: "",
    startDate: "",
    endDate: "",
    eventType: "other",
    color: "blue",
  });

  const utils = trpc.useUtils();
  const { data: events } = trpc.events.list.useQuery();
  const { data: tasks } = trpc.tasks.list.useQuery();
  const { data: exams } = trpc.exams.list.useQuery();

  const createEvent = trpc.events.create.useMutation({
    onSuccess: () => {
      utils.events.list.invalidate();
      setIsDialogOpen(false);
      setNewEvent({ title: "", startDate: "", endDate: "", eventType: "other", color: "blue" });
      toast.success("Event created successfully");
    },
    onError: () => {
      toast.error("Failed to create event");
    },
  });

  const calendarEvents = useMemo(() => {
    const allEvents: Array<{
      id: string;
      title: string;
      start: Date;
      end?: Date;
      backgroundColor: string;
      borderColor: string;
      textColor: string;
    }> = [];

    events?.forEach((event) => {
      allEvents.push({
        id: `event-${event.id}`,
        title: event.title,
        start: new Date(event.startDate),
        end: event.endDate ? new Date(event.endDate) : undefined,
        backgroundColor: colorMap[event.color || "purple"] || colorMap.purple,
        borderColor: "transparent",
        textColor: "oklch(0.25 0.02 250)",
      });
    });

    tasks?.forEach((task) => {
      if (task.dueDate) {
        allEvents.push({
          id: `task-${task.id}`,
          title: `📋 ${task.title}`,
          start: new Date(task.dueDate),
          backgroundColor: colorMap[task.color || "yellow"] || colorMap.yellow,
          borderColor: "transparent",
          textColor: "oklch(0.25 0.02 250)",
        });
      }
    });

    exams?.forEach((exam) => {
      allEvents.push({
        id: `exam-${exam.id}`,
        title: `📝 ${exam.title}`,
        start: new Date(exam.examDate),
        backgroundColor: colorMap[exam.color || "pink"] || colorMap.pink,
        borderColor: "transparent",
        textColor: "oklch(0.25 0.02 250)",
      });
    });

    return allEvents;
  }, [events, tasks, exams]);

  const handleDateClick = (arg: { date: Date; dateStr: string }) => {
    // Set start date to clicked date at 9:00 AM
    const startDate = new Date(arg.date);
    startDate.setHours(9, 0, 0, 0);
    
    // Set end date to clicked date at 10:00 AM (1 hour later)
    const endDate = new Date(arg.date);
    endDate.setHours(10, 0, 0, 0);
    
    setNewEvent((prev) => ({
      ...prev,
      startDate: format(startDate, "yyyy-MM-dd'T'HH:mm"),
      endDate: format(endDate, "yyyy-MM-dd'T'HH:mm"),
    }));
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.startDate) {
      toast.error("Please fill in required fields");
      return;
    }
    createEvent.mutate({
      title: newEvent.title,
      startDate: new Date(newEvent.startDate),
      endDate: newEvent.endDate ? new Date(newEvent.endDate) : undefined,
      eventType: newEvent.eventType,
      color: newEvent.color,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            View and manage your schedule, tasks, and exams.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Event title"
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select
                    value={newEvent.eventType}
                    onValueChange={(value: "class" | "task" | "exam" | "reminder" | "other") =>
                      setNewEvent((prev) => ({ ...prev, eventType: value }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class">Class</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select
                    value={newEvent.color}
                    onValueChange={(value) => setNewEvent((prev) => ({ ...prev, color: value }))}
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
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl" disabled={createEvent.isPending}>
                  {createEvent.isPending ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar */}
      <Card className="soft-card calendar-container">
        <CardContent className="p-4 md:p-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={calendarEvents}
            dateClick={handleDateClick}
            eventClick={(info) => {
              toast.info(`Event: ${info.event.title}`);
            }}
            height="auto"
            aspectRatio={1.8}
            dayMaxEvents={3}
            eventDisplay="block"
            eventClassNames="cursor-pointer"
          />
        </CardContent>
      </Card>
    </div>
  );
}
