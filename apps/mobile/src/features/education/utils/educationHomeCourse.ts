import type { EducationGuidedCourseProgress, EducationPublicCourseSummary } from '@/features/education/types/educationPractice.types';

export function chooseEducationHomeCourse(
  courses: readonly EducationPublicCourseSummary[],
  homeProgress: EducationGuidedCourseProgress | null,
): Pick<EducationPublicCourseSummary, 'id' | 'title' | 'isMemoPalStarter' | 'subjectCode'> | undefined {
  // The server selects the user's latest eligible course. Progress for any other
  // catalog entry is unknown; treating it as unstarted can mislabel completed work.
  if (homeProgress) {
    const catalogCourse = courses.find(course => course.id === homeProgress.courseId);
    if (catalogCourse) return catalogCourse;
    return { id: homeProgress.courseId, title: homeProgress.courseTitle, isMemoPalStarter: false };
  }
  return courses.find(course => course.isMemoPalStarter) ?? courses[0];
}
