import { NavLink } from 'react-router-dom';
import { adminMenuItems } from '../navigation/adminMenu';
import { adminPaths } from '../navigation/adminPaths';

export function PortalSectionNav({ section }: { section: 'configs' | 'referrals' }) {
  const group = adminMenuItems.find((item) => item.path === (
    section === 'configs' ? adminPaths.configsRoot : adminPaths.referralsRoot
  ));

  return (
    <nav className="portal-section-nav" aria-label={group?.name}>
      {group?.routes?.map((item) => (
        <NavLink key={item.path} to={item.path} end>{item.name}</NavLink>
      ))}
    </nav>
  );
}
