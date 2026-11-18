package tn.habibuna.app;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.SystemClock;
import android.service.notification.StatusBarNotification;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.HashSet;
import java.util.Set;

/**
 * ثلاث أدوات منفصلة على الشاشة الرئيسية (تجربة للمستخدم وحده، 2026-11-18): التاريخ، والصلاة القادمة، والمهمة الخفيّة.
 * بشكل البطاقة: حافّة زمردية ووجه عاجي بخيط ذهبي. البيانات يرسلها التطبيق مسبقًا (setHomeInfo) لثلاثين يومًا،
 * فتبقى الأدوات صحيحة وإن لم يُفتح التطبيق. منبّه واحد (Tick) يجدّدها في أقرب حدث: منتصف الليل، أو وقت صلاة،
 * أو نهاية «حان الآن»، أو وقت المهمة.
 */
public class HomeWidgets {
    static final String TICK = "tn.habibuna.app.HOME_TICK";
    static final String DONE = "tn.habibuna.app.TASK_DONE";
    static final long NOW_WINDOW = 20 * 60_000L;
    static final int TASK_ID = 7000, TASK_LAST = 7031;

    public static class DateW extends AppWidgetProvider {
        @Override public void onUpdate(Context c, AppWidgetManager m, int[] ids) { updateAll(c); }
    }
    public static class PrayerW extends AppWidgetProvider {
        @Override public void onUpdate(Context c, AppWidgetManager m, int[] ids) { updateAll(c); }
    }
    public static class TaskW extends AppWidgetProvider {
        @Override public void onUpdate(Context c, AppWidgetManager m, int[] ids) { updateAll(c); }
        @Override public void onReceive(Context c, Intent i) {
            if (DONE.equals(i.getAction())) { taskDone(c, i.getIntExtra("day", -1)); return; }
            super.onReceive(c, i);
        }
    }
    /** المنبّه المشترك، وبعد إعادة تشغيل الهاتف أو تغيير الساعة */
    public static class Tick extends BroadcastReceiver {
        @Override public void onReceive(Context c, Intent i) { updateAll(c); }
    }

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PopupScheduler.PREFS, Context.MODE_PRIVATE); }
    static JSONArray arr(Context c, String k) { try { return new JSONArray(prefs(c).getString(k, "[]")); } catch (Exception e) { return new JSONArray(); } }
    static int[] ids(Context c, Class<?> k) { return AppWidgetManager.getInstance(c).getAppWidgetIds(new ComponentName(c, k)); }

    public static void updateAll(Context c) {
        long now = System.currentTimeMillis();
        long next = nextMidnight(now);
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] d = ids(c, DateW.class), p = ids(c, PrayerW.class), t = ids(c, TaskW.class);
        if (d.length > 0) { RemoteViews v = dateViews(c, now); for (int id : d) m.updateAppWidget(id, v); }
        if (p.length > 0) { long[] n = new long[]{next}; RemoteViews v = prayerViews(c, now, n); next = n[0]; for (int id : p) m.updateAppWidget(id, v); }
        if (t.length > 0) { long[] n = new long[]{next}; RemoteViews v = taskViews(c, now, n); next = n[0]; for (int id : t) m.updateAppWidget(id, v); }
        if (d.length + p.length + t.length > 0) schedule(c, next);
    }

    static long nextMidnight(long now) {
        Calendar k = Calendar.getInstance(); k.setTimeInMillis(now); k.add(Calendar.DAY_OF_YEAR, 1);
        k.set(Calendar.HOUR_OF_DAY, 0); k.set(Calendar.MINUTE, 0); k.set(Calendar.SECOND, 5); k.set(Calendar.MILLISECOND, 0);
        return k.getTimeInMillis();
    }

    static PendingIntent openApp(Context c) {
        Intent i = new Intent(c, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(c, 7100, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** اليوم المطابق الآن من القائمة {start, greg, hijri} */
    static RemoteViews dateViews(Context c, long now) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_date);
        JSONArray a = arr(c, "homeDays");
        JSONObject cur = null;
        for (int i = 0; i < a.length(); i++) { JSONObject o = a.optJSONObject(i); if (o != null && o.optLong("start") <= now) cur = o; }
        if (cur == null) { v.setTextViewText(R.id.hgreg, ""); v.setTextViewText(R.id.hhijri, "افتح «حبيبنا» مرة ليظهر التاريخ"); }
        else {
            v.setTextViewText(R.id.hgreg, cur.optString("greg"));
            String h = cur.optString("hijri");
            v.setTextViewText(R.id.hhijri, h.isEmpty() ? cur.optString("greg") : h);
            v.setViewVisibility(R.id.hgreg, h.isEmpty() ? View.GONE : View.VISIBLE);
        }
        v.setOnClickPendingIntent(R.id.hroot, openApp(c));
        return v;
    }

    /** الصلاة القادمة بعدّ تنازلي حيّ (Chronometer)، و«حان الآن» عشرين دقيقة بعد دخول الوقت */
    static RemoteViews prayerViews(Context c, long now, long[] next) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_prayer);
        JSONArray a = arr(c, "homePrayers");
        JSONObject cur = null;
        for (int i = 0; i < a.length(); i++) {
            JSONObject o = a.optJSONObject(i);
            if (o != null && o.optLong("at") + NOW_WINDOW > now) { cur = o; break; }
        }
        v.setOnClickPendingIntent(R.id.hroot, openApp(c));
        if (cur == null) {
            v.setTextViewText(R.id.pname, "مواقيت الصلاة");
            v.setTextViewText(R.id.pnow, "افتح «حبيبنا» مرة لتظهر");
            v.setViewVisibility(R.id.pnow, View.VISIBLE);
            v.setViewVisibility(R.id.pcount, View.GONE);
            v.setTextViewText(R.id.ptime, "");
            return v;
        }
        long at = cur.optLong("at");
        v.setTextViewText(R.id.pname, cur.optString("name"));
        v.setTextViewText(R.id.ptime, cur.optString("hm"));
        if (at <= now) {
            v.setTextViewText(R.id.pnow, "حان الآن");
            v.setViewVisibility(R.id.pnow, View.VISIBLE);
            v.setViewVisibility(R.id.pcount, View.GONE);
            next[0] = Math.min(next[0], at + NOW_WINDOW + 1000);
        } else {
            v.setViewVisibility(R.id.pnow, View.GONE);
            v.setViewVisibility(R.id.pcount, View.VISIBLE);
            v.setChronometer(R.id.pcount, SystemClock.elapsedRealtime() + (at - now), "بعد %s", true);
            if (Build.VERSION.SDK_INT >= 24) v.setChronometerCountDown(R.id.pcount, true);
            next[0] = Math.min(next[0], at + 1000);
        }
        return v;
    }

    /** مهمة اليوم: لا تظهر قبل وقتها (كالتطبيق)، و«فعلتُها» يخفيها ويسجّلها للتطبيق */
    static RemoteViews taskViews(Context c, long now, long[] next) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_task);
        JSONArray a = arr(c, "homeTasks");
        Set<String> done = prefs(c).getStringSet("homeTaskDone", new HashSet<>());
        JSONObject cur = null;
        for (int i = 0; i < a.length(); i++) {
            JSONObject o = a.optJSONObject(i);
            if (o != null && o.optLong("start") <= now && now < o.optLong("start") + 86_400_000L) cur = o;
        }
        v.setOnClickPendingIntent(R.id.hroot, openApp(c));
        v.setViewVisibility(R.id.tdone, View.GONE);
        if (cur == null) {
            v.setTextViewText(R.id.ttext, a.length() == 0 ? "افتح «حبيبنا» مرة لتظهر مهمّتك" : "لا مهمة اليوم");
            return v;
        }
        int day = cur.optInt("day");
        long at = cur.optLong("at");
        if (cur.optBoolean("done") || done.contains(String.valueOf(day))) {
            v.setTextViewText(R.id.ttext, "عَلِمها الله، وكفى ✦");
        } else if (now < at) {
            v.setTextViewText(R.id.ttext, "✉ تصلك مهمّتك الخفيّة اليوم عند " + cur.optString("hm"));
            next[0] = Math.min(next[0], at + 1000);
        } else {
            v.setTextViewText(R.id.ttext, "✉ " + cur.optString("text"));
            v.setViewVisibility(R.id.tdone, View.VISIBLE);
            Intent i = new Intent(c, TaskW.class).setAction(DONE).putExtra("day", day);
            v.setOnClickPendingIntent(R.id.tdone, PendingIntent.getBroadcast(c, 7200, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        }
        return v;
    }

    static void taskDone(Context c, int day) {
        if (day < 0) return;
        SharedPreferences p = prefs(c);
        Set<String> s = new HashSet<>(p.getStringSet("homeTaskDone", new HashSet<>()));
        s.add(String.valueOf(day));
        // يأخذها التطبيق عند فتحه (takeTaskDone) فلا تظهر فيه مرة ثانية
        Set<String> ops = new HashSet<>(p.getStringSet("taskDoneOps", new HashSet<>()));
        ops.add(String.valueOf(day));
        p.edit().putStringSet("homeTaskDone", s).putStringSet("taskDoneOps", ops).apply();
        // ويزول إشعار المهمة إن كان ظاهرًا
        try {
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null && Build.VERSION.SDK_INT >= 23) for (StatusBarNotification n : nm.getActiveNotifications()) if (n.getId() >= TASK_ID && n.getId() <= TASK_LAST) nm.cancel(n.getTag(), n.getId());
        } catch (Exception ignored) {}
        updateAll(c);
    }

    static void schedule(Context c, long at) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = PendingIntent.getBroadcast(c, 7300, new Intent(c, Tick.class).setAction(TICK), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        try {
            if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) am.setAndAllowWhileIdle(AlarmManager.RTC, at, pi);
            else if (Build.VERSION.SDK_INT >= 23) am.setExactAndAllowWhileIdle(AlarmManager.RTC, at, pi);
            else am.setExact(AlarmManager.RTC, at, pi);
        } catch (Exception e) { am.set(AlarmManager.RTC, at, pi); }
    }
}
