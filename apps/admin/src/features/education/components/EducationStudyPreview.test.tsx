import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AdminLanguageProvider } from '../../../i18n/adminLanguage';
import type { EducationLearnerStudyItemDto } from '../../../types/educationAuthoring';
import { EducationStudyPreview } from './EducationStudyPreview';

const items: EducationLearnerStudyItemDto[] = [
  { id: 'half', position: 1, kind: 'ConceptUnderstanding', primary: 'One half', secondary: 'Equal shares', phonetic: null, extra: null, languageCode: 'en', contentVersion: 1, reviewStatus: 'Unreviewed', contentOrigin: 'Original', illustrationCode: 'fraction-half' },
  { id: 'square', position: 2, kind: 'ConceptUnderstanding', primary: 'A square', secondary: null, phonetic: null, extra: null, languageCode: 'en', contentVersion: 1, reviewStatus: 'Unreviewed', contentOrigin: 'Original', illustrationCode: 'shape-square' },
];
afterEach(cleanup);
describe('EducationStudyPreview', () => {
  it('shows one item at a time and resets the exploration when changing items', () => {
    localStorage.setItem('memopal.admin.language', 'en');
    render(<AdminLanguageProvider><EducationStudyPreview items={items} /></AdminLanguageProvider>);
    expect(screen.queryByText('A square')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Equal part 2' }));
    expect(screen.getByText('You shaded 2/2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset to 1/2' }));
    expect(screen.getByText('You shaded 1/2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('img', { name: 'A square' })).toBeInTheDocument();
    expect(screen.queryByText('One half')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByText('You shaded 1/2')).toBeInTheDocument();
  });
});

it('previews authored fraction parameters and polygons outside the starter examples',()=>{
 localStorage.setItem('memopal.admin.language','en');
 const custom=[{...items[0],illustrationCode:'fraction-3-7',primary:'Authored fraction'},{...items[1],illustrationCode:'shape-polygon-5',primary:'Authored polygon'}];
 render(<AdminLanguageProvider><EducationStudyPreview items={custom} /></AdminLanguageProvider>);
 expect(screen.getAllByRole('checkbox')).toHaveLength(7);
 expect(screen.getByText('You shaded 3/7')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Next'}));
 expect(screen.getByRole('img',{name:'Authored polygon'}).querySelector('polygon')?.getAttribute('points')?.split(' ')).toHaveLength(5);
});
