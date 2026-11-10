import { ArrowLeftOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './educationNavigation.css';

export function EducationBackLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link className="education-back-link" to={to}><ArrowLeftOutlined aria-hidden />{children}</Link>;
}
