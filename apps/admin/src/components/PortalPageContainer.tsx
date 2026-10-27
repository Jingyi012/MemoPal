import { PageContainer } from '@ant-design/pro-components';
import type { ReactNode } from 'react';
import { Typography } from 'antd';
import './portal.css';

interface PortalPageContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  navigation?: ReactNode;
  className?: string;
}

export function PortalPageContainer({ children, title, description, eyebrow, actions, navigation, className }: PortalPageContainerProps) {
  return (
    <PageContainer
      ghost
      className={[title ? 'portal-workspace' : '', className ?? ''].filter(Boolean).join(' ') || undefined}
      contentWidth='Fluid'
      header={{ title: undefined, breadcrumb: undefined }}
      style={{ width: '100%', maxWidth: '100%', margin: 0 }}
      childrenContentStyle={{
        padding: 0,
        width: '100%',
        maxWidth: '100%',
        margin: 0,
      }}
    >
      {navigation}
      {title && (
        <header className="portal-header">
          <div>
            {eyebrow && <div className="portal-eyebrow">{eyebrow}</div>}
            <Typography.Title level={2}>{title}</Typography.Title>
            {description && <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>}
          </div>
          {actions && <div className="portal-header-actions">{actions}</div>}
        </header>
      )}
      {children}
    </PageContainer>
  );
}
