package tn.habibuna.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;

/**
 * «الفقاعة» (اختيار المستخدم في الإعدادات، مثل فقاعات ماسنجر): في موعد البطاقة تظهر دائرة صغيرة بشعار التطبيق
 * على حافة الشاشة فوق أي تطبيق، لا تغطّي شيئًا. لمسُها يفتح نافذة البطاقة الكاملة، وسحبُها إلى أسفل الشاشة يخفيها.
 * الفقاعة نافذة فوق التطبيقات (إذن SYSTEM_ALERT_WINDOW نفسه الذي تستعمله النافذة)، والخدمة الأمامية تُبقيها حيّة
 * ما دامت ظاهرة (يشترط أندرويد معها إشعارًا ثابتًا صغيرًا).
 */
public class BubbleService extends Service {
    private static final String CHANNEL = "bubble";
    private static final int NOTE_ID = 7700;

    private static View bubble, trash;
    private static String json, cardId;
    private static int back; // كم مرة عادت هذه الفقاعة بعد إخفائها
    private static int noteId; // إشعار البطاقة نفسها، يُزال حين تُفتح الفقاعة

    /** آخر بطاقة ظهرت فقاعتُها (تُحفظ لأن عودة الفقاعة بعد ساعة قد تجد التطبيق قد أُغلق) */
    public static String lastCard(Context ctx) {
        return ctx.getSharedPreferences(PopupScheduler.PREFS, Context.MODE_PRIVATE).getString("bubbleCard", "");
    }

    public static boolean show(Context ctx, String cardJson, String id) { return show(ctx, cardJson, id, 0, 0); }

    /** يُظهر الفقاعة الآن (أو يبدّل بطاقتها إن كانت ظاهرة)، ثم يشغّل الخدمة التي تُبقيها */
    public static boolean show(Context ctx, String cardJson, String id, int backCount, int note) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(ctx)) return false;
        Context app = ctx.getApplicationContext();
        json = cardJson;
        cardId = id;
        back = backCount;
        noteId = note;
        if (backCount == 0) PopupScheduler.cancelBubbleBack(app); // بطاقة جديدة: لا تعود القديمة
        app.getSharedPreferences(PopupScheduler.PREFS, Context.MODE_PRIVATE).edit().putString("bubbleCard", id == null ? "" : id).apply();
        if (bubble == null) addBubble(app);
        // أندرويد 14+ يسمح بتشغيل الخدمة الأمامية من الخلفية لتطبيق له نافذة ظاهرة فوق التطبيقات؛ لذلك تُضاف الفقاعة أولًا
        try {
            Intent s = new Intent(app, BubbleService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) app.startForegroundService(s);
            else app.startService(s);
        } catch (Exception ignored) {
            // إن رُفضت الخدمة تبقى الفقاعة ظاهرة ما دام التطبيق حيًّا
        }
        return true;
    }

    private static int dp(Context c, float v) { return Math.round(v * c.getResources().getDisplayMetrics().density); }

    private static WindowManager.LayoutParams params(int size) {
        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;
        WindowManager.LayoutParams p = new WindowManager.LayoutParams(size, size, type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT);
        p.gravity = Gravity.TOP | Gravity.START;
        return p;
    }

    private static void addBubble(Context app) {
        final WindowManager wm = (WindowManager) app.getSystemService(WINDOW_SERVICE);
        final DisplayMetrics dm = app.getResources().getDisplayMetrics();
        final int size = dp(app, 62);

        // دائرة عاجية بحلقة ذهبية وفي وسطها أيقونة التطبيق
        FrameLayout b = new FrameLayout(app);
        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.OVAL);
        bg.setColor(Color.parseColor("#F6F0E1"));
        bg.setStroke(dp(app, 3), Color.parseColor("#C9A24B"));
        b.setBackground(bg);
        b.setElevation(dp(app, 6));
        ImageView icon = new ImageView(app);
        icon.setImageResource(R.mipmap.ic_launcher_round);
        // الشعار مربّع، فيُقصّ دائرةً ليناسب الفقاعة (طلب المستخدم بعد التجربة)
        icon.setScaleType(ImageView.ScaleType.CENTER_CROP);
        GradientDrawable round = new GradientDrawable();
        round.setShape(GradientDrawable.OVAL);
        round.setColor(Color.parseColor("#0F5C4D"));
        icon.setBackground(round);
        icon.setClipToOutline(true);
        int pad = dp(app, 4);
        FrameLayout.LayoutParams ip = new FrameLayout.LayoutParams(size - 2 * pad, size - 2 * pad, Gravity.CENTER);
        b.addView(icon, ip);

        final WindowManager.LayoutParams p = params(size);
        p.x = dm.widthPixels - size - dp(app, 8);
        p.y = dm.heightPixels / 3;

        // هدف الإخفاء: دائرة «×» تظهر أسفل الشاشة أثناء السحب
        TextView t = new TextView(app);
        t.setText("×");
        t.setTextColor(Color.WHITE);
        t.setTextSize(28);
        t.setGravity(Gravity.CENTER);
        GradientDrawable tbg = new GradientDrawable();
        tbg.setShape(GradientDrawable.OVAL);
        tbg.setColor(Color.parseColor("#B3101A18"));
        t.setBackground(tbg);
        final int ts = dp(app, 60);
        final WindowManager.LayoutParams tp = params(ts);
        tp.flags |= WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE;
        tp.x = (dm.widthPixels - ts) / 2;
        tp.y = dm.heightPixels - ts - dp(app, 90);

        b.setOnTouchListener(new View.OnTouchListener() {
            float sx, sy; int px, py; boolean moved;
            @Override public boolean onTouch(View v, MotionEvent e) {
                switch (e.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        sx = e.getRawX(); sy = e.getRawY(); px = p.x; py = p.y; moved = false;
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        float dx = e.getRawX() - sx, dy = e.getRawY() - sy;
                        if (!moved && Math.hypot(dx, dy) > dp(app, 10)) {
                            moved = true;
                            if (trash == null) { trash = t; try { wm.addView(t, tp); } catch (Exception ignored) {} }
                        }
                        if (moved) { p.x = px + Math.round(dx); p.y = py + Math.round(dy); try { wm.updateViewLayout(v, p); } catch (Exception ignored) {} }
                        return true;
                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL:
                        removeTrash(wm);
                        if (!moved) { open(app); return true; }
                        // تُركت فوق هدف الإخفاء (أسفل الشاشة في الوسط) ← تختفي
                        int cx = p.x + size / 2, cy = p.y + size / 2;
                        if (cy > tp.y - dp(app, 40) && Math.abs(cx - dm.widthPixels / 2) < dp(app, 90)) {
                            String j = json, id = cardId; int n = back + 1, nid = noteId;
                            dismiss(app);
                            // تعود بعد ساعتين مرة واحدة، ومعها إشعارها صامتًا؛ وإن لم تكن ستعود بقي الإشعار (قرار المستخدم 2026-11-12)
                            if (j != null && PopupScheduler.bubbleBack(app, j, id, n, nid)) PopupScheduler.cancelNote(app, nid);
                            return true;
                        }
                        // وإلا تلتصق بأقرب حافّة
                        p.x = cx < dm.widthPixels / 2 ? dp(app, 8) : dm.widthPixels - size - dp(app, 8);
                        try { wm.updateViewLayout(v, p); } catch (Exception ignored) {}
                        return true;
                }
                return false;
            }
        });
        try { wm.addView(b, p); bubble = b; } catch (Exception ignored) { bubble = null; }
    }

    private static void removeTrash(WindowManager wm) {
        if (trash != null) { try { wm.removeView(trash); } catch (Exception ignored) {} trash = null; }
    }

    /** لمس الفقاعة: تختفي وتنفتح نافذة البطاقة الكاملة */
    private static void open(Context app) {
        String j = json, id = cardId; int nid = noteId;
        dismiss(app);
        PopupScheduler.cancelBubbleBack(app); // قُرئت: لا تعود
        PopupScheduler.cancelNote(app, nid); // ولا يبقى إشعارها في أعلى الشاشة
        if (j != null) PopupScheduler.show(app, j, id, nid);
    }

    public static void dismiss(Context app) {
        WindowManager wm = (WindowManager) app.getSystemService(WINDOW_SERVICE);
        removeTrash(wm);
        if (bubble != null) { try { wm.removeView(bubble); } catch (Exception ignored) {} bubble = null; }
        try { app.stopService(new Intent(app, BubbleService.class)); } catch (Exception ignored) {}
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "فقاعة البطاقة", NotificationManager.IMPORTANCE_MIN);
            ch.setDescription("يظهر ما دامت فقاعة البطاقة على شاشتك");
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }
        Intent tap = new Intent(this, BubbleService.class).setAction("open");
        PendingIntent pi = PendingIntent.getService(this, 1, tap, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder nb = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        Notification n = nb.setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("بطاقة من «حبيبنا» تنتظرك ✦")
            .setContentText("المس الفقاعة لتقرأها؛ وإن أخفيتها دون قراءتها عادت بعد ساعتين")
            .setContentIntent(pi)
            .setOngoing(true)
            .build();
        try {
            if (Build.VERSION.SDK_INT >= 34) startForeground(NOTE_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            else startForeground(NOTE_ID, n);
        } catch (Exception e) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (intent != null && "open".equals(intent.getAction())) open(getApplicationContext());
        else if (bubble == null) stopSelf(); // لا فقاعة (أُخفيت أو مات التطبيق): لا داعي للخدمة
        return START_NOT_STICKY;
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (bubble != null) {
            WindowManager wm = (WindowManager) getSystemService(WINDOW_SERVICE);
            removeTrash(wm);
            try { wm.removeView(bubble); } catch (Exception ignored) {}
            bubble = null;
        }
    }
}
