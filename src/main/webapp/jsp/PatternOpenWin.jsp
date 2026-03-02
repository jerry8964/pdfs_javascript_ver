<%@ page contentType="text/html; charset=UTF-8" %>
<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title>Pattern 1 - openWin</title>
  <%@ include file="/jsp/include_js_common_pdf.jsp" %>
</head>
<body data-context-path="${pageContext.request.contextPath}">
  <p><a href="${pageContext.request.contextPath}/index.jsp">&lt; Back</a></p>
  <h1>1. openWin パターン</h1>

  <a href="javascript:void(0);"
     data-pdf-url="${pageContext.request.contextPath}/pdfs/sampleA.pdf"
     data-page="1"
     data-viewer-template="${pageContext.request.contextPath}/static/{pdfjs-dir-name}/web/viewer.html?file={pdf-file-url-encoded}#page={page}"
     onclick="return PdfViewerRouter.openWin(PdfViewerRouter.ensureViewerUrl(this), 'report_pop_A');">
    レポートA
  </a>
  <br />
  <a href="javascript:void(0);"
     data-pdf-url="${pageContext.request.contextPath}/pdfs/sampleB.pdf"
     data-page="1"
     data-viewer-template="${pageContext.request.contextPath}/static/{pdfjs-dir-name}/web/viewer.html?file={pdf-file-url-encoded}#page={page}"
     onclick="return PdfViewerRouter.openWin(PdfViewerRouter.ensureViewerUrl(this), 'report_pop_B');">
    レポートB
  </a>
</body>
</html>
