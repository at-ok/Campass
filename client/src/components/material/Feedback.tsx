import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Alert, Snackbar } from "@mui/material";

type Notify = (
  message: string,
  severity?: "success" | "error" | "info"
) => void;
const FeedbackContext = createContext<Notify>(() => {});
export const useFeedback = () => useContext(FeedbackContext);
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{
    message: string;
    severity: "success" | "error" | "info";
    key: number;
  } | null>(null);
  const notify = useCallback<Notify>(
    (message, severity = "success") =>
      setNotice({ message, severity, key: Date.now() }),
    []
  );
  return (
    <FeedbackContext.Provider value={notify}>
      {children}
      <Snackbar
        key={notice?.key}
        open={!!notice}
        autoHideDuration={5000}
        onClose={(_, reason) => reason !== "clickaway" && setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: { xs: 88, md: 24 } }}
      >
        <Alert
          variant="filled"
          severity={notice?.severity}
          onClose={() => setNotice(null)}
          sx={{ borderRadius: 2 }}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </FeedbackContext.Provider>
  );
}
