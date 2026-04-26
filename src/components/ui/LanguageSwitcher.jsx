import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ compact = false }) {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(nextLang);
  };

  if (compact) {
    return (
      <button 
        onClick={toggleLanguage}
        className="flex-row items-center gap-2 p-2 hover:bg-on-surface/10 rounded-xl transition-all border border-transparent hover:border-on-surface/5"
        title={t('nav.language')}
      >
        <span className="material-symbols-outlined text-on-surface-variant text-lg">translate</span>
        <span className="text-[10px] font-bold text-on-surface uppercase">{i18n.language === 'en' ? 'EN' : 'ID'}</span>
      </button>
    );
  }

  return (
    <button 
      onClick={toggleLanguage}
      className="flex-row items-center gap-3 px-4 py-3 bg-on-surface/5 hover:bg-on-surface/10 rounded-2xl transition-all border border-on-surface/10 w-full"
      title={t('nav.language')}
    >
       <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 flex-row items-center justify-center bg-black/20">
          <span className="text-[10px] font-black text-white uppercase">
             {i18n.language === 'en' ? 'EN' : 'ID'}
          </span>
       </div>
       <div className="flex-1 text-left">
          <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest leading-none">
             {t('nav.language')}
          </p>
          <p className="text-[10px] font-bold text-on-surface mt-1">
             {i18n.language === 'en' ? 'English' : 'Indonesia'}
          </p>
       </div>
       <span className="material-symbols-outlined text-on-surface-variant text-sm">
          swap_horiz
       </span>
    </button>
  );
}
