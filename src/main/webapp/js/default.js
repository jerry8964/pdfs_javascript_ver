function openWin(LinkUrl, msgTitle, width, height){
    subwin = window.open(LinkUrl, msgTitle, "width="+width+",height="+height+",scrollbars=yes");
    subwin.focus();
    return false;
}

// PDF.js のバージョン判定結果に従って viewer URL を補正してから既存 openWin を呼ぶ。
function openPdfWin(LinkUrl, msgTitle, width, height){
    var rewrittenUrl = LinkUrl;
    if (window.PdfViewerRouter && typeof window.PdfViewerRouter.rewriteViewerUrl === "function") {
        rewrittenUrl = window.PdfViewerRouter.rewriteViewerUrl(LinkUrl);
    }
    return openWin(rewrittenUrl, msgTitle, width, height);
}
