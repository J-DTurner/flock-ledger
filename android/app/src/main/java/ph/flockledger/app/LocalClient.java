package ph.flockledger.app;
import android.webkit.WebView;
import android.webkit.WebViewClient;
/** Block navigation from content; only MainActivity loads the bundled document. */
public final class LocalClient extends WebViewClient {
    @Override public boolean shouldOverrideUrlLoading(WebView view, String url) { return true; }
}
