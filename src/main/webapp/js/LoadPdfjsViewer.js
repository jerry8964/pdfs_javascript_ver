/* global document, navigator, window */
/*
 * 機能概要:
 * - このファイルは「完全に JavaScript のみ」で PDF.js バージョンを判定する実装です。
 * - 判定入力はブラウザの User-Agent (UA) です。
 * - UA を parseMajor / parseSafariVersion / isLegacy / isSuspiciousUserAgent などの
 *   関数で解析し、v2.2.228 または v5.4.530 を選択します。
 * - Java 側の判定結果は利用しません。
 */
(function () {
  const VIEWER_LEGACY_PATH = "/pc/pdf_js_2.2.228/web/viewer.html";
  const VIEWER_MODERN_PATH = "/pc/pdf_js_5.4.530/web/viewer.html";

  // PDF 表示用のポップアップウィンドウを開く。
  function openWin(url, winName) {
    window.open(url, winName, "width=1000,height=700,scrollbars=yes,resizable=yes");
    return false;
  }

  // UA トークン（例: "Chrome/123"）からメジャーバージョンを取得する。
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

  // Safari の "Version/x.y" から major/minor を解析する（Chromium 系は除外）。
  function parseSafariVersion(userAgent) {
    if (!userAgent.includes("Safari/")) {
      return null;
    }
    if (userAgent.includes("Chrome/") || userAgent.includes("Chromium/") || userAgent.includes("Edg/")) {
      return null;
    }
    const token = "Version/";
    const idx = userAgent.indexOf(token);
    if (idx < 0) {
      return null;
    }
    const start = idx + token.length;
    let end = userAgent.indexOf(" ", start);
    if (end < 0) {
      end = userAgent.length;
    }
    const v = userAgent.substring(start, end);
    const parts = v.split(".");
    const major = parseInt(parts[0], 10);
    if (Number.isNaN(major)) {
      return null;
    }
    if (parts.length >= 2) {
      const minor = parseInt(parts[1], 10);
      if (!Number.isNaN(minor)) {
        return [major, minor];
      }
    }
    return [major, 0];
  }

  // バージョンの組（major, minor）を比較する。
  function compareMajorMinor(aMajor, aMinor, bMajor, bMinor) {
    if (aMajor !== bMajor) {
      return aMajor - bMajor;
    }
    return aMinor - bMinor;
  }

  // IE11 かどうかを判定する。
  function isIE11(userAgent) {
    return userAgent.includes("Trident/7.0") && userAgent.includes("rv:11.0");
  }

  // 不正・不完全な UA や非対応パターンを検出する。
  function isSuspiciousUserAgent(userAgent) {
    const ua = (userAgent || "").trim();
    if (ua.length < 20) {
      return true;
    }
    if (ua.includes("Headless") || ua.includes("PhantomJS") || ua.includes("bot")) {
      return true;
    }
    const hasChrome = ua.includes("Chrome/");
    const hasEdg = ua.includes("Edg/");
    const hasFirefox = ua.includes("Firefox/");
    const hasSafari = ua.includes("Safari/");
    const hasVersion = ua.includes("Version/");

    if (hasFirefox && hasChrome) {
      return true;
    }
    if (hasEdg && !hasChrome) {
      return true;
    }
    if (hasSafari && !hasVersion && !hasChrome && !hasEdg) {
      return true;
    }
    return false;
  }

  // pdf.js v5(Modern) に必要な最低限のモジュール/構文サポートを確認する。
  // いずれかが不足している場合は v2 へフォールバックする。
  function supportsPdfjsV5Runtime() {
    try {
      const script = document.createElement("script");
      if (!("noModule" in script)) {
        return false;
      }
      if (!supportsSyntax("const a={b:1}; return (a?.b ?? 0) === 1;")) {
        return false;
      }
      if (!supportsSyntax("class A{ #x=1; m(){ return this.#x; } } return new A().m() === 1;")) {
        return false;
      }
      if (!supportsDynamicImportSyntax()) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // new Function による構文サポート確認。
  function supportsSyntax(code) {
    try {
      return !!new Function(code)();
    } catch (e) {
      return false;
    }
  }

  // import() 構文の解釈可否を確認する（実行はしない）。
  function supportsDynamicImportSyntax() {
    try {
      new Function("return import('data:text/javascript,export default 0');");
      return true;
    } catch (e) {
      return false;
    }
  }

  // Legacy 判定の閾値ルール:
  // Edge < 110, Chrome < 110, Firefox < 128, Safari < 16.4
  function isLegacy(userAgent) {
    if (isIE11(userAgent)) {
      return true;
    }
    if (userAgent.includes("Edge/")) {
      return true;
    }

    const edgeMajor = parseMajor(userAgent, "Edg/");
    if (edgeMajor > 0) {
      return edgeMajor < 110;
    }

    const chromeMajor = parseMajor(userAgent, "Chrome/");
    if (chromeMajor > 0) {
      return chromeMajor < 110;
    }

    const firefoxMajor = parseMajor(userAgent, "Firefox/");
    if (firefoxMajor > 0) {
      return firefoxMajor < 128;
    }

    const safariVersion = parseSafariVersion(userAgent);
    if (safariVersion) {
      return compareMajorMinor(safariVersion[0], safariVersion[1], 16, 4) < 0;
    }

    return false;
  }

  // このページで使用する viewer パスを最終決定する。
  function selectViewerPath(userAgent) {
    if (!supportsPdfjsV5Runtime()) {
      return VIEWER_LEGACY_PATH;
    }
    if (isSuspiciousUserAgent(userAgent)) {
      return VIEWER_LEGACY_PATH;
    }
    return isLegacy(userAgent)
      ? VIEWER_LEGACY_PATH
      : VIEWER_MODERN_PATH;
  }

  // file/page パラメータをエンコードして viewer URL を組み立てる。
  function buildViewerUrl(viewerPath, fileUrl, page) {
    let url = viewerPath + "?file=" + encodeURIComponent(fileUrl);
    if (page) {
      url += "&page=" + encodeURIComponent(page);
    }
    return url;
  }

  // contextPath と viewerPath を結合し、表示用のバージョン文字列を作る。
  function buildViewerBase() {
    const body = document.body;
    const ctx = body ? body.getAttribute("data-context-path") || "" : "";

    const userAgent = navigator.userAgent || "";
    const viewerPath = selectViewerPath(userAgent);
    const viewerVersion = viewerPath.includes("2.2.228") ? "v2.2.228" : "v5.4.530";
    return {
      contextPath: ctx,
      viewerPath: viewerPath,
      viewerVersion
    };
  }

  // 対象要素（iframe / frame / a[data-pdf-url]）へ viewer URL を直接反映する。
  function applyViewerLinks(contextPath, primaryViewerPath) {
    const elements = document.querySelectorAll("[data-pdf-url]");
    elements.forEach(function (element) {
      const pdfUrl = element.getAttribute("data-pdf-url");
      if (!pdfUrl) {
        return;
      }
      const page = element.getAttribute("data-page") || "";
      const viewerUrl = buildViewerUrl(contextPath + primaryViewerPath, pdfUrl, page);
      if (element.tagName === "IFRAME" || element.tagName === "FRAME") {
        element.src = viewerUrl;
        return;
      }
      if (element.tagName === "A") {
        element.href = viewerUrl;
        if (element.getAttribute("data-openwin") === "true") {
          const winName = element.getAttribute("data-win-name") || "pdf_viewer";
          element.addEventListener("click", function (event) {
            event.preventDefault();
            openWin(viewerUrl, winName);
          });
        }
      }
    });
  }

  // 画面上に選択された viewer バージョンを表示する。
  function applyViewerVersion(viewerVersion) {
    const viewerVersionEl = document.getElementById("viewerVersion");
    if (viewerVersionEl) {
      viewerVersionEl.textContent = viewerVersion;
    }
  }

  // 初期化エントリポイント。
  document.addEventListener("DOMContentLoaded", function () {
    const viewerInfo = buildViewerBase();
    applyViewerLinks(viewerInfo.contextPath, viewerInfo.viewerPath);
    applyViewerVersion(viewerInfo.viewerVersion);
  });
})();
