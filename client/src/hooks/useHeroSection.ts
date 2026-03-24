import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  HERO_QUERY_KEY,
  HERO_STORAGE_KEY,
  fallbackHero,
  fetchHeroSection,
} from "@/lib/api/heroSection";

export const useHeroSection = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== HERO_STORAGE_KEY) return;
      void queryClient.invalidateQueries({ queryKey: HERO_QUERY_KEY });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [queryClient]);

  return useQuery({
    queryKey: HERO_QUERY_KEY,
    queryFn: fetchHeroSection,
    placeholderData: fallbackHero,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
