package tn.habibuna.app;

import android.content.ComponentName;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** نوع الهاتف، وفتح صفحة إعدادات التطبيق (وصفحة «التشغيل التلقائي» في شاومي) لإرشاد المستخدم */
@CapacitorPlugin(name = "PhoneSettings")
public class PhoneSettingsPlugin extends Plugin {

    @PluginMethod
    public void info(PluginCall call) {
        JSObject r = new JSObject();
        r.put("manufacturer", Build.MANUFACTURER);
        r.put("brand", Build.BRAND);
        call.resolve(r);
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", getContext().getPackageName(), null));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    /** صفحة «التشغيل التلقائي» في شاومي إن وُجدت، وإلا صفحة إعدادات التطبيق */
    @PluginMethod
    public void openAutostart(PluginCall call) {
        // شاومي، ثم «تشغيل التطبيقات» في هواوي (EMUI 9 وما بعده، ثم الأقدم)
        String[][] screens = {
            {"com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"},
            {"com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"},
            {"com.huawei.systemmanager", "com.huawei.systemmanager.appcontrol.activity.StartupAppControlActivity"},
        };
        for (String[] c : screens) {
            try {
                Intent i = new Intent();
                i.setComponent(new ComponentName(c[0], c[1]));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                JSObject r = new JSObject();
                r.put("opened", "autostart");
                call.resolve(r);
                return;
            } catch (Exception ignored) {}
        }
        openAppSettings(call);
    }

    /** هل سمح المستخدم بـ«الظهور فوق التطبيقات الأخرى»؟ (شرط نافذة البطاقة) */
    @PluginMethod
    public void canOverlay(PluginCall call) {
        JSObject r = new JSObject();
        r.put("allowed", Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            openAppSettings(call);
        }
    }

    /** شاومي: صفحة أذونات التطبيق، وفيها «عرض النوافذ المنبثقة أثناء التشغيل في الخلفية» */
    @PluginMethod
    public void openPopupPermissions(PluginCall call) {
        try {
            Intent i = new Intent("miui.intent.action.APP_PERM_EDITOR");
            i.setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.PermissionsEditorActivity");
            i.putExtra("extra_pkgname", getContext().getPackageName());
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            openAppSettings(call);
        }
    }

    /** items: [{id, at, json, cardId}]؛ قائمة فارغة تُلغي كل النوافذ المجدولة */
    @PluginMethod
    public void schedulePopups(PluginCall call) {
        JSArray items = call.getArray("items", new JSArray());
        PopupScheduler.scheduleAll(getContext(), items);
        call.resolve();
    }

    @PluginMethod
    public void previewPopup(PluginCall call) {
        JSObject r = new JSObject();
        r.put("shown", PopupScheduler.show(getContext(), call.getString("json", "{}"), call.getString("cardId", "")));
        call.resolve(r);
    }

    /** البطاقة التي طلب المستخدم فتحها من النافذة (تُقرأ مرة واحدة) */
    @PluginMethod
    public void takeOpenCard(PluginCall call) {
        android.content.SharedPreferences p = getContext().getSharedPreferences(PopupScheduler.PREFS, android.content.Context.MODE_PRIVATE);
        JSObject r = new JSObject();
        r.put("id", p.getString("openCard", null));
        p.edit().remove("openCard").apply();
        call.resolve(r);
    }

    /** ضغطات «اللهم صلِّ وسلِّم» في نافذة البطاقة منذ آخر قراءة: {يوم: عدد}، ثم تُمسح (يحفظها التطبيق عنده) */
    @PluginMethod
    public void takePrays(PluginCall call) {
        android.content.SharedPreferences p = getContext().getSharedPreferences(PopupScheduler.PREFS, android.content.Context.MODE_PRIVATE);
        JSObject r = new JSObject();
        r.put("days", p.getString("prays", "{}"));
        p.edit().remove("prays").apply();
        call.resolve(r);
    }

    /**
     * إذن شاومي «عرض النوافذ المنبثقة أثناء التشغيل في الخلفية» (طريقة غير رسمية تستعملها تطبيقات كثيرة:
     * العملية 10021 في AppOpsManager على MIUI/HyperOS). allowed / denied / unknown إن لم تنجح القراءة.
     */
    @PluginMethod
    public void bgPopupState(PluginCall call) {
        JSObject r = new JSObject();
        String state = "unknown";
        try {
            if ("xiaomi".equalsIgnoreCase(Build.MANUFACTURER)) {
                android.app.AppOpsManager ops = (android.app.AppOpsManager) getContext().getSystemService(android.content.Context.APP_OPS_SERVICE);
                java.lang.reflect.Method m = android.app.AppOpsManager.class.getMethod("checkOpNoThrow", int.class, int.class, String.class);
                int mode = (Integer) m.invoke(ops, 10021, android.os.Process.myUid(), getContext().getPackageName());
                state = mode == android.app.AppOpsManager.MODE_ALLOWED ? "allowed" : "denied";
            }
        } catch (Throwable ignored) { }
        r.put("state", state);
        call.resolve(r);
    }

    /** مشاركة صورة البطاقة ونصها بقائمة المشاركة في أندرويد (WebView لا يدعم navigator.share) */
    @PluginMethod
    public void shareImage(PluginCall call) {
        try {
            byte[] png = android.util.Base64.decode(call.getString("base64", ""), android.util.Base64.DEFAULT);
            java.io.File dir = new java.io.File(getContext().getCacheDir(), "share");
            if (!dir.exists()) dir.mkdirs();
            java.io.File f = new java.io.File(dir, "habibuna-card.png");
            java.io.FileOutputStream o = new java.io.FileOutputStream(f);
            o.write(png);
            o.close();
            Uri uri = androidx.core.content.FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", f);
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType("image/png");
            i.putExtra(Intent.EXTRA_STREAM, uri);
            i.putExtra(Intent.EXTRA_TEXT, call.getString("text", ""));
            i.setClipData(android.content.ClipData.newRawUri("", uri));
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(i, "مشاركة البطاقة");
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            if (getActivity() != null) getActivity().startActivity(chooser);
            else { chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); getContext().startActivity(chooser); }
            call.resolve();
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }
}
