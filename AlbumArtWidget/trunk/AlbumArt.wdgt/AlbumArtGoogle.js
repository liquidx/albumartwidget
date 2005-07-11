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


/* Fetch and Parse Google Images */
var google_base = "http://images.google.com/images";
var google_params = new Array();
google_params["q"] = "";
google_params["hl"] = "en";
google_params["lr"] = ""
google_params["start"] = "";
google_params["sa"] = "N";
google_params["safe"] = "on";
google_params["filter"] = "0";

var google_image_table = '<table align=center border=0 cellpadding=5 cellspacing=0 width=100%>';


/* some global state - inevitable with javascript */

var google_req = {req: null, on_finish: null, on_error: null};
var google_req_interval = 1000; // 3 seconds delay
var google_req_time = 0; // keep track of the last request, and throttle

var google_throttle_timer = null;
var google_throttle_args = null;

/* constructs a url for album art fetching */

function google_make_url(query) {
    var url = google_base + "?";
    
    google_params["q"] = query;
    
    for (var i in google_params) {
        url = url + i + "=" + encodeURIComponent(google_params[i]) + "&";
    }
    return url;
}

/* handler for when the XmlHttpRequest comes back */

function google_process_request() {
    if (google_req.req.readyState == 4) { 
        google_req_time = (new Date).getTime();
        if (google_req.req.status == 200) {
            if (google_req.on_finish != null) {
                google_req.on_finish(google_req.req);
            }
        }
        else {
            if (google_req.on_error != null) {
                google_req.on_error(google_req.req);
            }
        }
    }
}

/* creates a request - if you execute this faster than the throttle, it will
    either queue your request or silently discard it */

function google_make_request(query, on_finish, on_error) {
    var url = google_make_url(query);

    now = (new Date).getTime();

    if (google_req_time + google_req_interval > now) {
        google_throttle_delay(google_req_interval, query, on_finish, on_error);
        return;
    }
    google_req_time = now;

    if (window.XMLHttpRequest) {
        google_req.req = new XMLHttpRequest();
        google_req.on_finish = on_finish;
        google_req.on_error = on_error;
        google_req.req.onreadystatechange = google_process_request;
        google_req.req.open("GET", url, true);
        google_req.req.send();
    }
}

/* ability to return all the urls returned, and displays them in a DOM
    element called 'images' and a textarea element called 'debug'  */

function google_get_urls(req) {
    var small_large_urls = new Array();
    
    // NOTE: reponseXML doesn't exist because output is on parsable    
    if (req.responseText.indexOf(google_image_table) != -1) {
        // find image matches
        var index = req.responseText.indexOf("<img ");
        while (index != -1) {
            var end_index = req.responseText.indexOf(">", index + 1);
            var img_tag = req.responseText.substring(index, end_index + 1);
            var is_image = img_tag.indexOf("src=/images");
            if (is_image != -1) {
                var before_img = req.responseText.substring(0, index);
                var a_index = before_img.lastIndexOf("<a ");
                var a_url = "";
                var img_params = tag_parse(img_tag, "img");
                var img_url = "http://images.google.com" + img_params["src"];
                
                if (a_index != -1) {
                    var a_tag = req.responseText.substring(a_index, index);
                    var a_attribs = tag_parse(a_tag, "a");
                    var a_query = query_string_parse(a_attribs["href"]);
                    a_url = a_query["imgurl"];
                }
                
                var urls = new Array(2);
                urls[0] = img_url;
                urls[1] = a_url;
                small_large_urls.push(urls);
            }
            index = req.responseText.indexOf("<img ", end_index + 1);
        }
    }
    return small_large_urls;
}

// --------------------------------------------------------------------------
// private functions you don't have to care about
// --------------------------------------------------------------------------

function google_throttle_delay(delay, query, on_finish, on_error) {

    if (google_throttle_timer != null) {
        clearInterval(google_throttle_timer);
        google_throttle_timer = null;
    }
    google_throttle_args = new Object
    google_throttle_args.query = query;
    google_throttle_args.on_finish = on_finish;
    google_throttle_args.on_error = on_error;
    google_throttle_timer = setInterval("google_throttle_resume();", delay);    
}

function google_throttle_resume() {
    query = google_throttle_args.query;
    on_finish = google_throttle_args.on_finish;
    on_error = google_throttle_args.on_error;
    
    if (google_throttle_timer != null) {
        clearInterval(google_throttle_timer);
        google_throttle_timer = null;
    }

    google_make_request(query, on_finish, on_error);
}


// --------------------------------------------------------------------------
// debugging !!!
// --------------------------------------------------------------------------


function test_handler(req) {
    var img_urls = google_get_urls(req);
    if ((img_urls == null) || (img_urls.length < 1)) {
        return;
    }
    
    var d = document.getElementById("images");
    for (var i = 0; i < img_urls.length; i++) {
        var img = document.createElement("img");
        img.src = img_urls[i][0];
        d.appendChild(img);
        img = document.createElement("img");
        img.src = img_urls[i][1];
        d.appendChild(img);
    }
}


function test_request() {
    var query = document.getElementById("query").value;
    google_make_request(query, test_handler, alert);
}    


/* To test this, put the code below in an HTML file and play! 
file:///Users/liquidx/Dev/cocoa/AlbumArtWidget/AlbumArt.wdgt/debug.html
<html>
<head>
<script type="text/javascript" src="AlbumArtGoogle.js" charset="utf-8" />
</head>
<body>
query: <input type="text" id="query" value="" /><br />
<a href="javascript:test_request();">test</a>
<p><textarea id="debug" cols="80" rows="10"></textarea></p>
<p id="images"></p>
</body>
</html>

*/