import type { PersonalStudySummary } from '../api/personalStudy.api';
import type { EducationPublicCourseSummary } from '../types/educationPractice.types';

export type StudyLibraryFilter = 'all' | 'personal' | 'saved' | 'draft';
export type StudyLibraryItem = { source: 'personal'; course: PersonalStudySummary } | { source: 'saved'; course: EducationPublicCourseSummary };

export function studyLibraryItems(personal: readonly PersonalStudySummary[], saved: readonly EducationPublicCourseSummary[]): StudyLibraryItem[] {
  return [...personal.map(course => ({ source: 'personal' as const, course })), ...saved.map(course => ({ source: 'saved' as const, course }))];
}

export function filterStudyLibrary(items: readonly StudyLibraryItem[], filter: StudyLibraryFilter, search: string) {
  const query = search.normalize('NFC').trim().toLocaleLowerCase();
  return items.filter(item => (!query || item.course.title.normalize('NFC').toLocaleLowerCase().includes(query)) &&
    (filter === 'all' || (filter === 'draft' ? item.source === 'personal' && !item.course.readyToLearn : item.source === filter)));
}
