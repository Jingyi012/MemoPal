import type { EducationPublicCourseDetail } from '../types/educationPractice.types';

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
