import {
  Avatar,
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { PageHeading } from "@/components/material/Page";
import { useFeedback } from "@/components/material/Feedback";
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { mode, setMode, weekends, setWeekends } = useTheme();
  const notify = useFeedback();
  return (
    <Box sx={{ maxWidth: 840 }}>
      <PageHeading title="設定" />
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Typography variant="h6" sx={{ mb: 2.5 }}>
            アカウント
          </Typography>
          <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
            <Avatar
              src={user?.image ?? undefined}
              sx={{
                width: 56,
                height: 56,
                bgcolor: "action.selected",
                color: "primary.main",
              }}
            >
              {user?.name?.slice(0, 1)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 500 }}>{user?.name}</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ overflowWrap: "anywhere" }}
              >
                {user?.email}
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Divider />
        <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
          <FormControl>
            <FormLabel
              id="theme-label"
              sx={{ color: "text.primary", fontWeight: 500, mb: 1 }}
            >
              表示モード
            </FormLabel>
            <RadioGroup
              aria-labelledby="theme-label"
              value={mode}
              onChange={(_, value) => setMode(value as typeof mode)}
            >
              <FormControlLabel
                value="system"
                control={<Radio />}
                label="デバイスの設定に合わせる"
              />
              <FormControlLabel
                value="light"
                control={<Radio />}
                label="ライト"
              />
              <FormControlLabel
                value="dark"
                control={<Radio />}
                label="ダーク"
              />
            </RadioGroup>
          </FormControl>
        </Box>
        <Divider />
        <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            時間割の表示
          </Typography>
          <FormControlLabel
            label="土曜日・日曜日を表示する"
            control={
              <Switch
                checked={weekends}
                onChange={(_, checked) => setWeekends(checked)}
              />
            }
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            週末に授業がある場合は、この設定にかかわらず表示します。
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            このアプリについて
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Campass — 時間割、課題、試験をまとめて管理する学習プランナー。
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            表示設定は、このブラウザーに保存されます。
          </Typography>
        </Box>
      </Paper>
      <Button
        color="error"
        startIcon={<LogoutRounded />}
        onClick={async () => {
          try {
            await logout();
          } catch {
            notify("ログアウトできませんでした", "error");
          }
        }}
        sx={{ mt: 3 }}
      >
        ログアウト
      </Button>
    </Box>
  );
}
