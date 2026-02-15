<%@ page contentType="text/html; charset=UTF-8" %>
<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title>Pattern 1 - openWin</title>
</head>
<body data-context-path="${pageContext.request.contextPath}">
  <p><a href="${pageContext.request.contextPath}/index.jsp">&lt; Back</a></p>
  <h1>1. openWin パターン</h1>
  <p>現在の判定: <span id="viewerVersion">-</span></p>

  <a href="javascript:void(0);"
     data-pdf-url="${pageContext.request.contextPath}/pdfs/sampleA.pdf"
     data-page="1"
     data-viewer-template="{pdfjs-path-url}/web/viewer.html?file={pdf-file-url-encoded}#page={page}"
     onclick="return openWin(this.dataset.viewerUrl, 'report_pop_A');">
    レポートA
  </a>
  <br />
  <a href="javascript:void(0);"
     data-pdf-url="${pageContext.request.contextPath}/pdfs/sampleB.pdf"
     data-page="1"
     data-viewer-template="{pdfjs-path-url}/web/viewer.html?file={pdf-file-url-encoded}#page={page}"
     onclick="return openWin(this.dataset.viewerUrl, 'report_pop_B');">
    レポートB
  </a>

  <script src="${pageContext.request.contextPath}/js/LoadPdfjsViewer.js"></script>
</body>
</html>
