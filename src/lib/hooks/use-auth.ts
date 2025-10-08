import { useChunkValue } from "stunk/react";

import { authStore } from "../store/app-store";

export function useAuth() {
  const state = useChunkValue(authStore);

  return {
    isAuthenticated: !!state.user,
    user: state.user,
    isLoading: state.isLoading
  };
}
