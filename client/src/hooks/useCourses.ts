import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteCourse, fetchCourseBySlug, fetchCourses, saveCourse } from "@/lib/api/courses";
import { Course, slugify } from "@/lib/courses";

export const useCourses = () =>
  useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: fetchCourses,
    staleTime: 1000 * 60 * 5,
  });

export const useCourse = (slug?: string, fallback?: Course | null) =>
  useQuery<Course | null>({
    queryKey: ["courses", slug],
    queryFn: () => fetchCourseBySlug(slug!),
    enabled: Boolean(slug),
    initialData: fallback ?? null,
  });

export const useSaveCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveCourse,
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      const slug = course?.slug || (course?.title ? slugify(course.title) : undefined);
      if (slug) {
        queryClient.invalidateQueries({ queryKey: ["courses", slug] });
      }
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (course: Pick<Course, "_id" | "slug" | "title">) => deleteCourse(course),
    onSuccess: (_data, course) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      const slug = course?.slug || (course?.title ? slugify(course.title) : undefined);
      if (slug) {
        queryClient.invalidateQueries({ queryKey: ["courses", slug] });
      }
    },
  });
};
