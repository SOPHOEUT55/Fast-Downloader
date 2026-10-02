import React, { useState, useEffect } from 'react';
import { X, Sliders, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface UserPreferences {
  defaultQuality: '2160p' | '1080p' | '720p' | '480p';
  defaultFormat: 'video' | 'audio';
  autoRemoveWatermark: boolean;
  audioBitrate: '320' | '256' | '192';
}

const SETTINGS_KEY = 'omnisave_user_settings_v1';

export function loadSettings(): UserPreferences {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    defaultQuality: '1080p',
    defaultFormat: 'video',
    autoRemoveWatermark: true,
    audioBitrate: '320'
  };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<UserPreferences>(loadSettings());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(loadSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-indigo-400 mb-1">
          <Sliders className="h-5 w-5" />
          <h3 className="text-base font-bold text-white">Downloader Preferences</h3>
        </div>
        <p className="text-xs text-slate-400">
          Configure default resolutions, audio bitrates, and extraction policies.
        </p>

        <div className="mt-5 space-y-4">
          {/* Quality Default */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Preferred Video Quality
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: '2160p', label: '4K Ultra HD' },
                { id: '1080p', label: '1080p Full HD' },
                { id: '720p', label: '720p HD' },
                { id: '480p', label: '480p Data Saver' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSettings(s => ({ ...s, defaultQuality: opt.id as any }))}
                  className={`rounded-lg border p-2 text-xs font-medium text-left transition-colors ${
                    settings.defaultQuality === opt.id
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Bitrate */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              MP3 Audio Extraction Bitrate
            </label>
            <div className="flex gap-2">
              {[
                { id: '320', label: '320 kbps (HQ Studio)' },
                { id: '256', label: '256 kbps' },
                { id: '192', label: '192 kbps' }
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSettings(s => ({ ...s, audioBitrate: b.id as any }))}
                  className={`flex-1 rounded-lg border py-2 text-center text-xs font-medium transition-colors ${
                    settings.audioBitrate === b.id
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Watermark default */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={settings.autoRemoveWatermark}
                onChange={(e) => setSettings(s => ({ ...s, autoRemoveWatermark: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
              />
              <span>Automatically bypass watermarks by default (TikTok / Reels)</span>
            </label>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow"
          >
            {saved ? <Check className="h-4 w-4" /> : null}
            <span>{saved ? 'Saved' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
