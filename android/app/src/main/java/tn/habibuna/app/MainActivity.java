package tn.habibuna.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PhoneSettingsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
