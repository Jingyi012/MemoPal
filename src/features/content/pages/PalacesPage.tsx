import { useNavigate } from 'react-router-dom';
import { adminContentApi } from '../../../api/adminContentApi';
import { PortalPageContainer } from '../../../components/PortalPageContainer';
import { adminPaths } from '../../../navigation/adminPaths';
import { PalacesManagerWorkspace } from '../components/palace-setup/PalacesManagerWorkspace';

export default function PalacesPage() {
  const navigate = useNavigate();

  return (
    <PortalPageContainer>
      <PalacesManagerWorkspace
        onConfigure={(palaceId) => navigate(adminPaths.palaceDetails(palaceId))}
        listPalaces={(pageNumber, pageSize) =>
          adminContentApi.listPalaces(pageNumber, pageSize, { adminCreatedOnly: true })
        }
      />
    </PortalPageContainer>
  );
}
