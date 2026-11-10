package tn.habibuna.app;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PhoneSettingsPlugin.class);
        keepOpenCard(getIntent());
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        keepOpenCard(intent);
        super.onNewIntent(intent);
    }

    /** لمس بطاقة الشاشة الرئيسية: يُحفظ رقمها ليفتحها التطبيق (takeOpenCard) كما تفعل النافذة */
    private void keepOpenCard(Intent i) {
        String id = i == null ? null : i.getStringExtra(CardWidget.EXTRA_OPEN);
        if (id != null && !id.isEmpty()) {
            getSharedPreferences(PopupScheduler.PREFS, MODE_PRIVATE).edit().putString("openCard", id).apply();
            i.removeExtra(CardWidget.EXTRA_OPEN);
        }
    }
}
