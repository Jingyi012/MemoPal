import { useState } from 'react';
import { Button, Card, Flex, Progress, Tag, Typography, theme } from 'antd';
import type { EducationLearnerStudyItemDto } from '../../../types/educationAuthoring';
import { useEducationText } from '../i18n/useEducationText';
import { EducationPatternPreview, studyPatterns } from './EducationPatternPreview';

const fractions: Record<string, [number, number]> = {
  'fraction-half': [2, 1], 'fraction-quarter': [4, 1], 'fraction-three-quarters': [4, 3],
};

function Illustration({ code, zh }: { code?: string | null; zh: boolean }) {
  const { token } = theme.useToken();
  const fraction = code ? fractions[code] : undefined;
  const [parts, shaded] = fraction ?? [0, 0];
  const initial = () => Array.from({ length: parts }, (_, i) => i < shaded);
  const [selected, setSelected] = useState(initial);
  if (code && Object.hasOwn(studyPatterns, code)) return <EducationPatternPreview key={code} code={code as keyof typeof studyPatterns} zh={zh} />;
  if (fraction) return <Card size="small" style={{ borderRadius: 20 }}>
    <Typography.Title level={5}>{zh ? '动手涂一涂' : 'Colour the equal parts'}</Typography.Title>
    <Typography.Paragraph>{zh ? `一个整体，分成 ${parts} 个同样大的部分。点一点，改变涂色。` : `One whole, split into ${parts} equal parts. Tap to change the shading.`}</Typography.Paragraph>
    <div style={{ display: 'flex', border: `2px solid ${token.colorPrimary}`, borderRadius: 16, overflow: 'hidden' }}>
      {selected.map((checked, index) => <button key={index} type="button" role="checkbox" aria-checked={checked}
        aria-label={zh ? `第 ${index + 1} 等份` : `Equal part ${index + 1}`}
        onClick={() => setSelected(current => current.map((value, i) => i === index ? !value : value))}
        style={{ flex: 1, minWidth: 44, minHeight: 76, cursor: 'pointer', border: 0, borderLeft: index ? `2px solid ${token.colorPrimary}` : 0,
          background: checked ? token.colorPrimary : token.colorBgContainer, color: checked ? token.colorTextLightSolid : token.colorText, fontSize: 24 }}>
        {checked ? '✓' : '·'}
      </button>)}
    </div>
    <Typography.Paragraph aria-live="polite" style={{ marginTop: 12 }}>{zh ? '已涂色' : 'You shaded'} {selected.filter(Boolean).length}/{parts}</Typography.Paragraph>
    <Button block style={{ minHeight: 44 }} onClick={() => setSelected(initial())}>{zh ? '回到例子' : 'Reset to'} {shaded}/{parts}</Button>
  </Card>;
  if (!code || !['shape-circle', 'shape-triangle', 'shape-square'].includes(code)) return null;
  const label = code === 'shape-circle' ? (zh ? '圆：没有角' : 'Circle: no corners')
    : code === 'shape-triangle' ? (zh ? '三角形：3 条直边，3 个角' : 'Triangle: 3 straight sides and 3 corners')
      : (zh ? '正方形：4 条等长直边，4 个直角' : 'Square: 4 equal straight sides and 4 right angles');
  return <Card size="small" style={{ borderRadius: 20, textAlign: 'center' }}>
    <svg role="img" aria-label={label} width="160" height="160" viewBox="0 0 160 160" fill={token.colorPrimaryBg} stroke={token.colorPrimary} strokeWidth="5">
      {code === 'shape-circle' ? <circle cx="80" cy="80" r="58" /> : code === 'shape-triangle'
        ? <polygon points="80,18 144,136 16,136" strokeLinejoin="round" /> : <rect x="24" y="24" width="112" height="112" />}
    </svg>
    <Typography.Paragraph>{label}</Typography.Paragraph>
  </Card>;
}

export function EducationStudyPreview({ items }: { items: EducationLearnerStudyItemDto[] }) {
  const { language, t } = useEducationText();
  const zh = language === 'zh-Hans';
  const { token } = theme.useToken();
  const [position, setPosition] = useState(0);
  const index = Math.min(position, Math.max(0, items.length - 1));
  const item = items[index];
  if (!item) return null;
  return <div style={{ maxWidth: 430, margin: '0 auto', minWidth: 0, overflowWrap: 'anywhere' }}>
    <Typography.Paragraph type="secondary">{zh ? '教学内容预览 · 不记录学习成绩' : 'Teaching content preview · No learning results are recorded'}</Typography.Paragraph>
    <Progress percent={Math.round((index + 1) / items.length * 100)} showInfo={false} />
    <p aria-live="polite">{index + 1} / {items.length}</p>
    <Tag style={{ marginBottom: 12 }}>{t(item.reviewStatus === 'TeacherReviewed' ? 'teacherReviewed' : 'unreviewed')}</Tag>
    <Flex vertical gap={16}>
      <Card style={{ borderRadius: 24, background: `linear-gradient(135deg, ${token.colorPrimaryBg}, ${token.colorBgContainer})`, borderBottom: `5px solid ${token.colorPrimaryBorder}` }}>
        <Typography.Title level={3} style={{ marginTop: 0, whiteSpace: 'pre-wrap' }}>{item.primary}</Typography.Title>
        {item.phonetic && <Typography.Paragraph>{item.phonetic}</Typography.Paragraph>}
      </Card>
      <Illustration key={`${item.id}:${item.illustrationCode}`} code={item.illustrationCode} zh={zh} />
      {item.secondary && <Card size="small" style={{ borderRadius: 20 }}><Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.secondary}</Typography.Paragraph></Card>}
      {item.extra && <Card size="small" style={{ borderRadius: 20 }}><Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.extra}</Typography.Paragraph></Card>}
      <Flex gap={12} style={{ paddingBlock: 8 }}>
        <Button style={{ flex: 1, minHeight: 44 }} disabled={index === 0} onClick={() => setPosition(index - 1)}>{zh ? '上一张' : 'Previous'}</Button>
        <Button type="primary" style={{ flex: 1, minHeight: 44 }} disabled={index === items.length - 1} onClick={() => setPosition(index + 1)}>{zh ? '下一张' : 'Next'}</Button>
      </Flex>
    </Flex>
  </div>;
}
