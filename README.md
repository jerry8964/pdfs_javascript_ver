# pdfjs-unified-demo

## 目的
このプロジェクトは、PDF.js の表示バージョンを安全側で自動切替するサンプルです。

- デフォルトは `v2`
- 条件を満たす場合のみ `v5` を使用
- 既存業務関数（`openWin` / `toFundReportLink`）の本体ロジックは維持

## 現在の切替方式（最終仕様）
判定は 2 段階です。

1. Java 側 UA 判定（第1ゲート）
2. JavaScript 側 ES 機能判定（第2ゲート）

最終的な表示バージョンは `window.__PDFJS_VERSION__` に保持されます（`"v2"` or `"v5"`）。

### 1) Java 側 UA 判定
`src/main/java/com/example/pdfjs/PdfjsGateUtil.java`

- Chrome `>= 110`
- Edge(Chromium) `>= 110`
- Firefox `>= 115`
- Safari `>= 16.4`（minor まで判定）
- 上記以外は `v2`

判定結果は `v2` / `v5` として JSP に渡します。

### 2) JS 側 ES 機能判定
`src/main/webapp/js/LoadPdfjsViewer.js`

- Java 側が `v2` を返した場合はそのまま `v2`
- Java 側が `v5` 候補の場合のみ ES 判定を実施
- ES 判定 NG の場合は `v2`

ES 判定は軽量条件として以下を使用しています。

- `Array.prototype.findLast`
- `Array.prototype.findLastIndex`

## 共通 include
`src/main/webapp/jsp/include_js_common_pdf.jsp`

役割:
- `window.__PDFJS_UA_SUGGEST__` を出力
- PDF.js のベースパスを出力
  - `window.__PDFJS_BASE_V2__ = '/pc/static/js/pdf_js_2.2.8/'`
  - `window.__PDFJS_BASE_V5__ = '/pc/static/js/pdf_js_5.4.530-legacy/'`
- `LoadPdfjsViewer.js` を `defer` で読み込み

PDF.js を使う JSP は、この include を `<head>` で読み込んでください。

## URL 変換ルール
`LoadPdfjsViewer.js` の `PdfViewerRouter.rewriteViewerUrl(url)` で以下のみを置換します。

- `/pdf_js_2.2.8/` ⇔ `/pdf_js_5.4.530-legacy/`

`query` / `hash` / `file` パラメータ文字列は壊さない方針です。

## 既存業務関数との連携
### openWin 系
- 既存: `src/main/webapp/js/default.js` の `openWin(...)`
- 追加: `openPdfWin(...)`
  - 内部で `PdfViewerRouter.rewriteViewerUrl(...)` を適用
  - その後 `openWin(...)` を呼び出し

### fund report 系
- 既存: `src/main/webapp/js/fundreportlink.js` の `toFundReportLink(...)`
- 追加: `toFundReportPdfLink(...)`
  - 内部で `PdfViewerRouter.rewriteViewerUrl(...)` を適用
  - その後 `toFundReportLink(...)` を呼び出し

## JSP サンプル
- `src/main/webapp/jsp/PatternOpenWin.jsp`
- `src/main/webapp/jsp/PatternIframe.jsp`
- `src/main/webapp/jsp/PatternBlankLink.jsp`
- `src/main/webapp/jsp/PatternFrameset.jsp`
- 入口: `src/main/webapp/index.jsp`

## JSP 記述ルール（推奨）
1. `data-viewer-template` には v2 の viewer URL を書く
2. クリック時に `PdfViewerRouter.ensureViewerUrl(this)` で最終 URL を取得する
3. `openPdfWin(...)` / `toFundReportPdfLink(...)` を使って既存処理へ接続する

## 含めない範囲（この版では未対応）
- syntax probe（`eval` / `new Function` ベース）
- runtime 深度チェック
- 自動リロード回退
- エラーイベント監視
- Cookie 固定戦略

## 動作環境
- JDK 8+
- Maven
- Tomcat など JSP/Servlet コンテナ

## ビルド
```bash
mvn clean package
```
