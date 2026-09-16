import { useState, useEffect } from 'react';
import { storage, ShopSettings } from './storage.js';

export const SETTINGS_UPDATED_EVENT = 'shop-settings-updated';

export function useShopSettings() {
  const [settings, setSettings] = useState<ShopSettings>(() => storage.getSettings());

  useEffect(() => {
    const handler = () => setSettings(storage.getSettings());
    window.addEventListener(SETTINGS_UPDATED_EVENT, handler);
    return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, handler);
  }, []);

  const saveSettings = (s: ShopSettings) => {
    storage.saveSettings(s);
    setSettings(s);
    window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
  };

  return { settings, saveSettings };
}
