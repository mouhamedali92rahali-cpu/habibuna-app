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
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.TimeZone;

/**
 * زرّ الصلاة على النبي ﷺ على الشاشة الرئيسية (تجربة 2026-11-10، طلب المستخدم):
 * دائرة «ﷺ» بعدد صلوات الأسبوع، وصيغة اليوم من «دلائل الخيرات» (setFormulas) تتبدّل كل يوم بمنبّه منتصف الليل.
 * زرّ «ﷺ» يسجّل الصلاة في «prays» نفسه الذي تسجّل فيه النافذة (يأخذه التطبيق بـ takePrays)،
 * والعدد المعروض = ما في التطبيق للأيام السبعة (prayBase) + ما لم يأخذه التطبيق بعد.
 */
public class CardWidget extends AppWidgetProvider {
    static final String PRAY = "tn.habibuna.app.WIDGET_PRAY";
    static final String TICK = "tn.habibuna.app.WIDGET_TICK";
    static final String GLOW = "tn.habibuna.app.WIDGET_GLOW";
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
        else if (GLOW.equals(a)) updateAll(ctx);
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

    /** اهتزاز قصير: أندرويد يُسقط اهتزاز التطبيق الذي في الخلفية إلا لأنواع منها «الإشعار»، فنطلبه بهذا النوع */
    static void buzz(Context ctx) {
        try {
            android.os.Vibrator v = (android.os.Vibrator) ctx.getSystemService(Context.VIBRATOR_SERVICE);
            if (Build.VERSION.SDK_INT >= 26) {
                android.os.VibrationEffect e = Build.VERSION.SDK_INT >= 29 ? android.os.VibrationEffect.createPredefined(android.os.VibrationEffect.EFFECT_HEAVY_CLICK)
                    : android.os.VibrationEffect.createOneShot(40, 255);
                android.media.AudioAttributes a = new android.media.AudioAttributes.Builder().setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_EVENT).build();
                v.vibrate(e, a);
            } else v.vibrate(40);
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

    /** عدد صلوات اليوم (رقم الأداة، قرار المستخدم 2026-11-10: يبدأ من الصفر كل صباح) */
    static int todayCount(SharedPreferences p) {
        try {
            String k = String.valueOf(today());
            return new JSONObject(p.getString("prayBase", "{}")).optInt(k, 0) + new JSONObject(p.getString("prays", "{}")).optInt(k, 0);
        } catch (Exception e) { return 0; }
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

    public static void updateAll(Context ctx) { updateAll(ctx, false); }

    /** glow: باقٍ في التوقيع لما يستدعيه، والتوهّج حُذف بطلب المستخدم (الاهتزاز من PrayTapActivity لا منه) */
    public static void updateAll(Context ctx, boolean glow) {
        AppWidgetManager m = AppWidgetManager.getInstance(ctx);
        SharedPreferences p = ctx.getSharedPreferences(PopupScheduler.PREFS, Context.MODE_PRIVATE);
        // مفتاح التطبيق مطفأ: تختفي الأداة (أندرويد لا يسمح للتطبيق بإزالتها؛ يزيلها صاحبها بالضغط الطويل)
        boolean hidden = p.getBoolean("widgetHidden", false);
        int vis = hidden ? android.view.View.INVISIBLE : android.view.View.VISIBLE;
        String count = String.valueOf(todayCount(p));
        Intent tap = new Intent(ctx, PrayTapActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_ANIMATION | Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);

        int[] coins = m.getAppWidgetIds(new ComponentName(ctx, CoinWidget.class));
        if (coins != null && coins.length > 0) {
            RemoteViews c = new RemoteViews(ctx.getPackageName(), R.layout.widget_coin);
            c.setTextViewText(R.id.wcount, count);
            c.setViewVisibility(R.id.wroot, vis);
            if (!hidden) c.setOnClickPendingIntent(R.id.wpray, PendingIntent.getActivity(ctx, 7003, tap, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
            m.updateAppWidget(coins, c);
        }
        int[] ids = m.getAppWidgetIds(new ComponentName(ctx, CardWidget.class));
        long now = System.currentTimeMillis();
        // لون الإطار: باب البطاقة التي حان موعدها (يرسلها التطبيق: setWidget)، ويتبدّل في الموعد القادم
        String theme = "emerald"; long nextAt = 0, curAt = -1;
        try {
            JSONArray items = new JSONArray(p.getString("widget", "[]"));
            for (int k = 0; k < items.length(); k++) {
                JSONObject it = items.getJSONObject(k);
                long at = it.optLong("at");
                if (at <= now) { if (at > curAt) { curAt = at; theme = it.optString("theme", "emerald"); } }
                else if (nextAt == 0 || at < nextAt) nextAt = at;
            }
        } catch (Exception ignored) { }
        if (ids == null || ids.length == 0) { scheduleNext(ctx, nextAt); return; }
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_card);
        // صيغة اليوم من «دلائل الخيرات» تتبدّل كل يوم، ويوم الجمعة حديث «فأكثروا عليّ من الصلاة فيه»
        String text = "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ";
        try {
            JSONArray f = new JSONArray(p.getString("formulas", "[]"));
            if (f.length() > 0) text = f.optString((int) (today() % f.length()));
        } catch (Exception ignored) { }
        String fri = p.getString("fridayText", "");
        if (!fri.isEmpty() && Calendar.getInstance().get(Calendar.DAY_OF_WEEK) == Calendar.FRIDAY) text = fri;
        // جمل اليوم (2026-11-10، قرار المستخدم): آية يومًا وحديث يومًا من السبت إلى الأربعاء، والخميس فضل الصلاة عليه ﷺ، والجمعة حديث الجمعة
        String src = "";
        try {
            JSONObject L = new JSONObject(p.getString("lines", "{}"));
            JSONArray q = L.optJSONArray("q"), h = L.optJSONArray("h"), s = L.optJSONArray("s");
            if (q != null && h != null && s != null && q.length() > 0 && h.length() > 0 && s.length() > 0) {
                long d = today() - 2; // اليوم 2 من 1970 سبت
                long week = Math.floorDiv(d, 7L); int pos = (int) Math.floorMod(d, 7L);
                JSONObject o;
                if (pos == 6) o = L.optJSONObject("f");
                else if (pos == 5) o = s.getJSONObject((int) Math.floorMod(week, (long) s.length()));
                else {
                    long slot = week * 5 + pos;
                    o = slot % 2 == 0 ? q.getJSONObject((int) Math.floorMod(slot / 2, (long) q.length()))
                                      : h.getJSONObject((int) Math.floorMod(slot / 2, (long) h.length()));
                }
                if (o != null) { text = o.optString("t", text); src = o.optString("s", ""); }
            }
        } catch (Exception ignored) { }
        v.setTextViewText(R.id.wsrc, src);
        v.setViewVisibility(R.id.wsrc, src.isEmpty() ? View.GONE : View.VISIBLE);
        v.setTextViewText(R.id.wtext, text);
        v.setTextViewTextSize(R.id.wtext, android.util.TypedValue.COMPLEX_UNIT_SP, src.isEmpty() ? (text.length() < 50 ? 17f : text.length() < 75 ? 15.5f : 14.5f) : (text.length() < 40 ? 16f : text.length() < 60 ? 14.5f : 13.5f));
        v.setTextViewText(R.id.wcount, count);
        v.setInt(R.id.wframe, "setColorFilter", frameColor(theme));
        v.setViewVisibility(R.id.wroot, vis);
        if (!hidden) {
            v.setOnClickPendingIntent(R.id.wpray, PendingIntent.getActivity(ctx, 7001, tap, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
            Intent open = new Intent(ctx, MainActivity.class);
            open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            v.setOnClickPendingIntent(R.id.wtext, PendingIntent.getActivity(ctx, 7000, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        }
        m.updateAppWidget(ids, v);
        scheduleNext(ctx, nextAt);
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

    public static void setHidden(Context ctx, boolean h) {
        ctx.getSharedPreferences(PopupScheduler.PREFS, Context.MODE_PRIVATE).edit().putBoolean("widgetHidden", h).apply();
        updateAll(ctx);
    }

    public static boolean hidden(Context ctx) {
        return ctx.getSharedPreferences(PopupScheduler.PREFS, Context.MODE_PRIVATE).getBoolean("widgetHidden", false);
    }

    /** هل وضع المستخدم البطاقة على شاشته الرئيسية؟ */
    public static boolean placed(Context ctx) {
        AppWidgetManager m = AppWidgetManager.getInstance(ctx);
        int[] a = m.getAppWidgetIds(new ComponentName(ctx, CardWidget.class));
        int[] b = m.getAppWidgetIds(new ComponentName(ctx, CoinWidget.class));
        return (a != null && a.length > 0) || (b != null && b.length > 0);
    }

    /** يطلب من الهاتف وضع البطاقة على الشاشة الرئيسية (أندرويد 8+، إن سمح الهاتف) */
    public static boolean requestPin(Context ctx) { return requestPin(ctx, false); }

    public static boolean requestPin(Context ctx, boolean coin) {
        if (Build.VERSION.SDK_INT < 26) return false;
        AppWidgetManager m = ctx.getSystemService(AppWidgetManager.class);
        if (m == null || !m.isRequestPinAppWidgetSupported()) return false;
        return m.requestPinAppWidget(new ComponentName(ctx, coin ? CoinWidget.class : CardWidget.class), null, null);
    }
}
