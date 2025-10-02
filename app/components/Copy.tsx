import { useState } from 'react';

const Copy = (text: string) => {
  const [coppied, setCoppied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCoppied(true);
      setTimeout(() => setCoppied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCoppied(true);
      setTimeout(() => setCoppied(false), 2000);
    }
  };

  return (
    <div
      onClick={copyLink}
      className={`${
        coppied 
          ? 'text-green-500 font-semibold' 
          : 'text-red-400 focus:bg-gray-700 focus:text-red-200'
      }`}
    >
      {coppied ? 'coppied' : 'copy link'}
    </div>
  );
};

export default Copy;