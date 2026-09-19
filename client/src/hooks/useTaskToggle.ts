import { trpc } from "@/lib/trpc";
import { useFeedback } from "@/components/material/Feedback";
export function useTaskToggle() {
  const utils = trpc.useUtils();
  const notify = useFeedback();
  return trpc.tasks.toggleStatus.useMutation({
    onSuccess: (_, input) => {
      void utils.tasks.list.invalidate();
      void utils.dashboard.invalidate();
      notify(
        input.status === "completed"
          ? "課題を完了しました"
          : "課題を未完了に戻しました"
      );
    },
    onError: () =>
      notify("更新できませんでした。もう一度お試しください。", "error"),
  });
}
