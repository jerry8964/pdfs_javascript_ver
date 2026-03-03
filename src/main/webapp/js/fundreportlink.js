function toFundReportLink(URL,message,kbn){
    var res;
    if(kbn == 1){
        res=true;
    }
    else if(kbn == 2){
        res=confirm(message);
    }
    if(res == true){
        return openWin(URL, 'report_pop', '820', '640');
    }
    else
    {
        return false;
    }
}

// PDF.js のバージョン判定結果に従って URL を補正してから既存 toFundReportLink を呼ぶ。
function toFundReportPdfLink(URL,message,kbn){
    var rewrittenUrl = URL;
    if (window.PdfViewerRouter && typeof window.PdfViewerRouter.rewriteViewerUrl === "function") {
        rewrittenUrl = window.PdfViewerRouter.rewriteViewerUrl(URL);
    }
    return toFundReportLink(rewrittenUrl, message, kbn);
}
