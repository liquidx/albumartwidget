/*

 Album Art Widget for Dashboard.
 http://www.liquidx.net/albumartwidget/

 Copyright (c) 2005, Alastair Tse <alastair@liquidx.net>
 All rights reserved.
 
 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.

 Redistributions in binary form must reproduce the above copyright notice, this
 list of conditions and the following disclaimer in the documentation and/or
 other materials provided with the distribution.

 Neither the Alastair Tse nor the names of its contributors may
 be used to endorse or promote products derived from this software without 
 specific prior written permission.
 
 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
 LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
 SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
 ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 POSSIBILITY OF SUCH DAMAGE.
 
*/

// question mark prevents caching
var update_versions_base = "http://media.liquidx.net/static/albumartwidget/";
var update_versions_xml = update_versions_base + "versions.xml?v=" + 
                          current_version;
var update_req = null;
var update_file_url = null;
var update_version = null;
var update_version_string = "";

function auto_update() {
    if (update_req != null) {
        update_req = null;
    }
    
    if (window.XMLHttpRequest) {
        update_req = new XMLHttpRequest();
        update_req.onreadystatechange = auto_update_request;
        update_req.setRequestHeader("Cache-Control", "no-cache");        
        update_req.open("GET", update_versions_xml, true);
        update_req.send();
    }
}

function auto_update_request() {

    if (update_req.readyState == 4) { 

        var latest = update_req.responseXML;
        var latest_version_string = "";
        var latest_version = 0;
        var latest_url = "";
        var versions = latest.getElementsByTagName("version");

        if (versions) {
            for (var i = 0; i < versions.length; i++) {
                var verstr = "";
                var vernum = "";
                var verurl = "";
                var num = versions[i].getElementsByTagName("number");
                if (num && (num.length > 0)) {
                    for (var j = 0; j < num[0].childNodes.length; j++) {
                        if (num[0].childNodes[j].nodeName == "#text") {
                            vernum += num[0].childNodes[j].nodeValue;
                        }
                    }
                }
                
                var url = versions[i].getElementsByTagName("url");
                if (url && (url.length > 0)) {
                    for (var j = 0; j < url[0].childNodes.length; j++) {
                         if (url[0].childNodes[j].nodeName == "#text") {
                            verurl += url[0].childNodes[j].nodeValue;
                        }
                    }
                }
                
                 var str = versions[i].getElementsByTagName("versionstring");
                    if (str && (str.length > 0)) {
                        for (var j = 0; j < str[0].childNodes.length; j++) {
                             if (str[0].childNodes[j].nodeName == "#text") {
                                verstr += str[0].childNodes[j].nodeValue;
                            }
                        }
                    }
                
                var ver = parseFloat(vernum);
                if (ver > latest_version) {
                    latest_version_string = verstr;
                    latest_version = ver;
                    latest_url = verurl;
                }
            }
        }
        
        if (latest_version > current_version) {
            show_update_drawer();
            update_version_string = latest_version_string;
            update_version = latest_version;
            update_file_url = latest_url;
        }
        else {
            hide_update_drawer();
        }
    }
}

function hide_update_drawer() {
    document.getElementById("update-layer").style.display = "none";
    document.getElementById("update-get").style.display = "none";
    document.getElementById("update-ignore").style.display = "none";
}

function show_update_drawer() {
    document.getElementById("update-layer").style.display = "block";
    document.getElementById("update-get").style.display = "block";
    document.getElementById("update-ignore").style.display = "block";
    document.getElementById("update-get").title = "New Version: " + 
                                                  update_version_string;
}

function fetch_update() {
    hide_update_drawer();
    
    if (update_file_url == null) {
        return;
    }
    
    if (window.widget) {
        widget.openURL(update_file_url);
    }
}

function ignore_update() {
    hide_update_drawer();
    if (window.widget) {
        widget.setPreferenceForKey(0, pref_check_update);
        document.getElementById("select-check-update").checked = 0;
    }
}

