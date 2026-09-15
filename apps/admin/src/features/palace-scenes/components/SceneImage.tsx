import { PictureOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useAdminMediaApi } from '../../../hooks/useAdminMediaApi';

export function SceneImage({ path, name }: { path: string; name: string }) {
  const { resolveMediaPath } = useAdminMediaApi();
  const [failedPath, setFailedPath] = useState<string>();
  return !path || failedPath === path ? <span className='studio-image-empty' role='img' aria-label={`${name}: image unavailable`}><PictureOutlined /></span>
    : <img src={resolveMediaPath(path)} alt={name} loading='lazy' onError={() => setFailedPath(path)} />;
}
