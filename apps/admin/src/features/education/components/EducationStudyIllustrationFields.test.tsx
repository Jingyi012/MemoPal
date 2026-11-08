import { afterEach, expect, it, vi } from 'vitest';
import { Button, Form } from 'antd';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AdminLanguageProvider } from '../../../i18n/adminLanguage';
import { EducationStudyIllustrationFields } from './EducationStudyIllustrationFields';
afterEach(cleanup);
function mount(mediaRef:string) {localStorage.setItem('memopal.admin.language','en');const save=vi.fn();render(<AdminLanguageProvider><Form initialValues={{mediaRef}} onFinish={save}><EducationStudyIllustrationFields /><Button htmlType="submit">Save diagram</Button></Form></AdminLanguageProvider>);return save;}
it('preserves an existing illustration when saving other study content', async()=>{const save=mount('media:learning-fraction-half');expect(screen.getByRole('spinbutton',{name:'Equal parts'})).toHaveValue('2');fireEvent.click(screen.getByRole('button',{name:'Save diagram'}));await waitFor(()=>expect(save).toHaveBeenCalledWith({mediaRef:'media:learning-fraction-half'}));});
it('saves authored fraction values rather than a fixed half or quarter',async()=>{const save=mount('media:learning-fraction-3-7');fireEvent.change(screen.getByRole('spinbutton',{name:'Equal parts'}),{target:{value:'5'}});fireEvent.click(screen.getByRole('button',{name:'Save diagram'}));await waitFor(()=>expect(save).toHaveBeenCalledWith({mediaRef:'media:learning-fraction-3-5'}));});
it('preserves repeated symbols and their author-controlled order',async()=>{const save=mount('media:learning-pattern-red-red-blue');fireEvent.click(screen.getByRole('button',{name:'Add symbol'}));fireEvent.click(screen.getByRole('button',{name:'Save diagram'}));await waitFor(()=>expect(save).toHaveBeenCalledWith({mediaRef:'media:learning-pattern-red-red-blue-red'}));});
