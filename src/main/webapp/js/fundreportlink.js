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