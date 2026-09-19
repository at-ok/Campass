import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Backdrop, CircularProgress } from "@mui/material";
import type { Class, Task, Exam, Event } from "@shared/schema";
const Editor = lazy(() => import("./EditorDialog"));
export type EditorRequest =
  | { kind: "class"; record?: Class; day?: Class["dayOfWeek"]; period?: number }
  | { kind: "task"; record?: Task }
  | { kind: "exam"; record?: Exam }
  | { kind: "event"; record?: Event; date?: Date };
const EditorContext = createContext<(request: EditorRequest) => void>(() => {});
export const usePlannerEditor = () => useContext(EditorContext);

export function PlannerEditorProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<EditorRequest | null>(null);
  return (
    <EditorContext.Provider value={setRequest}>
      {children}
      {request && (
        <Suspense
          fallback={
            <Backdrop open sx={{ zIndex: 1400 }}>
              <CircularProgress aria-label="編集画面を読み込み中" />
            </Backdrop>
          }
        >
          <Editor
            key={`${request.kind}-${request.record?.id ?? "new"}`}
            request={request}
            onClose={() => setRequest(null)}
          />
        </Suspense>
      )}
    </EditorContext.Provider>
  );
}
