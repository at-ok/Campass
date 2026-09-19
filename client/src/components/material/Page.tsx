import type { ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import EventNoteRounded from "@mui/icons-material/EventNoteRounded";
import AddRounded from "@mui/icons-material/AddRounded";
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      sx={{
        alignItems: { sm: "center" },
        justifyContent: "space-between",
        gap: 2,
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {description && (
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            {description}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}
export function AddButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button variant="contained" startIcon={<AddRounded />} onClick={onClick}>
      {children}
    </Button>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      spacing={1.5}
      sx={{ alignItems: "center", textAlign: "center", px: 3, py: 7 }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          display: "grid",
          placeItems: "center",
          bgcolor: "action.selected",
          color: "primary.main",
          borderRadius: "24px",
          mb: 1,
        }}
      >
        <EventNoteRounded sx={{ fontSize: 34 }} />
      </Box>
      <Typography variant="h6">{title}</Typography>
      {description && (
        <Typography color="text.secondary" sx={{ maxWidth: 380 }}>
          {description}
        </Typography>
      )}
      {action}
    </Stack>
  );
}
export function QueryError({ retry }: { retry: () => void }) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" onClick={retry}>
          再試行
        </Button>
      }
      sx={{ my: 2 }}
    >
      データを読み込めませんでした。接続を確認してください。
    </Alert>
  );
}
export function PageLoading() {
  return (
    <Stack spacing={2} role="status" aria-label="読み込み中">
      <Skeleton width={180} height={44} />
      <Skeleton height={30} width="45%" />
      {[0, 1, 2].map(i => (
        <Skeleton key={i} variant="rounded" height={104} />
      ))}
    </Stack>
  );
}
export function AppLoading() {
  return (
    <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <CircularProgress aria-label="読み込み中" />
    </Box>
  );
}
export function Section({ children }: { children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      {children}
    </Paper>
  );
}
