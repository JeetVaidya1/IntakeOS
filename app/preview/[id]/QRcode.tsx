'use client';

import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function QRCode({ url }: { url: string }) {
  const [qrCode, setQrCode] = useState<string>('');

  useEffect(() => {
    QRCodeLib.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#4F46E5',
        light: '#FFFFFF',
      },
    }).then(setQrCode);
  }, [url]);

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = 'intake-qr-code.png';
    link.click();
    toast.success('QR code downloaded!');
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code</title>
            <style>
              body { 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh;
                margin: 0;
                flex-direction: column;
                font-family: system-ui;
              }
              img { 
                width: 400px; 
                height: 400px;
                border: 8px solid #4F46E5;
                border-radius: 12px;
              }
              h1 { 
                font-size: 32px;
                margin-top: 24px;
                color: #1e293b;
              }
              p {
                font-size: 18px;
                color: #64748b;
                max-width: 400px;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <img src="${qrCode}" alt="QR Code" />
            <h1>Scan to Get Started</h1>
            <p>${url}</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        toast.success('Print dialog opened!');
      }, 250);
    }
  };

  if (!qrCode) return <div className="animate-pulse bg-slate-200 w-[300px] h-[300px] rounded-lg" />;

  return (
    <div className="flex flex-col items-center gap-4">
      <img src={qrCode} alt="QR Code" className="border-4 border-slate-200 rounded-lg" />
      <div className="flex gap-2 w-full">
        <Button onClick={downloadQR} variant="outline" className="flex-1">
          📥 Download
        </Button>
        <Button onClick={printQR} variant="outline" className="flex-1">
          🖨️ Print
        </Button>
      </div>
      <p className="text-xs text-slate-500 text-center">
        Print this and add it to flyers, business cards, or your truck!
      </p>
    </div>
  );
}