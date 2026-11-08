import { useState } from 'react';
import { Button, Card, Flex, Typography, theme } from 'antd';

export const studyPatterns = {
  'pattern-red-blue': ['red', 'blue'],
  'pattern-red-red-blue': ['red', 'red', 'blue'],
  'pattern-circle-triangle': ['circle', 'triangle'],
} as const;

export function EducationPatternPreview({ code, zh }: { code: keyof typeof studyPatterns; zh: boolean }) {
  const { token } = theme.useToken();
  const [groups, setGroups] = useState(2);
  const pattern = studyPatterns[code];
  const labels = { red: zh ? '红' : 'Red', blue: zh ? '蓝' : 'Blue', circle: zh ? '圆' : 'Circle', triangle: zh ? '三角形' : 'Triangle' };
  return <Card size="small" style={{ borderRadius: 20, background: token.colorPrimaryBg }}>
    <Typography.Title level={5}>{zh ? '找到重复的一组' : 'Find the repeating group'}</Typography.Title>
    <Typography.Paragraph>{zh ? '每个框里都是同样的一组，顺序也一样。' : 'Each box repeats the same group, in the same order.'}</Typography.Paragraph>
    <Flex vertical gap={10}>
      {Array.from({ length: groups }, (_, group) => <div key={group} style={{ border: `2px solid ${token.colorPrimary}`, borderRadius: 18, padding: 12, background: token.colorBgContainer }}>
        <Typography.Text type="secondary">{zh ? `第 ${group + 1} 组` : `Group ${group + 1}`}</Typography.Text>
        <Flex wrap gap={10} style={{ marginTop: 8 }}>
          {pattern.map((symbol, index) => <div key={index} style={{ flex: '1 1 48px', textAlign: 'center' }}>
            <div aria-hidden style={{ fontSize: 30, color: symbol === 'red' ? token.colorError : symbol === 'blue' ? token.colorInfo : token.colorPrimary }}>{symbol === 'triangle' ? '▲' : '●'}</div>
            <Typography.Text>{labels[symbol]}</Typography.Text>
          </div>)}
        </Flex>
      </div>)}
    </Flex>
    <Typography.Paragraph aria-live="polite" style={{ marginTop: 12 }}>{zh ? `“${pattern.map(symbol => labels[symbol]).join('、')}”重复了 ${groups} 次。` : `${pattern.map(symbol => labels[symbol]).join(' → ')} repeats ${groups} times.`}</Typography.Paragraph>
    <Button block style={{ minHeight: 44, whiteSpace: 'normal', height: 'auto' }} onClick={() => setGroups(current => current < 4 ? current + 1 : 2)}>
      {groups < 4 ? (zh ? '＋ 再接一组' : '+ Add the next group') : (zh ? '重新探索' : 'Explore again')}
    </Button>
  </Card>;
}
