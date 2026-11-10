package tn.habibuna.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.TimeZone;

/**
 * بطاقة اليوم على الشاشة الرئيسية (تجربة 2026-11-10، طلب المستخدم).
 * البطاقات يرسلها التطبيق (setWidget) لليوم وثلاثين يومًا قادمة، فتتبدّل وحدها في مواعيدها بمنبّه.
 * زرّ «ﷺ» يسجّل الصلاة في «prays» نفسه الذي تسجّل فيه النافذة (يأخذه التطبيق بـ takePrays)،
 * والعدد المعروض = ما في التطبيق للأيام السبعة (prayBase) + ما لم يأخذه التطبيق بعد.
 */
public class CardWidget extends AppWidgetProvider {
    static final String PRAY = "tn.habibuna.app.WIDGET_PRAY";
    static final String TICK = "tn.habibuna.app.WIDGET_TICK";
    static final String EXTRA_OPEN = "openCard";

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) { updateAll(ctx); }

    @Override
    public void onEnabled(Context ctx) { updateAll(ctx); }

    @Override
    public void onDisabled(Context ctx) {
        PendingIntent pi = tick(ctx, PendingIntent.FLAG_NO_CREATE);
        if (pi != null) { ((AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE)).cancel(pi); pi.cancel(); }
    }

    @Override
    public void onReceive(Context ctx, Intent i) {
        super.onReceive(ctx, i);
        String a = i.getAction();
        if (PRAY.equals(a)) { recordPray(ctx); buzz(ctx); updateAll(ctx); }
        else if (TICK.equals(a) || Intent.ACTION_BOOT_COMPLETED.equals(a) || Intent.ACTION_TIME_CHANGED.equals(a) || Intent.ACTION_TIMEZONE_CHANGED.equals(a)) updateAll(ctx);
    }

    static long today() {
        long now = System.currentTimeMillis();
        return (now + TimeZone.getDefault().getOffset(now)) / 86_400_000L;
    }

    static void recordPray(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PopupScheduler.PREFS, Context.MODE_PRIVATE);
        try {
            String k = String.valueOf(today());
            JSONObject o = new JSONObject(p.getString("prays", "{}"));
            o.put(k, o.optInt(k, 0) + 1);
            p.edit().putString("prays", o.toString()).apply();
        } catch (Exception ignored) { }
    }

    static void buzz(Context ctx) {
        try {
            android.os.Vibrator v = (android.os.Vibrator) ctx.getSystemService(Context.VIBRATOR_SERVICE);
            if (Build.VERSION.SDK_INT >= 26) v.vibrate(android.os.VibrationEffect.createOneShot(25, android.os.VibrationEffect.DEFAULT_AMPLITUDE));
            else v.vibrate(25);
        } catch (Exception ignored) { }
    }

    static int weekCount(SharedPreferences p) {
        int n = 0;
        try {
            JSONObject base = new JSONObject(p.getString("prayBase", "{}"));
            JSONObject pend = new JSONObject(p.getString("prays", "{}"));
            long t = today();
            for (long d = t - 6; d <= t; d++) n += base.optInt(String.valueOf(d), 0) + pend.optInt(String.valueOf(d), 0);
        } catch (Exception ignored) { }
        return n;
    }

    static int frameColor(String theme) {
        switch (theme == null ? "" : theme) {
            case "navy": return Color.parseColor("#17305C");
            case "plum": return Color.parseColor("#4A2A55");
            case "brown": return Color.parseColor("#5B3A1E");
            case "slate": return Color.parseColor("#3F4647");
            case "ivory": return Color.parseColor("#CDB67A");
            default: return Color.parseColor("#0F5C4D");
        }
    }

    static String hhmm(long at) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(at);
        return String.format(java.util.Locale.ROOT, "%02d:%02d", c.get(Calendar.HOUR_OF_DAY), c.get(Calendar.MINUTE));
    }

    public static void updateAll(Context ctx) {
        AppWidgetManager m = AppWidgetManager.getInstance(ctx);
        int[] ids = m.getAppWidgetIds(new ComponentName(ctx, CardWidget.class));
        if (ids == null || ids.length == 0) return;
        SharedPreferences p = ctx.getSharedPreferences(PopupScheduler.PREFS, Context.MODE_PRIVATE);
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_card);
        long now = System.currentTimeMillis();
        JSONObject cur = null, next = null;
        try {
            JSONArray items = new JSONArray(p.getString("widget", "[]"));
            for (int k = 0; k < items.length(); k++) {
                JSONObject it = items.getJSONObject(k);
                long at = it.optLong("at");
                if (at <= now) { if (cur == null || at > cur.optLong("at")) cur = it; }
                else if (next == null || at < next.optLong("at")) next = it;
            }
        } catch (Exception ignored) { }
        String theme = cur != null ? cur.optString("theme") : "emerald";
        boolean ivory = "ivory".equals(theme);
        v.setInt(R.id.wframe, "setColorFilter", frameColor(theme));
        int lab = ivory ? Color.parseColor("#3B2F12") : Color.parseColor("#F3E2A6");
        v.setTextColor(R.id.wpraylab, lab);
        v.setTextColor(R.id.wnext, lab);
        if (cur != null) {
            String text = cur.optString("text");
            v.setTextViewText(R.id.wkicker, cur.optString("kicker"));
            v.setTextViewText(R.id.wtext, text);
            int len = text.length();
            v.setTextViewTextSize(R.id.wtext, android.util.TypedValue.COMPLEX_UNIT_SP, len < 110 ? 16f : len < 180 ? 14.5f : len < 260 ? 13f : 12f);
            v.setTextViewText(R.id.wsrc, cur.optString("src"));
        } else {
            v.setTextViewText(R.id.wkicker, "حبيبنا");
            v.setTextViewText(R.id.wtext, next != null ? "أول بطاقة تصلك هنا عند " + hhmm(next.optLong("at")) + " بإذن الله" : "افتح «حبيبنا» مرة لتظهر بطاقاتك هنا");
            v.setTextViewText(R.id.wsrc, "");
        }
        v.setTextViewText(R.id.wnext, next != null ? "البطاقة القادمة " + hhmm(next.optLong("at")) + " ✦" : "");
        v.setTextViewText(R.id.wcount, String.valueOf(weekCount(p)));

        // لمس البطاقة يفتحها في التطبيق؛ لمس «ﷺ» يزيد العدد دون فتحه
        Intent open = new Intent(ctx, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (cur != null) open.putExtra(EXTRA_OPEN, cur.optString("cardId"));
        v.setOnClickPendingIntent(R.id.wpaper, PendingIntent.getActivity(ctx, 7000, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        Intent pray = new Intent(ctx, CardWidget.class).setAction(PRAY);
        v.setOnClickPendingIntent(R.id.wpray, PendingIntent.getBroadcast(ctx, 7001, pray, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));

        m.updateAppWidget(ids, v);
        scheduleNext(ctx, next != null ? next.optLong("at") : 0);
    }

    private static PendingIntent tick(Context ctx, int extra) {
        return PendingIntent.getBroadcast(ctx, 7002, new Intent(ctx, CardWidget.class).setAction(TICK), extra | PendingIntent.FLAG_IMMUTABLE);
    }

    /** المنبّه القادم: موعد البطاقة القادمة، أو منتصف الليل (ليتجدّد عدد الأسبوع)، أيهما أقرب */
    private static void scheduleNext(Context ctx, long nextAt) {
        Calendar c = Calendar.getInstance();
        c.add(Calendar.DAY_OF_YEAR, 1);
        c.set(Calendar.HOUR_OF_DAY, 0); c.set(Calendar.MINUTE, 0); c.set(Calendar.SECOND, 5); c.set(Calendar.MILLISECOND, 0);
        long at = c.getTimeInMillis();
        if (nextAt > 0 && nextAt + 2000 < at) at = nextAt + 2000;
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = tick(ctx, PendingIntent.FLAG_UPDATE_CURRENT);
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
    }

    /** هل وضع المستخدم البطاقة على شاشته الرئيسية؟ */
    public static boolean placed(Context ctx) {
        int[] ids = AppWidgetManager.getInstance(ctx).getAppWidgetIds(new ComponentName(ctx, CardWidget.class));
        return ids != null && ids.length > 0;
    }

    /** يطلب من الهاتف وضع البطاقة على الشاشة الرئيسية (أندرويد 8+، إن سمح الهاتف) */
    public static boolean requestPin(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return false;
        AppWidgetManager m = ctx.getSystemService(AppWidgetManager.class);
        if (m == null || !m.isRequestPinAppWidgetSupported()) return false;
        return m.requestPinAppWidget(new ComponentName(ctx, CardWidget.class), null, null);
    }
}
