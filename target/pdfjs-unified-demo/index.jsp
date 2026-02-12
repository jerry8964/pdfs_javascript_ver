<%@ page contentType="text/html; charset=UTF-8" %>
<!doctype html>
<html lang="ja">
<head>
    <meta charset="UTF-8" />
    <title>PDF.js JavaScript Demo</title>
    <style>
        :root {
            --bg: #0b1020;
            --text: #ecf0ff;
            --sub: #98a7cc;
            --line: #2f3a5f;
            --accent: #5ea0ff;
            --accent-2: #8cf0cc;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            color: var(--text);
            font-family: "Hiragino Sans", "Yu Gothic", sans-serif;
            background:
                radial-gradient(circle at 20% 10%, #1d2d53 0%, transparent 35%),
                radial-gradient(circle at 85% 85%, #0f4a50 0%, transparent 30%),
                var(--bg);
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 48px 20px 64px;
        }
        h1 {
            margin: 0 0 12px;
            font-size: 34px;
            letter-spacing: 0.02em;
        }
        .lead {
            color: var(--sub);
            margin: 0 0 28px;
            line-height: 1.7;
        }
        .card {
            display: block;
            text-decoration: none;
            color: var(--text);
            background: linear-gradient(165deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 20px;
            transition: transform .15s ease, border-color .15s ease;
        }
        .card:hover {
            transform: translateY(-2px);
            border-color: var(--accent);
        }
        .card h2 {
            margin: 0 0 6px;
            font-size: 20px;
        }
        .card p {
            margin: 0;
            color: var(--sub);
            line-height: 1.5;
            font-size: 14px;
        }
        .tag {
            display: inline-block;
            margin-top: 10px;
            font-size: 12px;
            color: var(--accent-2);
        }
    </style>
</head>
<body>
<div class="container">
    <h1>PDF.js JavaScript 実装</h1>
    <p class="lead">
        本プロジェクトは JavaScript による単一実装のみを提供します。<br />
        ブラウザ判定で PDF.js v2.2.228 / v5.4.530 を切り替え、直接 viewer を開きます（中継ページなし）。
    </p>

    <a class="card" href="<%= request.getContextPath() %>/jsp/AmountList-javascript.jsp">
        <h2>JavaScript Viewer</h2>
        <p>UA と機能検出でバージョンを選択し、OpenWin / iframe / frame / a を直接表示します。</p>
        <span class="tag">Single Implementation</span>
    </a>
</div>
</body>
</html>
