package tn.habibuna.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * مواعيد نوافذ البطاقات (منبّهات AlarmManager مستقلة عن الإشعارات).
 * تُحفظ القائمة لتُعاد جدولتها بعد إعادة تشغيل الهاتف (PopupReceiver).
 */
public final class PopupScheduler {
    public static final String PREFS = "habibuna_popup";
    private static final int BASE = 5000;

    private PopupScheduler() {}

    /** items: [{id, at, json, cardId}] — تُلغى المواعيد السابقة كلها ثم تُجدول هذه */
    public static void scheduleAll(Context ctx, JSONArray items) {
        cancelAll(ctx);
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        boolean exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms();
        long now = System.currentTimeMillis();
        JSONArray kept = new JSONArray();
        for (int k = 0; k < items.length(); k++) {
            JSONObject it = items.optJSONObject(k);
            if (it == null || it.optLong("at") <= now) continue;
            PendingIntent pi = intent(ctx, it.optInt("id"), it.optString("json"), it.optString("cardId"));
            if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, it.optLong("at"), pi);
            else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, it.optLong("at"), pi);
            kept.put(it);
        }
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("items", kept.toString()).apply();
    }

    public static void cancelAll(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        try {
            JSONArray old = new JSONArray(p.getString("items", "[]"));
            for (int k = 0; k < old.length(); k++) am.cancel(intent(ctx, old.getJSONObject(k).optInt("id"), "", ""));
        } catch (Exception ignored) {}
        p.edit().remove("items").apply();
    }

    public static void restore(Context ctx) {
        try {
            scheduleAll(ctx, new JSONArray(ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("items", "[]")));
        } catch (Exception ignored) {}
    }

    private static PendingIntent intent(Context ctx, int id, String json, String cardId) {
        Intent i = new Intent(ctx, PopupReceiver.class);
        i.putExtra(CardPopupActivity.EXTRA_JSON, json);
        i.putExtra(CardPopupActivity.EXTRA_CARD_ID, cardId);
        return PendingIntent.getBroadcast(ctx, BASE + id, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** مكالمة جارية أو رنين، هاتفية أو عبر الإنترنت (واتساب، مكالمة فيديو…)؛ لا يحتاج أي إذن */
    public static boolean inCall(Context ctx) {
        try {
            android.media.AudioManager a = (android.media.AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
            int m = a.getMode();
            return m == android.media.AudioManager.MODE_IN_CALL || m == android.media.AudioManager.MODE_IN_COMMUNICATION
                || m == android.media.AudioManager.MODE_RINGTONE;
        } catch (Exception e) {
            return false;
        }
    }

    /** الهاتف يرنّ الآن (مكالمة واردة) */
    public static boolean ringing(Context ctx) {
        try {
            return ((android.media.AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE)).getMode() == android.media.AudioManager.MODE_RINGTONE;
        } catch (Exception e) {
            return false;
        }
    }

    /** فيديو أو صوت يعمل الآن (يوتيوب، قرآن، موسيقى…)؛ لا يحتاج أي إذن */
    public static boolean mediaPlaying(Context ctx) {
        try {
            return ((android.media.AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE)).isMusicActive();
        } catch (Exception e) {
            return false;
        }
    }

    /** وضع «عدم الإزعاج» (أو النوم/التركيز) مفعّل */
    public static boolean doNotDisturb(Context ctx) {
        try {
            android.app.NotificationManager nm = (android.app.NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            int f = nm.getCurrentInterruptionFilter();
            return f != android.app.NotificationManager.INTERRUPTION_FILTER_ALL && f != android.app.NotificationManager.INTERRUPTION_FILTER_UNKNOWN;
        } catch (Exception e) {
            return false;
        }
    }

    /** إعادة المحاولة بعد 10 دقائق (3 مرات على الأكثر)؛ لا تُحفظ بعد إعادة تشغيل الهاتف */
    public static void retryLater(Context ctx, Intent from) { retryLater(ctx, from, 3); }

    public static void retryLater(Context ctx, Intent from, int max) {
        int tries = from.getIntExtra("tries", 0);
        if (tries >= max) return;
        Intent i = new Intent(ctx, PopupReceiver.class);
        i.putExtra(CardPopupActivity.EXTRA_JSON, from.getStringExtra(CardPopupActivity.EXTRA_JSON));
        i.putExtra(CardPopupActivity.EXTRA_CARD_ID, from.getStringExtra(CardPopupActivity.EXTRA_CARD_ID));
        i.putExtra("tries", tries + 1);
        PendingIntent pi = PendingIntent.getBroadcast(ctx, BASE - 1, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + 10 * 60 * 1000L, pi);
    }

    /** الفقاعة التي أُخفيت دون أن تُفتح تعود بعد ساعتين مرة واحدة فقط، ولا تعود بعد منتصف الليل (بطاقة 20:00 تعود نحو 22:00 كغيرها، قرار المستخدم)
     *  ولا إن جاءت بعدها بطاقة أخرى (اقتراح المستخدم 2026-11-04) */
    public static final int BUBBLE_BACK_MAX = 1;

    public static void bubbleBack(Context ctx, String json, String cardId, int n) {
        if (n > BUBBLE_BACK_MAX) return;
        long at = System.currentTimeMillis() + 2 * 60 * 60 * 1000L;
        java.util.Calendar c = java.util.Calendar.getInstance();
        c.setTimeInMillis(at);
        if (c.get(java.util.Calendar.HOUR_OF_DAY) < 7) return; // لا تعود بعد منتصف الليل (من أخفى بطاقة المساء متأخرًا)
        Intent i = new Intent(ctx, PopupReceiver.class);
        i.putExtra(CardPopupActivity.EXTRA_JSON, json);
        i.putExtra(CardPopupActivity.EXTRA_CARD_ID, cardId);
        i.putExtra("back", n);
        PendingIntent pi = PendingIntent.getBroadcast(ctx, BASE - 3, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        ((AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE)).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
    }

    public static void cancelBubbleBack(Context ctx) {
        Intent i = new Intent(ctx, PopupReceiver.class);
        PendingIntent pi = PendingIntent.getBroadcast(ctx, BASE - 3, i, PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (pi != null) { ((AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE)).cancel(pi); pi.cancel(); }
    }

    /** طريقة ظهور البطاقة على الشاشة (اختيار المستخدم): full نافذة في موعدها، bubble فقاعة صغيرة.
     *  («حين تفتح هاتفك» unlock حُذف في 3.22 بقرار المستخدم؛ من اختاره يعود إلى النافذة الكاملة) */
    public static String mode(Context ctx) {
        return "bubble".equals(ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("mode", "full")) ? "bubble" : "full";
    }

    public static void setMode(Context ctx, String m) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("mode", m).apply();
    }

    /** يعرض البطاقة بالطريقة التي اختارها المستخدم (فقاعة أو نافذة) */
    public static boolean present(Context ctx, String json, String cardId) {
        if ("bubble".equals(mode(ctx))) return BubbleService.show(ctx, json, cardId);
        return show(ctx, json, cardId);
    }

    /** «تجربة النافذة بعد دقيقة»: تمرّ بـ PopupReceiver كالموعد الحقيقي (فتُؤجَّل في المكالمة والفيديو، ولا تظهر في «عدم الإزعاج») */
    public static void testSoon(Context ctx, String json, String cardId) {
        PendingIntent pi = intent(ctx, -2, json, cardId);
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + 60_000L, pi);
    }

    /** يفتح نافذة البطاقة الآن، إن سمح المستخدم بالظهور فوق التطبيقات */
    public static boolean show(Context ctx, String json, String cardId) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !android.provider.Settings.canDrawOverlays(ctx)) return false;
        Intent a = new Intent(ctx, CardPopupActivity.class);
        a.putExtra(CardPopupActivity.EXTRA_JSON, json);
        a.putExtra(CardPopupActivity.EXTRA_CARD_ID, cardId);
        a.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        ctx.startActivity(a);
        return true;
    }
}
