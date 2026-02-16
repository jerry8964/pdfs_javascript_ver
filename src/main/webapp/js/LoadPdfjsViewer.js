/* global document, navigator, window */
/*
 * 機能概要:
 * - 4 つの表示パターン（openWin / iframe / a / frameset）で共通利用する版数判定 JS。
 * - 占位子 {pdfjs-path-url} を、判定結果に応じた実パスへ置換する。
 * - openWin は onclick から openWin(this.dataset.viewerUrl, ...) 形式で利用する。
 */
(function (global) {
  const PDFJS_BASE_LEGACY = "/pc/static/pdf_js_v2.2.228";
  const PDFJS_BASE_MODERN = "/pc/static/pdf_js_v5.4.530";
  let initialized = false;

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

  function supportsPdfjsV5Runtime() {
    try {
      const script = document.createElement("script");
      if (!("noModule" in script)) return false;
      if (!supportsSyntax("const a={b:1}; return (a?.b ?? 0) === 1;")) return false;
      if (!supportsSyntax("class A{ #x=1; m(){ return this.#x; } } return new A().m() === 1;")) return false;
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
      new Function("return import('data:text/javascript,export default 0');");
      return true;
    } catch (e) {
      return false;
    }
  }

  function isLegacy(userAgent) {
    if (isIE11(userAgent) || userAgent.includes("Edge/")) return true;

    const edgeMajor = parseMajor(userAgent, "Edg/");
    if (edgeMajor > 0) return edgeMajor < 110;

    const chromeMajor = parseMajor(userAgent, "Chrome/");
    if (chromeMajor > 0) return chromeMajor < 110;

    const firefoxMajor = parseMajor(userAgent, "Firefox/");
    if (firefoxMajor > 0) return firefoxMajor < 128;

    const safariVersion = parseSafariVersion(userAgent);
    if (safariVersion) return compareMajorMinor(safariVersion[0], safariVersion[1], 16, 4) < 0;

    return false;
  }

  function getContextPath() {
    if (global.__APP_CONTEXT_PATH__ != null) return global.__APP_CONTEXT_PATH__;
    const body = document.body;
    if (!body) return "";
    return body.getAttribute("data-context-path") || "";
  }

  function resolvePdfjsBasePath() {
    const userAgent = navigator.userAgent || "";
    if (!supportsPdfjsV5Runtime()) return PDFJS_BASE_LEGACY;
    if (isSuspiciousUserAgent(userAgent)) return PDFJS_BASE_LEGACY;
    return isLegacy(userAgent) ? PDFJS_BASE_LEGACY : PDFJS_BASE_MODERN;
  }

  function resolveViewerVersion() {
    return resolvePdfjsBasePath() === PDFJS_BASE_MODERN ? "v5.4.530" : "v2.2.228";
  }

  function buildViewerUrl(fileUrl, page) {
    const contextPath = getContextPath();
    const basePath = resolvePdfjsBasePath();
    let url = contextPath + basePath + "/web/viewer.html?file=" + encodeURIComponent(fileUrl);
    if (page) {
      url += "#page=" + encodeURIComponent(page);
    }
    return url;
  }

  function openWin(url, winName) {
    global.open(url, winName || "pdf_viewer", "width=1000,height=700,scrollbars=yes,resizable=yes");
    return false;
  }

  function setIframeViewer(iframeId, viewerUrl) {
    const iframe = document.getElementById(iframeId);
    if (!iframe) return false;
    iframe.src = viewerUrl || "about:blank";
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
      .replace(/\{pdf-file-url-encoded\}/g, encodeURIComponent(fileUrl))
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
        // 自动加载模式
        if (element.getAttribute("data-auto-load") === "true") {
          element.src = viewerUrl;
        }
      }
    });
  }

  // 兜底: 必要時に data-viewer-url を再計算する。
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
              node.href = url;
              node.target = "_blank";
              node.rel = "noopener noreferrer";
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
    if (el) el.textContent = resolveViewerVersion();
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
