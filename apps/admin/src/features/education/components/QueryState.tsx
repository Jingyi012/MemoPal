import { Alert, Button, Empty, Spin } from 'antd';
import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

export function QueryState<T>({ query, children, emptyText = 'No records yet.' }: { query: UseQueryResult<T>; children: (data: T) => ReactNode; emptyText?: string }) {
  if (query.isPending) return <Spin />;
  if (query.isError) return <Alert type="error" showIcon message="Could not load this information." action={<Button onClick={() => void query.refetch()}>Retry</Button>} />;
  const data = query.data;
  if (Array.isArray(data) && data.length === 0) return <Empty description={emptyText} />;
  return <>{children(data)}</>;
}
