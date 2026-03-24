/* global document, window */
(function (global) {
  var initialized = false;
  var DIR_V2 = "pdf_js_2.2.8";
  var DIR_V5 = "pdf_js_5.4.530-legacy";

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

  function rewritePathnameOnly(pathname) {
    // 判定結果が v2 の場合は v5 トークンがあれば v2 に戻す。
    // 判定結果が v5 の場合のみ v2 トークンを v5 に切り替える。
    // 該当トークンがない URL はそのまま返すため、安全側で動作する。
    if (global.__PDFJS_VERSION__ === "v5") {
      return pathname.replace(DIR_V2, DIR_V5);
    }
    return pathname.replace(DIR_V5, DIR_V2);
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

  function toAbsoluteUrlOrNull(raw) {
    try {
      return new URL(raw).href;
    } catch (e1) {
      try {
        return new URL(raw, global.location.href).href;
      } catch (e2) {
        return null;
      }
    }
  }

  function normalizeFileParamForV5(parsed) {
    // v5 のときだけ file パラメータを正規化する。
    // v2 は現行動作を崩さないため、この処理を通さない。
    if (global.__PDFJS_VERSION__ !== "v5") return;

    var fileParam = parsed.searchParams.get("file");
    if (!fileParam) return;

    // まずはそのまま URL 化を試す。
    var normalized = toAbsoluteUrlOrNull(fileParam);
    if (normalized) {
      parsed.searchParams.set("file", normalized);
      return;
    }

    // 失敗時のみ、%3F などを含むケース向けに 1 回だけ復号して再試行する。
    try {
      var decoded = decodeURIComponent(fileParam);
      normalized = toAbsoluteUrlOrNull(decoded);
      if (normalized) {
        parsed.searchParams.set("file", normalized);
      }
    } catch (e) {
      // 正規化できない場合は元の値を維持する（Fail-safe）。
    }
  }

  function rewriteViewerUrl(rawUrl) {
    var input = (rawUrl || "").toString();
    if (!input) return input;

    try {
      // pathname だけを書き換え、query/hash はそのまま維持する。
      var parsed = new URL(input, global.location.href);
      parsed.pathname = rewritePathnameOnly(parsed.pathname);
      normalizeFileParamForV5(parsed);
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
