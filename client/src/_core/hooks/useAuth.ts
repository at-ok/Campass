import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { signOut } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
export function useAuth() {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const query = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const logout = async () => {
    setLoggingOut(true);
    try {
      const result = await signOut();
      if (result.error) throw new Error(result.error.message);
      queryClient.clear();
      utils.auth.me.setData(undefined, null);
      window.location.assign("/login");
    } finally {
      setLoggingOut(false);
    }
  };
  return {
    user: query.data ?? null,
    loading: query.isLoading || loggingOut,
    error: query.error,
    isAuthenticated: !!query.data,
    refresh: query.refetch,
    logout,
  };
}
