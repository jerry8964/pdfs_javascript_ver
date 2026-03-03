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
     data-viewer-template="/pc/static/js/pdf_js_2.2.8/web/viewer.html?file=${pageContext.request.contextPath}/pdfs/sampleA.pdf#page=1"
     onclick="return openPdfWin(PdfViewerRouter.ensureViewerUrl(this), 'report_pop_A', '1000', '700');">
    レポートA
  </a>
  <br />
  <a href="javascript:void(0);"
     data-viewer-template="/pc/static/js/pdf_js_2.2.8/web/viewer.html?file=${pageContext.request.contextPath}/pdfs/sampleB.pdf#page=1"
     onclick="return openPdfWin(PdfViewerRouter.ensureViewerUrl(this), 'report_pop_B', '1000', '700');">
    レポートB
  </a>

  <script src="${pageContext.request.contextPath}/js/default.js"></script>
</body>
</html>
