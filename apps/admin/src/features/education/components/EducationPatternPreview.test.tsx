import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EducationPatternPreview } from './EducationPatternPreview';

afterEach(cleanup);

it('extends the complete repeating group without losing its order and can restart', () => {
  render(<EducationPatternPreview code="pattern-red-red-blue" zh={false} />);
  expect(screen.getByText('Red → Red → Blue repeats 2 times.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '+ Add the next group' }));
  expect(screen.getByText('Red → Red → Blue repeats 3 times.')).toBeInTheDocument();
  expect(screen.getAllByText('Red')).toHaveLength(6);
  expect(screen.getAllByText('Blue')).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: '+ Add the next group' }));
  fireEvent.click(screen.getByRole('button', { name: 'Explore again' }));
  expect(screen.queryByText('Group 3')).not.toBeInTheDocument();
  expect(screen.getByText('Red → Red → Blue repeats 2 times.')).toBeInTheDocument();
});
