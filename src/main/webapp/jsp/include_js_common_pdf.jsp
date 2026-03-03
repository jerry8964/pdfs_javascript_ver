<%@ page import="com.example.pdfjs.PdfjsGateUtil" %>
<%
  // サーバー側で UA を判定し、初期候補（v2/v5）をフロントへ渡す。
  String uaSuggest = PdfjsGateUtil.suggestVersionFromUa(request.getHeader("User-Agent"));
%>
<script>
  // フロント側の判定入力値（UA 判定の第一ゲート）。
  window.__PDFJS_UA_SUGGEST__ = '<%= uaSuggest %>';
  // viewer パスは環境差分が出やすいため、共通 include で一元管理する。
  window.__PDFJS_BASE_V2__ = '/pc/static/js/pdf_js_2.2.8/';
  window.__PDFJS_BASE_V5__ = '/pc/static/js/pdf_js_5.4.530-legacy/';
</script>
<script defer src="${pageContext.request.contextPath}/js/LoadPdfjsViewer.js"></script>
