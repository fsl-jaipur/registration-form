import { useQuery } from "@tanstack/react-query";
import {
  ENGINEERING_TEAM_QUERY_KEY,
  fallbackEngineeringTeam,
  fetchEngineeringTeam,
} from "@/lib/api/engineeringTeam";

export const useEngineeringTeam = () =>
  useQuery({
    queryKey: ENGINEERING_TEAM_QUERY_KEY,
    queryFn: fetchEngineeringTeam,
    placeholderData: fallbackEngineeringTeam,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
