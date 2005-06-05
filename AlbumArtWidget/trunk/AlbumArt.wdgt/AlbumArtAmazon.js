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


/* Fetch and Parse Amazon API stuff */

var amazon_key = "0RP8NAGZCK3J88E8QE82";

var amazon_base = new Array();
amazon_base["us"] = "http://webservices.amazon.com/onca/xml";
amazon_base["uk"] = "http://webservices.amazon.co.uk/onca/xml";
amazon_base["de"] = "http://webservices.amazon.de/onca/xml";
amazon_base["jp"] = "http://webservices.amazon.co.jp/onca/xml";
amazon_base["fr"] = "http://webservices.amazon.fr/onca/xml";
amazon_base["ca"] = "http://webservices.amazon.ca/onca/xml";

var amazon_params = new Array();
amazon_params["Service"] = "AWSECommerceService";
amazon_params["Operation"] = "ItemSearch";
amazon_params["SearchIndex"] = "Music";
amazon_params["SubscriptionId"] = amazon_key;
amazon_params["ResponseGroup"] = "Images";
amazon_params["Keywords"] = "";
amazon_params["Artist"] = "";
amazon_params["Title"] = "";

var amazon_req = {req: null, on_finish: null, on_error: null}

function amazon_make_url(artist, albumname, trackname, locale) {
    var url = amazon_base[locale] + "?";
    
    amazon_params["Keywords"] = trackname;
    amazon_params["Artist"] = artist;
    amazon_params["Title"] = albumname;
    
    for (var i in amazon_params) {
        url = url + i + "=" + encodeURIComponent(amazon_params[i]) + "&";
    }
    return url;
}

function amazon_process_request() {
    if (amazon_req.req.readyState == 4) { 
        if (amazon_req.req.status == 200) {
            if (amazon_req.on_finish != null) {
                amazon_req.on_finish(amazon_req.req);
            }
        }
        else {
            if (amazon_req.on_error != null) {
                amazon_req.on_error(amazon_req.req);
            }
        }
    }
}

function amazon_make_request(artist, albumname, trackname, locale, on_finish, on_error) {
    var url = amazon_make_url(artist, albumname, trackname, locale);

    if (window.XMLHttpRequest) {
        amazon_req.req = new XMLHttpRequest();
        amazon_req.on_finish = on_finish;
        amazon_req.on_error = on_error;
        amazon_req.req.onreadystatechange = amazon_process_request;
        amazon_req.req.open("GET", url, true);
        amazon_req.req.send();
    }
}

function amazon_get_url_medium(req) {
    var urls = req.responseXML.getElementsByTagName("URL");
    var medium_img = "._SCMZZZZZZZ_.jpg";
    var medium_url = "";
    for (var i = 0; i < urls.length; i++) {
        url = urls[i].firstChild.nodeValue;
        if (url.indexOf(medium_img) != -1) {
            medium_url = url;
            break;
        }
    }
    return medium_url;
}    

function amazon_get_urls(req) {
    var urls = req.responseXML.getElementsByTagName("URL");
    var display = document.getElementById("images");
    
    while (display.firstChild != null) {
        display.removeChild(display.firstChild);
    }
    
    for (var i = 0; i < urls.length; i++) {
        img = document.createElement("img");
        img.src = urls[i].firstChild.nodeValue;
        display.appendChild(img);
    }
}

function test_request() {
    var title = document.getElementById("title").value;
    var album = document.getElementById("album").value;
    var artist = document.getElementById("artist").value;
    amazon_make_request(artist, album, title, "jp", amazon_get_urls, alert);
}    

/* To test this, put the code below in an HTML file and play! 

<html>
<head>
<script type="text/javascript" src="AlbumArtAmazon.js" charset="utf-8" />
</head>
<body>
album: <input type="text" id="album" value="" /><br />
artist: <input type="text" id="artist" value="" /><br />
title: <input type="text" id="title" value="" /><br />
<a href="javascript:test_request();">test</a>
<p><textarea id="debug" cols="80" rows="10"></textarea></p>
<p id="images"></p>
</body>
</html>
*/