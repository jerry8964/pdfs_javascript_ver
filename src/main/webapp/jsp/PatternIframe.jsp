<%@ page contentType="text/html; charset=UTF-8" %>
<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title>Pattern 2 - iframe</title>
  <style>
    .pdf-iframe { width: 100%; height: 70vh; border: 0; }
  </style>
</head>
<body data-context-path="${pageContext.request.contextPath}">
  <p><a href="${pageContext.request.contextPath}/index.jsp">&lt; Back</a></p>
  <h1>2. iframe パターン（同一ページ）</h1>
  <p>現在の判定: <span id="viewerVersion">-</span></p>

  <a href="javascript:void(0);"
     data-pdf-url="${pageContext.request.contextPath}/pdfs/sampleA.pdf"
     data-page="1"
     data-viewer-template="{pdfjs-path-url}/web/viewer.html?file={pdf-file-url-encoded}#page={page}"
     onclick="return PdfViewerRouter.setIframeViewer('pdfFrame', this.dataset.viewerUrl);">
    レポートAを表示
  </a>
  <br />
  <a href="javascript:void(0);"
     data-pdf-url="${pageContext.request.contextPath}/pdfs/sampleB.pdf"
     data-page="1"
     data-viewer-template="{pdfjs-path-url}/web/viewer.html?file={pdf-file-url-encoded}#page={page}"
     onclick="return PdfViewerRouter.setIframeViewer('pdfFrame', this.dataset.viewerUrl);">
    レポートBを表示
  </a>

  <hr />
  <iframe id="pdfFrame" class="pdf-iframe" src="about:blank" frameborder="0"></iframe>

  <script src="${pageContext.request.contextPath}/js/LoadPdfjsViewer.js"></script>
</body>
</html>
