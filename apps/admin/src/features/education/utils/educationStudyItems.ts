import type { EducationStudyItemAuthorDto, EducationStudyItemRequest } from '../../../types/educationAuthoring';
import type { EducationMessageKey } from '../i18n/educationMessages';

export function unicodeCodePointLength(value: string) { return [...value].length; }
export function validateStudyItem(input: EducationStudyItemRequest) {
  const errors: Partial<Record<'primary' | 'secondary' | 'phonetic' | 'extra' | 'hint', string>> = {};
  const limits = { primary: 500, secondary: 500, phonetic: 200, extra: 300, hint: 200 } as const;
  for (const [field, max] of Object.entries(limits) as [keyof typeof limits, number][]) {
    const value = input[field] ?? '';
    if (unicodeCodePointLength(value) > max) errors[field] = `${field}:${max}`;
  }
  if (!input.primary.trim()) errors.primary = 'primary:required';
  if (!Number.isInteger(input.position) || input.position < 1) errors.primary = 'position:invalid';
  return errors;
}
export function moveStudyItem<T extends Pick<EducationStudyItemAuthorDto, 'id'>>(items: readonly T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= items.length) return [...items];
  const next = [...items]; [next[index], next[target]] = [next[target], next[index]];
  return next;
}

const englishHeaders = ['key', 'kind', 'primary', 'secondary', 'phonetic', 'extra', 'hint', 'position', 'language'];
const chineseHeaders = ['key', '类型', '内容', '释义', '拼音', '作者提示', '记忆提示', '顺序', '语言'];
const chineseHeaderMap = new Map(chineseHeaders.map((header, index) => [header, englishHeaders[index]]));
export interface ParsedCsv { canonicalCsv: string; headers: string[] }

export function parseCsvText(text: string): ParsedCsv {
  const normalized = text.replace(/^\uFEFF/, '');
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quote = false;
  for (let index = 0; index < normalized.length; index++) {
    const char = normalized[index];
    if (quote) {
      if (char === '"' && normalized[index + 1] === '"') { cell += '"'; index++; }
      else if (char === '"') quote = false;
      else cell += char;
    } else if (char === '"' && cell.length === 0) quote = true;
    else if (char === ',') { row.push(cell.trim()); cell = ''; }
    else if (char === '\n' || char === '\r') {
      row.push(cell.trim()); cell = '';
      if (row.some(value => value.length)) rows.push(row);
      row = [];
      if (char === '\r' && normalized[index + 1] === '\n') index++;
    } else cell += char;
  }
  if (quote) throw new Error('csv:unclosedQuote');
  if (cell.length || row.length) { row.push(cell.trim()); rows.push(row); }
  if (!rows.length) throw new Error('csv:empty');
  let headers = rows[0].map(value => chineseHeaderMap.get(value) ?? value.toLowerCase());
  if (headers[0] === 'key' && headers[1] === 'kind') headers = [...headers];
  const required = ['kind', 'primary', 'secondary', 'phonetic', 'extra', 'hint', 'position', 'language'];
  if (required.some(name => !headers.includes(name))) throw new Error('csv:headers');
  const canonicalCsv = [englishHeaders.join(','), ...rows.slice(1).map(values => englishHeaders.map(name => {
    const value = values[headers.indexOf(name)] ?? '';
    return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
  }).join(','))].join('\r\n');
  return { canonicalCsv, headers };
}

export function csvTemplate(chinese: boolean) {
  const headers = chinese ? chineseHeaders : englishHeaders;
  const row = ['spring', 'LanguageItem', '春天', '一年的第一个季节', 'chūntiān', '', '', '1', 'zh-Hans'];
  return `${headers.join(',')}\r\n${row.map(value => /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value).join(',')}\r\n`;
}

export const importReasonTranslations: Record<string, EducationMessageKey> = {
  InvalidEncoding: 'nonUtf8', FileTooLarge: 'fileTooLarge', TooManyRows: 'tooManyRows', ItemsRequired: 'itemsRequired',
  RequiredField: 'requiredField', DuplicateValue: 'duplicateValue', DuplicateStableKey: 'duplicateKey', PublishedItemConflict: 'publishedConflict',
  InvalidPosition: 'invalidPosition', InvalidKind: 'invalidKind', InvalidLanguage: 'invalidLanguage', InvalidGradeCode: 'invalidGradeCode',
  InvalidMediaRef: 'mediaRef', InvalidCharacters: 'overLimit', FieldTooLong: 'overLimit', InvalidCsv: 'invalidCsv',
  InvalidRow: 'row', ItemsLimitExceeded: 'itemsLimit', InvalidField: 'field',
};
