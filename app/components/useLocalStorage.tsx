import { useEffect, useState } from "react";

interface Metadata {
  [url: string]: {
    title: string;
    artist: string;
    picture?: string;
  };
}

export function useLocalStorage(key: string): Metadata | null {
  const [value, setValue] = useState(null);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.metadata && typeof parsed.metadata === "object") {
            setValue(parsed.metadata);
          }
        }
      } catch (e) {
        console.warn("Failed to parse metadata:", e);
      }
    };

    // گوش دادن به تغییرات از تبهای دیگر
    window.addEventListener('storage', handleStorageChange);

    // گوش دادن به تغییرات در همین تب
    const interval = setInterval(handleStorageChange, 500);

    // مقدار اولیه
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [key]);

  return value;
}