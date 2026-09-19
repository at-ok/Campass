import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import jaLocale from "@fullcalendar/core/locales/ja";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import { addDays, addMonths, format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme as useMaterialTheme,
} from "@mui/material";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { useTheme } from "@/contexts/ThemeContext";
import { usePlannerDate } from "@/contexts/PlannerDateContext";
export function ScheduleCalendar({
  events,
  onEventClick,
  onDateClick,
  timetable = false,
  hasWeekendClasses = false,
}: {
  events: EventInput[];
  onEventClick: (event: EventClickArg) => void;
  onDateClick: (date: DateClickArg) => void;
  timetable?: boolean;
  hasWeekendClasses?: boolean;
}) {
  const calendar = useRef<FullCalendar>(null);
  const { date, setDate } = usePlannerDate();
  const { weekends } = useTheme();
  const materialTheme = useMaterialTheme();
  const mobile = useMediaQuery(materialTheme.breakpoints.down("sm"));
  const [view, setView] = useState(timetable ? "timeGridWeek" : "dayGridMonth");
  const effectiveView =
    mobile && view === "timeGridWeek" ? "timeGridDay" : view;
  useEffect(() => {
    calendar.current?.getApi().gotoDate(date);
  }, [date]);
  useEffect(() => {
    calendar.current?.getApi().changeView(effectiveView);
  }, [effectiveView]);
  const shift = (direction: number) =>
    setDate(
      effectiveView === "dayGridMonth"
        ? addMonths(date, direction)
        : addDays(date, direction * (effectiveView === "timeGridWeek" ? 7 : 1))
    );
  return (
    <Paper
      className="schedule-calendar"
      variant="outlined"
      sx={{ borderRadius: "20px", overflow: "hidden" }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          px: { xs: 1.5, sm: 2.5 },
          py: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Button
          variant="outlined"
          onClick={() => setDate(new Date())}
          sx={{ minWidth: 64, px: 2 }}
        >
          今日
        </Button>
        <Stack direction="row">
          <Tooltip title="前へ">
            <IconButton
              aria-label="前の期間"
              onClick={() => shift(-1)}
              size="small"
            >
              <ChevronLeftRounded />
            </IconButton>
          </Tooltip>
          <Tooltip title="次へ">
            <IconButton
              aria-label="次の期間"
              onClick={() => shift(1)}
              size="small"
            >
              <ChevronRightRounded />
            </IconButton>
          </Tooltip>
        </Stack>
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, fontWeight: 400, fontSize: { xs: 16, md: 20 } }}
          aria-live="polite"
        >
          {format(
            date,
            effectiveView === "timeGridDay" ? "M月d日（E）" : "yyyy年 M月",
            { locale: ja }
          )}
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={effectiveView}
          onChange={(_, next) => next && setView(next)}
          aria-label="カレンダーの表示"
        >
          {!timetable && (
            <ToggleButton value="dayGridMonth" aria-label="月表示">
              月
            </ToggleButton>
          )}
          <ToggleButton
            value="timeGridWeek"
            aria-label="週表示"
            sx={{ display: { xs: "none", sm: "inline-flex" } }}
          >
            週
          </ToggleButton>
          <ToggleButton value="timeGridDay" aria-label="日表示">
            日
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Box sx={{ px: { xs: 0.5, sm: 1.5 }, pb: 1.5 }}>
        <FullCalendar
          ref={calendar}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          locale={jaLocale}
          initialView={effectiveView}
          initialDate={date}
          headerToolbar={false}
          events={events}
          eventClick={onEventClick}
          dateClick={onDateClick}
          firstDay={1}
          weekends={
            !timetable ||
            effectiveView === "timeGridDay" ||
            weekends ||
            hasWeekendClasses
          }
          nowIndicator
          dayMaxEvents={3}
          height="auto"
          allDaySlot={!timetable}
          slotMinTime={timetable ? "08:00:00" : "00:00:00"}
          slotMaxTime={timetable ? "19:00:00" : "24:00:00"}
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
            hour12: false,
          }}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          displayEventEnd
          eventMinHeight={28}
          expandRows
          stickyHeaderDates
          navLinks
          navLinkDayClick={value => {
            setDate(value);
            setView("timeGridDay");
          }}
          dayHeaderContent={arg => (
            <Box sx={{ py: 1, textAlign: "center" }}>
              <Typography
                component="span"
                sx={{
                  display: "block",
                  fontSize: 11,
                  color: arg.isToday ? "primary.main" : "text.secondary",
                  mb: 0.5,
                }}
              >
                {format(arg.date, "E", { locale: ja })}
              </Typography>
              {effectiveView !== "dayGridMonth" && (
                <Box
                  component="span"
                  sx={{
                    display: "inline-grid",
                    placeItems: "center",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    fontSize: 22,
                    fontWeight: 400,
                    bgcolor: arg.isToday ? "primary.main" : "transparent",
                    color: arg.isToday
                      ? "primary.contrastText"
                      : "text.primary",
                  }}
                >
                  {format(arg.date, "d")}
                </Box>
              )}
            </Box>
          )}
          eventContent={arg => (
            <Box sx={{ px: 0.5, py: 0.25, overflow: "hidden" }}>
              <Box
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: 1.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {arg.event.title}
              </Box>
              {arg.timeText && (
                <Box sx={{ fontSize: 10, mt: 0.25 }}>{arg.timeText}</Box>
              )}
              {arg.event.extendedProps.record?.room &&
                effectiveView !== "dayGridMonth" && (
                  <Box sx={{ fontSize: 11, mt: 0.5 }}>
                    {arg.event.extendedProps.record.room}
                  </Box>
                )}
            </Box>
          )}
        />
      </Box>
    </Paper>
  );
}
