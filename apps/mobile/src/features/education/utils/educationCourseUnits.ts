import type { EducationPublicCourseDetail, EducationGuidedLessonProgress } from '../types/educationPractice.types';

/** Shared practice has one course-level entry, even when its objectives span units. */
export function getCrossObjectiveLessons(lessons: readonly EducationGuidedLessonProgress[], objectiveIds: readonly string[]) {
  const valid = new Set(objectiveIds);
  return lessons.filter(lesson => new Set(lesson.objectives.filter(item => valid.has(item.objectiveId)).map(item => item.objectiveId)).size > 1);
}

/** Keeps older/unassigned objectives reachable when authors introduce units gradually. */
export function groupCourseObjectives(course: Pick<EducationPublicCourseDetail, 'units' | 'objectives'>) {
  const used = new Set<string>();
  const groups = [...(course.units ?? [])].sort((a, b) => a.position - b.position).map(unit => {
    const objectives = unit.objectiveIds.flatMap(id => {
      const objective = course.objectives.find(item => item.id === id);
      if (!objective || used.has(id)) return [];
      used.add(id);
      return [objective];
    });
    return { id: unit.id, title: unit.title, objectives };
  });
  const remaining = course.objectives.filter(objective => !used.has(objective.id));
  if (remaining.length || !groups.length) groups.push({ id: 'ungrouped', title: '', objectives: [...remaining] });
  return groups;
}
