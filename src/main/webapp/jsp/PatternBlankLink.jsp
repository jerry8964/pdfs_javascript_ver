<%@ page contentType="text/html; charset=UTF-8" %>
<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title>Pattern 3 - blank link</title>
  <%@ include file="/jsp/include_js_common_pdf.jsp" %>
</head>
<body data-context-path="${pageContext.request.contextPath}">
  <p><a href="${pageContext.request.contextPath}/index.jsp">&lt; Back</a></p>
  <h1>3. a(target=_blank) パターン</h1>
<!-- 現実のコード Start-->
 <!-- Parttern 1 -->
  <a href="javascript:void(0);"
      data-viewer-template="/pc/static/js/pdf_js_2.2.8/web/viewer.html?file=${pageContext.request.contextPath}/pdfs/sampleA.pdf#page=1"
      onclick="return openPdfWin(PdfViewerRouter.ensureViewerUrl(this), 'report_pop', '820', '640');"
      id="pdf">report_A
  </a>
  <!-- Parttern 2 -->
  <a tableindex="0"
     href="javascript:void(0);"
     data-viewer-template="/pc/static/js/pdf_js_2.2.8/web/viewer.html?file=${pageContext.request.contextPath}/pdfs/sampleA.pdf#page=1"
     onclick="return toFundReportPdfLink(PdfViewerRouter.ensureViewerUrl(this), '', '2');">
    report_A
  </a>
<!-- 現実のコード End-->
  <br />
  <a data-link-mode="blank"
     data-viewer-template="/pc/static/js/pdf_js_2.2.8/web/viewer.html?file=${pageContext.request.contextPath}/pdfs/sampleB.pdf#page=1">
    report_B
  </a>

  <script src="${pageContext.request.contextPath}/js/default.js"></script>
  <script src="${pageContext.request.contextPath}/js/fundreportlink.js"></script>
</body>
</html>
