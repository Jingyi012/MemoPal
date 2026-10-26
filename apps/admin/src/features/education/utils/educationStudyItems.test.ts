import { describe, expect, it } from 'vitest';
import { educationMessages } from '../i18n/educationMessages';
import { csvTemplate, importReasonTranslations, moveStudyItem, parseCsvText, unicodeCodePointLength, validateStudyItem } from './educationStudyItems';
import type { EducationStudyItemAuthorDto, EducationStudyItemRequest } from '../../../types/educationAuthoring';

const item = (id: string): EducationStudyItemAuthorDto => ({ id, objectiveId: 'o', stableKey: id, position: 1, kind: 'OrderedList', primary: id,
  secondary: null, phonetic: null, extra: null, hint: null, mediaRef: null, languageCode: 'zh-Hans', status: 'Draft', contentVersion: 1,
  notConfidentialExamContentConfirmedByUserId: null, notConfidentialExamContentConfirmedAtUtc: null, createdAtUtc: '', updatedAtUtc: '' });

describe('education study item helpers', () => {
  it('counts Unicode code points and validates the same field limits as the API', () => {
    expect(unicodeCodePointLength('生僻字𠀀')).toBe(4);
    const valid: EducationStudyItemRequest = { position: 1, kind: 'LanguageItem', primary: '𠀀'.repeat(500) };
    expect(validateStudyItem(valid)).toEqual({});
    expect(validateStudyItem({ ...valid, primary: `${valid.primary}𠀀` }).primary).toBe('primary:500');
    expect(validateStudyItem({ ...valid, primary: '' }).primary).toBe('primary:required');
  });

  it('parses BOM, multilingual CSV headers, quotes, commas, and multiline fields into canonical import CSV', () => {
    const source = '\uFEFFkey,类型,内容,释义,拼音,作者提示,记忆提示,顺序,语言\r\nspring,LanguageItem,"春天，来了","一年中的第一季","chūntiān","示例，原创","""想象""春天",1,zh-Hans\r\n';
    const parsed = parseCsvText(source);
    expect(parsed.headers[2]).toBe('primary');
    expect(parsed.canonicalCsv).toContain('春天，来了');
    expect(parsed.canonicalCsv).toContain('"""想象""春天"');
    expect(parseCsvText('kind,primary,secondary,phonetic,extra,hint,position,language\nLanguageItem,"春天\n来了",,chūntiān,,,1,zh-Hans').canonicalCsv).toContain('春天\n来了');
    expect(() => parseCsvText('not,a,template\n')).toThrow('csv:headers');
  });

  it('moves rows in stable order and generates original bilingual CSV templates', () => {
    expect(moveStudyItem([item('a'), item('b'), item('c')], 1, -1).map(row => row.id)).toEqual(['b', 'a', 'c']);
    expect(moveStudyItem([item('a')], 0, -1).map(row => row.id)).toEqual(['a']);
    expect(csvTemplate(true)).toContain('key,类型,内容,释义');
    expect(csvTemplate(false)).toContain('key,kind,primary,secondary');
    expect(csvTemplate(true)).toContain('春天');
  });

  it('provides a translation key for every dry-run error reason in both supported locales', () => {
    const apiReasonCodes = ['InvalidEncoding', 'FileTooLarge', 'TooManyRows', 'ItemsRequired', 'ItemsLimitExceeded', 'RequiredField',
      'DuplicateValue', 'DuplicateStableKey', 'PublishedItemConflict', 'InvalidPosition', 'InvalidKind', 'InvalidLanguage',
      'InvalidGradeCode', 'InvalidMediaRef', 'InvalidCharacters', 'FieldTooLong', 'InvalidCsv', 'InvalidRow', 'InvalidField'];
    const zh = Object.keys(educationMessages['zh-Hans']).sort();
    const en = Object.keys(educationMessages.en).sort();
    expect(zh).toEqual(en);
    expect(Object.keys(importReasonTranslations).sort()).toEqual(apiReasonCodes.sort());
    for (const key of Object.values(importReasonTranslations)) {
      expect(educationMessages.en[key]).toBeTruthy();
      expect(educationMessages['zh-Hans'][key]).toBeTruthy();
    }
  });
});
