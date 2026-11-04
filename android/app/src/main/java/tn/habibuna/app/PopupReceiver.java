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
        // المستخدم في مكالمة (هاتفية أو واتساب/فيديو) أو الهاتف يرنّ أو يشغّل فيديو/صوتًا: نؤجّل النافذة 10 دقائق، ثلاث مرات على الأكثر
        // (الإشعار العادي مجدول وحده في LocalNotifications، فلا يتأثّر بشيء من هذا)
        if (PopupScheduler.inCall(ctx) || PopupScheduler.mediaPlaying(ctx)) {
            PopupScheduler.retryLater(ctx, intent);
            return;
        }
        // وضع «عدم الإزعاج» أو «النوم»: لا نافذة، ويبقى الإشعار العادي بحسب إعدادات الهاتف
        if (PopupScheduler.doNotDisturb(ctx)) return;
        // «حين تفتح هاتفك»: لا تقاطع من يستعمل هاتفه؛ نعيد المحاولة كل 10 دقائق (حتى 3 ساعات) إلى أن تكون الشاشة مطفأة أو مقفلة،
        // فتُفتح النافذة فيجدها صاحب الهاتف أول ما يفتحه
        if ("unlock".equals(PopupScheduler.mode(ctx)) && PopupScheduler.userActive(ctx)) {
            PopupScheduler.retryLater(ctx, intent, 18);
            return;
        }
        try {
            PopupScheduler.present(ctx, intent.getStringExtra(CardPopupActivity.EXTRA_JSON), intent.getStringExtra(CardPopupActivity.EXTRA_CARD_ID));
        } catch (Exception ignored) {
            // إن منع النظام فتح النافذة من الخلفية يبقى الإشعار العادي
        }
    }
}
