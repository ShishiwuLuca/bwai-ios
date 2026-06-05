import UIKit
import WebKit
import Capacitor

/// WKWebView 绘制修复。禁止在 viewDidLayoutSubviews 里改 frame/layout（会无限递归崩溃）。
@objc(BWBridgeViewController)
class BWBridgeViewController: CAPBridgeViewController {

    private let pageBg = UIColor(red: 9 / 255, green: 13 / 255, blue: 32 / 255, alpha: 1)
    private var isRepainting = false

    override func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let config = super.webViewConfiguration(for: instanceConfiguration)
        config.suppressesIncrementalRendering = false
        return config
    }

    override func webView(with frame: CGRect, configuration: WKWebViewConfiguration) -> WKWebView {
        let wv = WKWebView(frame: frame, configuration: configuration)
        wv.isOpaque = true
        wv.backgroundColor = pageBg
        wv.scrollView.backgroundColor = pageBg
        if #available(iOS 15.0, *) {
            wv.underPageBackgroundColor = pageBg
        }
        return wv
    }

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        view.backgroundColor = pageBg
        scheduleRepaint(after: 0.05)
        scheduleRepaint(after: 0.5)
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        scheduleRepaint(after: 0.1)
    }

    private func scheduleRepaint(after delay: TimeInterval) {
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            self?.forceWebViewRepaint()
        }
    }

    /// 供 AppDelegate 调用；勿触发布局链（不设 frame、不调 layoutIfNeeded）
    @objc func forceWebViewRepaint() {
        guard let webView = webView, !isRepainting else { return }
        isRepainting = true
        defer { isRepainting = false }

        webView.isHidden = false
        webView.alpha = 1
        view.backgroundColor = pageBg
        view.bringSubviewToFront(webView)

        stripSplashSubviews(from: webView)

        let scroll = webView.scrollView
        let offset = scroll.contentOffset
        scroll.setContentOffset(CGPoint(x: offset.x, y: offset.y + 1), animated: false)
        scroll.setContentOffset(offset, animated: false)

        webView.evaluateJavaScript(
            "void(document.body.offsetHeight);",
            completionHandler: nil
        )
    }

    private func stripSplashSubviews(from webView: WKWebView) {
        for sub in webView.subviews {
            if sub is UIScrollView { continue }
            let name = String(describing: type(of: sub))
            if name.contains("Splash") || name.contains("Launch") {
                sub.removeFromSuperview()
            }
        }
    }
}
