<%@ page contentType="text/html; charset=UTF-8" %>
<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title>Pattern 3 - blank link</title>
</head>
<body data-context-path="${pageContext.request.contextPath}">
  <p><a href="${pageContext.request.contextPath}/index.jsp">&lt; Back</a></p>
  <h1>3. a(target=_blank) パターン</h1>
  <p>現在の判定: <span id="viewerVersion">-</span></p>
<!-- 現実のコード Start-->
 <!-- Parttern 1 -->
  <a href="javascript:void(0);"
      data-pdf-url="${pageContext.request.contextPath}/pdfs/sampleA.pdf"
      data-page="1"
      data-viewer-template="{pdfjs-path-url}/web/viewer.html?file={pdf-file-url-encoded}#page={page}"
      onclick="return openWin(PdfViewerRouter.ensureViewerUrl(this), 'report_pop', '820', '640');"
      id="pdf">report_A
  </a>
  <!-- Parttern 2 -->
  <a tableindex="0"
     href="javascript:void(0);"
     data-pdf-url="${pageContext.request.contextPath}/pdfs/sampleA.pdf"
     data-page="1"
     data-viewer-template="{pdfjs-path-url}/web/viewer.html?file={pdf-file-url-encoded}#page={page}"
     onclick="return toFundReportLink(PdfViewerRouter.ensureViewerUrl(this), '', '2');">
    report_A
  </a>
<!-- 現実のコード End-->
  <br />
  <a data-link-mode="blank"
     data-pdf-url="${pageContext.request.contextPath}/pdfs/sampleB.pdf"
     data-page="1"
     data-viewer-template="{pdfjs-path-url}/web/viewer.html?file={pdf-file-url-encoded}#page={page}">
    report_B
  </a>

  <script src="${pageContext.request.contextPath}/js/default.js"></script>
  <script src="${pageContext.request.contextPath}/js/fundreportlink.js"></script>
  <script src="${pageContext.request.contextPath}/js/LoadPdfjsViewer.js"></script>
</body>
</html>
