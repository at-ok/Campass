import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Google from "@mui/icons-material/Google";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn, signUp } from "@/lib/auth-client";
import { setAuthReturnTo } from "@/lib/auth-return-to";
import { trpc } from "@/lib/trpc";
import { Brand } from "./Brand";
export function AuthPage({ signup = false }: { signup?: boolean }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const schema = z
    .object({
      name: signup
        ? z.string().trim().min(1, "名前を入力してください")
        : z.string(),
      email: z.email("有効なメールアドレスを入力してください"),
      password: signup
        ? z.string().min(8, "8文字以上で入力してください")
        : z.string().min(1, "パスワードを入力してください"),
      confirmation: z.string(),
    })
    .refine(data => !signup || data.password === data.confirmation, {
      path: ["confirmation"],
      message: "パスワードが一致しません",
    });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirmation: "" },
  });
  const submit = handleSubmit(async values => {
    setBusy(true);
    setError("");
    try {
      const result = signup
        ? await signUp.email({
            name: values.name,
            email: values.email,
            password: values.password,
          })
        : await signIn.email({
            email: values.email,
            password: values.password,
          });
      if (result.error) {
        setError(
          signup
            ? "アカウントを作成できませんでした。メールアドレスを確認してください。"
            : "ログインできませんでした。メールアドレスとパスワードを確認してください。"
        );
        return;
      }
      await utils.auth.me.invalidate();
      navigate("/");
    } catch {
      setError("接続できませんでした。しばらくしてからお試しください。");
    } finally {
      setBusy(false);
    }
  });
  const google = async () => {
    setGoogleBusy(true);
    setError("");
    setAuthReturnTo();
    try {
      const result = await signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/`,
      });
      if (result.error) throw new Error(result.error.message);
    } catch {
      setError("Googleでログインできませんでした。もう一度お試しください。");
    } finally {
      setGoogleBusy(false);
    }
  };
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        p: { xs: 2.5, sm: 5 },
      }}
    >
      <Box
        component={Link}
        href="/"
        sx={{
          color: "text.primary",
          textDecoration: "none",
          alignSelf: "flex-start",
        }}
      >
        <Brand />
      </Box>
      <Box sx={{ flex: 1, display: "grid", alignContent: "center", py: 5 }}>
        <Paper
          sx={{
            mx: "auto",
            width: "100%",
            maxWidth: 1040,
            borderRadius: { xs: "24px", md: "28px" },
            p: { xs: 3, md: 6 },
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 4, md: 9 },
          }}
        >
          <Box sx={{ py: { md: 3 } }}>
            <Typography
              color="primary"
              sx={{ fontSize: 13, fontWeight: 500, mb: 2 }}
            >
              学びの毎日を、もっとシンプルに。
            </Typography>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 30, md: 40 },
                fontWeight: 400,
                lineHeight: 1.6,
                letterSpacing: "-.04em",
              }}
            >
              今日がわかる。
              <br />
              一週間が見える。
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 340 }}>
              時間割、課題、試験。
              <br />
              大学生活の予定を、Campassひとつに。
            </Typography>
            <Stack
              spacing={2}
              sx={{ mt: 5, display: { xs: "none", md: "flex" } }}
            >
              {[
                "授業と教室を、ひと目で確認",
                "締め切りを整理して、提出忘れを防ぐ",
                "スマートフォンでも、すっきり使える",
              ].map(text => (
                <Stack
                  direction="row"
                  key={text}
                  sx={{ gap: 1.5, alignItems: "center" }}
                >
                  <CheckCircleOutlineRounded
                    color="primary"
                    sx={{ fontSize: 20 }}
                  />
                  <Typography variant="body2">{text}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h5" component="h2">
                {signup ? "アカウントを作成" : "ログイン"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {signup
                  ? "あなたの時間割を、ここから。"
                  : "おかえりなさい。今日の予定を確認しましょう。"}
              </Typography>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
            <Button
              variant="outlined"
              startIcon={<Google />}
              onClick={google}
              disabled={busy || googleBusy}
              sx={{ minHeight: 48 }}
            >
              {googleBusy ? "接続中…" : "Googleで続ける"}
            </Button>
            <Divider>
              <Typography variant="caption" color="text.secondary">
                またはメールアドレスで
              </Typography>
            </Divider>
            <Stack component="form" onSubmit={submit} noValidate spacing={2.5}>
              {signup && (
                <TextField
                  label="名前"
                  autoComplete="name"
                  {...register("name")}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  disabled={busy}
                />
              )}
              <TextField
                label="メールアドレス"
                type="email"
                autoComplete="email"
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={busy}
              />
              <TextField
                label="パスワード"
                type={visible ? "text" : "password"}
                autoComplete={signup ? "new-password" : "current-password"}
                {...register("password")}
                error={!!errors.password}
                helperText={
                  errors.password?.message ?? (signup ? "8文字以上" : undefined)
                }
                disabled={busy}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            visible ? "パスワードを隠す" : "パスワードを表示"
                          }
                          onClick={() => setVisible(!visible)}
                          edge="end"
                        >
                          {visible ? (
                            <VisibilityOffOutlined />
                          ) : (
                            <VisibilityOutlined />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              {signup && (
                <TextField
                  label="パスワード（確認）"
                  type={visible ? "text" : "password"}
                  autoComplete="new-password"
                  {...register("confirmation")}
                  error={!!errors.confirmation}
                  helperText={errors.confirmation?.message}
                  disabled={busy}
                />
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={busy || googleBusy}
                sx={{ minHeight: 48 }}
              >
                {busy ? "処理中…" : signup ? "アカウントを作成" : "ログイン"}
              </Button>
            </Stack>
            <Button component={Link} href={signup ? "/login" : "/signup"}>
              {signup ? "アカウントをお持ちの方はこちら" : "アカウントを作成"}
            </Button>
          </Stack>
        </Paper>
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textAlign: "center" }}
      >
        Campass · 毎日に、学びの余白を。
      </Typography>
    </Box>
  );
}
