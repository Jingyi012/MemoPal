import { EducationStudyIllustrationFields } from './EducationStudyIllustrationFields';
import { useMemo, useRef, useState } from 'react';
import { App, Button, Card, Checkbox, Descriptions, Divider, Form, Input, Modal, Select, Space, Spin, Table, Tag, Typography, Upload } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, EyeOutlined, ImportOutlined, PlusOutlined } from '@ant-design/icons';
import type { EducationMemoryContentType, EducationObjectiveDto, EducationStudyItemAuthorDto, EducationStudyItemImportResult, EducationStudyItemRequest } from '../../../types/educationAuthoring';
import { educationAuthoringApi } from '../../../api/educationAuthoringApi';
import { useEducationStudyItems, useLearnerStudyItems } from '../hooks/useEducationStudyItems';
import { csvTemplate, importReasonTranslations, moveStudyItem, parseCsvText, unicodeCodePointLength, validateStudyItem } from '../utils/educationStudyItems';
import { useEducationText } from '../i18n/useEducationText';
import { useAuth } from '../../../auth/AuthContext';
import { EducationStudyPreview } from './EducationStudyPreview';

const contentTypes: EducationMemoryContentType[] = ['VocabularyPair', 'OrderedList', 'NumberDate', 'FormulaSymbols', 'CategoryMembership', 'VerbatimText', 'LabelDiagram', 'LanguageItem', 'ConceptUnderstanding', 'ReasoningProcedure', 'NotApplicable'];
const typeText: Record<EducationMemoryContentType, { label: Parameters<ReturnType<typeof useEducationText>['t']>[0]; description: Parameters<ReturnType<typeof useEducationText>['t']>[0]; fit: Parameters<ReturnType<typeof useEducationText>['t']>[0] }> = {
  VocabularyPair: { label: 'typeVocabulary', description: 'descVocabulary', fit: 'suitableBoth' }, OrderedList: { label: 'typeOrderedList', description: 'descOrderedList', fit: 'suitableBoth' },
  NumberDate: { label: 'typeNumberDate', description: 'descNumberDate', fit: 'suitablePeg' }, FormulaSymbols: { label: 'typeFormula', description: 'descFormula', fit: 'suitablePeg' },
  CategoryMembership: { label: 'typeCategory', description: 'descCategory', fit: 'suitableBoth' }, VerbatimText: { label: 'typeVerbatim', description: 'descVerbatim', fit: 'suitablePalace' },
  LabelDiagram: { label: 'typeDiagram', description: 'descDiagram', fit: 'suitablePalace' }, LanguageItem: { label: 'typeLanguage', description: 'descLanguage', fit: 'suitableBoth' },
  ConceptUnderstanding: { label: 'typeConcept', description: 'descConcept', fit: 'ordinaryPractice' }, ReasoningProcedure: { label: 'typeReasoning', description: 'descReasoning', fit: 'ordinaryPractice' },
  NotApplicable: { label: 'typeNone', description: 'descNone', fit: 'unsuitable' },
};

export function educationMemoryTypeLabel(type: string | undefined): Parameters<ReturnType<typeof useEducationText>['t']>[0] {
  return type && type in typeText ? typeText[type as EducationMemoryContentType].label : 'typeNone';
}

function messageForImportError(code: string, fallback: string, t: ReturnType<typeof useEducationText>['t']) {
  return importReasonTranslations[code] ? t(importReasonTranslations[code]) : fallback;
}

export function StudyItemEditor({ courseId, objective, isPublic }: { courseId: string; objective: EducationObjectiveDto; isPublic: boolean }) {
  const { t } = useEducationText();
  const { message, modal } = App.useApp();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const data = useEducationStudyItems(userId, courseId, objective.id);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form] = Form.useForm<EducationStudyItemRequest>();
  const [isComposing, setIsComposing] = useState(false);
  const composingRef = useRef(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const learnerPreview = useLearnerStudyItems(userId, objective.id, previewOpen);
  const [importOpen, setImportOpen] = useState(false);
  const [importKind, setImportKind] = useState<'csv' | 'json'>('csv');
  const [importData, setImportData] = useState<string | EducationStudyItemRequest[] | null>(null);
  const [preflight, setPreflight] = useState<EducationStudyItemImportResult | null>(null);
  const [preflighting, setPreflighting] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [confidentialChecked, setConfidentialChecked] = useState(false);
  const [publishTarget, setPublishTarget] = useState<string | null>(null);
  const rows = useMemo(() => data.items.data ?? [], [data.items.data]);
  const selectedType = objective.memoryContentType ?? 'NotApplicable';
  const typeHint = typeText[selectedType];
  const visibleError = (query: { isError: boolean }) => query.isError ? <Typography.Text role="alert" type="danger">{t('loadError')}</Typography.Text> : null;

  const resetForm = () => { setEditing(null); form.resetFields(); setIsComposing(false); composingRef.current = false; };
  const beginCreate = () => { form.setFieldsValue({ stableKey: null, position: rows.length + 1, kind: selectedType, primary: '', secondary: '', phonetic: '', extra: '', hint: '', mediaRef: null, languageCode: objective.languageCode }); setEditing('new'); };
  const beginEdit = (item: EducationStudyItemAuthorDto) => { form.setFieldsValue({ stableKey: item.stableKey, position: item.position, kind: item.kind, primary: item.primary, secondary: item.secondary, phonetic: item.phonetic, extra: item.extra, hint: item.hint, mediaRef: item.mediaRef, languageCode: item.languageCode }); setEditing(item.id); };
  const handleSave = async (value: EducationStudyItemRequest) => {
    if (composingRef.current) return;
    const errors = validateStudyItem(value);
    if (Object.keys(errors).length) { form.setFields(Object.entries(errors).map(([name, code]) => ({ name: name as 'primary' | 'secondary' | 'phonetic' | 'extra' | 'hint', errors: [code === 'primary:required' ? t('requiredPrimary') : t('overLimit')] }))); return; }
    if (editing === 'new') await data.create.mutateAsync(value);
    else if (editing) await data.update.mutateAsync({ itemId: editing, input: value });
    resetForm();
  };

  const changeType = async (value: EducationMemoryContentType) => {
    const input = { memoryContentType: value, languageCode: objective.languageCode ?? null, gradeCode: objective.gradeCode ?? null,
      curriculumCode: objective.curriculumCode ?? null, subjectCode: objective.subjectCode ?? null,
      contentOrigin: objective.contentOrigin ?? 'Original', reviewStatus: objective.reviewStatus ?? 'Unreviewed' };
    await data.setMetadata.mutateAsync(input);
  };
  const markReviewed = async () => data.setMetadata.mutateAsync({ memoryContentType: selectedType,
    languageCode: objective.languageCode ?? null, gradeCode: objective.gradeCode ?? null, curriculumCode: objective.curriculumCode ?? null,
    subjectCode: objective.subjectCode ?? null, contentOrigin: objective.contentOrigin ?? 'Original', reviewStatus: 'TeacherReviewed' });
  const updateMetadata = (field: 'languageCode' | 'gradeCode' | 'curriculumCode' | 'subjectCode' | 'contentOrigin', value: string | null) => data.setMetadata.mutate({
    memoryContentType: selectedType, languageCode: field === 'languageCode' ? value : objective.languageCode ?? null,
    gradeCode: field === 'gradeCode' ? value : objective.gradeCode ?? null,
    curriculumCode: field === 'curriculumCode' ? value : objective.curriculumCode ?? null,
    subjectCode: field === 'subjectCode' ? value : objective.subjectCode ?? null,
    contentOrigin: field === 'contentOrigin' ? value ?? 'Original' : objective.contentOrigin ?? 'Original', reviewStatus: objective.reviewStatus ?? 'Unreviewed',
  });
  const ordered = useMemo(() => [...rows].sort((a, b) => a.position - b.position), [rows]);
  const reorderBy = (index: number, delta: -1 | 1) => {
    const ids = moveStudyItem(ordered, index, delta).map(item => item.id);
    data.reorder.mutate(ids);
  };
  const downloadTemplate = (chinese: boolean) => {
    const blob = new Blob([`\uFEFF${csvTemplate(chinese)}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url;
    anchor.download = chinese ? 'education-study-items-zh-Hans.csv' : 'education-study-items-en.csv'; anchor.click(); URL.revokeObjectURL(url);
  };
  const inspectFile = async (file: File) => {
    setPreflight(null);
    if (file.size > 1024 * 1024) { setImportData(null); message.error(t('fileTooLarge')); return false; }
    if (importKind === 'csv') {
      try {
        const bytes = await file.arrayBuffer();
        const content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        setImportData(parseCsvText(content).canonicalCsv);
      } catch { setImportData(null); message.error(t('nonUtf8')); }
    } else {
      try {
        const parsed = JSON.parse(await file.text()) as EducationStudyItemRequest[];
        if (!Array.isArray(parsed)) throw new Error('invalid');
        setImportData(parsed);
      } catch { setImportData(null); message.error(t('invalidJson')); }
    }
    return false;
  };
  const preflightImport = async () => {
    if (importData === null) { message.error(t('noFile')); return; }
    setPreflighting(true);
    try {
      const result = importKind === 'csv'
        ? await educationAuthoringApi.importCsv(courseId, objective.id, new Blob([importData as string], { type: 'text/csv' }), true)
        : await educationAuthoringApi.importJson(courseId, objective.id, importData as EducationStudyItemRequest[], true);
      setPreflight(result);
    } catch { message.error(t('requestError')); } finally { setPreflighting(false); }
  };
  const confirmImport = async () => {
    if (!preflight?.canImport || importData === null) { message.error(t('preflightRequired')); return; }
    const oldPlan = `${preflight.created}/${preflight.updated}/${preflight.unchanged}`;
    setCommitting(true);
    try {
      const actual = importKind === 'csv'
        ? await educationAuthoringApi.importCsv(courseId, objective.id, new Blob([importData as string], { type: 'text/csv' }), false)
        : await educationAuthoringApi.importJson(courseId, objective.id, importData as EducationStudyItemRequest[], false);
      await data.items.refetch();
      if (!actual.imported || !actual.canImport || `${actual.created}/${actual.updated}/${actual.unchanged}` !== oldPlan) {
        setPreflight(actual); message.warning(t('preflightChanged')); return;
      }
      message.success(`${t('importComplete')}: ${t('willCreate')} ${actual.created}, ${t('willUpdate')} ${actual.updated}, ${t('unchanged')} ${actual.unchanged}`);
      setImportOpen(false); setImportData(null); setPreflight(null);
    } catch { message.error(t('requestError')); } finally { setCommitting(false); }
  };

  const headerActions = <Space wrap className="education-study-actions">
    <Button aria-label={t('import')} icon={<ImportOutlined />} onClick={() => { setImportOpen(true); setPreflight(null); }}>{t('import')}</Button>
    <Button aria-label={t('previewLearner')} icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>{t('previewLearner')}</Button>
    <Button aria-label={t('addItem')} icon={<PlusOutlined />} type="primary" onClick={beginCreate}>{t('addItem')}</Button>
  </Space>;

  return <Card className="education-study-editor" title={`${t('studyContent')} · ${t(typeHint.label)}`} extra={<div className="education-study-card-actions">{headerActions}</div>}>
    <Typography.Paragraph type="secondary">{t(typeHint.description)}{' · '}{t(typeHint.fit === 'ordinaryPractice' ? typeHint.fit : (selectedType === 'NumberDate' || selectedType === 'FormulaSymbols' ? 'suitablePeg' : selectedType === 'VerbatimText' || selectedType === 'LabelDiagram' ? 'suitablePalace' : typeHint.fit))}</Typography.Paragraph>
    <Form layout="vertical" className="education-study-metadata">
      <Space wrap align="start" className="education-study-metadata-fields">
        <Form.Item label={t('memoryType')}><Select aria-label={t('memoryType')} value={selectedType} onChange={changeType} options={contentTypes.map(value => ({ value, label: t(typeText[value].label) }))} /></Form.Item>
        <Form.Item label={t('languageCode')}><Select aria-label={t('languageCode')} value={objective.languageCode ?? undefined} allowClear onChange={value => updateMetadata('languageCode', value ?? null)} options={[{ value: 'zh-Hans', label: t('langZhHans') }, { value: 'en', label: t('langEn') }, { value: 'zh-Hant', label: t('langZhHant') }, { value: 'ms', label: t('langMs') }]} /></Form.Item>
        <Form.Item label={t('grade')}><Select aria-label={t('grade')} value={objective.gradeCode ?? undefined} allowClear showSearch onChange={value => updateMetadata('gradeCode', value ?? null)} options={[...Array.from({ length: 6 }, (_, i) => `MY-P${i + 1}`), ...Array.from({ length: 5 }, (_, i) => `MY-F${i + 1}`), 'MY-UEC-J1', 'MY-UEC-S1'].map(value => ({ value, label: value }))} /></Form.Item>
        <Form.Item label={t('curriculum')}><Select aria-label={t('curriculum')} value={objective.curriculumCode ?? undefined} allowClear showSearch onChange={value => updateMetadata('curriculumCode', value ?? null)} options={['KSSR', 'KSSM', 'IGCSE', 'UEC'].map(value => ({ value, label: value }))} /></Form.Item>
        <Form.Item label={t('subject')}><Select aria-label={t('subject')} value={objective.subjectCode ?? undefined} allowClear showSearch onChange={value => updateMetadata('subjectCode', value ?? null)} options={[
          ['Chinese', 'subjectChinese'], ['English', 'subjectEnglish'], ['Science', 'subjectScience'], ['Mathematics', 'subjectMathematics'], ['Bahasa Melayu', 'subjectMalay'], ['History', 'subjectHistory'],
        ].map(([value, key]) => ({ value, label: t(key as Parameters<typeof t>[0]) }))} /></Form.Item>
        <Form.Item label={t('contentOrigin')}><Select aria-label={t('contentOrigin')} value={objective.contentOrigin ?? 'Original'} onChange={value => updateMetadata('contentOrigin', value)} options={[
          { value: 'Original', label: t('original') }, { value: 'PublicDomainConfirmed', label: t('publicDomain') }, { value: 'Imported', label: t('imported') },
        ]} /></Form.Item>
        <Button loading={data.setMetadata.isPending} onClick={() => void markReviewed()} disabled={objective.reviewStatus === 'TeacherReviewed'}>{t('markReviewed')}</Button>
      </Space>
    </Form>
    <Space wrap style={{ marginBottom: 12 }}>
      <Tag>{t('contentOrigin')}: {t(objective.contentOrigin === 'Imported' ? 'imported' : objective.contentOrigin === 'PublicDomainConfirmed' ? 'publicDomain' : 'original')}</Tag>
      <Tag color={objective.reviewStatus === 'TeacherReviewed' ? 'green' : 'gold'}>{t('review')}: {t(objective.reviewStatus === 'TeacherReviewed' ? 'teacherReviewed' : 'unreviewed')}</Tag>
      <Typography.Text type="secondary">{t('publishedHelp')}</Typography.Text>
    </Space>
    {visibleError(data.items)}
    {data.items.isPending ? <div role="status"><Spin /> {t('loading')}</div> : data.items.isError ? null : ordered.length === 0 && editing !== 'new'
      ? <Typography.Paragraph type="secondary">{t('emptyItems')}</Typography.Paragraph>
      : <Space direction="vertical" style={{ width: '100%' }}>
        {ordered.map((item, index) => editing === item.id ? <Card size="small" key={item.id}>{renderEditor()}</Card> : <Card className="education-study-item-card" size="small" key={item.id} title={<Space className="education-study-item-title"><Tag color={item.status === 'Published' ? 'green' : 'gold'}>{t(item.status === 'Published' ? 'published' : 'draft')}</Tag><Typography.Text>{item.primary}</Typography.Text></Space>} extra={<Space wrap className="education-study-item-actions">
          <Button aria-label={t('moveUp')} icon={<ArrowUpOutlined />} disabled={index === 0 || data.reorder.isPending} onClick={() => reorderBy(index, -1)} />
          <Button aria-label={t('moveDown')} icon={<ArrowDownOutlined />} disabled={index === ordered.length - 1 || data.reorder.isPending} onClick={() => reorderBy(index, 1)} />
          {item.status === 'Draft' && <Button aria-label={t('edit')} icon={<EditOutlined />} onClick={() => beginEdit(item)}>{t('edit')}</Button>}
          {item.status === 'Draft' ? <Button type="primary" onClick={() => { setConfidentialChecked(false); setPublishTarget(item.id); }}>{t('publishItem')}</Button>
            : <Button onClick={() => data.retract.mutate(item.id)}>{t('retractItem')}</Button>}
          <Button danger icon={<DeleteOutlined />} aria-label={t('delete')} disabled={item.status === 'Published'} onClick={() => modal.confirm({ title: t('deleteConfirm'), okText: t('delete'), okButtonProps: { danger: true }, onOk: () => data.remove.mutateAsync(item.id) })}>{t('delete')}</Button>
        </Space>}>
          <Typography.Paragraph>{item.secondary}</Typography.Paragraph>
          {item.phonetic && <Typography.Text>{item.phonetic}</Typography.Text>}
          {item.extra && <Typography.Paragraph type="secondary">{item.extra}</Typography.Paragraph>}
        </Card>)}
        {editing === 'new' && <Card size="small">{renderEditor()}</Card>}
      </Space>}

    <Modal open={importOpen} title={t('importTitle')} onCancel={() => { setImportOpen(false); setPreflight(null); }} onOk={confirmImport} okText={t('confirmImport')} confirmLoading={committing} okButtonProps={{ disabled: !preflight?.canImport || committing }} width={780}>
      <Space wrap style={{ marginBottom: 12 }}>
        <Select aria-label={t('importTitle')} value={importKind} onChange={value => { setImportKind(value); setImportData(null); setPreflight(null); }} options={[{ value: 'csv', label: 'CSV' }, { value: 'json', label: 'JSON' }]} />
        <Button icon={<DownloadOutlined />} onClick={() => downloadTemplate(false)}>{t('templateEnglish')}</Button>
        <Button icon={<DownloadOutlined />} onClick={() => downloadTemplate(true)}>{t('templateChinese')}</Button>
      </Space>
      {importKind === 'csv' ? <Upload beforeUpload={inspectFile} maxCount={1} accept=".csv,text/csv"><Button>{t('csvUpload')}</Button></Upload>
        : <Input.TextArea aria-label={t('jsonPaste')} placeholder={t('jsonPaste')} rows={8} onChange={event => { setPreflight(null); try { const value = JSON.parse(event.target.value) as EducationStudyItemRequest[]; setImportData(Array.isArray(value) ? value : null); } catch { setImportData(null); } }} />}
      <Button style={{ marginTop: 12 }} loading={preflighting} disabled={importData === null} onClick={() => void preflightImport()}>{t('runPreflight')}</Button>
      {preflight && <div aria-live="polite">
        <Divider /><Typography.Title level={5}>{t('summary')}</Typography.Title>
        <Descriptions size="small" column={4} items={[
          { key: 'create', label: t('willCreate'), children: preflight.created }, { key: 'update', label: t('willUpdate'), children: preflight.updated },
          { key: 'same', label: t('unchanged'), children: preflight.unchanged }, { key: 'reject', label: t('rejected'), children: preflight.rejectedRows },
        ]} />
        {preflight.errors.length > 0 && <Table size="small" rowKey={(row, index) => `${row.row}-${row.field}-${index}`} pagination={{ pageSize: 5 }} dataSource={preflight.errors} columns={[
          { title: t('row'), dataIndex: 'row' }, { title: t('field'), dataIndex: 'field' },
          { title: t('reason'), render: (_: unknown, row) => messageForImportError(row.reasonCode, row.message, t) },
        ]} />}
        {!preflight.canImport && <Typography.Text type="danger" role="alert">{t('rejected')}: {preflight.rejectedRows}</Typography.Text>}
      </div>}
    </Modal>

    <Modal open={!!publishTarget} title={t('publishItem')} okText={t('publishItem')} cancelText={t('cancel')}
      okButtonProps={{ disabled: isPublic && !confidentialChecked }} confirmLoading={data.publish.isPending}
      onCancel={() => setPublishTarget(null)} onOk={async () => { if (!publishTarget) return; await data.publish.mutateAsync({ itemId: publishTarget, confirm: !isPublic || confidentialChecked }); setPublishTarget(null); }}>
      {isPublic && <Checkbox checked={confidentialChecked} onChange={event => setConfidentialChecked(event.target.checked)}>{t('confidential')}</Checkbox>}
    </Modal>

    <Modal open={previewOpen} destroyOnHidden title={t('learnerPreviewTitle')} footer={null} onCancel={() => setPreviewOpen(false)}>
      {learnerPreview.isPending ? <div role="status"><Spin /> {t('loading')}</div> : learnerPreview.isError ? <Typography.Text role="alert" type="danger">{t('loadError')}</Typography.Text> : learnerPreview.data?.length
        ? <EducationStudyPreview items={learnerPreview.data} /> : <Typography.Text type="secondary">{t('noPublished')}</Typography.Text>}
    </Modal>
  </Card>;

  function renderEditor() {
    const maxPrimary = selectedType === 'OrderedList' ? t('stepPlaceholder', { n: rows.length + 1 }) : selectedType === 'NumberDate' ? t('numberPlaceholder') : selectedType === 'VerbatimText' ? t('verbatimPlaceholder') : selectedType === 'LanguageItem' ? t('languagePlaceholder') : selectedType === 'VocabularyPair' ? t('vocabularyPlaceholder') : t('primaryPlaceholder');
    const compositionProps = { onCompositionStart: () => { composingRef.current = true; setIsComposing(true); }, onCompositionEnd: () => { composingRef.current = false; setIsComposing(false); } };
    const codePointRule = (max: number) => ({ validator: (_: unknown, value?: string) => unicodeCodePointLength(value ?? '') <= max ? Promise.resolve() : Promise.reject(new Error(t('overLimit'))) });
    const itemBeingEdited = editing === 'new' ? null : ordered.find(item => item.id === editing);
    return <Form className="education-study-item-form" form={form} layout="vertical" onFinish={handleSave} onSubmitCapture={event => { if (composingRef.current) { event.preventDefault(); event.stopPropagation(); } }} validateTrigger={isComposing ? [] : 'onBlur'}>
      <Space wrap align="start" className="education-study-item-fields">
        <Form.Item name="primary" label={t('primary')} rules={[{ required: true, message: t('requiredPrimary') }, codePointRule(500)]}>
          <Input aria-label={t('primary')} placeholder={maxPrimary} showCount={{ formatter: ({ value }) => t('chars', { count: unicodeCodePointLength(value), max: 500 }) }} {...compositionProps} />
        </Form.Item>
        <Form.Item name="secondary" label={t('secondary')} rules={[codePointRule(500)]}>
          <Input aria-label={t('secondary')} placeholder={selectedType === 'VocabularyPair' || selectedType === 'LanguageItem' ? t('meaningPlaceholder') : t('secondary')} showCount={{ formatter: ({ value }) => t('chars', { count: unicodeCodePointLength(value), max: 500 }) }} {...compositionProps} />
        </Form.Item>
        {(selectedType === 'LanguageItem' || selectedType === 'VerbatimText' || selectedType === 'VocabularyPair') && <Form.Item name="phonetic" label={t('phonetic')} rules={[codePointRule(200)]}>
          <Input aria-label={t('phonetic')} placeholder={t('phoneticPlaceholder')} showCount={{ formatter: ({ value }) => t('chars', { count: unicodeCodePointLength(value), max: 200 }) }} {...compositionProps} />
        </Form.Item>}
        <Form.Item name="extra" label={t('extra')} rules={[codePointRule(300)]}><Input aria-label={t('extra')} placeholder={t('extraPlaceholder')} showCount={{ formatter: ({ value }) => t('chars', { count: unicodeCodePointLength(value), max: 300 }) }} {...compositionProps} /></Form.Item>
      </Space>
      <Form.Item name="hint" label={t('hint')} rules={[codePointRule(200)]}><Input aria-label={t('hint')} placeholder={t('hintPlaceholder')} showCount={{ formatter: ({ value }) => t('chars', { count: unicodeCodePointLength(value), max: 200 }) }} {...compositionProps} /></Form.Item>
      <EducationStudyIllustrationFields />
      <Space><Button type="primary" htmlType="submit" loading={data.create.isPending || data.update.isPending} disabled={isComposing}>{t('save')}</Button><Button onClick={resetForm}>{t('cancel')}</Button>{itemBeingEdited && <Tag>{t(itemBeingEdited.status === 'Draft' ? 'draft' : 'published')}</Tag>}</Space>
    </Form>;
  }
}

export function EducationObjectiveStudyEditor({ courseId, objective, isPublic }: { courseId: string; objective: EducationObjectiveDto; isPublic: boolean }) {
  return <StudyItemEditor key={objective.id} courseId={courseId} objective={objective} isPublic={isPublic} />;
}

