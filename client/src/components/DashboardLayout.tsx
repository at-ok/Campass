import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { jaJP as pickersJaJP } from "@mui/x-date-pickers/locales";
import { ja } from "date-fns/locale";
import { useState, type ReactNode } from "react";
import { Link, Redirect, useLocation } from "wouter";
import {
  AppBar,
  Autocomplete,
  Avatar,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import CalendarViewWeekRounded from "@mui/icons-material/CalendarViewWeekRounded";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import MenuBookRounded from "@mui/icons-material/MenuBookRounded";
import AssignmentRounded from "@mui/icons-material/AssignmentRounded";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  PlannerDateProvider,
  usePlannerDate,
} from "@/contexts/PlannerDateContext";
import {
  PlannerEditorProvider,
  usePlannerEditor,
  type EditorRequest,
} from "./material/PlannerEditor";
import { Brand } from "./material/Brand";
import { AppLoading, QueryError } from "./material/Page";
import { useFeedback } from "./material/Feedback";

const navigation = [
  { path: "/", label: "時間割", icon: CalendarViewWeekRounded },
  { path: "/calendar", label: "カレンダー", icon: CalendarMonthRounded },
  { path: "/tasks", label: "課題", icon: CheckCircleOutlineRounded },
  { path: "/exams", label: "試験", icon: AssignmentRounded },
  { path: "/classes", label: "授業一覧", icon: MenuBookRounded },
];
const width = 232;
const calendarLocale = {
  ...ja,
  options: { ...ja.options, weekStartsOn: 1 as const },
};
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, error, refresh } = useAuth();
  if (loading) return <AppLoading />;
  if (error)
    return (
      <Box sx={{ maxWidth: 600, m: "15vh auto", p: 3 }}>
        <Brand />
        <QueryError retry={() => void refresh()} />
      </Box>
    );
  if (!user) return <Redirect to="/login" />;
  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={calendarLocale}
      localeText={
        pickersJaJP.components.MuiLocalizationProvider.defaultProps.localeText
      }
    >
      <PlannerDateProvider>
        <PlannerEditorProvider>
          <Shell>{children}</Shell>
        </PlannerEditorProvider>
      </PlannerDateProvider>
    </LocalizationProvider>
  );
}
function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createAnchor, setCreateAnchor] = useState<HTMLElement | null>(null);
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);
  const { date, setDate } = usePlannerDate();
  const edit = usePlannerEditor();
  const notify = useFeedback();
  const classes = trpc.classes.list.useQuery();
  const tasks = trpc.tasks.list.useQuery();
  const exams = trpc.exams.list.useQuery();
  const events = trpc.events.list.useQuery();
  const pending = (tasks.data ?? []).filter(
    task => task.status !== "completed"
  ).length;
  const options: { label: string; group: string; request: EditorRequest }[] = [
    ...(classes.data ?? []).map(record => ({
      label: record.name,
      group: "授業",
      request: { kind: "class" as const, record },
    })),
    ...(tasks.data ?? []).map(record => ({
      label: record.title,
      group: "課題",
      request: { kind: "task" as const, record },
    })),
    ...(exams.data ?? []).map(record => ({
      label: record.title,
      group: "試験",
      request: { kind: "exam" as const, record },
    })),
    ...(events.data ?? []).map(record => ({
      label: record.title,
      group: "予定",
      request: { kind: "event" as const, record },
    })),
  ];
  const search = (
    <Autocomplete
      options={options}
      getOptionLabel={option => option.label}
      getOptionKey={option =>
        `${option.request.kind}-${option.request.record?.id}`
      }
      groupBy={option => option.group}
      value={null}
      onChange={(_, option) => {
        if (option) {
          setSearchOpen(false);
          edit(option.request);
        }
      }}
      noOptionsText="一致する予定がありません"
      clearText="クリア"
      openText="候補を表示"
      closeText="閉じる"
      renderInput={params => (
        <TextField
          {...params}
          placeholder="授業、課題、予定を検索"
          size="small"
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded />
                </InputAdornment>
              ),
            },
            htmlInput: {
              ...params.slotProps.htmlInput,
              "aria-label": "授業、課題、予定を検索",
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "action.hover",
              borderRadius: "28px",
              height: 48,
            },
            "& fieldset": { borderColor: "transparent" },
          }}
        />
      )}
      sx={{ width: "100%", maxWidth: 560 }}
    />
  );
  const navContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: 1.5,
        pt: { xs: 2, md: 0 },
      }}
    >
      <Box sx={{ display: { md: "none" }, p: 1.5, mb: 2 }}>
        <Brand />
      </Box>
      <Button
        onClick={event => setCreateAnchor(event.currentTarget)}
        startIcon={<AddRounded sx={{ fontSize: "28px !important" }} />}
        sx={{
          bgcolor: "action.selected",
          color: "text.primary",
          borderRadius: "16px",
          minHeight: 56,
          width: 136,
          ml: 1,
          mb: 3,
          fontSize: 15,
          boxShadow: "0 1px 3px #00000018",
          "&:hover": {
            bgcolor: "action.selected",
            boxShadow: "0 3px 8px #00000024",
          },
        }}
      >
        作成
      </Button>
      <List component="nav" aria-label="メインナビゲーション" disablePadding>
        {navigation.map(item => (
          <ListItemButton
            key={item.path}
            component={Link}
            href={item.path}
            selected={location === item.path}
            aria-current={location === item.path ? "page" : undefined}
            onClick={() => setDrawer(false)}
            sx={{
              py: 1.1,
              mb: 0.5,
              color: location === item.path ? "primary.main" : "text.secondary",
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}>
              <item.icon sx={{ fontSize: 22 }} />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              slotProps={{
                primary: {
                  sx: {
                    fontSize: 14,
                    fontWeight: location === item.path ? 600 : 400,
                  },
                },
              }}
            />
            {item.path === "/tasks" && pending > 0 && (
              <Typography variant="body2">{pending}</Typography>
            )}
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ my: 2, mx: 1 }} />
      <Box sx={{ display: { xs: "none", md: "block" }, mx: -0.5 }}>
        <DateCalendar
          value={date}
          onChange={value => {
            if (value) {
              setDate(value);
              if (location !== "/calendar") navigate("/");
            }
          }}
          showDaysOutsideCurrentMonth
          sx={{
            width: 216,
            height: 280,
            "& .MuiDayCalendar-weekDayLabel, & .MuiPickerDay-root": {
              width: 27,
              height: 30,
              mx: "1px",
              fontSize: 11,
            },
            "& .MuiPickersCalendarHeader-root": { px: 0.5, mx: 1, mt: 0 },
            "& .MuiPickersCalendarHeader-label": { fontSize: 13 },
            "& .MuiDayCalendar-header": { justifyContent: "center" },
            "& .MuiDayCalendar-weekContainer": { mx: 0 },
            "& .MuiIconButton-root": { width: 28, height: 28 },
            "& .MuiMonthCalendar-root, & .MuiYearCalendar-root": {
              width: "100%",
            },
          }}
        />
      </Box>
      <Box sx={{ flexGrow: 1 }} />
      <ListItemButton
        component={Link}
        href="/settings"
        selected={location === "/settings"}
        onClick={() => setDrawer(false)}
        sx={{ my: 1 }}
      >
        <ListItemIcon sx={{ minWidth: 38 }}>
          <SettingsOutlined />
        </ListItemIcon>
        <ListItemText
          primary="設定"
          slotProps={{ primary: { sx: { fontSize: 14 } } }}
        />
      </ListItemButton>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ px: 2, pb: 3 }}
      >
        毎日に、学びの余白を。
      </Typography>
    </Box>
  );
  return (
    <Box sx={{ minHeight: "100dvh" }}>
      <a className="skip-link" href="#main-content">
        メインコンテンツへ
      </a>
      <AppBar
        position="fixed"
        elevation={0}
        color="transparent"
        sx={{
          bgcolor: "background.default",
          zIndex: theme => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 64, md: 80 },
            gap: { xs: 1, md: 3 },
            px: { xs: 1.5, md: 3 },
          }}
        >
          <IconButton
            aria-label="メニューを開く"
            onClick={() => setDrawer(true)}
            sx={{ display: { md: "none" } }}
          >
            <MenuRounded />
          </IconButton>
          <Box
            component={Link}
            href="/"
            sx={{
              minWidth: { md: width - 24 },
              color: "text.primary",
              textDecoration: "none",
            }}
          >
            <Brand />
          </Box>
          <Box sx={{ flex: 1, display: { xs: "none", md: "block" } }}>
            {search}
          </Box>
          <Box sx={{ flex: 1, display: { md: "none" } }} />
          <Tooltip title="検索">
            <IconButton
              aria-label="検索"
              onClick={() => setSearchOpen(true)}
              sx={{ display: { md: "none" } }}
            >
              <SearchRounded />
            </IconButton>
          </Tooltip>
          <Tooltip title="設定">
            <IconButton
              component={Link}
              href="/settings"
              aria-label="設定"
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
            >
              <SettingsOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="アカウント">
            <IconButton
              onClick={event => setAccountAnchor(event.currentTarget)}
              aria-label="アカウントメニュー"
              aria-haspopup="menu"
              aria-expanded={!!accountAnchor}
            >
              <Avatar
                src={user?.image ?? undefined}
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: "#c2e7d0",
                  color: "#146c2e",
                  fontSize: 16,
                }}
              >
                {user?.name?.slice(0, 1) || "U"}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width,
          "& .MuiDrawer-paper": {
            width,
            top: 80,
            height: "calc(100% - 80px)",
            bgcolor: "background.default",
            border: 0,
          },
        }}
      >
        {navContent}
      </Drawer>
      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        sx={{
          display: { md: "none" },
          zIndex: theme => theme.zIndex.appBar + 2,
          "& .MuiDrawer-paper": { width: 280, borderRadius: "0 24px 24px 0" },
        }}
      >
        {navContent}
      </Drawer>
      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          ml: { md: `${width}px` },
          pt: { xs: "80px", md: "96px" },
          px: { xs: 2, md: 3 },
          pb: { xs: "100px", md: 3 },
          minWidth: 0,
          outline: 0,
        }}
      >
        {children}
      </Box>
      <Paper
        sx={{
          display: { md: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme => theme.zIndex.appBar,
          borderRadius: 0,
          pb: "env(safe-area-inset-bottom)",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <BottomNavigation
          showLabels
          value={location}
          onChange={(_, path) => navigate(path)}
          sx={{
            height: 72,
            bgcolor: "background.default",
            "& .MuiBottomNavigationAction-root": { minWidth: 0, gap: 0.5 },
            "& .MuiBottomNavigationAction-label": {
              fontSize: "11px !important",
            },
            "& .Mui-selected > svg, & .Mui-selected > .MuiBadge-root": {
              bgcolor: "action.selected",
              borderRadius: 10,
              px: 2,
              width: 60,
              height: 30,
            },
          }}
        >
          {navigation.slice(0, 4).map(item => (
            <BottomNavigationAction
              key={item.path}
              value={item.path}
              label={item.label}
              icon={
                item.path === "/tasks" ? (
                  <Badge color="error" variant="dot" invisible={!pending}>
                    <item.icon />
                  </Badge>
                ) : (
                  <item.icon />
                )
              }
            />
          ))}
        </BottomNavigation>
      </Paper>
      <Menu
        anchorEl={createAnchor}
        open={!!createAnchor}
        onClose={() => setCreateAnchor(null)}
      >
        {(
          [
            { kind: "class", label: "授業", icon: MenuBookRounded },
            { kind: "task", label: "課題", icon: CheckCircleOutlineRounded },
            { kind: "exam", label: "試験", icon: AssignmentRounded },
            { kind: "event", label: "予定", icon: CalendarMonthRounded },
          ] as const
        ).map(item => (
          <MenuItem
            key={item.kind}
            onClick={() => {
              setCreateAnchor(null);
              setDrawer(false);
              edit({ kind: item.kind });
            }}
            sx={{ minWidth: 180, minHeight: 48 }}
          >
            <ListItemIcon>
              <item.icon fontSize="small" />
            </ListItemIcon>
            {item.label}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={accountAnchor}
        open={!!accountAnchor}
        onClose={() => setAccountAnchor(null)}
      >
        <Box sx={{ px: 2, py: 1, maxWidth: 280 }}>
          <Typography>{user?.name}</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={async () => {
            setAccountAnchor(null);
            try {
              await logout();
            } catch {
              notify("ログアウトできませんでした", "error");
            }
          }}
        >
          <ListItemIcon>
            <LogoutRounded fontSize="small" />
          </ListItemIcon>
          ログアウト
        </MenuItem>
      </Menu>
      <Dialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          予定を検索
          <IconButton
            aria-label="閉じる"
            onClick={() => setSearchOpen(false)}
            sx={{ position: "absolute", right: 12, top: 12 }}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ minHeight: 300, pt: "8px !important" }}>
          {search}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
