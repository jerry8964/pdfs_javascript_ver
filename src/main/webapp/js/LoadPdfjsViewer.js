/* global document, window */
(function (global) {
  var initialized = false;

  // 受け取ったバージョン候補を v2/v5 のどちらかに正規化する。
  function normalizeVersion(value) {
    return value === "v5" ? "v5" : "v2";
  }

  // ES14 相当の最低要件（findLast/findLastIndex）を確認する。
  function supportsEs14Gate() {
    return (
      typeof Array.prototype.findLast === "function" &&
      typeof Array.prototype.findLastIndex === "function"
    );
  }

  function resolveFinalVersion() {
    // 最終判定:
    // 1) UA 候補が v2 なら即 v2
    // 2) UA 候補が v5 の場合のみ ES 機能を再確認
    // 3) 例外時は必ず v2（Fail-safe）
    try {
      var uaSuggest = normalizeVersion(global.__PDFJS_UA_SUGGEST__);
      if (uaSuggest !== "v5") return "v2";
      return supportsEs14Gate() ? "v5" : "v2";
    } catch (e) {
      return "v2";
    }
  }

  function normalizeBasePath(path) {
    var value = (path || "").toString();
    if (!value) return "/";
    if (value.charAt(0) !== "/") value = "/" + value;
    if (value.charAt(value.length - 1) !== "/") value += "/";
    return value;
  }

  function getViewerPaths() {
    // viewer.html の実パス定義。
    // 環境差分がある場合は include JSP 側のグローバル変数で上書き可能。
    var baseV2 = normalizeBasePath(global.__PDFJS_BASE_V2__ || "/pc/static/js/pdf_js_2.2.8/");
    var baseV5 = normalizeBasePath(global.__PDFJS_BASE_V5__ || "/pc/static/js/pdf_js_5.4.530-legacy/");
    return {
      v2Viewer: baseV2 + "web/viewer.html",
      v5Viewer: baseV5 + "web/viewer.html"
    };
  }

  function replaceViewerPath(pathname) {
    // 安全性優先:
    // 既知の viewer.html パスに完全一致した場合のみ v2/v5 を切り替える。
    var viewers = getViewerPaths();
    if (pathname !== viewers.v2Viewer && pathname !== viewers.v5Viewer) return pathname;
    return global.__PDFJS_VERSION__ === "v5" ? viewers.v5Viewer : viewers.v2Viewer;
  }

  function isExpectedViewerUrl(pathname) {
    var viewers = getViewerPaths();
    return pathname === viewers.v2Viewer || pathname === viewers.v5Viewer;
  }

  function rewritePathnameOnly(pathname) {
    if (!isExpectedViewerUrl(pathname)) return pathname;
    return replaceViewerPath(pathname);
  }

  function isAbsoluteUrl(url) {
    return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url) || /^\/\//.test(url);
  }

  function buildOutputUrl(input, parsed) {
    if (isAbsoluteUrl(input)) {
      return parsed.toString();
    }
    return parsed.pathname + parsed.search + parsed.hash;
  }

  function rewriteViewerUrl(rawUrl) {
    var input = (rawUrl || "").toString();
    if (!input) return input;

    try {
      // pathname だけを書き換え、query/hash はそのまま維持する。
      var parsed = new URL(input, global.location.href);
      parsed.pathname = rewritePathnameOnly(parsed.pathname);
      return buildOutputUrl(input, parsed);
    } catch (e) {
      // URL として解釈できない場合は元文字列を返す。
      return input;
    }
  }

  // data-viewer-template / href から最終 URL を決定して要素に反映する。
  function ensureViewerUrl(element) {
    if (!element) return "";

    var template = element.getAttribute("data-viewer-template");
    if (!template) {
      return rewriteViewerUrl(element.getAttribute("href") || "");
    }
    var resolved = rewriteViewerUrl(template);
    element.setAttribute("data-viewer-url", resolved);
    return resolved;
  }

  function setIframeViewer(iframeId, viewerUrl) {
    var iframe = document.getElementById(iframeId);
    if (!iframe) return false;
    iframe.src = rewriteViewerUrl(viewerUrl || "about:blank");
    return false;
  }

  function openPdfViewer(link, option) {
    var rewritten = rewriteViewerUrl(link);
    if (typeof global.openReportWithOption !== "function") return false;
    return global.openReportWithOption(rewritten, option);
  }

  function applyAllTemplates(root) {
    // data-viewer-template を持つ要素を一括初期化する。
    var scope = root || document;
    var elements = scope.querySelectorAll("[data-viewer-template]");

    Array.prototype.forEach.call(elements, function (element) {
      var viewerUrl = ensureViewerUrl(element);
      if (!viewerUrl) return;

      var tag = element.tagName;
      if (tag === "A") {
        if (element.getAttribute("data-link-mode") === "blank") {
          element.href = viewerUrl;
          element.target = "_blank";
          element.rel = "noopener noreferrer";
        }
      } else if ((tag === "IFRAME" || tag === "FRAME") && element.getAttribute("data-auto-load") === "true") {
        element.src = viewerUrl;
      }
    });
  }

  function initPage() {
    if (initialized) return;
    initialized = true;

    global.__PDFJS_VERSION__ = resolveFinalVersion();
    applyAllTemplates(document);
  }

  global.PdfViewerRouter = {
    initPage: initPage,
    ensureViewerUrl: ensureViewerUrl,
    rewriteViewerUrl: rewriteViewerUrl,
    setIframeViewer: setIframeViewer,
    openPdfViewer: openPdfViewer
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
  } else {
    initPage();
  }
})(window);
