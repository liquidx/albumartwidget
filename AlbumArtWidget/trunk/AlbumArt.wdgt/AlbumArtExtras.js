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

/* split a http query string into it's components */

function query_string_parse(qstring) {
    var path_query = qstring.split('?');
    if (path_query.length < 2) {
        return null;
    }
    
    var query_components = path_query[1].split('&');
    var components = new Array();
    for (var i = 0; i < query_components.length; i++) {
        var equal = query_components[i].indexOf('=');
        if (equal == -1) {
            continue; // ignore this one
        }
        var name =query_components[i].substring(0, equal);
        var value = query_components[i].substring(equal + 1, query_components[i].length);
        components[name] = decodeURIComponent(value);
    }
    return components;
}


/* parse an html tag and return an array of the attributes */

function tag_parse(tag_string, tag_name) {
    var attribs = new Array();
    var tag_len = tag_string.length;
    var index = tag_name.length + 2 ; // start after "<img "
    var attrib_name = "";
    var attrib_value = "";
    
    // first replace all the \" and \' with blanks
    tag_string = tag_string.replace("\\\'", " ");
    tag_string = tag_string.replace("\\\"", " ");
    
    while (index < tag_len) {
        var c = tag_string.charAt(index);
        if ((c == "\"") || (c == "\'")) { 
            // find closing quote
            var closing = tag_string.indexOf(c, index + 1);
            if (closing == -1) {
                attribs[attrib_name] = tag_string.substring(index, tag_len - 1);            
                break; // end of tag
            }
            attribs[attrib_name] = tag_string.substring(index + 1, closing);
            index = closing + 1;
            attrib_name = "";
        }
        else if (c == " ") {
            index++;
        }
        else if (c == ">") {
            break; // end of tag
        }
        else if (c == "=") {
            // end of attribute name
            index++;
            nc = tag_string.charAt(index);
            if ((nc == "\"") || (nc == "\'")) {
                // ignore, the first rule wil ltake care of it
                continue;
            }
            else {
                // we have to parse this as the value witout quotes
                var closing = tag_string.indexOf(" ", index + 1);
                if (closing == -1) {
                    attribs[attrib_name] = tag_string.substring(index, tag_len - 1);
                    break; // end of tag
                }
                attribs[attrib_name] = tag_string.substring(index, closing);
                attrib_name = "";
                index = closing + 1;
            }
        }
        else {
            attrib_name += c.toLowerCase();
            index++;
        }
    }    
    
    return attribs;        
}

/* test if a URL is valid */
var test_url = {req: null, on_finish: null, on_error: null, userdata:null};

function test_url_request(url, userdata, on_valid, on_error) {
    if (window.XMLHttpRequest) {
        test_url.req = new XMLHttpRequest();
        test_url.on_valid = on_valid;
        test_url.on_error = on_error;
        test_url.userdata = userdata;
        test_url.req.onreadystatechange = test_url_handler;
        test_url.req.open("GET", url, true);
        test_url.req.send();
    }
}

function test_url_handler() {
     if (test_url.req.readyState == 4) { 
        if (test_url.req.status == 200) {
            if (test_url.on_valid != null) {
                test_url.on_valid(test_url.userdata);
            }
        }
        else {
            if (test_url.on_error != null) {
                test_url.on_error(test_url.userdata);
            }
        }
    }
}

