package tn.habibuna.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** يصل في موعد البطاقة فيفتح نافذتها؛ وبعد إعادة تشغيل الهاتف يعيد جدولة المواعيد المحفوظة */
public class PopupReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            PopupScheduler.restore(ctx);
            return;
        }
        // النافذة الكاملة: المستخدم في مكالمة (هاتفية أو واتساب/فيديو) أو الهاتف يرنّ أو يشغّل فيديو/صوتًا ← نؤجّلها 10 دقائق، ثلاث مرات على الأكثر.
        // الفقاعة (قرار المستخدم 2026-11-04): تظهر في وقتها حتى أثناء الفيديو والمكالمة، لأنها صغيرة تُزاح بسهولة، والتأجيل قد يطول مع فيديو
        // أو مكالمة طويلة؛ ولا تُؤجَّل إلا والهاتف يرنّ، حتى لا تقع على زرّ الردّ.
        // (الإشعار العادي مجدول وحده في LocalNotifications، فلا يتأثّر بشيء من هذا)
        boolean bubble = "bubble".equals(PopupScheduler.mode(ctx));
        if (bubble ? PopupScheduler.ringing(ctx) : (PopupScheduler.inCall(ctx) || PopupScheduler.mediaPlaying(ctx))) {
            PopupScheduler.retryLater(ctx, intent);
            return;
        }
        // وضع «عدم الإزعاج» أو «النوم»: لا نافذة، ويبقى الإشعار العادي بحسب إعدادات الهاتف
        if (PopupScheduler.doNotDisturb(ctx)) return;
        try {
            PopupScheduler.present(ctx, intent.getStringExtra(CardPopupActivity.EXTRA_JSON), intent.getStringExtra(CardPopupActivity.EXTRA_CARD_ID));
        } catch (Exception ignored) {
            // إن منع النظام فتح النافذة من الخلفية يبقى الإشعار العادي
        }
    }
}
