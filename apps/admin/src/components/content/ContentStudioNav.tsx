import { BookOutlined, PictureOutlined, TagsOutlined } from '@ant-design/icons';
import { NavLink, useLocation } from 'react-router-dom';
import { adminPaths } from '../../navigation/adminPaths';
import './contentStudio.css';

export function ContentStudioNav() {
  const { pathname } = useLocation();
  const libraryActive = pathname.startsWith(adminPaths.memoryCollections) || pathname.startsWith(adminPaths.predefinedMemoryLessons);
  return <nav className='content-studio-nav' aria-label='Content studio'>
    <NavLink to={adminPaths.memoryCollections} className={libraryActive ? 'is-active' : ''} aria-current={libraryActive ? 'page' : undefined}><BookOutlined /> Content library</NavLink>
    <NavLink to={adminPaths.palaceScenes} className={({ isActive }) => isActive ? 'is-active' : ''}><PictureOutlined /> Palace scenes</NavLink>
    <NavLink to={adminPaths.predefinedMemoryLessonCategories} className={({ isActive }) => isActive ? 'is-active' : ''}><TagsOutlined /> Categories</NavLink>
  </nav>;
}
