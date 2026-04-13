import { useQuery } from "@tanstack/react-query";
import { FOOTER_QUERY_KEY, fallbackFooter, fetchFooter } from "@/lib/api/footer";

export const useFooter = () =>
  useQuery({
    queryKey: FOOTER_QUERY_KEY,
    queryFn: fetchFooter,
    placeholderData: fallbackFooter,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 1000 * 60,
  });
