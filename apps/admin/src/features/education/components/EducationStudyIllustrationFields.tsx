import { Button, Form, Input, InputNumber, Select, Space, Typography } from 'antd';
import { useEducationText } from '../i18n/useEducationText';
import { parseStudyIllustration, type PatternSymbol } from '../utils/studyIllustrations';

/** Uses the existing mediaRef field; edits and imports share the same validated protocol. */
export function EducationStudyIllustrationFields() {
  const form = Form.useFormInstance();
  const value = Form.useWatch('mediaRef', form) as string | null | undefined;
  const configuration = parseStudyIllustration(value);
  const { language } = useEducationText();
  const zh = language === 'zh-Hans';
  const setCode = (code: string) => form.setFieldValue('mediaRef', `media:learning-${code}`);
  const symbolLabels = { red: zh ? '红色圆点' : 'Red dot', blue: zh ? '蓝色圆点' : 'Blue dot', circle: zh ? '圆形' : 'Circle', triangle: zh ? '三角形' : 'Triangle', square: zh ? '方形' : 'Square' };
  return <>
    <Form.Item name="mediaRef" hidden><Input /></Form.Item>
    <Form.Item label={zh ? '互动教学图示' : 'Interactive teaching diagram'}>
      <Select aria-label={zh ? '互动教学图示' : 'Interactive teaching diagram'} value={configuration?.kind ?? (value ? 'media' : 'none')} onChange={kind => {
        if (kind === 'none') form.setFieldValue('mediaRef', null);
        if (kind === 'fraction') setCode('fraction-1-2');
        if (kind === 'shape') setCode('shape-circle');
        if (kind === 'pattern') setCode('pattern-red-blue');
      }} options={[{value:'none',label:zh?'无图示':'No diagram'},{value:'fraction',label:zh?'分数涂色':'Fraction shading'},{value:'shape',label:zh?'图形与角':'Shapes and corners'},{value:'pattern',label:zh?'重复规律':'Repeating pattern'}, ...(value && !configuration ? [{value:'media',label:zh?'其他媒体引用（不会公开显示）':'Other media reference (not publicly displayed)'}] : [])]} />
    </Form.Item>
    {configuration?.kind === 'fraction' ? <Space wrap align="start">
      <Form.Item label={zh?'等份数':'Equal parts'}><InputNumber aria-label={zh?'等份数':'Equal parts'} min={2} max={12} precision={0} value={configuration.parts} onChange={parts=>{if(parts!==null)setCode(`fraction-${Math.min(configuration.shaded,parts)}-${parts}`);}} /></Form.Item>
      <Form.Item label={zh?'初始涂色份数':'Initially shaded parts'}><InputNumber aria-label={zh?'初始涂色份数':'Initially shaded parts'} min={0} max={configuration.parts} precision={0} value={configuration.shaded} onChange={shaded=>{if(shaded!==null)setCode(`fraction-${shaded}-${configuration.parts}`);}} /></Form.Item>
    </Space> : null}
    {configuration?.kind === 'shape' ? <Space wrap align="start">
      <Form.Item label={zh?'图形':'Shape'}><Select aria-label={zh?'图形':'Shape'} style={{minWidth:180}} value={configuration.shape} onChange={shape=>setCode(shape==='polygon'?'shape-polygon-5':`shape-${shape}`)} options={[{value:'circle',label:zh?'圆':'Circle'},{value:'triangle',label:zh?'三角形':'Triangle'},{value:'square',label:zh?'正方形':'Square'},{value:'polygon',label:zh?'规则多边形':'Regular polygon'}]} /></Form.Item>
      {configuration.shape==='polygon'?<Form.Item label={zh?'边数':'Sides'}><InputNumber aria-label={zh?'边数':'Sides'} min={3} max={8} precision={0} value={configuration.sides} onChange={sides=>{if(sides!==null)setCode(`shape-polygon-${sides}`);}} /></Form.Item>:null}
    </Space> : null}
    {configuration?.kind === 'pattern' ? <Form.Item label={zh?'一组中的顺序（可重复选择）':'Sequence within one group (repeats allowed)'}>
      <Space direction="vertical" style={{width:'100%'}}>{configuration.symbols.map((symbol,index)=><Space key={index}>
        <Typography.Text>{index+1}.</Typography.Text><Select aria-label={`${zh?'符号':'Symbol'} ${index+1}`} style={{minWidth:150}} value={symbol} onChange={(next:PatternSymbol)=>setCode(`pattern-${configuration.symbols.map((old,i)=>i===index?next:old).join('-')}`)} options={Object.entries(symbolLabels).map(([value,label])=>({value,label}))} />
        <Button disabled={configuration.symbols.length<=2} onClick={()=>setCode(`pattern-${configuration.symbols.filter((_,i)=>i!==index).join('-')}`)}>{zh?'删除':'Remove'}</Button>
      </Space>)}</Space>
      <Button style={{marginTop:8}} disabled={configuration.symbols.length>=8} onClick={()=>setCode(`pattern-${[...configuration.symbols,'red'].join('-')}`)}>{zh?'添加符号':'Add symbol'}</Button>
    </Form.Item> : null}
    <Typography.Paragraph type="secondary">{zh?'图示的标题、解释和补充内容使用上方学习资料字段；已发布内容需先撤回，修改后再发布。':'Diagram titles, explanations and extra content come from the study fields above. Withdraw published content before editing, then republish it for learners.'}</Typography.Paragraph>
  </>;
}
