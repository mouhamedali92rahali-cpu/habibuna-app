package tn.habibuna.app;

import android.content.ComponentName;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

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
}
