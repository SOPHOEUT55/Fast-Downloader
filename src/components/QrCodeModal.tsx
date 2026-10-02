import React, { useState } from 'react';
import { X, Smartphone, Copy, Check, ExternalLink } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  downloadUrl: string;
  title: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  downloadUrl,
  title
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate simple high-contrast SVG QR-like matrix or clean visual QR placeholder
  // We can use an encoded QR service or SVG vector rendering
  const fullTargetUrl = downloadUrl.startsWith('http')
    ? downloadUrl
    : window.location.origin + downloadUrl;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(fullTargetUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullTargetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 mb-3">
          <Smartphone className="h-6 w-6" />
        </div>

        <h3 className="text-base font-bold text-white">Scan to Download on Phone</h3>
        <p className="mt-1 text-xs text-slate-400">
          Point your phone camera at the QR code below to save the video directly to your Camera Roll / Files app.
        </p>

        {/* QR Code Container with white padding for contrast */}
        <div className="mt-5 mx-auto w-52 h-52 bg-white rounded-xl p-3 shadow-inner flex items-center justify-center">
          <img
            src={qrImageUrl}
            alt="Download QR Code"
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback to SVG if offline
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <div className="mt-5 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={fullTargetUrl}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400 font-mono truncate"
          />
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shrink-0"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <p className="mt-3 text-[11px] text-slate-500">
          Compatible with Safari (iOS 13+) and Chrome for Android.
        </p>
      </div>
    </div>
  );
};
