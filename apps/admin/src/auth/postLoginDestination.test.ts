import { describe, expect, it } from 'vitest';
import { getPostLoginDestination } from './postLoginDestination';
import type { AuthUser } from '../types/auth';

const learner: AuthUser = { id: 'learner', email: 'learner@example.com', displayName: 'Learner', role: 'User' };
const admin: AuthUser = { id: 'admin', email: 'admin@example.com', displayName: 'Admin', role: 'Admin' };

describe('getPostLoginDestination', () => {
  it('returns ordinary users to the Education workspace instead of the admin-only area', () => {
    expect(getPostLoginDestination(undefined, learner)).toBe('/education');
  });

  it('keeps platform administrators in the admin portal by default', () => {
    expect(getPostLoginDestination(undefined, admin)).toBe('/admin/users');
  });

  it('preserves a safe education deep link for either role', () => {
    expect(getPostLoginDestination('/education/courses/course-1', learner)).toBe('/education/courses/course-1');
    expect(getPostLoginDestination('/education/courses/course-1', admin)).toBe('/education/courses/course-1');
  });

  it.each(['//external.test', '/education\\\\external', '/admin/users', 'https://external.test'])('rejects unsafe or unauthorized return path %s', returnTo => {
    expect(getPostLoginDestination(returnTo, learner)).toBe('/education');
    expect(getPostLoginDestination(returnTo, admin)).toBe('/admin/users');
  });
});
