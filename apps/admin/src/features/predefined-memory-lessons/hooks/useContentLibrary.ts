import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { adminMemoryCollectionsApi, type MemoryCollectionDto, type MoveCollectionLessonInput } from '../../../api/adminMemoryCollectionsApi';
import { adminPredefinedMemoryLessonCategoriesApi, adminPredefinedMemoryLessonsApi } from '../../../api/adminPredefinedMemoryLessonsApi';
import { extractApiErrorMessage } from '../../../lib/errorMessage';

export const contentKeys = {
  collections: ['admin-memory-collections'],
  lessons: ['admin-predefined-memory-lessons'],
  categories: ['admin-predefined-memory-lesson-categories'],
};
export async function invalidateContentLibrary(client: QueryClient) {
  await Promise.all(Object.values(contentKeys).map(queryKey => client.invalidateQueries({ queryKey })));
}
export function collectionInput(collection: MemoryCollectionDto, lessonIds = collection.lessons.map(l => l.id)) {
  return { titleEn: collection.titleEn, titleZh: collection.titleZh, descriptionEn: collection.descriptionEn,
    descriptionZh: collection.descriptionZh, emoji: collection.emoji, categoryId: collection.categoryId,
    isPublished: collection.isPublished, sortOrder: collection.sortOrder, expectedVersion: collection.version, lessonIds };
}

export function useContentLibrary() {
  const client = useQueryClient();
  const { message } = App.useApp();
  const collections = useQuery({ queryKey: contentKeys.collections, queryFn: adminMemoryCollectionsApi.list });
  const lessons = useQuery({ queryKey: contentKeys.lessons, queryFn: adminPredefinedMemoryLessonsApi.list });
  const categories = useQuery({ queryKey: contentKeys.categories, queryFn: adminPredefinedMemoryLessonCategoriesApi.list });
  const onError = (error: unknown) => message.error(extractApiErrorMessage(error, 'Could not save changes. Please try again.'));
  const onSuccess = async (text: string) => { await invalidateContentLibrary(client); message.success(text); };
  const move = useMutation({
    mutationFn: ({ lessonId, input }: { lessonId: string; input: MoveCollectionLessonInput }) => adminMemoryCollectionsApi.moveLesson(lessonId, input),
    onSuccess: () => onSuccess('Lesson moved.'), onError, meta: { suppressGlobalErrorToast: true }, retry: false,
  });
  const deleteLesson = useMutation({ mutationFn: adminPredefinedMemoryLessonsApi.delete,
    onSuccess: () => onSuccess('Lesson deleted.'), onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const deleteCollection = useMutation({ mutationFn: (collection: MemoryCollectionDto) => adminMemoryCollectionsApi.delete(collection.id, collection.version),
    onSuccess: () => onSuccess('Collection deleted. Its lessons have been kept.'), onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const reorder = useMutation({ mutationFn: ({ collection, lessonIds }: { collection: MemoryCollectionDto; lessonIds: string[] }) =>
    adminMemoryCollectionsApi.save(collection.id, collectionInput(collection, lessonIds)),
    onSuccess: () => onSuccess('Lesson order saved.'), onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  return { collections, lessons, categories, move, deleteLesson, deleteCollection, reorder,
    loading: collections.isPending || lessons.isPending || categories.isPending,
    error: collections.isError || lessons.isError || categories.isError,
    busy: move.isPending || deleteLesson.isPending || deleteCollection.isPending || reorder.isPending,
    retry: () => Promise.all([collections.refetch(), lessons.refetch(), categories.refetch()]),
  };
}
