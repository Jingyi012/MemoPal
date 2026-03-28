import { Alert, Card } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';
import { PalaceDetailsWorkspace } from '../components/palace-setup/PalaceDetailsWorkspace';
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
      <PalaceDetailsWorkspace
        palaceId={palaceId}
        palace={palaceQuery.data}
        locations={locationsQuery.data ?? []}
        lessons={lessonsQuery.data ?? []}
        locationsLoading={locationsQuery.isLoading}
        lessonsLoading={lessonsQuery.isLoading}
        onChanged={refreshAll}
        onBack={() => navigate(adminPaths.palaces)}
        backLabel='Back to Palaces'
        breadcrumbRootPath={adminPaths.palaces}
        breadcrumbRootLabel='Palaces'
      />
    </PortalPageContainer>
  );
}

