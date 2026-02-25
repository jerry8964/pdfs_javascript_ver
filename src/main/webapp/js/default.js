function openWin(LinkUrl, msgTitle, width, height){
    subwin = window.open(LinkUrl, msgTitle, "width="+width+",height="+height+",scrollbars=yes");
    subwin.focus();
    return false;
}