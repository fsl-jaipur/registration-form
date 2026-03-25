import { useLocalSearchParams } from "expo-router";
import WebPage from "../../components/WebPage";

export default function CourseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string | string[] }>();
  const segment = Array.isArray(slug) ? slug.join("/") : slug ?? "";
  const path = segment ? `/courses/${segment}` : "/courses";

  return <WebPage path={path} />;
}
