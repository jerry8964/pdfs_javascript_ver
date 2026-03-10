# pdfjs-unified-demo

## 概要
本プロジェクトは、JSP/Java Web アプリで PDF.js の `v2` / `v5` を安全側で自動切替するサンプルです。

- 既定は `v2`
- 条件を満たす場合のみ `v5`
- 既存業務関数の本体（`openWin` / `toFundReportLink`）は維持
- `viewer.html` / `viewer_download.html` の選択は JSP 側で制御

## バージョン判定フロー
最終版の判定は 2 段階です。

1. Java 側 UA 判定（第1ゲート）
2. JavaScript 側 ES 機能判定（第2ゲート）

最終結果は `window.__PDFJS_VERSION__` に保持します（`"v2"` または `"v5"`）。

### 1) Java 側（UA 判定）
対象: `src/main/java/com/example/pdfjs/PdfjsGateUtil.java`

判定条件:
- Chrome `>= 110`
- Edge(Chromium) `>= 110`
- Firefox `>= 115`
- Safari `>= 16.4`（minor まで判定）
- それ以外は `v2`

出力値は `v2` / `v5`。

### 2) JS 側（ES 判定）
対象: `src/main/webapp/js/LoadPdfjsViewer.js`

- UA 判定が `v2` の場合: そのまま `v2`（追加チェックなし）
- UA 判定が `v5` の場合のみ: ES チェック実行
- ES チェック NG: `v2` にフォールバック

ES チェック条件:
- `Array.prototype.findLast`
- `Array.prototype.findLastIndex`

## 共通 include
対象: `src/main/webapp/jsp/include_js_common_pdf.jsp`

役割:
- `window.__PDFJS_UA_SUGGEST__` を出力
- `LoadPdfjsViewer.js` を `defer` 読み込み

注意:
- この include は PDF.js のフル URL を生成しません。
- viewer URL（`viewer.html` / `viewer_download.html`）は各 JSP の `data-viewer-template` で指定します。

## URL 書き換え仕様（現行）
`LoadPdfjsViewer.js` は URL 全体を作り直さず、`pathname` のディレクトリ名のみ置換します。

- `pdf_js_2.2.8` ⇔ `pdf_js_5.4.530-legacy`

特性:
- `viewer.html` / `viewer_download.html` は変更しない
- `query` / `hash` は保持
- 置換対象が無い URL はそのまま返す（Fail-safe）

## 既存業務関数との接続
### openWin 系
対象: `src/main/webapp/js/default.js`

- 既存: `openWin(...)`
- 追加: `openPdfWin(...)`
  - `PdfViewerRouter.rewriteViewerUrl(...)` 適用後に `openWin(...)` 呼び出し

### fund report 系
対象: `src/main/webapp/js/fundreportlink.js`

- 既存: `toFundReportLink(...)`
- 追加: `toFundReportPdfLink(...)`
  - `PdfViewerRouter.rewriteViewerUrl(...)` 適用後に `toFundReportLink(...)` 呼び出し

## JSP サンプル
- `src/main/webapp/jsp/PatternOpenWin.jsp`
- `src/main/webapp/jsp/PatternIframe.jsp`
- `src/main/webapp/jsp/PatternBlankLink.jsp`
- `src/main/webapp/jsp/PatternFrameset.jsp`
- 入口: `src/main/webapp/index.jsp`

## 推奨運用
1. 各 JSP の `data-viewer-template` は v2 URL を基準で記述
2. `onclick` などで `PdfViewerRouter.ensureViewerUrl(this)` を通す
3. 既存処理呼び出しは `openPdfWin(...)` / `toFundReportPdfLink(...)` を利用

この構成により、判定失敗や置換対象外でも元 URL（v2）で表示可能です。

## 非対応（この版でやらないこと）
- syntax probe（`eval` / `new Function`）
- runtime 深度チェック
- 自動リロード回退
- エラーイベント監視
- Cookie 固定戦略

## 動作環境
- JDK 8+
- Maven
- JSP/Servlet コンテナ（Tomcat など）

## ビルド
```bash
mvn clean package
```
