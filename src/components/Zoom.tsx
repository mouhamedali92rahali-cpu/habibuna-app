import { useEffect, useRef, useState } from 'react';
import type { ZoomReq } from '../lib/art';

/**
 * الصورة على الشاشة كلها: تكبير بإصبعين أو بلمستين أو بزرّي + و−، والسحب للتنقّل فيها.
 * تُغلق بزرّ ✕ أو بزرّ الرجوع في الهاتف (backRef في App).
 */
export function Zoom({ z, onClose }: { z: ZoomReq; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const box = useRef<HTMLDivElement>(null);
  const pinch = useRef<{ d: number; s: number } | null>(null);
  const lastTap = useRef(0);
  const clamp = (v: number) => Math.min(5, Math.max(1, v));

  useEffect(() => {
    const el = box.current; if (!el) return;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const start = (e: TouchEvent) => {
      if (e.touches.length === 2) { pinch.current = { d: dist(e.touches), s: scaleRef.current }; e.preventDefault(); }
      else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTap.current < 300) { setScale((s) => (s > 1 ? 1 : 2.5)); e.preventDefault(); }
        lastTap.current = now;
      }
    };
    const move = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinch.current) { e.preventDefault(); setScale(clamp(pinch.current.s * dist(e.touches) / pinch.current.d)); }
    };
    const end = () => { pinch.current = null; };
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    return () => { el.removeEventListener('touchstart', start); el.removeEventListener('touchmove', move); el.removeEventListener('touchend', end); };
  }, []);
  const scaleRef = useRef(scale); scaleRef.current = scale;

  return (
    <div className="zoom" role="dialog" aria-label="الصورة مكبّرة">
      <div className="zbox" ref={box}>
        <img src={z.src} alt={z.caption} style={{ width: `${scale * 100}%` }}
          onError={(e) => { const i = e.currentTarget; if (!i.src.endsWith(z.fallback)) i.src = z.fallback; }} />
      </div>
      {/* السطر والأزرار في الأسفل (طلب المستخدم: في الأعلى كان شريط الهاتف يغطّيها) */}
      <div className="zbar">
        {z.caption && <p className="zcap">{z.caption}</p>}
        <div className="zrow">
          <button className="zclose" onClick={onClose}>✕ إغلاق</button>
          <span className="zhint">كبّرها بإصبعين، أو المسها مرتين</span>
          <div className="zbtns">
            <button onClick={() => setScale((s) => clamp(s - .75))} aria-label="تصغير" disabled={scale <= 1}>−</button>
            <button onClick={() => setScale((s) => clamp(s + .75))} aria-label="تكبير" disabled={scale >= 5}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
}
