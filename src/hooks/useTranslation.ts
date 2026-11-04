import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { translateText } from '../utils/translation';

export function useTranslation(text: string): string {
  const { language } = useApp();
  const [translated, setTranslated] = useState<string>(text);

  useEffect(() => {
    let isMounted = true;
    if (language === 'en') {
      setTranslated(text);
      return;
    }
    translateText(text, language).then(res => {
      if (isMounted) setTranslated(res);
    });
    return () => {
      isMounted = false;
    };
  }, [text, language]);

  return translated;
}
