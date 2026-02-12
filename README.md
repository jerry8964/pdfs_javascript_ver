# pdfjs-unified-demo

## 目的
本プロジェクトは、PDF 表示方式を **JavaScript 実装 1 本**に統一し、
ブラウザ判定で `PDF.js v2.2.228` と `PDF.js v5.4.530` を切り替えることを目的とします。

## 実装されている機能
- JavaScript のみで PDF.js バージョンを判定（UA + 機能検出）
- `OpenWin` / `iframe` / `frame` / `<a>` の 4 パターン対応

## 利用順序
1. `index.jsp` を開く。
2. `JavaScript Viewer` を選択する。
3. `sampleA.pdf` / `sampleB.pdf` を `OpenWin` または `iframe` で確認する。
4. 必要に応じて `frame` や `<a>` でも同じ `data-pdf-url` 方式で利用する。

## 構成（主要）
- `pom.xml`
- `src/main/webapp/index.jsp`
- `src/main/webapp/jsp/AmountList-javascript.jsp`
- `src/main/webapp/js/LoadPdfjsViewer.js`
- `src/main/webapp/pc/...`（PDF.js v2 / v5 viewer）
- `src/main/webapp/pdfs/sampleA.pdf`
- `src/main/webapp/pdfs/sampleB.pdf`

## 動作環境
- JDK 8
- Apache Tomcat
- Maven

## ビルド
```bash
mvn clean package
```

生成物:
- `target/pdfjs-unified-demo.war`
