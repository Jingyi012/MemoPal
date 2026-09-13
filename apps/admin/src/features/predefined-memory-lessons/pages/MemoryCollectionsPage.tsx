import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Space, Table, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { adminMemoryCollectionsApi } from '../../../api/adminMemoryCollectionsApi';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';

export default function MemoryCollectionsPage() {
  const query = useQuery({ queryKey: ['admin-memory-collections'], queryFn: adminMemoryCollectionsApi.list });
  return <PortalPageContainer>
    <Typography.Title level={2}>Memory collections</Typography.Title>
    <Typography.Paragraph>Bundle lessons into downloadable collections. Categories organize topics; each collection has its own title and ordered lessons.</Typography.Paragraph>
    <Space style={{ marginBottom: 16 }}><Link to={`${adminPaths.memoryCollections}/new`}><Button type="primary">New collection</Button></Link></Space>
    {query.isError ? <Alert type="error" message="Could not load collections" action={<Button onClick={() => void query.refetch()}>Retry</Button>} /> : null}
    <Table rowKey="id" loading={query.isLoading} dataSource={query.data ?? []} columns={[
      { title: 'Collection', render: (_, item) => <Link to={`${adminPaths.memoryCollections}/${item.id}`}>{item.emoji} {item.titleZh} / {item.titleEn}</Link> },
      { title: 'Lessons', render: (_, item) => item.lessons.length },
      { title: 'Status', render: (_, item) => <Tag color={item.isPublished ? 'green' : 'default'}>{item.isPublished ? 'Published' : 'Draft'}</Tag> },
    ]} />
  </PortalPageContainer>;
}
