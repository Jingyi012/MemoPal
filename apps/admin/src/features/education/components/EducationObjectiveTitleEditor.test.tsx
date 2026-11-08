import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AdminLanguageProvider } from '../../../i18n/adminLanguage';
import { EducationObjectiveTitleEditor } from './EducationObjectiveTitleEditor';
afterEach(cleanup);
it('submits the authored title and retains it after a failed save',async()=>{localStorage.setItem('memopal.admin.language','en');const save=vi.fn().mockRejectedValue(new Error('Unavailable'));render(<AdminLanguageProvider><EducationObjectiveTitleEditor title="Old title" loading={false} onSave={save} /></AdminLanguageProvider>);fireEvent.change(screen.getByRole('textbox',{name:'Knowledge point title'}),{target:{value:'New teaching point'}});fireEvent.click(screen.getByRole('button',{name:'Save'}));await waitFor(()=>expect(save).toHaveBeenCalledWith('New teaching point'));expect(screen.getByRole('textbox',{name:'Knowledge point title'})).toHaveValue('New teaching point');});
