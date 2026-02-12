<%@ page contentType="text/html; charset=UTF-8" %>

<!doctype html>
<html lang="ja">
<head>
    <meta charset="UTF-8" />
    <title>PDF.js Viewer Example (Client Side Routing)</title>
    <style>
        body { font-family: sans-serif; margin: 16px; }
        .box { border: 1px solid #ddd; padding: 12px; margin-bottom: 16px; }
        .pdf-iframe { width: 100%; height: 60vh; border: 0; }
        .note { color: #666; font-size: 12px; }
    </style>
</head>
<body data-context-path="${pageContext.request.contextPath}">

<p><a href="${pageContext.request.contextPath}/index.jsp">&lt; Back to Index</a></p>
<h1>PDF.js Viewer Example（クライアント側でバージョン判定）</h1>
<p class="note">
    4種類のブラウザ（Chrome/Firefox/Edge/Safari）を対象に、指定の閾値で
    PDF.js v2.2.228 / v5.4.530 を切り替えます。
    現在の判定結果: <span id="viewerVersion">-</span>
</p>

<div class="box">
    <h2>OpenWin で開く</h2>
    <a href="#" id="openA" data-pdf-url="${pageContext.request.contextPath}/pdfs/sampleA.pdf" data-page="1" data-openwin="true" data-win-name="report_A">
        サンプルPDF A を開く
    </a>
    <br />
    <a href="#" id="openB" data-pdf-url="${pageContext.request.contextPath}/pdfs/sampleB.pdf" data-page="1" data-openwin="true" data-win-name="report_B">
        サンプルPDF B を開く
    </a>
</div>

<div class="box">
    <h2>iframe で表示</h2>
    <iframe class="pdf-iframe" id="iframeA" title="PDF Viewer A"
            data-pdf-url="${pageContext.request.contextPath}/pdfs/sampleA.pdf" data-page="1"></iframe>
</div>

<script src="${pageContext.request.contextPath}/js/LoadPdfjsViewer.js"></script>

</body>
</html>
