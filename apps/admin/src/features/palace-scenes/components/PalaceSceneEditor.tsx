import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Flex, Form, Input, Segmented, Select, Space, Switch, Tag, Typography } from 'antd';
import { useState } from 'react';
import { adminPalaceScenesApi } from '../../../api/adminPalaceScenesApi';
import { ImageUploadField } from '../../../components/media/ImageUploadField';
import { useAdminMediaApi } from '../../../hooks/useAdminMediaApi';
import { extractApiErrorMessage } from '../../../lib/errorMessage';
import type { PalaceLocusInput, PalaceSceneDto, PalaceSceneUpsertRequest } from '../../../types/palaceScene';
import { LocusCanvas } from './LocusCanvas';
import { LocusInspector } from './LocusInspector';
import '../pages/palaceStudio.css';

export function PalaceSceneEditor({ scene, onClose }: { scene?: PalaceSceneDto; onClose: () => void }) {
  const { message, modal } = App.useApp();
  const client = useQueryClient();
  const { resolveMediaPath } = useAdminMediaApi();
  const [initial] = useState<PalaceSceneUpsertRequest>(() => scene ? {
    name: scene.name, description: scene.description, imageUrl: scene.imageUrl, status: scene.status, isPremium: scene.isPremium, expectedVersion: scene.version,
    loci: scene.loci.map(({ id, position, name, description, nameEn, nameZh, descriptionEn, descriptionZh, xPercent, yPercent, radiusPercent }) => ({ id, position, name, description: description ?? undefined, nameEn: nameEn ?? undefined, nameZh: nameZh ?? undefined, descriptionEn: descriptionEn ?? undefined, descriptionZh: descriptionZh ?? undefined, xPercent, yPercent, radiusPercent })),
  } : { name: '', description: '', imageUrl: '', status: 'draft', isPremium: false, loci: [] });
  const [draft, setDraft] = useState(initial);
  const [selected, setSelected] = useState(0);
  const [panel, setPanel] = useState('settings');
  const selectPoint = (index: number) => { setSelected(index); setPanel('point'); };
  const [uploading, setUploading] = useState(false);
  const save = useMutation({ mutationFn: () => scene ? adminPalaceScenesApi.update(scene.id, draft) : adminPalaceScenesApi.create(draft), retry: false, meta: { suppressGlobalErrorToast: true },
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['admin-palace-scenes'] }); message.success('Palace scene saved.'); onClose(); },
    onError: error => message.error(extractApiErrorMessage(error, 'Could not save scene. Your changes are still here.')) });
  const busy = save.isPending || uploading;
  const valid = Boolean(draft.name.trim() && draft.imageUrl.trim() && draft.loci.every(l => l.name.trim()) && (draft.status !== 'published' || draft.loci.length));
  const close = () => {
    if (busy) return;
    if (JSON.stringify(initial) === JSON.stringify(draft)) { onClose(); return; }
    modal.confirm({ title: 'Discard scene changes?', content: 'Your changes have not been saved.', okText: 'Discard changes', okButtonProps: { danger: true }, onOk: onClose });
  };
  const updatePoint = (index: number, values: Partial<PalaceLocusInput>) => setDraft(current => ({ ...current, loci: current.loci.map((l, i) => i === index ? { ...l, ...values } : l) }));
  const reorder = (index: number, offset: number) => {
    setDraft(current => { const loci = [...current.loci]; [loci[index], loci[index + offset]] = [loci[index + offset], loci[index]]; return { ...current, loci: loci.map((l, i) => ({ ...l, position: i + 1 })) }; });
    selectPoint(index + offset);
  };
  return <div>
    <Button type='link' style={{ padding: 0, marginBottom: 16 }} disabled={busy} onClick={close}>← Back to Palace scenes</Button>
    <header className='studio-header'><div><div className='studio-eyebrow'>CONTENT STUDIO / SCENE EDITOR</div><Typography.Title level={2}>{scene ? scene.name : 'New Palace scene'}</Typography.Title><Typography.Paragraph type='secondary'>Build a memorable route, one point at a time.</Typography.Paragraph></div>
      <Space><Button disabled={busy} onClick={close}>Cancel</Button><Button aria-label='Save scene' type='primary' size='large' icon={<SaveOutlined />} loading={save.isPending} disabled={!valid || uploading} onClick={() => {
        if (draft.status === 'published' && scene?.status !== 'published') modal.confirm({ title: 'Publish this scene?', content: 'It will become available in the mobile Palace catalogue.', okText: 'Publish scene', onOk: () => save.mutateAsync() });
        else save.mutate();
      }}>Save scene</Button></Space>
    </header>
    {!valid && <Alert type='info' showIcon style={{ marginBottom: 20 }} message='A scene needs a name and image. Name every memory point, and add at least one point before publishing.' />}
    {save.isError && <Alert showIcon type='error' style={{ marginBottom: 20 }} message={extractApiErrorMessage(save.error, 'Could not save scene.')} />}
    <div className='palace-editor-grid'>
      <section><Flex justify='space-between' align='center' gap={12} wrap style={{ marginBottom: 12 }}><Typography.Title level={4} style={{ margin: 0 }}>Scene canvas</Typography.Title><Tag color='green'>{draft.loci.length} memory points</Tag></Flex>
        <Typography.Paragraph type='secondary'>Click to place the selected point, drag a marker to move it, or use arrow keys and the coordinate fields.</Typography.Paragraph>
        <LocusCanvas imageUrl={draft.imageUrl ? resolveMediaPath(draft.imageUrl) : ''} loci={draft.loci} selected={selected} disabled={busy} onSelect={selectPoint} onPosition={updatePoint}
          onAdd={position => { selectPoint(draft.loci.length); setDraft(current => ({ ...current, loci: [...current.loci, { position: current.loci.length + 1, name: `Point ${current.loci.length + 1}`, ...position, radiusPercent: 7 }] })); }} />
        <Flex justify='space-between' align='center' gap={12} wrap style={{ marginTop: 20 }}><Typography.Title level={4} style={{ margin: 0 }}>Memory route</Typography.Title><Button icon={<PlusOutlined />} disabled={busy || !draft.imageUrl} onClick={() => selectPoint(draft.loci.length)}>Add point on image</Button></Flex>
        {selected === draft.loci.length && draft.imageUrl && <Alert type='info' showIcon style={{ marginTop: 12 }} message='Click the image to place your new memory point.' />}
        <ol className='palace-point-list'>{draft.loci.map((point, index) => <li key={point.id ?? index} className={selected === index ? 'is-selected' : ''}>
          <Button type='link' disabled={busy} onClick={() => selectPoint(index)}>{index + 1}. {point.name || 'Untitled point'}{point.nameZh ? ` · ${point.nameZh}` : ''}</Button>
          <Space size={0}><Button type='text' aria-label={`Move point ${index + 1} up`} icon={<ArrowUpOutlined />} disabled={busy || index === 0} onClick={() => reorder(index, -1)} /><Button type='text' aria-label={`Move point ${index + 1} down`} icon={<ArrowDownOutlined />} disabled={busy || index === draft.loci.length - 1} onClick={() => reorder(index, 1)} /><Button type='text' danger aria-label={`Remove point ${index + 1}`} icon={<DeleteOutlined />} disabled={busy} onClick={() => {
            setDraft(current => ({ ...current, loci: current.loci.filter((_, i) => i !== index).map((l, i) => ({ ...l, position: i + 1 })) })); setSelected(current => current > index ? current - 1 : Math.min(current, Math.max(0, draft.loci.length - 2)));
          }} /></Space>
        </li>)}</ol>
      </section>
      <aside className='palace-editor-aside'>
        <Segmented block disabled={busy} value={panel} onChange={value => setPanel(String(value))} options={[{ value: 'settings', label: 'Scene settings' }, { value: 'point', label: 'Point details' }]} />
        {panel === 'settings' ? <>
        <section className='studio-editor-section'><Typography.Title level={4} style={{ marginTop: 0 }}>Scene settings</Typography.Title><Form layout='vertical' disabled={busy}>
          <Form.Item label='Scene name' htmlFor='scene-name' required><Input id='scene-name' maxLength={200} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></Form.Item>
          <Form.Item label='Description' htmlFor='scene-description'><Input.TextArea id='scene-description' rows={3} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></Form.Item>
          <Form.Item label='Scene image' required><ImageUploadField category='palace' value={draft.imageUrl} disabled={busy} onUploadingChange={setUploading}
            onUploadError={error => message.error(extractApiErrorMessage(error, 'Image upload failed. Please try again.'))} onChange={imageUrl => setDraft(current => ({ ...current, imageUrl }))} /></Form.Item>
          <Form.Item label='Publication status' htmlFor='scene-status'><Select id='scene-status' value={draft.status} onChange={status => setDraft({ ...draft, status })} options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }]} /></Form.Item>
          <Form.Item label='Premium access' extra='Require Premium to use this scene.'><Switch aria-label='Premium access' checked={draft.isPremium} onChange={isPremium => setDraft({ ...draft, isPremium })} /></Form.Item>
        </Form></section>
        </> : <LocusInspector locus={draft.loci[selected]} disabled={busy} onChange={value => updatePoint(selected, value)} />}
      </aside>
    </div>
  </div>;
}
