<%@ page contentType="text/html; charset=UTF-8" %>
<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title>PDF.js JavaScript Patterns</title>
  <style>
    body { font-family: sans-serif; margin: 24px; }
    ul { line-height: 2; }
  </style>
</head>
<body>
  <h1>PDF.js JavaScript パターン一覧</h1>
  <p>以下の 4 方式を確認できます（版数判定 JS は共通）。</p>
  <ul>
    <li><a href="<%= request.getContextPath() %>/jsp/PatternOpenWin.jsp">1. openWin パターン</a></li>
    <li><a href="<%= request.getContextPath() %>/jsp/PatternIframe.jsp">2. iframe パターン（同一ページ）</a></li>
    <li><a href="<%= request.getContextPath() %>/jsp/PatternBlankLink.jsp">3. a(target=_blank) パターン</a></li>
    <li><a href="<%= request.getContextPath() %>/jsp/PatternFrameset.jsp">4. frameset パターン（初期化時設定）</a></li>
  </ul>
</body>
</html>
