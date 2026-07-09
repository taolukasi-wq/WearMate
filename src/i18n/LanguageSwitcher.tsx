import React from 'react';
import { useTranslation } from './useTranslation';
import { Language } from './types';

interface LanguageSwitcherProps {
  variant?: 'button' | 'select';
}

export default function LanguageSwitcher({ variant = 'button' }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'zh-CN' ? 'en' : 'zh-CN');
  };

  if (variant === 'select') {
    return (
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="px-3 py-1.5 bg-white border border-outline-variant rounded-lg text-sm font-medium text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
      >
        <option value="zh-CN">{t('languageChinese')}</option>
        <option value="en">{t('languageEnglish')}</option>
      </select>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all cursor-pointer"
      title={language === 'zh-CN' ? `Switch to ${t('languageEnglish')}` : `切换到${t('languageChinese')}`}
    >
      <span className="material-symbols-outlined text-lg">translate</span>
    </button>
  );
}
