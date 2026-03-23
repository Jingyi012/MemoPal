import { ArrowLeftOutlined } from '@ant-design/icons';
import { Alert, Breadcrumb, Button, Card, Space, Tabs } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';
import { LessonsSetupCard } from '../components/palace-setup/LessonsSetupCard';
import { LocationsSetupCard } from '../components/palace-setup/LocationsSetupCard';
import { PalaceOverviewCard } from '../components/palace-setup/PalaceOverviewCard';
import { usePalaceSetupData } from '../hooks/usePalaceSetupData';

export default function PalaceDetailsPage() {
  const { palaceId } = useParams<{ palaceId: string }>();
  const navigate = useNavigate();
  const { palaceQuery, locationsQuery, lessonsQuery, refreshAll } = usePalaceSetupData(palaceId);

  if (!palaceId) {
    return <Alert type='error' showIcon message='Missing palace id.' />;
  }

  if (palaceQuery.isLoading) {
    return <Card loading />;
  }

  if (palaceQuery.isError || !palaceQuery.data) {
    return <Alert type='error' showIcon message='Failed to load palace details.' />;
  }

  return (
    <PortalPageContainer>
      <Space direction='vertical' size={16} style={{ width: '100%' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(adminPaths.palaces)}
          style={{ width: 'fit-content' }}
        >
          Back to Palaces
        </Button>

        <Breadcrumb
          items={[
            { title: <Link to={adminPaths.palaces}>Palaces</Link> },
            { title: palaceQuery.data.name },
          ]}
        />

        <PalaceOverviewCard palaceId={palaceId} palace={palaceQuery.data} onChanged={refreshAll} />

        <Tabs
          defaultActiveKey='locations'
          items={[
            {
              key: 'locations',
              label: `Locations (${locationsQuery.data?.length ?? 0})`,
              children: (
                <LocationsSetupCard
                  palaceId={palaceId}
                  locations={locationsQuery.data ?? []}
                  loading={locationsQuery.isLoading}
                  onChanged={refreshAll}
                />
              ),
            },
            {
              key: 'lessons',
              label: `Lessons (${lessonsQuery.data?.length ?? 0})`,
              children: (
                <LessonsSetupCard
                  palaceId={palaceId}
                  lessons={lessonsQuery.data ?? []}
                  loading={lessonsQuery.isLoading}
                  onChanged={refreshAll}
                />
              ),
            },
          ]}
        />
      </Space>
    </PortalPageContainer>
  );
}

