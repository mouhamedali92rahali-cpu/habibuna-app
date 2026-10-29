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
        try {
            PopupScheduler.show(ctx, intent.getStringExtra(CardPopupActivity.EXTRA_JSON), intent.getStringExtra(CardPopupActivity.EXTRA_CARD_ID));
        } catch (Exception ignored) {
            // إن منع النظام فتح النافذة من الخلفية يبقى الإشعار العادي
        }
    }
}
