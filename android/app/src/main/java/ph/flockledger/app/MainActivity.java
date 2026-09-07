package ph.flockledger.app;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.content.SharedPreferences;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.JsPromptResult;
import android.widget.Toast;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.ByteArrayOutputStream;

/** Offline shell. Only the packaged asset may call the prompt-based bridge.
 * No INTERNET, broad storage, account, location, or camera permission is used.
 */
public final class MainActivity extends Activity {
    public WebView web;
    private static final String LOCAL = "file:///android_asset/index.html";
    public SharedPreferences prefs() { return getSharedPreferences("flock-ledger", 0); }
    public void notice(String text) { Toast.makeText(this, text, Toast.LENGTH_LONG).show(); }

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(0xff37563e);
        getWindow().setNavigationBarColor(0xff25382c);
        web = new WebView(this);
        web.setBackgroundColor(0xfff5f5ef);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false); // android_asset remains loadable; arbitrary files do not.
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setUserAgentString(s.getUserAgentString().concat(" FlockLedger/1"));
        web.setWebChromeClient(new LocalChrome(this));
        web.setWebViewClient(new LocalClient());
        setContentView(web);
        web.loadUrl(LOCAL);
    }

    public boolean handlePrompt(String url, String message, String value, JsPromptResult result) {
        if (!LOCAL.equals(url)) { result.cancel(); return true; }
        try {
            if ("flock:load".equals(message)) {
                result.confirm(prefs().getString("ledger", ""));
                return true;
            }
            if ("flock:save".equals(message)) {
                if (value.length() > 4500000) { result.confirm("too-large"); return true; }
                JSONObject obj = new JSONObject(value);
                if (!"FlockLedger".equals(obj.getString("app"))) { result.confirm("invalid"); return true; }
                SharedPreferences p = prefs();
                boolean saved = p.edit().putString("previous", p.getString("ledger", "")).putString("ledger", value).commit();
                result.confirm(saved ? "ok" : "storage-error");
                return true;
            }
            if ("flock:export".equals(message)) {
                JSONObject obj = new JSONObject(value);
                String text = obj.getString("text");
                if (!prefs().edit().putString("pending-export", text).commit()) {
                    result.confirm("storage-error"); return true;
                }
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType(obj.getString("mime"));
                intent.putExtra(Intent.EXTRA_TITLE, obj.getString("name"));
                startActivityForResult(intent, 101);
                result.confirm("pending");
                return true;
            }
            if ("flock:import".equals(message)) {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                startActivityForResult(intent, 102);
                result.confirm("pending");
                return true;
            }
            if ("flock:take-import".equals(message)) {
                SharedPreferences p = prefs();
                String text = p.getString("pending-import", "");
                p.edit().remove("pending-import").apply();
                result.confirm(text);
                return true;
            }
            if ("flock:exit".equals(message)) {
                result.confirm("ok"); finish(); return true;
            }
            result.cancel(); return true;
        } catch (Exception e) {
            result.confirm("Unable to complete the operation. Try a local file location.");
            return true;
        }
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (result != RESULT_OK || data == null) return;
        try {
            if (request == 101) {
                String text = prefs().getString("pending-export", "");
                try (OutputStream out = getContentResolver().openOutputStream(data.getData(), "wt")) {
                    if (out == null) throw new IllegalArgumentException("No output stream");
                    out.write(text.getBytes("UTF-8"));
                }
                prefs().edit().remove("pending-export").apply();
                notice("Backup or CSV saved to the chosen location.");
            } else if (request == 102) {
                String text;
                try (InputStream in = getContentResolver().openInputStream(data.getData())) {
                    if (in == null) throw new IllegalArgumentException("No input stream");
                    text = readText(in);
                }
                if (!prefs().edit().putString("pending-import", text).commit()) {
                    throw new IllegalStateException("Unable to retain imported text");
                }
                web.evaluateJavascript("window.checkPendingImport&&window.checkPendingImport();", null);
            }
        } catch (Exception e) {
            notice("File could not be read or saved. Choose a local location and a backup under 4.5 MB.");
        }
    }

    public static String readText(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int n;
        while ((n = in.read(buffer)) != -1) {
            out.write(buffer, 0, n);
            if (out.size() > 4500000) throw new IllegalArgumentException("Backup too large");
        }
        return out.toString("UTF-8");
    }

    @Override public void onBackPressed() {
        web.evaluateJavascript("if(!window.nativeBack||!window.nativeBack())window.prompt('flock:exit','');", null);
    }
}
