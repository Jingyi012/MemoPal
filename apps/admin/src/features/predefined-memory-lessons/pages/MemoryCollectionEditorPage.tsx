import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Skeleton, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { adminMemoryCollectionsApi, type MemoryCollectionInput } from '../../../api/adminMemoryCollectionsApi';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { extractApiErrorMessage } from '../../../lib/errorMessage';
import { adminPaths } from '../../../navigation/adminPaths';
import { CollectionEditor } from '../components/CollectionEditor';
import { invalidateContentLibrary, useContentLibrary } from '../hooks/useContentLibrary';
import './contentLibrary.css';

export default function MemoryCollectionEditorPage() {
  const { collectionId } = useParams();
  const id = collectionId === 'new' ? undefined : collectionId;
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const client = useQueryClient();
  const library = useContentLibrary();
  const current = library.collections.data?.find(item => item.id === id);
  const back = () => navigate(id ? adminPaths.memoryCollectionLessons(id) : adminPaths.memoryCollections);
  const leave = () => modal.confirm({ title: 'Leave collection editor?', content: 'Unsaved changes will be discarded.', okText: 'Leave editor', onOk: back });
  const save = useMutation({
    mutationFn: (input: MemoryCollectionInput) => adminMemoryCollectionsApi.save(id, input),
    meta: { suppressGlobalErrorToast: true }, retry: false,
    onSuccess: async saved => {
      await invalidateContentLibrary(client);
      message.success('Collection saved.');
      navigate(saved ? adminPaths.memoryCollectionLessons(saved.id) : adminPaths.memoryCollections);
    },
    onError: error => message.error(extractApiErrorMessage(error, 'Could not save collection. Your changes are still here.')),
  });
  return <PortalPageContainer><div className='library-editor'>
    <Button type='link' style={{ padding: 0 }} disabled={save.isPending} onClick={leave}>← Back to library</Button>
    <Typography.Title level={2}>{id ? 'Edit collection' : 'New collection'}</Typography.Title>
    <Typography.Paragraph type='secondary'>Organize related lessons into a collection learners can explore together.</Typography.Paragraph>
    {library.error ? <Alert showIcon type='error' message='Could not load collection editor' action={<Button onClick={() => void library.retry()}>Retry</Button>} />
      : library.loading ? <Skeleton active /> : id && !current ? <Alert type='warning' showIcon message='Collection not found' />
      : <CollectionEditor key={id ?? 'new'} current={current} categories={library.categories.data ?? []} lessons={library.lessons.data ?? []} pending={save.isPending}
        onCancel={leave}
        onSave={input => {
          if (input.isPublished && !current?.isPublished) {
            modal.confirm({ title: 'Publish collection?', content: 'This collection will become available in the mobile catalogue.', okText: 'Publish collection', onOk: () => save.mutateAsync(input) });
          } else save.mutate(input);
        }} />}
  </div></PortalPageContainer>;
}
