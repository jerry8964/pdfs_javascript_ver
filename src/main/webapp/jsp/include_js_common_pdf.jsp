<%@ page import="com.example.pdfjs.PdfjsGateUtil" %>
<%
  // サーバー側で UA を判定し、初期候補（v2/v5）をフロントへ渡す。
  String uaSuggest = PdfjsGateUtil.suggestVersionFromUa(request.getHeader("User-Agent"));
%>
<script>
  // フロント側の判定入力値（UA 判定の第一ゲート）。
  window.__PDFJS_UA_SUGGEST__ = '<%= uaSuggest %>';
</script>
<script defer src="${pageContext.request.contextPath}/js/LoadPdfjsViewer.js"></script>
