import { useQuery } from "@tanstack/react-query";
import {
  GET_IN_TOUCH_QUERY_KEY,
  fallbackGetInTouch,
  fetchGetInTouch,
} from "@/lib/api/getInTouch";

export const useGetInTouch = () =>
  useQuery({
    queryKey: GET_IN_TOUCH_QUERY_KEY,
    queryFn: fetchGetInTouch,
    placeholderData: fallbackGetInTouch,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 1000 * 60,
  });
