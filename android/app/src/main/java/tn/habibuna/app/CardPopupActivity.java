package tn.habibuna.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * نافذة البطاقة التي تظهر على الشاشة في موعدها، فوق أي تطبيق مفتوح.
 * تعرض public/popup.html (التصميم نفسه في الويب)، وتُغلق أو تفتح التطبيق عبر habibuna://close و habibuna://open.
 */
public class CardPopupActivity extends Activity {
    public static final String EXTRA_JSON = "json";
    public static final String EXTRA_CARD_ID = "cardId";
    private WebView web;
    private String cardId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        w.setBackgroundDrawableResource(android.R.color.transparent);
        w.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        w.setStatusBarColor(Color.TRANSPARENT);
        w.setNavigationBarColor(Color.TRANSPARENT);
        web = new WebView(this);
        web.setBackgroundColor(Color.TRANSPARENT);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setAllowFileAccess(true);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!"habibuna".equals(u.getScheme())) return false;
                if ("open".equals(u.getHost())) openApp(); else finish();
                return true;
            }
        });
        setContentView(web);
        show(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        show(intent);
    }

    private void show(Intent i) {
        String json = i.getStringExtra(EXTRA_JSON);
        cardId = i.getStringExtra(EXTRA_CARD_ID);
        if (json == null) { finish(); return; }
        // معامل t يجبر الصفحة على إعادة التحميل حين تصل بطاقة جديدة والنافذة مفتوحة
        web.loadUrl("file:///android_asset/public/popup.html?t=" + System.currentTimeMillis() + "#" + Uri.encode(json));
    }

    /** «اقرأ المصدر والشرح»: يُحفظ رقم البطاقة ليفتحها التطبيق (takeOpenCard)، ثم يُفتح التطبيق */
    private void openApp() {
        if (cardId != null) getSharedPreferences(PopupScheduler.PREFS, MODE_PRIVATE).edit().putString("openCard", cardId).apply();
        Intent i = new Intent(this, MainActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(i);
        finish();
    }

    @Override
    public void finish() {
        super.finish();
        overridePendingTransition(0, android.R.anim.fade_out);
    }
}
