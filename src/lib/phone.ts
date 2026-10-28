import { registerPlugin } from '@capacitor/core';
import { isNative } from './notify';

interface PhoneSettingsPlugin {
  info(): Promise<{ manufacturer: string; brand: string }>;
  openAppSettings(): Promise<void>;
  openAutostart(): Promise<{ opened?: string }>;
}
export const PhoneSettings = registerPlugin<PhoneSettingsPlugin>('PhoneSettings');

/** هواتف تُوقف التطبيقات المغلقة فتمسح إشعاراتها المجدولة، ما لم يُسمح لها بالتشغيل التلقائي */
const STRICT = ['xiaomi', 'redmi', 'poco', 'huawei', 'honor', 'oppo', 'realme', 'oneplus', 'vivo', 'iqoo', 'tecno', 'infinix'];

export type Maker = 'xiaomi' | 'other-strict' | 'normal';
export async function phoneMaker(): Promise<Maker> {
  if (!isNative) return 'normal';
  try {
    const { manufacturer, brand } = await PhoneSettings.info();
    const m = `${manufacturer} ${brand}`.toLowerCase();
    if (/xiaomi|redmi|poco/.test(m)) return 'xiaomi';
    return STRICT.some((k) => m.includes(k)) ? 'other-strict' : 'normal';
  } catch {
    return 'normal';
  }
}
