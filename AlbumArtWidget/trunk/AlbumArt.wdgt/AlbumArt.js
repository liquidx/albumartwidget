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

/*

quick disclaimer about coding scheme:

- this is my first time i've written anything complex in javascript.
- all external functions use CamelCase with java-esque conventions.
- all internal functions use normal_underscore_syntax because i'm used to it.

*/

var shade_x = 34;
var shade_y = 140;
var shade_w = 158;
var shade_h = 40;

var key_next = 190; // ">"
var key_prev = 188; // "<"
var key_playpause = 32; //"space"

var fetch_attempted = 0; // make sure we don't fetch many times per track
var fetch_amazon_max_attempts = 4;
var fetch_result = "";

// ---------------------------------------------------------------------------
// preferences
// ---------------------------------------------------------------------------

var pref_color = "widget_color";
var pref_color_default = "black";
var pref_stars = "stars_color";
var pref_stars_default = "blue";
var pref_info_opacity = "overlay_opacity";
var pref_info_opacity_default = 0.2;
var pref_fetch = "fetch_method";
var pref_fetch_default = "none";

function select_pref(pref_value, pref_object) {
    options = pref_object.options;
    for (i = 0; i < options.length; i++) {
        if (options[i].value != pref_value) {
            options[i].selected = false;
        }
        else {
            options[i].selected = true;
        }
    }
}


function init() {
    if (window.widget) {
        
        // init widget color scheme
        var color = widget.preferenceForKey(pref_color);
        if (!color) {
            color = pref_color_default;
        }
        
        document.getElementById("front-background").src = color + "-Default.png";
        document.getElementById("overlay").src = color + "-Overlay.png";
        document.getElementById("albumart").src = color + "-Blank.png";
        
        // make sure prefs are in sync
        select_pref(color, document.getElementById("select-widget-color"));
        
        // init info opacity
        var opacity = widget.preferenceForKey(pref_info_opacity);
        if (!opacity) {
            opacity = pref_info_opacity_default;
        }
        document.getElementById("shade-layer").style.opacity = opacity;
        select_pref(opacity, document.getElementById("select-info-opacity"));
        
        // init star colors
        var starColor = widget.preferenceForKey(pref_stars);
        if (!starColor) {
            starColor = pref_stars_default;
        }
        select_pref(starColor, document.getElementById("select-stars-color"));
        
        
        // init fetch prefs
        var fetch = widget.preferenceForKey(pref_fetch);
        if (!fetch) {
            fetch = pref_fetch_default;
        }
        select_pref(fetch, document.getElementById("select-fetch"));
    }
}

// ---------------------------------------------------------------------------
// widget api callbacks
// ---------------------------------------------------------------------------


if (window.widget)
{
    widget.onshow = onshow;
    widget.onhide = onhide;
    widget.onfocus = onfocus;
    widget.onblur = onblur;
    widget.ondragstart = ondragstart;
    widget.ondragstop = ondragstop;
    widget.onremove = onremove;
}

function onremove() {
    if (window.AlbumArt) {
        AlbumArt.remove();
    }
}

function ondragstart() { }
function ondragstop() { }
function onblur() { }
function onhide() { }

function onfocus()
{
    // show info button
    document.getElementById("flip")
}

function onshow() {
    if (window.AlbumArt)  {
        AlbumArt.reload();
        redisplay_values();
        document.getElementById("albumart").style.visibility = "visible";
    }
}

// ---------------------------------------------------------------------------
// album art fetching logic
// ---------------------------------------------------------------------------

function fetch_from_amazon(variation) {
    if (!window.AlbumArt) {
        return;
    }

    locale = widget.preferenceForKey(pref_fetch);
    if (!locale) {
        locale = pref_fetch_default;
    }
    
    if (locale.indexOf("amazon_") == -1) {
        return;
    }
    
    locale = locale.substring(7,9);

    alert("amazon fetch in progress: " + variation );
    
    var title = AlbumArt.trackName();
    var artist = AlbumArt.trackArtist();
    var album = AlbumArt.trackAlbum();

    switch (variation) {
        case 0:
            amazon_make_request(artist, album, title, locale, on_amazon_finish, on_amazon_error);
            break;
        case 1:
            amazon_make_request(artist, album, "", locale, on_amazon_finish, on_amazon_error);
            break;
        case 2:
            amazon_make_request(artist, "", album, locale, on_amazon_finish, on_amazon_error);
            break;
        case 3:
            amazon_make_request(artist, "", "", locale, on_amazon_finish, on_amazon_error);
            break;
    }
}

function on_amazon_finish(req) {
    var url = amazon_get_url_medium(req);
    if (url != "") {
        document.getElementById("albumart").src = url;
        fetch_result = url;
    }
    else {
        document.getElementById("albumart").src = get_blank_albumart();
        if (fetch_attempted < fetch_amazon_max_attempts) {
            fetch_from_amazon(fetch_attempted);
            fetch_attempted++;            
        }
    }
    alert("amazon fetch completed");
}

function on_amazon_error(req) {
    document.getElementById("albumart").src = get_blank_albumart();
}


// ---------------------------------------------------------------------------
// ui components
// ---------------------------------------------------------------------------


function get_blank_albumart() {
    var trackArt = null;
    var color = null;
    
    if (window.widget) {
        color = widget.preferenceForKey(pref_color);
        if (!color) {
            color = pref_color_default;
        }
        trackArt = color + "-Blank.png";
    }            
    else {
        trackArt = "Blank.png";
    }
    return trackArt;
}


function set_rating(rating) {
    if (window.AlbumArt) {
        AlbumArt.updateRating_(rating);
        redisplay_rating();
    }
}

/* called from AlbumArt object ! */
function reloadImage(status) {
    if (window.AlbumArt) {
        AlbumArt.reload();
        fetch_attempted = 0;
        fetch_result = "";
        redisplay_values();
    }
}

function redisplay_rating() {
    var trackRating = AlbumArt.trackRating();
    
    if (window.widget) {
        starColor = widget.preferenceForKey(pref_stars);
    }
    if (!starColor) {
        starColor = pref_stars_default;
    }

    if (window.widget) {
        color = widget.preferenceForKey(pref_color);
    }
    if (!color) {
        color = pref_color_default;
    }    
    
    
    for (i = 1; i < 6; i++) {
        document.getElementById("rateimg" + i).src = color + "-StarOff.png";
    }
        
    switch (trackRating) {
    case 100:
        if (starColor == "rainbow")
            document.getElementById("rateimg5").src = starColor + "-Star5.png";                
        else
            document.getElementById("rateimg5").src = starColor + "-StarOn.png";    
    case 80:
        if (starColor == "rainbow")
            document.getElementById("rateimg4").src = starColor + "-Star4.png";                
        else
            document.getElementById("rateimg4").src = starColor + "-StarOn.png";    
    case 60:
        if (starColor == "rainbow")
            document.getElementById("rateimg3").src = starColor + "-Star3.png";                
        else
            document.getElementById("rateimg3").src = starColor + "-StarOn.png";            
    case 40:
        if (starColor == "rainbow")
            document.getElementById("rateimg2").src = starColor + "-Star2.png";                
        else
            document.getElementById("rateimg2").src = starColor + "-StarOn.png";            
    case 20:
        if (starColor == "rainbow")
            document.getElementById("rateimg1").src = starColor + "-Star1.png";                
        else
            document.getElementById("rateimg1").src = starColor + "-StarOn.png";            
    }
}

function redisplay_values() {

    if (!window.AlbumArt) {
        return;
    }
    
    var trackName = AlbumArt.trackName();
    var trackArtist = AlbumArt.trackArtist();
    var trackRating = AlbumArt.trackRating();
    var trackArt = AlbumArt.trackArt();
    var trackAlbum = AlbumArt.trackAlbum();
    
    if (!trackName) {
        trackName  = "Untitled";
    }
    if (!trackArtist) {
        trackArtist = "Unknown Artist";
    }
    
    if (!trackAlbum) {
        trackAlbum = "Unknown Album";
    }
    
    if (!trackArt) {
        if (fetch_attempted == 0) {
            var fetch_method = pref_fetch_default;
            if (window.widget) {
                fetch_method = widget.preferenceForKey(pref_fetch);
                if (!fetch_method) {
                    fetch_method = pref_fetch_default;
                }
            }
            
            if (fetch_method.indexOf("amazon_") != -1) {
                fetch_from_amazon(fetch_attempted);
            }
            
            // increment this anyway, even if we don't fetch anything
            // at least we don't have to check a second time.
            fetch_attempted++;
            trackArt = get_blank_albumart();
        }
        else if (fetch_result != "") {
            trackArt = fetch_result;
        }
        else {
           trackArt = get_blank_albumart();
        }
    }
    else {
        trackArt = "file://" + trackArt;
    }
    
    document.getElementById("track-name").innerHTML = trackName;
    document.getElementById("track-artist").innerHTML = trackArtist;
    document.getElementById("albumart").src = trackArt;
    redisplay_rating();

    if (isBack) {
        updateTrackList();
    }
}


function rotatefield(e) {
    // because overlay-layer has a high z-index than shade/text-layer
    // therefore, the events do not propagate to those. so we 
    // hack around it by capturing events in overlay-layer and
    // manually working out whether we want it.
    // 
    // if someone can read this and come up with a better idea,
    // please let me know:
    //
    // http://www.quirksmode.org/index.html?/js/introevents.html

    var posx = 0;
    var posy = 0;
    
    if (!e) {
        var e = window.event;
    }
    
    if (e.pageX || e.pageY) {
        posx = e.pageX;
        posy = e.pageY;
    }
    else if (e.clientX || e.clientY) {
        posx = e.clientX + document.body.scrollLeft;
        posy = e.clientY + document.body.scrollTop;
    }
    
    if (!window.AlbumArt) {
        return;
    }
    
    if ((posx > shade_x) && (posx < shade_x + shade_w) &&
        (posy > shade_y) && (posy < shade_y + shade_h)) {
        var trackName = AlbumArt.trackName();
        var trackArtist = AlbumArt.trackArtist();
        var trackAlbum = AlbumArt.trackAlbum();
    
        firstField = document.getElementById("track-name");
        secondField = document.getElementById("track-artist");
        
        if (firstField.firstChild) {
            fieldData = firstField.firstChild.data;
            if (fieldData == trackName) {
                firstField.innerHTML = trackAlbum;
            }
            else {
                firstField.innerHTML = trackName;
            }
        }
    }
}

// ---------------------------------------------------------------------------
// itunes controlling functions
// ---------------------------------------------------------------------------

function hotkeys(e) {
    if (!e) {
        var e = window.event;
    }
    
    if (window.AlbumArt) {
        if (e.keyCode == key_next) {
            AlbumArt.playerNext();
        }
        else if (e.keyCode == key_prev) {
            AlbumArt.playerPrev();
        }
        else if (e.keyCode == key_playpause) {
            AlbumArt.playerPlayPause();
        }
    }
    
}
document.onkeydown = hotkeys;


function trackListCompare(a, b) {
    return a[0] - b[0];
}

function playTrack(tid) {
    if (window.AlbumArt) {
        AlbumArt.playSongFile_(tid);
    }
}

function updateTrackList() {
   if (window.AlbumArt) {
        playlist = document.getElementById("album-playlist");   

        // clear nodes
        while (playlist.firstChild != null) {
            playlist.removeChild(playlist.firstChild);
        }
   
        tracks = AlbumArt.getCurrentAlbumTracks();
        //tracks = null;
        if (tracks == null) {
            playlist.appendChild(document.createTextNode("No tracks found"));
        }
        else {
            ol = document.createElement("ol");
            for (i = 0; i < tracks.length; i++) {
                x = document.createTextNode(" " + tracks[i][2] + " ");
                a = document.createElement("a");
                a.style.color = "white";
                a.appendChild(x);
                a.href = "javascript:playTrack('" + tracks[i][1] + "');";
                li = document.createElement("li");
                li.value = tracks[i][0];
                li.appendChild(a);
                ol.appendChild(li);
            }
            playlist.appendChild(ol);
        }
    }
}

// ---------------------------------------------------------------------------
// preference manipulating functions
// ---------------------------------------------------------------------------

function changeInfoOpacity(selection) {
    newOpacity = selection.value;
    
    shader = document.getElementById("shade-layer");
    if (shader) shader.style.opacity = newOpacity;
    
    if (window.widget) {
        widget.setPreferenceForKey(newOpacity, pref_info_opacity);
    }
}


function changeWidgetColor(selection) {
    newColor = selection.value;
    
    bg = document.getElementById("front-background");
    if (bg) bg.src = newColor + "-Default.png";
    overlay = document.getElementById("overlay");
    if (overlay) overlay.src = newColor + "-Overlay.png";
    
    if (window.widget) {
        widget.setPreferenceForKey(newColor, pref_color);
    }
    
    redisplay_values();
}

function changeStarsColor(selection) {
    newColor = selection.value;
    
    if (window.widget) {
        widget.setPreferenceForKey(newColor, pref_stars);
    }
    
    redisplay_values();
}

function changeFetchMethod(selection) {
    fetch_method = selection.value;
    if (window.widget) {
        widget.setPreferenceForKey(fetch_method, pref_fetch);
    }
}
