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

/* Screen-scrapes album art from yesasia.com */

var yesasia_base = new Array();
yesasia_base["en"] = "http://global.yesasia.com/en/Search/SearchResult.aspx";
yesasia_base["b5"] = "http://global.yesasia.com/b5/Search/SearchResult.aspx";
yesasia_base["gb"] = "http://global.yesasia.com/gb/Search/SearchResult.aspx";

var yesasia_params = new Array();
yesasia_params["asSectionId"] = "music";
yesasia_params["asLanguage"] = "";
yesasia_params["asFormat"] = 0;
yesasia_params["asArtist"] = "";
yesasia_params["asTitle"] = "";

yesasia_params["asSubtitle"] = 0;
yesasia_params["asGentre"] = 0;
yesasia_params["asPictureFormat"] = 0;
yesasia_params["asDubbedIn"] = 0;
yesasia_params["asOrigin"] = 0;
yesasia_params["asRegionCode"] = 0;
yesasia_params["asKeyword"] = "";
yesasia_params["asMatchType"] = 0;
yesasia_params["asDescription"] = "";
yesasia_params["asManufacturer"] = "";
yesasia_params["asCode"] = "";
yesasia_params["asIncludeOutOfStock"] = 1;
yesasia_params["mode"] = "adsearch";
yesasia_params["JavascriptEnabled"] = "true";

/* some global state - inevitable with javascript */

var yesasia_req = {req: null, on_finish: null, on_error: null};
var yesasia_req_interval = 1000; // 3 seconds delay
var yesasia_req_time = 0; // keep track of the last request, and throttle

var yesasia_throttle_timer = null;
var yesasia_throttle_args = null;

/* constructs a url for album art fetching */

function yesasia_make_post_content(encoded_artist, encoded_album, encoded_title) {
    var content = "";
    
    for (var i in yesasia_params) {
        if ((i != "asArtist") && (i != "asTitle") && (i != "asDescription")) {
            content = content + i + "=" + encodeURIComponent(yesasia_params[i]) + "&";
        }
    }
    
    content = content + "asArtist=" + encoded_artist + "&";
    content = content + "asTitle=" + encoded_album + "&";
    content = content + "asDescription=" + encoded_title;
    return content;
}

/* handler for when the XmlHttpRequest comes back */

function yesasia_process_request() {
    if (yesasia_req.req.readyState == 4) {
        //yesasia_req_time = (new Date).getTime();
        if (yesasia_req.req.status == 200) {
            if (yesasia_req.on_finish != null) {
                yesasia_req.on_finish(yesasia_req.req);
            }
        }
        else {
            if (yesasia_req.on_error != null) {
                yesasia_req.on_error(yesasia_req.req);
            }
        }
    }
}

/* creates a request - if you execute this faster than the throttle, it will
    either queue your request or silently discard it */

function yesasia_make_request(encoded_artist, encoded_album, encoded_title, encoding,  on_finish, on_error) {
    var url = yesasia_base[encoding];
    
    var content = yesasia_make_post_content(encoded_artist, encoded_album, encoded_title);
    
    if (window.XMLHttpRequest) {
        yesasia_req.req = new XMLHttpRequest();
        yesasia_req.on_finish = on_finish;
        yesasia_req.on_error = on_error;
        yesasia_req.req.url = url + "?" + content;
        yesasia_req.req.onreadystatechange = yesasia_process_request;
        yesasia_req.req.open("POST", url, true);
        yesasia_req.req.send(content);
    }
}

/* ability to return all the urls returned, and displays them in a DOM
    element called 'images' and a textarea element called 'debug'  */

function yesasia_get_urls(req) {
    var small_large_urls = new Array();
    
    // NOTE: reponseXML doesn't exist because output is on parsable    
    var index = req.responseText.indexOf("<IMG ");
    while (index != -1) {
        var end_index = req.responseText.indexOf(">", index + 1);
        var img_tag = req.responseText.substring(index, end_index + 1);
        var is_image = img_tag.indexOf("SRC='http://i3.yesasia.com/assets/imgs/");
        if (is_image != -1) {
            var before_img = req.responseText.substring(0, index);
            var a_index = before_img.lastIndexOf("<a ");
            var a_url = "";
            var img_params = tag_parse(img_tag, "img");
            var img_url = img_params["src"];
            var urls = new Array();
            urls[0] = _yesasia_to_small_pic_url(img_url);
            urls[1] = _yesasia_to_large_pic_url(img_url);
            small_large_urls.push(urls);
        }
        index = req.responseText.indexOf("<IMG ", end_index + 1);
    }
    return small_large_urls;
}

function _yesasia_to_large_pic_url(url) {
    var index = url.lastIndexOf("/");
    if (index == -1) {
        return "";
    }
    var prefix = url.substring(0, index + 1);
    var filename = url.substring(index + 1, url.length);
    if (filename.charAt(0) == "p") {
        return prefix + "l_" + filename;
    }
    else if (filename.charAt(0) == "l") {
        return url;
    }
    else if (filename.charAt(0) == "s") {
        return prefix + "l_" + filename.substring(2, filename.length);
    }
    else {
        return "";
    }
}

function _yesasia_to_small_pic_url(url) {
    var index = url.lastIndexOf("/");
    if (index == -1) {
        return "";
    }
    var prefix = url.substring(0, index + 1);
    var filename = url.substring(index + 1, url.length);
    if (filename.charAt(0) == "p") {
        return url;
    }
    else if (filename.charAt(0) == "s") {
        return prefix + filename.substring(2, filename.length);    
        //return url;
    }
    else if (filename.charAt(0) == "l") {
        //return prefix + "s_" + filename.substring(2, filename.length);
        return prefix + filename.substring(2, filename.length);        
    }
    else {
        return "";
    }
}


// --------------------------------------------------------------------------
// debugging !!!
// --------------------------------------------------------------------------


function test_handler(req) {
    var img_urls = yesasia_get_urls(req);

    if ((img_urls == null) || (img_urls.length < 1)) {
        return;
    }
    
    var d = document.getElementById("images");
    //var t = document.getElementById("debug");
    for (var i = 0; i < img_urls.length; i++) {
        var img = document.createElement("img");
        img.src = img_urls[i][0];
        d.appendChild(img);
        img = document.createElement("img");
        img.src = img_urls[i][1];
        d.appendChild(img);
        //t.value = t.value + img_urls[i][0] + "\n";
    }
}


function test_request() {
    var query = document.getElementById("query").value;
    yesasia_make_request("%bc%42%bc%77%b5%d8%20%4c%61%75%2c%20%41%6e%64%79", "", "", "b5", test_handler, alert);
}    


/* To test this, put the code below in an HTML file and play! 
file:///Users/liquidx/Dev/cocoa/AlbumArtWidget/AlbumArt.wdgt/debug.html
<html>
<head>
<script type="text/javascript" src="AlbumArtYesAsia.js" charset="utf-8" />
</head>
<body>
query: <input type="text" id="query" value="" /><br />
<a href="javascript:test_request();">test</a>
<p><textarea id="debug" cols="80" rows="10"></textarea></p>
<p id="images"></p>
</body>
</html>

*/

