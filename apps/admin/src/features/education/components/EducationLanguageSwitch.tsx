import { Select } from 'antd';
import { useEducationText } from '../i18n/useEducationText';

export function EducationLanguageSwitch() {
  const { language, setLanguage, t } = useEducationText();
  return <Select className="education-language-select" aria-label={t('language')} size="small" value={language} onChange={setLanguage} style={{ width: 130 }} options={[
    { value: 'zh-Hans', label: t('zhHans') }, { value: 'en', label: t('english') },
  ]} />;
}
