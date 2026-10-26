import { Alert, Button, Empty, Spin } from 'antd';
import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { useEducationText } from '../i18n/useEducationText';

export function QueryState<T>({ query, children, emptyText = 'No records yet.' }: { query: UseQueryResult<T>; children: (data: T) => ReactNode; emptyText?: string }) {
  const { t } = useEducationText();
  if (query.isPending) return <Spin />;
  if (query.isError) return <Alert type="error" showIcon role="alert" message={t('loadError')} action={<Button onClick={() => void query.refetch()}>{t('retry')}</Button>} />;
  const data = query.data;
  if (Array.isArray(data) && data.length === 0) return <Empty description={emptyText} />;
  return <>{children(data)}</>;
}
