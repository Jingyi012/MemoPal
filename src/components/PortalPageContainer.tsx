import { PageContainer } from '@ant-design/pro-components';
import type { ReactNode } from 'react';

interface PortalPageContainerProps {
  children: ReactNode;
}

export function PortalPageContainer({ children }: PortalPageContainerProps) {
  return (
    <PageContainer
      ghost
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
      {children}
    </PageContainer>
  );
}

