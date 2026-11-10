package tn.habibuna.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;

/**
 * لمس «ﷺ» في أداة الشاشة الرئيسية (تجربة 2026-11-10، طلب المستخدم): نافذة شفافة تمامًا تُفتح جزءًا من الثانية،
 * لأن أندرويد لا يسمح بالاهتزاز إلا للتطبيق الذي في المقدّمة؛ تسجّل الصلاة وتهتزّ وتشغّل التوهّج ثم تُغلق بلا حركة.
 */
public class PrayTapActivity extends Activity {
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        CardWidget.recordPray(this);
        try {
            android.os.Vibrator v = (android.os.Vibrator) getSystemService(VIBRATOR_SERVICE);
            if (Build.VERSION.SDK_INT >= 29) v.vibrate(android.os.VibrationEffect.createPredefined(android.os.VibrationEffect.EFFECT_HEAVY_CLICK));
            else if (Build.VERSION.SDK_INT >= 26) v.vibrate(android.os.VibrationEffect.createOneShot(40, 255));
            else v.vibrate(40);
        } catch (Exception ignored) { }
        sendBroadcast(new Intent(this, CardWidget.class).setAction(CardWidget.GLOW));
        finish();
        overridePendingTransition(0, 0);
    }
}
