package tn.habibuna.app;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

/**
 * لمس «ﷺ» في أداة الشاشة الرئيسية (تجربة 2026-11-10، طلب المستخدم): نافذة شفافة تمامًا تُفتح لحظة،
 * لأن أندرويد لا يسمح بالاهتزاز إلا للتطبيق الذي في المقدّمة. تسجّل الصلاة وتُظهر التوهّج وتهتزّ،
 * وتبقى 180ms قبل أن تُغلق (أندرويد يقطع اهتزاز التطبيق حين يرجع إلى الخلفية؛ كان يهتزّ مرة من كل خمس).
 */
public class PrayTapActivity extends Activity {
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        final android.content.Context app = getApplicationContext();
        CardWidget.recordPray(app);
        CardWidget.updateAll(app, true);
        Handler h = new Handler(Looper.getMainLooper());
        h.postDelayed(() -> CardWidget.updateAll(app, false), 900);
        h.postDelayed(() -> { finish(); overridePendingTransition(0, 0); }, 180);
    }

    @Override
    protected void onResume() {
        super.onResume();
        try {
            android.os.Vibrator v = (android.os.Vibrator) getSystemService(VIBRATOR_SERVICE);
            if (Build.VERSION.SDK_INT >= 26) v.vibrate(android.os.VibrationEffect.createOneShot(45, 255));
            else v.vibrate(45);
        } catch (Exception ignored) { }
    }
}
