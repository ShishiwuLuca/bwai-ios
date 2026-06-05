import UIKit
import WebKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        stripSplashOverlaysFromWindows()
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        stripSplashOverlaysFromWindows()
        nudgeWebViewScroll()
    }

    /// 回前台时 Capacitor Splash 偶发仍盖在 WebView 上（与页面同色 #090d20，看起来像空白）
    private func stripSplashOverlaysFromWindows() {
        DispatchQueue.main.async {
            for window in self.keyWindows() {
                self.walkAndRemoveSplash(in: window)
            }
        }
    }

    private func nudgeWebViewScroll() {
        DispatchQueue.main.async {
            for window in self.keyWindows() {
                guard let webView = self.findWebView(in: window) else { continue }
                webView.isHidden = false
                webView.alpha = 1
                let offset = webView.scrollView.contentOffset
                webView.scrollView.setContentOffset(CGPoint(x: offset.x, y: offset.y + 1), animated: false)
                webView.scrollView.setContentOffset(offset, animated: false)
            }
        }
    }

    private func keyWindows() -> [UIWindow] {
        if #available(iOS 13.0, *) {
            return UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap(\.windows)
        }
        return UIApplication.shared.windows
    }

    private func findWebView(in root: UIView) -> WKWebView? {
        if let wv = root as? WKWebView { return wv }
        for sub in root.subviews {
            if let found = findWebView(in: sub) { return found }
        }
        return nil
    }

    private func walkAndRemoveSplash(in root: UIView) {
        let name = String(describing: type(of: root))
        if name.contains("Splash") || name.contains("CAPSplash") {
            root.removeFromSuperview()
            return
        }
        Array(root.subviews).forEach(walkAndRemoveSplash)
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
