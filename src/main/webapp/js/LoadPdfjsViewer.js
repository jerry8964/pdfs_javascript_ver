/* global document, window */
(function (global) {
  var PDFJS_DIR_LEGACY = "pdf_js_v2.2.228";
  var PDFJS_DIR_MODERN = "pdf_js_v5.4.530-legacy";
  var PREF_COOKIE_NAME = "pdfjs_pref";
  var PROBE_SCRIPT_PATH = "/js/probe-v5-syntax.js";
  var VIEWER_BOOT_TIMEOUT_MS = 6000;

  var initialized = false;
  var decisionResolved = false;
  var decisionCallbacks = [];

  function getGateConfig() {
    var gate = global.__PDFJS_GATE__ || {};
    var pref = normalizePref(gate.pref);
    return {
      pref: pref,
      uaOk: gate.uaOk === true,
      ttlDays: normalizeTtlDays(gate.ttlDays),
      contextPath: typeof gate.contextPath === "string" ? gate.contextPath : ""
    };
  }

  function normalizePref(value) {
    if (value === "v2" || value === "v5") return value;
    return null;
  }

  function normalizeTtlDays(value) {
    var parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed <= 0) return 7;
    return parsed;
  }

  function getContextPath() {
    var gate = getGateConfig();
    if (gate.contextPath) return gate.contextPath;
    var body = document.body;
    if (!body) return "";
    return body.getAttribute("data-context-path") || "";
  }

  function getStaticBasePath() {
    var contextPath = getContextPath();
    if (contextPath) return contextPath + "/static";
    return "/static";
  }

  function normalizeViewerBasePath(url) {
    var value = (url || "").toString();
    var staticBasePath = getStaticBasePath();
    if (staticBasePath === "/static") return value;
    return value.replace(/^\/static(?=\/)/, staticBasePath);
  }

  function setResolvedVersion(version) {
    global.__PDFJS_VERSION__ = version === "v5" ? "v5" : "v2";
    decisionResolved = true;
    flushDecisionCallbacks();
  }

  function flushDecisionCallbacks() {
    while (decisionCallbacks.length > 0) {
      var cb = decisionCallbacks.shift();
      try {
        cb(global.__PDFJS_VERSION__);
      } catch (e) {}
    }
  }

  function whenDecisionReady(callback) {
    if (decisionResolved) {
      callback(global.__PDFJS_VERSION__);
      return;
    }
    decisionCallbacks.push(callback);
  }

  function setPrefCookie(version) {
    var gate = getGateConfig();
    var ttlSeconds = gate.ttlDays * 24 * 60 * 60;
    document.cookie =
      PREF_COOKIE_NAME + "=" + version +
      "; Max-Age=" + ttlSeconds +
      "; Path=/" +
      "; SameSite=Lax" +
      "; Secure";
  }

  function resolvePdfjsDir(version) {
    var current = version || global.__PDFJS_VERSION__ || "v2";
    return current === "v5" ? PDFJS_DIR_MODERN : PDFJS_DIR_LEGACY;
  }

  function encodeFileUrlForViewer(fileUrl) {
    var value = fileUrl || "";
    return encodeURI(value)
      .replace(/\?/g, "%3F")
      .replace(/&/g, "%26")
      .replace(/#/g, "%23");
  }

  function buildViewerUrl(fileUrl, page, forceVersion) {
    var dirName = resolvePdfjsDir(forceVersion);
    var url = getStaticBasePath() + "/" + dirName + "/web/viewer.html?file=" + encodeFileUrlForViewer(fileUrl);
    if (page) {
      url += "#page=" + encodeURIComponent(page);
    }
    return url;
  }

  function resolveViewerUrlFromLink(rawLink, forceVersion) {
    var input = (rawLink || "").toString().trim();
    if (!input) return input;

    var marker = "/web/viewer.html?file=";
    var markerIndex = input.indexOf(marker);
    if (markerIndex >= 0) {
      var afterMarker = input.slice(markerIndex + marker.length);
      var hashIndex = afterMarker.indexOf("#");
      var encodedFile = hashIndex >= 0 ? afterMarker.slice(0, hashIndex) : afterMarker;
      var hash = hashIndex >= 0 ? afterMarker.slice(hashIndex) : "";

      var fileUrl = encodedFile;
      try {
        fileUrl = decodeURIComponent(encodedFile);
      } catch (e) {
        fileUrl = encodedFile;
      }
      var rebuilt = buildViewerUrl(fileUrl, "", forceVersion);
      return hash ? rebuilt + hash : rebuilt;
    }

    if (/\.pdf(?:$|[?#])/i.test(input)) {
      var hashMatch = /#(?:.*&)?page=([^&]+)/.exec(input);
      var page = hashMatch ? hashMatch[1] : "";
      var fileOnly = input.split("#")[0];
      return buildViewerUrl(fileOnly, page, forceVersion);
    }

    return input;
  }

  function isModernViewerUrl(viewerUrl) {
    return !!viewerUrl && viewerUrl.indexOf(PDFJS_DIR_MODERN) >= 0;
  }

  function canAccessViewerWindow(win) {
    try {
      return !!(win && win.location && typeof win.location.href === "string");
    } catch (e) {
      return false;
    }
  }

  function isViewerReady(win) {
    try {
      if (!win) return false;
      var app = win.PDFViewerApplication;
      if (!app) return false;
      if (app.initialized === true) return true;
      if (app.pdfViewer) return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  function downgradeToV2() {
    if (global.__PDFJS_VERSION__ !== "v2") {
      global.__PDFJS_VERSION__ = "v2";
    }
    setPrefCookie("v2");
  }

  // v5 运行时失败时，统一降级到 v2 并整页重载（仅触发一次）。
  function downgradeToV2AndReload() {
    downgradeToV2();
    if (global.__PDFJS_V5_RELOAD_TRIGGERED__ === true) return;
    global.__PDFJS_V5_RELOAD_TRIGGERED__ = true;
    try {
      global.location.reload();
    } catch (e) {}
  }

  function applyRuntimeFallbackForFrame(target, modernUrl) {
    if (!target || !modernUrl || !isModernViewerUrl(modernUrl)) return;

    var startedAt = Date.now();
    var done = false;

    function fallbackToLegacy() {
      if (done) return;
      done = true;
      downgradeToV2AndReload();
    }

    function finish() {
      done = true;
    }

    target.addEventListener("error", fallbackToLegacy, { once: true });
    target.addEventListener("load", function () {
      var timer = global.setInterval(function () {
        if (done) {
          global.clearInterval(timer);
          return;
        }
        var win = target.contentWindow;
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
    }, { once: true });
  }

  function monitorPopupAndFallback(popup, modernUrl) {
    if (!popup || !modernUrl || !isModernViewerUrl(modernUrl)) return;

    var startedAt = Date.now();
    var timer = global.setInterval(function () {
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
        downgradeToV2AndReload();
        global.clearInterval(timer);
      }
    }, 250);
  }

  function ensureViewerUrl(element) {
    if (!element) return "";
    var template = element.getAttribute("data-viewer-template");
    if (!template) {
      return resolveViewerUrlFromLink(element.getAttribute("href") || "");
    }

    var current = element.getAttribute("data-viewer-url") || "";
    if (current && current.indexOf("{pdfjs-dir-name}") < 0) {
      return current;
    }

    var dirName = resolvePdfjsDir();
    var fileUrl = element.getAttribute("data-pdf-url") || "";
    var page = element.getAttribute("data-page") || "1";

    var resolved = template
      .replace(/\{pdfjs-dir-name\}/g, dirName)
      .replace(/\{pdf-file-url-encoded\}/g, encodeFileUrlForViewer(fileUrl))
      .replace(/\{pdf-file-url\}/g, fileUrl)
      .replace(/\{page\}/g, encodeURIComponent(page));
    resolved = normalizeViewerBasePath(resolved);

    element.setAttribute("data-viewer-url", resolved);
    return resolved;
  }

  function applyAllTemplates(root) {
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
      } else if (tag === "IFRAME" || tag === "FRAME") {
        if (element.getAttribute("data-auto-load") === "true") {
          element.src = viewerUrl;
          applyRuntimeFallbackForFrame(element, viewerUrl);
        }
      }
    });
  }

  function setIframeViewer(iframeId, viewerUrl) {
    var iframe = document.getElementById(iframeId);
    if (!iframe) return false;
    iframe.src = viewerUrl || "about:blank";
    applyRuntimeFallbackForFrame(iframe, viewerUrl);
    return false;
  }

  function openWin(url, winName) {
    var popup = global.open(url, winName || "pdf_viewer", "width=1000,height=700,scrollbars=yes,resizable=yes");
    monitorPopupAndFallback(popup, url);
    return false;
  }

  function openPdfViewer(link, option) {
    var rewrittenLink = resolveViewerUrlFromLink(link);
    try {
      if (typeof global.openReportWithOption === "function") {
        return global.openReportWithOption(rewrittenLink, option);
      }
      return false;
    } catch (e) {
      downgradeToV2AndReload();
      return false;
    }
  }

  function installClickFallback() {
    document.addEventListener("click", function (event) {
      var node = event.target;
      while (node && node !== document) {
        if (node.nodeType === 1 && node.hasAttribute && node.hasAttribute("data-viewer-template")) {
          var url = ensureViewerUrl(node);
          if (!url) return;
          if (node.tagName === "A" && node.getAttribute("data-link-mode") === "blank") {
            event.preventDefault();
            var popup = global.open(url, "_blank", "noopener,noreferrer");
            monitorPopupAndFallback(popup, url);
          }
          return;
        }
        node = node.parentNode;
      }
    }, true);
  }

  function resolveGateDecision() {
    var gate = getGateConfig();
    if (gate.pref) {
      setResolvedVersion(gate.pref);
      return;
    }
    if (!gate.uaOk) {
      setResolvedVersion("v2");
      setPrefCookie("v2");
      return;
    }

    global.__PDFJS_V5_SYNTAX_OK__ = false;
    var probe = document.createElement("script");
    probe.src = getContextPath() + PROBE_SCRIPT_PATH;
    probe.async = true;
    probe.onload = function () {
      if (global.__PDFJS_V5_SYNTAX_OK__ === true) {
        setResolvedVersion("v5");
        setPrefCookie("v5");
      } else {
        setResolvedVersion("v2");
        setPrefCookie("v2");
      }
    };
    probe.onerror = function () {
      setResolvedVersion("v2");
      setPrefCookie("v2");
    };
    document.head.appendChild(probe);
  }

  function initPage() {
    if (initialized) return;
    initialized = true;
    resolveGateDecision();
    whenDecisionReady(function () {
      applyAllTemplates(document);
    });
  }

  global.PdfViewerRouter = {
    initPage: initPage,
    buildViewerUrl: buildViewerUrl,
    setIframeViewer: setIframeViewer,
    openWin: openWin,
    ensureViewerUrl: ensureViewerUrl,
    resolveViewerUrlFromLink: resolveViewerUrlFromLink,
    openPdfViewer: openPdfViewer
  };

  installClickFallback();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
  } else {
    initPage();
  }
})(window);
