/* global document, navigator, window */
/*
 * 機能概要:
 * - 4 つの表示パターン（openWin / iframe / a / frameset）で共通利用する版数判定 JS。
 * - 占位子 {pdfjs-path-url} を、判定結果に応じた実パスへ置換する。
 * - openWin は onclick から PdfViewerRouter.openWin(...) 形式で利用する。
 */
(function (global) {
  const PDFJS_BASE_LEGACY = "/pc/static/pdf_js_v2.2.228";
  const PDFJS_BASE_MODERN = "/pc/static/pdf_js_v5.4.530";
  const VIEWER_BOOT_TIMEOUT_MS = 6000;
  let initialized = false;
  let eligibilityCache = null;

  function parseMajor(userAgent, token) {
    const index = userAgent.indexOf(token);
    if (index >= 0) {
      const versionStart = index + token.length;
      const match = /^(\d+)/.exec(userAgent.slice(versionStart));
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return -1;
  }

  function parseSafariVersion(userAgent) {
    if (!userAgent.includes("Safari/")) return null;
    if (userAgent.includes("Chrome/") || userAgent.includes("Chromium/") || userAgent.includes("Edg/")) return null;

    const token = "Version/";
    const idx = userAgent.indexOf(token);
    if (idx < 0) return null;

    const start = idx + token.length;
    let end = userAgent.indexOf(" ", start);
    if (end < 0) end = userAgent.length;

    const parts = userAgent.substring(start, end).split(".");
    const major = parseInt(parts[0], 10);
    if (Number.isNaN(major)) return null;
    const minor = parts.length >= 2 ? parseInt(parts[1], 10) : 0;
    return [major, Number.isNaN(minor) ? 0 : minor];
  }

  function compareMajorMinor(aMajor, aMinor, bMajor, bMinor) {
    if (aMajor !== bMajor) return aMajor - bMajor;
    return aMinor - bMinor;
  }

  function isIE11(userAgent) {
    return userAgent.includes("Trident/7.0") && userAgent.includes("rv:11.0");
  }

  function isSuspiciousUserAgent(userAgent) {
    const ua = (userAgent || "").trim();
    if (ua.length < 20) return true;
    if (ua.includes("Headless") || ua.includes("PhantomJS") || ua.includes("bot")) return true;

    const hasChrome = ua.includes("Chrome/");
    const hasEdg = ua.includes("Edg/");
    const hasFirefox = ua.includes("Firefox/");
    const hasSafari = ua.includes("Safari/");
    const hasVersion = ua.includes("Version/");

    if (hasFirefox && hasChrome) return true;
    if (hasEdg && !hasChrome) return true;
    if (hasSafari && !hasVersion && !hasChrome && !hasEdg) return true;
    return false;
  }

  // v5 の構文要件を明示チェックする。
  function supportsPdfjsV5Syntax() {
    try {
      // Optional Chaining(?.) と Nullish Coalescing(??) は ES2020 で標準化。
      if (!supportsSyntax("const a={b:1}; return (a?.b ?? 0) === 1;")) return false;
      // Private Field(#x) は ES2022 で標準化（提案段階で先行実装はあるが保証しない）。
      if (!supportsSyntax("class A{ #x=1; m(){ return this.#x; } } return new A().m() === 1;")) return false;
      // class static block を解釈・実行できない環境は v5 から除外する。
      if (!supportsSyntax("class A{ static { this.ok = 1; } } return A.ok === 1;")) return false;
      // dynamic import() は ES2020 で標準化（モジュール実行時の遅延読み込み機能）。
      if (!supportsDynamicImportSyntax()) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  function supportsSyntax(code) {
    try {
      return !!new Function(code)();
    } catch (e) {
      return false;
    }
  }

  function supportsDynamicImportSyntax() {
    try {
      const fn = new Function("return import('data:text/javascript,export default 0');");
      const result = fn();
      const ok = !!(result && typeof result.then === "function");
      if (ok) {
        // data: import が拒否されても unhandled rejection を残さない。
        result.then(
          function () {},
          function () {}
        );
      }
      return ok;
    } catch (e) {
      return false;
    }
  }

  // v5 の実行時要件（API/挙動）を明示チェックする。
  function supportsPdfjsV5Runtime() {
    try {
      const script = document.createElement("script");
      if (!("noModule" in script)) return false;
      if (typeof Promise === "undefined" || typeof Promise.allSettled !== "function") return false;
      if (typeof TextDecoder === "undefined") return false;
      if (typeof URL === "undefined") return false;
      if (typeof AbortController === "undefined") return false;
      if (typeof ReadableStream === "undefined") return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  // UA が「公式サポート相当」の範囲に入っているかを明示判定する。
  function isUaSupportedForV5(userAgent) {
    if (!userAgent) return false;
    if (isSuspiciousUserAgent(userAgent)) return false;
    if (isIE11(userAgent) || userAgent.includes("Edge/")) return false;

    const edgeMajor = parseMajor(userAgent, "Edg/");
    if (edgeMajor > 0) return edgeMajor >= 110;

    const chromeMajor = parseMajor(userAgent, "Chrome/");
    if (chromeMajor > 0) return chromeMajor >= 110;

    const firefoxMajor = parseMajor(userAgent, "Firefox/");
    if (firefoxMajor > 0) return firefoxMajor >= 128;

    const safariVersion = parseSafariVersion(userAgent);
    if (safariVersion) return compareMajorMinor(safariVersion[0], safariVersion[1], 16, 4) >= 0;

    // 判別不能 UA は v5 に上げず、安全側で v2 を使う。
    return false;
  }

  function resolveV5Eligibility() {
    if (eligibilityCache) return eligibilityCache;
    const userAgent = navigator.userAgent || "";
    const uaOk = isUaSupportedForV5(userAgent);
    const syntaxOk = supportsPdfjsV5Syntax();
    const runtimeOk = supportsPdfjsV5Runtime();
    eligibilityCache = {
      uaOk: uaOk,
      syntaxOk: syntaxOk,
      runtimeOk: runtimeOk,
      useV5: uaOk && syntaxOk && runtimeOk
    };
    return eligibilityCache;
  }

  function getLegacyViewerUrl(viewerUrl) {
    if (!viewerUrl) return "";
    return viewerUrl.replace(PDFJS_BASE_MODERN, PDFJS_BASE_LEGACY);
  }

  function isModernViewerUrl(viewerUrl) {
    return !!viewerUrl && viewerUrl.indexOf(PDFJS_BASE_MODERN) >= 0;
  }

  function canAccessViewerWindow(win) {
    try {
      return !!(win && win.location && typeof win.location.href === "string");
    } catch (e) {
      return false;
    }
  }

  // PDF.js viewer 初期化の成功を親側から監視する。
  function isViewerReady(win) {
    try {
      if (!win) return false;
      const app = win.PDFViewerApplication;
      if (!app) return false;
      if (app.initialized === true) return true;
      if (app.pdfViewer) return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  function applyRuntimeFallbackForFrame(target, modernUrl) {
    if (!target || !modernUrl || !isModernViewerUrl(modernUrl)) return;
    const legacyUrl = getLegacyViewerUrl(modernUrl);
    if (!legacyUrl || legacyUrl === modernUrl) return;

    const startedAt = Date.now();
    let done = false;

    function fallbackToLegacy() {
      if (done) return;
      done = true;
      target.src = legacyUrl;
    }

    function finish() {
      done = true;
    }

    target.addEventListener("error", fallbackToLegacy, { once: true });
    target.addEventListener(
      "load",
      function () {
        const timer = global.setInterval(function () {
          if (done) {
            global.clearInterval(timer);
            return;
          }
          const win = target.contentWindow;
          if (isViewerReady(win)) {
            finish();
            global.clearInterval(timer);
            return;
          }
          if (Date.now() - startedAt > VIEWER_BOOT_TIMEOUT_MS) {
            global.clearInterval(timer);
            fallbackToLegacy();
          }
        }, 200);
      },
      { once: true }
    );
  }

  // openWin / target=_blank で開いた別ウィンドウの初期化失敗を監視し、v2 へ降格する。
  function monitorPopupAndFallback(popup, modernUrl) {
    if (!popup || !modernUrl || !isModernViewerUrl(modernUrl)) return;
    const legacyUrl = getLegacyViewerUrl(modernUrl);
    if (!legacyUrl || legacyUrl === modernUrl) return;

    const startedAt = Date.now();
    const timer = global.setInterval(function () {
      if (!popup || popup.closed) {
        global.clearInterval(timer);
        return;
      }
      if (!canAccessViewerWindow(popup)) {
        global.clearInterval(timer);
        return;
      }
      if (isViewerReady(popup)) {
        global.clearInterval(timer);
        return;
      }
      if (Date.now() - startedAt > VIEWER_BOOT_TIMEOUT_MS) {
        popup.location.replace(legacyUrl);
        global.clearInterval(timer);
      }
    }, 250);
  }

  function getContextPath() {
    if (global.__APP_CONTEXT_PATH__ != null) return global.__APP_CONTEXT_PATH__;
    const body = document.body;
    if (!body) return "";
    return body.getAttribute("data-context-path") || "";
  }

  function resolvePdfjsBasePath() {
    const result = resolveV5Eligibility();
    return result.useV5 ? PDFJS_BASE_MODERN : PDFJS_BASE_LEGACY;
  }

  function resolveViewerVersion() {
    return resolvePdfjsBasePath() === PDFJS_BASE_MODERN ? "v5.4.530" : "v2.2.228";
  }

  function resolveViewerDecision() {
    const result = resolveV5Eligibility();
    if (result.useV5) return "v5.4.530 (UA+Syntax+Runtime)";
    if (!result.uaOk) return "v2.2.228 (UA NG)";
    if (!result.syntaxOk) return "v2.2.228 (Syntax NG)";
    if (!result.runtimeOk) return "v2.2.228 (Runtime NG)";
    return "v2.2.228";
  }

  // viewer.html の file= パラメータ用エンコード。
  // 重要: v2 互換のため "/" は保持しつつ、クエリを壊す文字だけをエスケープする。
  function encodeFileUrlForViewer(fileUrl) {
    const value = fileUrl || "";
    return encodeURI(value)
      .replace(/\?/g, "%3F")
      .replace(/&/g, "%26")
      .replace(/#/g, "%23");
  }

  function buildViewerUrl(fileUrl, page) {
    const contextPath = getContextPath();
    const basePath = resolvePdfjsBasePath();
    let url = contextPath + basePath + "/web/viewer.html?file=" + encodeFileUrlForViewer(fileUrl);
    if (page) {
      url += "#page=" + encodeURIComponent(page);
    }
    return url;
  }

  function openWin(url, winName) {
    const popup = global.open(url, winName || "pdf_viewer", "width=1000,height=700,scrollbars=yes,resizable=yes");
    monitorPopupAndFallback(popup, url);
    return false;
  }

  function setIframeViewer(iframeId, viewerUrl) {
    const iframe = document.getElementById(iframeId);
    if (!iframe) return false;
    iframe.src = viewerUrl || "about:blank";
    applyRuntimeFallbackForFrame(iframe, viewerUrl);
    return false;
  }

  function resolveTemplate(element) {
    const template = element.getAttribute("data-viewer-template");
    if (!template) return "";

    const contextPath = getContextPath();
    const basePath = contextPath + resolvePdfjsBasePath();
    const fileUrl = element.getAttribute("data-pdf-url") || "";
    const page = element.getAttribute("data-page") || "1";

    return template
      .replace(/\{pdfjs-path-url\}/g, basePath)
      .replace(/\{pdf-file-url-encoded\}/g, encodeFileUrlForViewer(fileUrl))
      .replace(/\{pdf-file-url\}/g, fileUrl)
      .replace(/\{page\}/g, encodeURIComponent(page));
  }

  function applyAllTemplates(root) {
    const scope = root || document;
    const elements = scope.querySelectorAll("[data-viewer-template]");

    elements.forEach(function (element) {
      const viewerUrl = resolveTemplate(element);
      if (!viewerUrl) return;

      element.setAttribute("data-viewer-url", viewerUrl);

      const tag = element.tagName;
      if (tag === "A") {
        if (element.getAttribute("data-link-mode") === "blank") {
          element.href = viewerUrl;
          element.target = "_blank";
          element.rel = "noopener noreferrer";
        }
      } else if (tag === "IFRAME" || tag === "FRAME") {
        // 自動ロード指定のときのみ初期表示を設定する。
        if (element.getAttribute("data-auto-load") === "true") {
          element.src = viewerUrl;
          applyRuntimeFallbackForFrame(element, viewerUrl);
        }
      }
    });
  }

  // 念のため: 必要時に data-viewer-url を再計算する。
  function ensureViewerUrl(element) {
    if (!element) return "";
    const current = element.getAttribute("data-viewer-url") || "";
    if (current && current.indexOf("{pdfjs-path-url}") < 0) {
      return current;
    }
    const resolved = resolveTemplate(element);
    if (resolved) {
      element.setAttribute("data-viewer-url", resolved);
    }
    return resolved;
  }

  // クリック直前に URL を補完する（初期化漏れ時の保険）。
  function installClickFallback() {
    document.addEventListener(
      "click",
      function (event) {
        let node = event.target;
        while (node && node !== document) {
          if (node.nodeType === 1 && node.hasAttribute && node.hasAttribute("data-viewer-template")) {
            const url = ensureViewerUrl(node);
            if (!url) {
              return;
            }
            // target=_blank リンクの補完
            if (node.tagName === "A" && node.getAttribute("data-link-mode") === "blank") {
              event.preventDefault();
              const popup = global.open(url, "_blank", "noopener,noreferrer");
              monitorPopupAndFallback(popup, url);
            }
            return;
          }
          node = node.parentNode;
        }
      },
      true
    );
  }

  function applyViewerVersion() {
    const el = document.getElementById("viewerVersion");
    if (el) el.textContent = resolveViewerDecision();
  }

  function initPage() {
    if (initialized) return;
    initialized = true;
    applyAllTemplates(document);
    applyViewerVersion();
  }

  global.openWin = global.openWin || openWin;
  global.PdfViewerRouter = {
    initPage: initPage,
    buildViewerUrl: buildViewerUrl,
    resolveViewerVersion: resolveViewerVersion,
    setIframeViewer: setIframeViewer,
    openWin: openWin,
    ensureViewerUrl: ensureViewerUrl
  };

  installClickFallback();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
  } else {
    initPage();
  }
})(window);
