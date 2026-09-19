import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  CssBaseline,
  ThemeProvider as MuiThemeProvider,
  createTheme,
  useMediaQuery,
} from "@mui/material";
import { jaJP } from "@mui/material/locale";

type Mode = "light" | "dark" | "system";
const ThemeContext = createContext<{
  theme: "light" | "dark";
  mode: Mode;
  setMode: (mode: Mode) => void;
  weekends: boolean;
  setWeekends: (value: boolean) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem("theme");
    return saved === "light" || saved === "dark" ? saved : "system";
  });
  const [weekends, setWeekends] = useState(
    () => localStorage.getItem("campass-weekends") === "true"
  );
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
  useEffect(() => {
    localStorage.setItem("theme", mode);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [mode, theme]);
  useEffect(() => {
    localStorage.setItem("campass-weekends", String(weekends));
  }, [weekends]);
  const materialTheme = useMemo(
    () =>
      createTheme(
        {
          palette: {
            mode: theme,
            primary: {
              main: theme === "dark" ? "#a8c7fa" : "#0b57d0",
              contrastText: theme === "dark" ? "#062e6f" : "#fff",
            },
            secondary: { main: theme === "dark" ? "#c2c7dc" : "#535f70" },
            background: {
              default: theme === "dark" ? "#14171c" : "#f8fafd",
              paper: theme === "dark" ? "#1e2229" : "#fff",
            },
            text: {
              primary: theme === "dark" ? "#e3e3e8" : "#1f1f1f",
              secondary: theme === "dark" ? "#bfc6d1" : "#5f6368",
            },
            divider: theme === "dark" ? "#3c424c" : "#e3e7ed",
            action: {
              selected: theme === "dark" ? "#233c60" : "#d3e3fd",
              hover: theme === "dark" ? "#ffffff0a" : "#1f1f1f08",
            },
            error: { main: theme === "dark" ? "#ffb4ab" : "#b3261e" },
          },
          shape: { borderRadius: 8 },
          typography: {
            fontFamily: 'Roboto, "Noto Sans JP", sans-serif',
            h4: {
              fontSize: "1.8rem",
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: "-.025em",
            },
            h5: { fontSize: "1.35rem", fontWeight: 400 },
            h6: { fontSize: "1.05rem", fontWeight: 500 },
            body1: { fontSize: ".9375rem", lineHeight: 1.7 },
            body2: { fontSize: ".8125rem", lineHeight: 1.65 },
            button: {
              textTransform: "none",
              fontWeight: 500,
              letterSpacing: ".01em",
            },
          },
          components: {
            MuiCssBaseline: {
              styleOverrides: {
                body: { margin: 0 },
                "*": { boxSizing: "border-box" },
                "::selection": { backgroundColor: "#d3e3fd", color: "#0842a0" },
              },
            },
            MuiButton: {
              defaultProps: { disableElevation: true },
              styleOverrides: {
                root: { borderRadius: 100, minHeight: 40, paddingInline: 22 },
                outlined: {
                  borderColor: theme === "dark" ? "#8d929a" : "#c4c7c5",
                },
              },
            },
            MuiIconButton: {
              styleOverrides: { root: { width: 44, height: 44 } },
            },
            MuiPaper: {
              defaultProps: { elevation: 0 },
              styleOverrides: {
                root: { backgroundImage: "none", borderRadius: 16 },
              },
            },
            MuiAlert: {
              styleOverrides: {
                root: {
                  alignItems: "center",
                  padding: "12px 16px",
                  borderRadius: 12,
                },
                icon: { alignItems: "center", padding: 0, marginRight: 12 },
                message: { padding: 0, minWidth: 0, overflowWrap: "anywhere" },
                action: {
                  alignItems: "center",
                  padding: "0 0 0 16px",
                  marginRight: 0,
                },
              },
            },
            MuiAppBar: { styleOverrides: { root: { borderRadius: 0 } } },
            MuiDialog: {
              styleOverrides: {
                paperFullScreen: { borderRadius: 0 },
                paper: {
                  borderRadius: 28,
                  backgroundColor: theme === "dark" ? "#242a33" : "#f8fafd",
                },
              },
            },
            MuiDialogTitle: {
              styleOverrides: {
                root: {
                  fontSize: "1.5rem",
                  fontWeight: 400,
                  padding: "24px 24px 16px",
                },
              },
            },
            MuiDialogActions: {
              styleOverrides: { root: { padding: "16px 24px 24px", gap: 8 } },
            },
            MuiTextField: {
              defaultProps: { fullWidth: true, variant: "outlined" },
            },
            MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 8 } } },
            MuiChip: {
              styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } },
            },
            MuiTooltip: { defaultProps: { arrow: true } },
            MuiTab: {
              styleOverrides: {
                root: {
                  minHeight: 52,
                  textTransform: "none",
                  fontSize: ".875rem",
                },
              },
            },
            MuiTabs: {
              styleOverrides: {
                indicator: { height: 3, borderRadius: "3px 3px 0 0" },
              },
            },
            MuiListItemButton: {
              styleOverrides: {
                root: {
                  borderRadius: 28,
                  "&.Mui-selected": {
                    backgroundColor: theme === "dark" ? "#233c60" : "#d3e3fd",
                  },
                },
              },
            },
            MuiToggleButton: {
              styleOverrides: {
                root: {
                  textTransform: "none",
                  borderColor: theme === "dark" ? "#616771" : "#c4c7c5",
                  paddingInline: 20,
                  "&.Mui-selected": {
                    color: theme === "dark" ? "#d3e3fd" : "#0842a0",
                    backgroundColor: theme === "dark" ? "#233c60" : "#d3e3fd",
                  },
                },
              },
            },
          },
        },
        jaJP
      ),
    [theme]
  );
  return (
    <ThemeContext.Provider
      value={{ theme, mode, setMode, weekends, setWeekends }}
    >
      <MuiThemeProvider theme={materialTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("ThemeProvider is missing");
  return context;
}
