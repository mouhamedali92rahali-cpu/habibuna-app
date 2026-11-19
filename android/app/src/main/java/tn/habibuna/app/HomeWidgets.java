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
    static final String LATER = "tn.habibuna.app.TASK_LATER";
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
            if (LATER.equals(i.getAction())) { taskLater(c, i.getIntExtra("day", -1)); return; }
            super.onReceive(c, i);
        }
    }
    /** الثلاثة في أداة واحدة (طلب المستخدم 2026-11-18 بعد رؤية الثلاث منفصلة) */
    public static class DayW extends AppWidgetProvider {
        @Override public void onUpdate(Context c, AppWidgetManager m, int[] ids) { updateAll(c); }
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
        int[] d = ids(c, DateW.class), p = ids(c, PrayerW.class), t = ids(c, TaskW.class), all = ids(c, DayW.class);
        if (d.length > 0) { RemoteViews v = dateViews(c, now); for (int id : d) m.updateAppWidget(id, v); }
        if (p.length > 0) { long[] n = new long[]{next}; RemoteViews v = prayerViews(c, now, n); next = n[0]; for (int id : p) m.updateAppWidget(id, v); }
        if (t.length > 0) { long[] n = new long[]{next}; RemoteViews v = taskViews(c, now, n); next = n[0]; for (int id : t) m.updateAppWidget(id, v); }
        if (all.length > 0) {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_day);
            long[] n = new long[]{next};
            fillDay(c, v, now, n); next = n[0];
            v.setOnClickPendingIntent(R.id.hroot, openApp(c));
            for (int id : all) m.updateAppWidget(id, v);
            // «يومك» يُكتب بالكلمات («بعد 34 دقيقة») فيتجدّد كل دقيقة، بمنبّه لا يوقظ الهاتف (يتأخّر إلى أن تُضاء الشاشة)
            scheduleMinute(c, (now / 60_000L + 1) * 60_000L + 500);
        }
        if (d.length + p.length + t.length + all.length > 0) schedule(c, next);
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
    static RemoteViews dateViews(Context c, long now) { RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_date); fillDate(c, v, now); v.setOnClickPendingIntent(R.id.hroot, openApp(c)); return v; }
    static void fillDate(Context c, RemoteViews v, long now) {
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
    }

    /** الصلاة القادمة بعدّ تنازلي حيّ (Chronometer)، و«حان الآن» عشرين دقيقة بعد دخول الوقت */
    static RemoteViews prayerViews(Context c, long now, long[] next) { RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_prayer); fillPrayer(c, v, now, next); v.setOnClickPendingIntent(R.id.hroot, openApp(c)); return v; }
    static void fillPrayer(Context c, RemoteViews v, long now, long[] next) {
        JSONArray a = arr(c, "homePrayers");
        JSONObject cur = null;
        for (int i = 0; i < a.length(); i++) {
            JSONObject o = a.optJSONObject(i);
            if (o != null && o.optLong("at") + NOW_WINDOW > now) { cur = o; break; }
        }
        if (cur == null) {
            v.setTextViewText(R.id.pname, "مواقيت الصلاة");
            v.setTextViewText(R.id.pnow, "افتح «حبيبنا» مرة لتظهر");
            v.setViewVisibility(R.id.pnow, View.VISIBLE);
            v.setViewVisibility(R.id.pcount, View.GONE);
            v.setTextViewText(R.id.ptime, "");
            return;
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
    }

    /** مهمة اليوم: لا تظهر قبل وقتها (كالتطبيق)، و«فعلتُها» يخفيها ويسجّلها للتطبيق */
    static RemoteViews taskViews(Context c, long now, long[] next) { RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_task); fillTask(c, v, now, next); v.setOnClickPendingIntent(R.id.hroot, openApp(c)); return v; }
    static void fillTask(Context c, RemoteViews v, long now, long[] next) {
        JSONArray a = arr(c, "homeTasks");
        Set<String> done = prefs(c).getStringSet("homeTaskDone", new HashSet<>());
        JSONObject cur = null;
        for (int i = 0; i < a.length(); i++) {
            JSONObject o = a.optJSONObject(i);
            if (o != null && o.optLong("start") <= now && now < o.optLong("start") + 86_400_000L) cur = o;
        }
        v.setViewVisibility(R.id.tdone, View.GONE);
        if (cur != null && prefs(c).getStringSet("homeTaskSkip", new HashSet<>()).contains(String.valueOf(cur.optInt("day")))) cur = null;
        if (cur == null) {
            v.setTextViewText(R.id.ttext, a.length() == 0 ? "افتح «حبيبنا» مرة لتظهر مهمّتك" : "لا مهمة اليوم");
            return;
        }
        int day = cur.optInt("day");
        long at = cur.optLong("at");
        if (cur.optBoolean("done") || done.contains(String.valueOf(day))) {
            v.setTextViewText(R.id.ttext, "عَلِمها الله، وكفى ✦");
        } else if (now < at) {
            v.setTextViewText(R.id.ttext, "✉ مهمّتك الخفيّة في الطريق إليك اليوم ✦");
            next[0] = Math.min(next[0], at + 1000);
        } else {
            v.setTextViewText(R.id.ttext, "✉ " + cur.optString("text"));
            v.setViewVisibility(R.id.tdone, View.VISIBLE);
            Intent i = new Intent(c, TaskW.class).setAction(DONE).putExtra("day", day);
            v.setOnClickPendingIntent(R.id.tdone, PendingIntent.getBroadcast(c, 7200, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        }
    }

    // ===== «يومك» بخصائص التطبيق (طلب المستخدم 2026-11-18) =====
    static String hoursAr(long h) { return h == 1 ? "ساعة" : h == 2 ? "ساعتين" : h <= 10 ? h + " ساعات" : h + " ساعة"; }
    static String minsAr(long m) { return m == 1 ? "دقيقة" : m == 2 ? "دقيقتين" : m <= 10 ? m + " دقائق" : m + " دقيقة"; }
    /** مثل untilText في prayer.ts: «بعد ساعتين و20 دقيقة» */
    static String untilText(long ms) {
        long t = (ms + 59_999L) / 60_000L;
        if (t < 1) return "بعد أقل من دقيقة";
        long h = t / 60, m = t % 60;
        if (h == 0) return "بعد " + minsAr(m);
        return "بعد " + hoursAr(h) + (m > 0 ? " و" + minsAr(m) : "");
    }

    static void fillDay(Context c, RemoteViews v, long now, long[] next) {
        // التاريخ في نسختين يتبادلان بحركة من اليسار إلى اليمين
        JSONArray days = arr(c, "homeDays");
        JSONObject cur = null;
        for (int i = 0; i < days.length(); i++) { JSONObject o = days.optJSONObject(i); if (o != null && o.optLong("start") <= now) cur = o; }
        String hij = cur == null ? "افتح «حبيبنا» مرة ليظهر التاريخ" : cur.optString("hijri");
        String greg = cur == null ? "" : cur.optString("greg");
        if (hij.isEmpty()) { hij = greg; greg = ""; }
        int[][] dv = {{R.id.hhijri, R.id.hgreg}, {R.id.hhijri2, R.id.hgreg2}};
        for (int[] x : dv) {
            v.setTextViewText(x[0], hij); v.setTextViewText(x[1], greg);
            v.setViewVisibility(x[1], greg.isEmpty() ? View.GONE : View.VISIBLE);
        }

        // الصلاة القادمة بالكلمات، واسمها عريض بالزمردي كما في التطبيق
        JSONArray pr = arr(c, "homePrayers");
        JSONObject p = null;
        for (int i = 0; i < pr.length(); i++) { JSONObject o = pr.optJSONObject(i); if (o != null && o.optLong("at") + NOW_WINDOW > now) { p = o; break; } }
        if (p == null) v.setTextViewText(R.id.pline, "مواقيت الصلاة: افتح «حبيبنا» مرة");
        else {
            long at = p.optLong("at");
            String name = p.optString("name");
            boolean on = at <= now;
            // «حان الآن موعد صلاة المغرب» (صيغة المستخدم 2026-11-19)
            android.text.SpannableString sp = new android.text.SpannableString(on ? "حان الآن موعد صلاة " + name : name + " " + untilText(at - now));
            sp.setSpan(new android.text.style.StyleSpan(android.graphics.Typeface.BOLD), 0, on ? sp.length() : name.length(), 0);
            sp.setSpan(new android.text.style.ForegroundColorSpan(0xFF0F5C4D), 0, on ? sp.length() : name.length(), 0);
            v.setTextViewText(R.id.pline, sp);
            next[0] = Math.min(next[0], on ? at + NOW_WINDOW + 1000 : at + 1000);
        }

        // التناوب: المهمة (إن حان وقتها ولم تُنجز) أولًا، ثم سنن الأيام، ثم تذكير الوقت
        v.removeAllViews(R.id.hrot);
        int n = 0;
        JSONArray tk = arr(c, "homeTasks");
        Set<String> done = prefs(c).getStringSet("homeTaskDone", new HashSet<>());
        JSONObject t = null;
        for (int i = 0; i < tk.length(); i++) { JSONObject o = tk.optJSONObject(i); if (o != null && o.optLong("start") <= now && now < o.optLong("start") + 86_400_000L) t = o; }
        String fallback = null;
        Set<String> skip = prefs(c).getStringSet("homeTaskSkip", new HashSet<>());
        if (t != null && skip.contains(String.valueOf(t.optInt("day")))) t = null;
        if (t != null) {
            int day = t.optInt("day");
            long at = t.optLong("at");
            if (t.optBoolean("done") || done.contains(String.valueOf(day))) fallback = "عَلِمها الله، وكفى ✦";
            else if (now < at) { fallback = "✉ مهمّتك الخفيّة في الطريق إليك اليوم ✦"; next[0] = Math.min(next[0], at + 1000); }
            else {
                RemoteViews r = new RemoteViews(c.getPackageName(), R.layout.widget_day_task);
                r.setTextViewText(R.id.ttext, "✉ " + t.optString("text"));
                Intent i = new Intent(c, TaskW.class).setAction(DONE).putExtra("day", day);
                r.setOnClickPendingIntent(R.id.tdone, PendingIntent.getBroadcast(c, 7200, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
                // «لاحقًا» لغير مهام المناسبات (post يرسله التطبيق)
                if (t.optBoolean("post")) {
                    Intent l = new Intent(c, TaskW.class).setAction(LATER).putExtra("day", day);
                    r.setOnClickPendingIntent(R.id.tlater, PendingIntent.getBroadcast(c, 7202, l, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
                } else r.setViewVisibility(R.id.tlater, View.GONE);
                v.addView(R.id.hrot, r); n++;
            }
        }
        if (cur != null) {
            JSONArray su = cur.optJSONArray("sunan");
            if (su != null) for (int i = 0; i < su.length(); i++) { String x = su.optString(i); if (!x.isEmpty()) { addLine(c, v, "✦ " + x); n++; } }
        }
        // «كن مثله ﷺ» ثم اسم من أهل بيته ﷺ واسم من أصحابه (ext: [{h,t}])، كلٌّ بعنوانه الذهبي (قرارات المستخدم 2026-11-19)
        java.util.List<CharSequence> extLines = new java.util.ArrayList<>();
        JSONArray ext = cur == null ? null : cur.optJSONArray("ext");
        JSONArray kuns = cur == null ? null : cur.optJSONArray("kun");
        if (ext == null && kuns != null && kuns.length() > 0) { ext = new JSONArray(); try { ext.put(new JSONObject().put("h", "كن مثله ﷺ").put("t", kuns.optString(0))); } catch (Exception ignored) {} }
        if (ext != null) for (int i = 0; i < ext.length(); i++) {
            JSONObject o = ext.optJSONObject(i); if (o == null || o.optString("t").isEmpty()) continue;
            String head = o.optString("h") + "  ";
            android.text.SpannableString sp = new android.text.SpannableString(head + o.optString("t"));
            sp.setSpan(new android.text.style.StyleSpan(android.graphics.Typeface.BOLD), 0, head.length(), 0);
            sp.setSpan(new android.text.style.ForegroundColorSpan(0xFFB8892E), 0, head.length(), 0);
            extLines.add(sp);
        }
        JSONArray rot = arr(c, "homeRot");
        JSONObject r = null;
        for (int i = 0; i < rot.length(); i++) { JSONObject o = rot.optJSONObject(i); if (o == null) continue; if (o.optLong("at") <= now) r = o; else { next[0] = Math.min(next[0], o.optLong("at") + 1000); break; } }
        // تذكير الوقت هو جملة شريط الصلاة نفسها؛ فلا يظهر هنا إن كان الشريط ظاهرًا على الشاشة (قرار المستخدم 2026-11-18)
        boolean strip = ids(c, CardWidget.class).length > 0 && !prefs(c).getBoolean("widgetHidden", false);
        if (!strip && r != null && !r.optString("line").isEmpty()) { addLine(c, v, "✦ " + r.optString("line")); n++; }
        for (CharSequence x : extLines) { addLine(c, v, x); n++; }
        if (n == 0) { addLine(c, v, fallback != null ? fallback : "✦ صلِّ على النبي ﷺ"); n = 1; }
        // يبدأ من الموضع الذي يقابل الوقت، فإن لم تُشغّل واجهة الهاتف التبادل تغيّر السطر مع تجدّد الأداة كل دقيقة
        v.setDisplayedChild(R.id.hrot, (int) ((now / 7000L) % n));
    }
    static void addLine(Context c, RemoteViews v, CharSequence text) {
        RemoteViews r = new RemoteViews(c.getPackageName(), R.layout.widget_day_line);
        r.setTextViewText(R.id.rline, text);
        v.addView(R.id.hrot, r);
    }
    static void scheduleMinute(Context c, long at) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = PendingIntent.getBroadcast(c, 7301, new Intent(c, Tick.class).setAction(TICK + ".MIN"), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        // دقيق إن سُمحت المواعيد الدقيقة (HyperOS يؤخّر المنبّهات غير الدقيقة دقائق طويلة)، ولا يوقظ الهاتف في الحالتين
        try {
            if (Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms()) am.setExact(AlarmManager.RTC, at, pi);
            else am.setWindow(AlarmManager.RTC, at, 10_000L, pi);
        } catch (Exception e) { am.set(AlarmManager.RTC, at, pi); }
    }

    /** «لاحقًا» من الشاشة: تختفي مهمة اليوم، وتُنقل إلى أول يوم بعد ثلاثة أيام يقبلها (post) حتى يفتح التطبيق فيحسبها بقاعدته؛
     *  ويأخذ التطبيق «اليوم:الدقيقة» (takeTaskPost) ليعيد الجدولة بوقت مختلف (قرار المستخدم 2026-11-19) */
    static void taskLater(Context c, int day) {
        if (day < 0) return;
        SharedPreferences p = prefs(c);
        Set<String> skip = new HashSet<>(p.getStringSet("homeTaskSkip", new HashSet<>()));
        if (skip.contains(String.valueOf(day))) return;
        skip.add(String.valueOf(day));
        java.util.Calendar cal = java.util.Calendar.getInstance();
        Set<String> ops = new HashSet<>(p.getStringSet("taskPostOps", new HashSet<>()));
        ops.add(day + ":" + (cal.get(java.util.Calendar.HOUR_OF_DAY) * 60 + cal.get(java.util.Calendar.MINUTE)));
        SharedPreferences.Editor e = p.edit().putStringSet("homeTaskSkip", skip).putStringSet("taskPostOps", ops);
        try {
            JSONArray a = arr(c, "homeTasks");
            String text = null;
            for (int i = 0; i < a.length(); i++) { JSONObject o = a.optJSONObject(i); if (o != null && o.optInt("day") == day) text = o.optString("text"); }
            if (text != null) for (int i = 0; i < a.length(); i++) {
                JSONObject o = a.optJSONObject(i);
                if (o != null && o.optInt("day") >= day + 3 && o.optBoolean("post") && !o.optBoolean("moved") && !skip.contains(String.valueOf(o.optInt("day")))) {
                    o.put("text", text); o.put("moved", true); break;
                }
            }
            e.putString("homeTasks", a.toString());
        } catch (Exception ignored) {}
        e.apply();
        try {
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null && Build.VERSION.SDK_INT >= 23) for (StatusBarNotification n : nm.getActiveNotifications()) if (n.getId() >= TASK_ID && n.getId() <= TASK_LAST) nm.cancel(n.getTag(), n.getId());
        } catch (Exception ignored) {}
        updateAll(c);
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
