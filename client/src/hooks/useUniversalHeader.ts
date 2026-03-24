import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fallbackUniversalHeader,
  fetchUniversalHeader,
  UNIVERSAL_HEADER_QUERY_KEY,
  UNIVERSAL_HEADER_STORAGE_KEY,
} from "@/lib/api/universalHeader";

export const useUniversalHeader = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== UNIVERSAL_HEADER_STORAGE_KEY) return;
      void queryClient.invalidateQueries({ queryKey: UNIVERSAL_HEADER_QUERY_KEY });
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [queryClient]);

  return useQuery({
    queryKey: UNIVERSAL_HEADER_QUERY_KEY,
    queryFn: fetchUniversalHeader,
    placeholderData: fallbackUniversalHeader,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 1000 * 60,
  });
};
