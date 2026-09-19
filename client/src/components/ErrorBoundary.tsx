import { Component, type ReactNode } from "react";
import { Box, Button, Typography } from "@mui/material";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error(error);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <Box
        sx={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          p: 3,
        }}
      >
        <ErrorOutlineRounded color="error" sx={{ fontSize: 48 }} />
        <Typography variant="h5">画面を表示できませんでした</Typography>
        <Typography color="text.secondary">
          ページを再読み込みして、もう一度お試しください。
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          再読み込み
        </Button>
      </Box>
    );
  }
}
