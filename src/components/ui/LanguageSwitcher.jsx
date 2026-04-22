import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="flex-row items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10 w-full"
      title={t('nav.language')}
    >
       <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 flex items-center justify-center bg-black/20">
          <span className="text-[10px] font-black text-white uppercase">
             {i18n.language === 'en' ? 'EN' : 'ID'}
          </span>
       </div>
       <div className="flex-1 text-left">
          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">
             {t('nav.language')}
          </p>
          <p className="text-[10px] font-bold text-white mt-1">
             {i18n.language === 'en' ? 'English (US)' : 'Bahasa Indonesia'}
          </p>
       </div>
       <span className="material-symbols-outlined text-white/40 text-sm">
          swap_horiz
       </span>
    </button>
  );
}
