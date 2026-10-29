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
        try {
            Intent i = new Intent();
            i.setComponent(new ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            JSObject r = new JSObject();
            r.put("opened", "autostart");
            call.resolve(r);
        } catch (Exception e) {
            openAppSettings(call);
        }
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
}
