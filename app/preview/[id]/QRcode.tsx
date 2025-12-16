'use client';

import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';
import { Button } from '@/components/ui/button';

export function QRCode({ url }: { url: string }) {
  const [qrCode, setQrCode] = useState<string>('');

  useEffect(() => {
    // Generate QR code
    QRCodeLib.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#4F46E5', // Indigo to match brand
        light: '#FFFFFF',
      },
    }).then(setQrCode);
  }, [url]);

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = 'intake-qr-code.png';
    link.click();
  };

  if (!qrCode) return <div className="animate-pulse bg-slate-200 w-[300px] h-[300px] rounded-lg" />;

  return (
    <div className="flex flex-col items-center gap-4">
      <img src={qrCode} alt="QR Code" className="border-4 border-slate-200 rounded-lg" />
      <Button onClick={downloadQR} variant="outline" className="w-full">
        📥 Download QR Code
      </Button>
      <p className="text-xs text-slate-500 text-center">
        Print this and add it to flyers, business cards, or your truck!
      </p>
    </div>
  );
}