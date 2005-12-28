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

function _amazon_make_search(base, store) {
    var amazon_music_prefix = "/exec/obidos/search-handle-url/index=";
    var amazon_music_suffix = "&field-keywords=";    
    return base + amazon_music_prefix + store + amazon_music_suffix;
}

/* Example:
"http://www.amazon.ca/exec/obidos/search-handle-url/index=music-ca&field-keywords=killers%20hot%20fuss/ref=xs_ap_l_xgl15/701-3458204-9668362"
*/

var amazon_search = new Array();
amazon_search["us"] = _amazon_make_search("http://www.amazon.com", "music");
amazon_search["uk"] = _amazon_make_search("http://www.amazon.co.uk", "music");
amazon_search["de"] = _amazon_make_search("http://www.amazon.de", "pop-music-de");
amazon_search["jp"] = _amazon_make_search("http://www.amazon.co.jp", "music-jp");
amazon_search["fr"] = _amazon_make_search("http://www.amazon.fr", "music-fr");
amazon_search["ca"] = _amazon_make_search("http://www.amazon.ca", "music-ca");

var amazon_params = new Array();
amazon_params["Service"] = "AWSECommerceService";
amazon_params["Operation"] = "ItemSearch";
amazon_params["SearchIndex"] = "Music";
amazon_params["SubscriptionId"] = amazon_key;
amazon_params["ResponseGroup"] = "Images";
amazon_params["Keywords"] = "";
amazon_params["Artist"] = "";
amazon_params["Title"] = "";


/* some global state - inevitable with javascript */

var amazon_req = {req: null, on_finish: null, on_error: null};
var amazon_req_interval = 1000; // 3 seconds delay
var amazon_req_time = 0; // keep track of the last request, and throttle

var amazon_throttle_timer = null;
var amazon_throttle_args = null;

/* constructs a url for album art fetching */

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

function amazon_make_html_url(artist, albumname, trackname, locale) {
    var url = amazon_search[locale];
    var params = new Array();
    if (artist)
        params.push(encodeURIComponent(artist));
    if (albumname)
        params.push(encodeURIComponent(albumname));        
    if (trackname)
        params.push(encodeURIComponent(trackname));                
        
    return url + params.join("%20");
}

/* handler for when the XmlHttpRequest comes back */

function amazon_process_request() {
    if (amazon_req.req.readyState == 4) { 
        amazon_req_time = (new Date).getTime();
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

/* creates a request - if you execute this faster than the throttle, it will
    either queue your request or silently discard it */

function amazon_make_request(artist, albumname, trackname, locale, on_finish, on_error) {
    var url = amazon_make_url(artist, albumname, trackname, locale);
    now = (new Date).getTime();

    if (amazon_req_time + amazon_req_interval > now) {
        amazon_throttle_delay(amazon_req_interval, artist, albumname, trackname, locale, on_finish, on_error);
        return;
    }
    amazon_req_time = now;

    if (window.XMLHttpRequest) {
        amazon_req.req = new XMLHttpRequest();
        amazon_req.on_finish = on_finish;
        amazon_req.on_error = on_error;
        amazon_req.req.url = amazon_make_html_url(artist, albumname, trackname, locale);
        amazon_req.req.onreadystatechange = amazon_process_request;
        amazon_req.req.open("GET", url, true);
        amazon_req.req.send();
    }
}

/* return the first album cover that is medium size (eg. 160x160) */

function amazon_get_url_medium(req) {
    var urls = req.responseXML.getElementsByTagName("URL");
    var medium_suffix = "._SCMZZZZZZZ_.jpg";
    var medium_url = "";
    for (var i = 0; i < urls.length; i++) {
        url = urls[i].firstChild.nodeValue;
        if (url.indexOf(medium_suffix) != -1) {
            medium_url = url;
            break;
        }
    }
    return medium_url;
}    

/* return the first album cover that is large size (eg. 300x300) */

function amazon_get_url_large(req) {
    var urls = req.responseXML.getElementsByTagName("URL");
    var large_suffix = "._SCLZZZZZZZ_.jpg";
    var large_url = "";
    for (var i = 0; i < urls.length; i++) {
        url = urls[i].firstChild.nodeValue;
        if (url.indexOf(large_suffix) != -1) {
            large_url = url;
            break;
        }
    }
    return large_url;
}    


/* ability to return all the urls returned, and displays them in a DOM
    element called 'images' and a textarea element called 'debug'  */

function amazon_get_urls(req) {
    var urls = req.responseXML.getElementsByTagName("URL");
    var display = document.getElementById("images");
    var texturls = new Array();
    
    debug = document.getElementById("debug");
    if (debug)
        document.getElementById("debug").value = req.responseText;
    
    if (display) {
        while (display.firstChild != null) {
            display.removeChild(display.firstChild);
        }
    }
    
    for (var i = 0; i < urls.length; i++) {
        if (display) {
            img = document.createElement("img");
            img.src = urls[i].firstChild.nodeValue;
            display.appendChild(img);
        }
        texturls[i] = urls[i].firstChild.nodeValue;
    }
    
    return texturls;
}

// --------------------------------------------------------------------------
// private functions you don't have to care about
// --------------------------------------------------------------------------

function amazon_throttle_delay(delay, artist, album, title, locale, on_finish, on_error) {

    if (amazon_throttle_timer != null) {
        clearInterval(amazon_throttle_timer);
        amazon_throttle_timer = null;
    }
    amazon_throttle_args = new Object
    amazon_throttle_args.artist = artist;
    amazon_throttle_args.album = album;
    amazon_throttle_args.title = title;
    amazon_throttle_args.on_finish = on_finish;
    amazon_throttle_args.on_error = on_error;
    amazon_throttle_args.locale = locale;
    amazon_throttle_timer = setInterval("amazon_throttle_resume();", delay);    
}

function amazon_throttle_resume() {
    artist = amazon_throttle_args.artist;
    album = amazon_throttle_args.album;
    title = amazon_throttle_args.title;
    on_finish = amazon_throttle_args.on_finish;
    on_error = amazon_throttle_args.on_error;
    locale = amazon_throttle_args.locale;
    
    if (amazon_throttle_timer != null) {
        clearInterval(amazon_throttle_timer);
        amazon_throttle_timer = null;
    }

    amazon_make_request(artist, album, title, locale, on_finish, on_error);
}

// --------------------------------------------------------------------------
// debugging !!!
// --------------------------------------------------------------------------


function test_request() {
    var title = document.getElementById("title").value;
    var album = document.getElementById("album").value;
    var artist = document.getElementById("artist").value;
    amazon_make_request(artist, album, title, "us", amazon_get_urls, alert);
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