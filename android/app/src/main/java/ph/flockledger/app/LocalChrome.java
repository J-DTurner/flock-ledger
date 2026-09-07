package ph.flockledger.app;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.JsPromptResult;
/** Default WebChromeClient confirm/alert behavior is kept for user confirmations. */
public final class LocalChrome extends WebChromeClient {
    public final MainActivity owner;
    public LocalChrome(MainActivity owner) { this.owner = owner; }
    @Override public boolean onJsPrompt(WebView view, String url, String message, String value, JsPromptResult result) {
        return owner.handlePrompt(url, message, value, result);
    }
}
