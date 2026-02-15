<%@ page contentType="text/html; charset=UTF-8" %>
<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title>Pattern 4 - frameset</title>
  <script>
    window.__APP_CONTEXT_PATH__ = "${pageContext.request.contextPath}";
  </script>
  <script src="${pageContext.request.contextPath}/js/LoadPdfjsViewer.js"></script>
</head>
<frameset rows="*, 120">
  <frame name="PDF" marginwidth="0" marginheight="0" src="about:blank"
         data-auto-load="true"
         data-pdf-url="${pageContext.request.contextPath}/pdfs/sampleA.pdf"
         data-page="1"
         data-viewer-template="{pdfjs-path-url}/web/viewer.html?file={pdf-file-url-encoded}#page={page}" />

  <frame name="INFO"
         src="data:text/html;charset=UTF-8,%3Chtml%3E%3Cbody%20style%3D%27font-family%3Asans-serif%3Bmargin%3A8px%27%3E%3Ca%20href%3D%27${pageContext.request.contextPath}/index.jsp%27%20target%3D%27_top%27%3E%26lt%3B%20Back%3C/a%3E%3Cdiv%20style%3D%27margin-top%3A8px%3Bfont-size%3A12px%3Bcolor%3A%23666%27%3EFrameset%20%E3%81%AF%E5%88%9D%E6%9C%9F%E5%8C%96%E6%99%82%E3%81%AB%20JavaScript%20%E3%81%A7%20frame%20src%20%E3%82%92%E8%A8%AD%E5%AE%9A%E3%81%97%E3%81%BE%E3%81%99%E3%80%82%3C/div%3E%3C/body%3E%3C/html%3E" />
</frameset>
</html>
