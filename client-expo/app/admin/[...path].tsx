import { useLocalSearchParams } from "expo-router";
import WebPage from "../../components/WebPage";

export default function AdminCatchAllScreen() {
  const { path } = useLocalSearchParams<{ path?: string | string[] }>();
  const segment = Array.isArray(path) ? path.join("/") : path ?? "";
  const fullPath = segment ? `/admin/${segment}` : "/admin";

  return <WebPage path={fullPath} />;
}
