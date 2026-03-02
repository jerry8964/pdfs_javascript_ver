<%@ page import="com.example.pdfjs.PdfjsGateUtil" %>
<%
  String pref = PdfjsGateUtil.readPrefFromCookies(request.getCookies());
  int ttlDays = PdfjsGateUtil.resolveTtlDays(application.getInitParameter("pdfjs.pref.ttl.days"));
  boolean hasPref = pref != null;
  boolean uaOkForV5 = false;
  if (!hasPref) {
    uaOkForV5 = PdfjsGateUtil.isUaOkForV5(request.getHeader("User-Agent"));
  }
%>
<script>
  window.__PDFJS_GATE__ = {
    pref: <%= hasPref ? "'" + pref + "'" : "null" %>,
    uaOk: <%= hasPref ? "null" : (uaOkForV5 ? "true" : "false") %>,
    ttlDays: <%= ttlDays %>,
    contextPath: '<%= request.getContextPath() %>'
  };
</script>
<script defer src="${pageContext.request.contextPath}/js/LoadPdfjsViewer.js"></script>
