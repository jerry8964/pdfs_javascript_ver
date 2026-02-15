# pdfjs-unified-demo

## 概要
このプロジェクトは、PDF.js のバージョン（v2.2.228 / v5.4.530）を
JavaScript で判定し、4 つの JSP 表示パターンへ共通適用するサンプルです。

## 共通 JavaScript
- `src/main/webapp/js/LoadPdfjsViewer.js`
- 役割:
  - UA + 機能検出で版数を決定
  - 占位子 `{pdfjs-path-url}` を実際の版数パスに置換
  - `openWin`, `iframe`, `a`, `frameset` を 1 つのロジックで対応

## JSP パターン（各方式 1 ファイル）
1. `src/main/webapp/jsp/PatternOpenWin.jsp`
   - `onclick="return openWin(this.dataset.viewerUrl, ...)"` 形式
2. `src/main/webapp/jsp/PatternIframe.jsp`
   - 同一ページで iframe 表示
3. `src/main/webapp/jsp/PatternBlankLink.jsp`
   - `<a target="_blank">` 表示
4. `src/main/webapp/jsp/PatternFrameset.jsp`
   - 初期化時に frame src を設定

## 入口
- `src/main/webapp/index.jsp`

## 動作環境
- JDK 8
- Apache Tomcat
- Maven

## ビルド
```bash
mvn clean package
```
