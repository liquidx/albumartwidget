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

// ---------------------------------------------------------------------------
// constants
// ---------------------------------------------------------------------------


var shade_x = 34;
var shade_y = 140;
var shade_w = 158;
var shade_h = 40;

var key_next = 190; // ">"
var key_prev = 188; // "<"
var key_playpause = 32; //"space"
var key_debug = 68; // 'd'
var key_save = 83; // 's'

var str_default_artist = "Unknown Artist";
var str_default_album  = "No Album";
var str_default_title  = "Untitled";

var lx = 'http://www.liquidx.net/';
function shameless_self_promotion() { if (window.widget) widget.openURL(lx); }

// ---------------------------------------------------------------------------
// ugly global state
// ---------------------------------------------------------------------------

var fetch_attempted = 0; // make sure we don't fetch many times per track
var fetch_amazon_max_attempts = 5;
var fetch_google_max_attempts = 3;
var fetch_yesasia_max_attempts = 5;

var fetch_result = "";         // URL of album art to display (can be file:// or http://)
var fetch_save_url = "";       // URL to save if prompted. (null for local file)
var fetch_cache = new Array(); // key = album name, value = album cover url

var fetch_url_test_params = "";

var current_song_id = null;          // used to throttle redraws
var current_song_shared_name = null; // temporary hack for shared libraries

var debug_level = 0;
function debug(s) {
    if (debug_level > 0) {
        alert(s);
    }
}

// ---------------------------------------------------------------------------
// preferences
// ---------------------------------------------------------------------------

var pref_color = "widget_color";
var pref_color_default = "metal";
var pref_stars = "stars_color";
var pref_stars_default = "rainbow";
var pref_start_selected_border_style = "1px dashed #999";
var pref_info_opacity = "overlay_opacity";
var pref_info_opacity_default = 0.2;
var pref_fetch = "fetch_method";
var pref_fetch_default = "none";

function select_pref(pref_value, pref_object) {
    if (pref_object == null) 
        return;
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
        star_select = document.getElementById(starColor + "-star-link");
        star_select.style.border = pref_start_selected_border_style;      
        
        // init fetch prefs
        var fetch = widget.preferenceForKey(pref_fetch);
        if (!fetch) {
            fetch = pref_fetch_default;
        }
        select_pref(fetch, document.getElementById("select-fetch"));
        
        
        // init other global states
        if (window.AlbumArt) {
            current_song_id = AlbumArt.trackLocation();
        }
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

function fetch_album_art(trackArtist, trackAlbum, trackName) {
    var fetch_method = pref_fetch_default;
    var album_art = get_blank_albumart();
    
    // if we've already fetched before, return that
    if (fetch_attempted > 0) {
        if (fetch_result != "") {
            return fetch_result 
        }
        else {
            return album_art;
        }
    }
    
    // if we have no details, don't bother fetching
    if ((trackArtist == "") || (trackArtist == str_default_artist)) {
        return album_art;
    }
    if ((trackAlbum == "") || (trackAlbum == str_default_album)) {
        return album_art;
    }
    if ((trackName == "") || (trackName == str_default_title)) {
        return album_art;
    }
    
    
    // if we haven't attempted to fetch for this track, do it now
    if (window.widget) {
        user_fetch_method = widget.preferenceForKey(pref_fetch);
        if (user_fetch_method) {
            fetch_method = user_fetch_method;
        }
    }
    
    // return the result if found in cache
    if (fetch_cache[trackAlbum] != null) {
        fetch_attempted++;
        fetch_result = fetch_cache[trackAlbum][0];
        fetch_save_url = fetch_cache[trackAlbum][1];
        return fetch_cache[trackAlbum][0];
    }
    
    // if user wants to fetch, we do it.    
    if (fetch_method.indexOf("amazon_") != -1) {
        debug("fetching via amazon");
        fetch_from_amazon(fetch_attempted);
        fetch_attempted++;
    }
    else if (fetch_method.indexOf("google") != -1) {
        debug("fetching via google");
        fetch_from_google(fetch_attempted);
        fetch_attempted++;
    }
    else if (fetch_method.indexOf("yesasia") != -1) {
        debug("fetching via yesasia");
        fetch_from_yesasia(fetch_attempted);
        fetch_attempted++;
    }
    
    return album_art; // return placeholder
}

// ---------------------------------------------------------------------------
// Yesasia fetching
// ---------------------------------------------------------------------------

function fetch_from_yesasia(variation) {
    if (!window.AlbumArt) {
        return;
    }

    locale = widget.preferenceForKey(pref_fetch);
    if (!locale) {
        locale = pref_fetch_default;
    }
    
    if (locale.indexOf("yesasia_") == -1) {
        return;
    }
    
    debug("fetch_from_yesasia: method: " + variation);
    
    locale = locale.substring(8,10);
    
    var title = AlbumArt.trackNameInEncoding_(locale);
    var artist = AlbumArt.trackArtistInEncoding_(locale);
    var album = AlbumArt.trackAlbumInEncoding_(locale);
    
    // small hack to make searching chinese albums easier
    var artistChars = artist.split('%');
    // parse the first hex code, and if it is greater than %7f (128), then
    // it is non-ascii.
    if ((artistChars.length > 1) && (artistChars[1].charCodeAt(0) > 37)) {
        artist = artist.split('%20')[0];
    }
    
    switch (variation) {
        case 0:
            yesasia_make_request(artist, album, title, locale, on_yesasia_finish, on_fetch_error);
            break;
        case 1:
            yesasia_make_request(artist, album, "", locale, on_yesasia_finish, on_fetch_error);
            break;
        case 2:
            yesasia_make_request(artist, "", album, locale, on_yesasia_finish, on_fetch_error);
            break;
        case 3:
            yesasia_make_request(artist, "", title, locale, on_yesasia_finish, on_fetch_error);        
            break;
        case 4:
            yesasia_make_request(artist, "", "", locale, on_yesasia_finish, on_fetch_error);
            break;
    }
    
    show_spinner();
}


function on_yesasia_finish(req) {
    debug("on_yesasia_finish: request successful");
    
    var urls = yesasia_get_urls(req);
    
    if (debug_level > 0) {
        for (var i = 0; i < urls.length; i++) {
            debug(i + ": " + urls[i][0]);
        }
    }
    
    if ((urls != null)  && (urls.length > 0)) {
        // get large url
        var url_small = urls[0][0];
        var url_large = urls[0][1];
        
        if (url_large == "") {
            url_large = url_small;
        }
    
        // add URL to cache
        if (window.AlbumArt) {
            trackAlbum = AlbumArt.trackAlbum();
            if (trackAlbum) {
                fetch_cache[trackAlbum] = new Array(2);
                fetch_cache[trackAlbum][0] = url_large; // use large! url_small;
                fetch_cache[trackAlbum][1] = url_large;
            }
        }
        
        // initiate an async url test
        if (window.AlbumArt) {
            fetch_url_test_params = {url:url_large, alt_url:url_small, album:AlbumArt.trackAlbum()};
            test_url_request(url_large, fetch_url_test_params, null, on_album_art_unreachable);
        }
        
        // update interface and store result
        document.getElementById("albumart").src = url_large;
        document.getElementById("albumart").width = 160;
        document.getElementById("albumart").height = 160;
        fetch_result = url_large; // use large! url_small;
        fetch_save_url = url_large;
        hide_spinner();
    }
    else {
        // attempt another variation of artist/album/track combination
        document.getElementById("albumart").src = get_blank_albumart();
        if (fetch_attempted < fetch_yesasia_max_attempts) {
            fetch_from_yesasia(fetch_attempted);
            fetch_attempted++;            
        }
        else {
            hide_spinner();
        }
    }
}

function on_album_art_unreachable(params) {
    // album art we requested to display is not available
    // so display a small version, or blank albumart
    if (window.AlbumArt) {
    
        // switch display to alternative image
        if (params.album == AlbumArt.trackAlbum()) {
            var aa = document.getElementById("albumart");
            if (params.alt_url != "") {
                aa.src = params.alt_url;
            }
            else {
                aa.src = get_blank_albumart();
            }
            fetch_result = params.alt_url;
            fetch_save_url = params.alt_url;                
            
            aa.width = 160;
            aa.height = 160;
        }
        
        
        // update the cache to reflect out new situation
        if (params.alt_url != "") {
            fetch_cache[params.album][0] = params.alt_url;
            fetch_cache[params.album][1] = params.alt_url;
        }
        else {
            fetch_cache[params.album] = null;
        }
    }
}


// ---------------------------------------------------------------------------
// Google fetching
// ---------------------------------------------------------------------------


function fetch_from_google(variation) {

    if (!window.AlbumArt) {
        return;
    }

    debug("fetch_from_google: method: " + variation);
    
    var title = AlbumArt.trackName();
    var artist = AlbumArt.trackArtist();
    var album = AlbumArt.trackAlbum();
    
    // small hack to make searching chinese albums easier
    if (artist && (artist.charCodeAt(0) >  128)) {
        artist = artist.split(' ')[0];
    }

    switch (variation) {
        case 0:
            var query = album + " " + artist;
            google_make_request(query, on_google_finish, on_fetch_error);
            break;
        case 1:
            var query = title + " " + artist;        
            google_make_request(query, on_google_finish, on_fetch_error);
            break;
        case 2:
            var query = artist;        
            google_make_request(query, on_google_finish, on_fetch_error);
            break;
        default:
            break;
    }
    show_spinner();
}

function on_google_finish(req) {
    debug("on_google_finish: request successful");
    
    var urls = google_get_urls(req);
    
    if ((urls != null)  && (urls.length > 0)) {
        // get large url
        var url_small = urls[0][0];
        var url_large = urls[0][1];
        
        if (url_large == "") {
            url_large = url_small;
        }
    
        // add URL to cache
        if (window.AlbumArt) {
            trackAlbum = AlbumArt.trackAlbum();
            if (trackAlbum) {
                fetch_cache[trackAlbum] = new Array(2);
                fetch_cache[trackAlbum][0] = url_large; // use large! url_small;
                fetch_cache[trackAlbum][1] = url_large;
            }
        }
        
         // initiate an async url test
        if (window.AlbumArt) {
            fetch_url_test_params = {url:url_large, alt_url:url_small, album:AlbumArt.trackAlbum()};
            test_url_request(url_large, fetch_url_test_params, null, on_album_art_unreachable);
        }
        
        // update interface and store result
        document.getElementById("albumart").src = url_large;
        document.getElementById("albumart").width = 160;
        document.getElementById("albumart").height = 160;
        fetch_result = url_large; // use large! url_small;
        fetch_save_url = url_large;
        hide_spinner();
    }
    else {
        // attempt another variation of artist/album/track combination
        document.getElementById("albumart").src = get_blank_albumart();
        if (fetch_attempted < fetch_google_max_attempts) {
            fetch_from_google(fetch_attempted);
            fetch_attempted++;            
        }
        else {
            hide_spinner();
        }
    }
}

// ---------------------------------------------------------------------------
// Amazon fetching
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
    
    debug("fetch_from_amazon: method: " + variation);
    
    locale = locale.substring(7,9);
    
    var title = AlbumArt.trackName();
    var artist = AlbumArt.trackArtist();
    var album = AlbumArt.trackAlbum();

    switch (variation) {
        case 0:
            amazon_make_request(artist, album, title, locale, on_amazon_finish, on_fetch_error);
            break;
        case 1:
            amazon_make_request(artist, album, "", locale, on_amazon_finish, on_fetch_error);
            break;
        case 2:
            amazon_make_request(artist, "", album, locale, on_amazon_finish, on_fetch_error);
            break;
        case 3:
            amazon_make_request(artist, "", title, locale, on_amazon_finish, on_fetch_error);        
            break;
        case 4:
            amazon_make_request(artist, "", "", locale, on_amazon_finish, on_fetch_error);
            break;
    }
    show_spinner();
}

function on_amazon_finish(req) {
    debug("on_amazon_finish: request successful");
    
    var url = amazon_get_url_medium(req);
    
    if (url != "") {
        // get large url
        var url_large = amazon_get_url_large(req);
        if (url_large == "") {
            url_large = url;
        }
    
        // add URL to cache
        if (window.AlbumArt) {
            trackAlbum = AlbumArt.trackAlbum();
            if (trackAlbum) {
                fetch_cache[trackAlbum] = new Array(2);
                fetch_cache[trackAlbum][0] = url;
                fetch_cache[trackAlbum][1] = url_large;
            }
        }
        
        // update interface and store result
        document.getElementById("albumart").src = url;
        fetch_result = url;
        fetch_save_url = url_large;
        hide_spinner();
    }
    else {
        // attempt another variation of artist/album/track combination
        document.getElementById("albumart").src = get_blank_albumart();
        if (fetch_attempted < fetch_amazon_max_attempts) {
            fetch_from_amazon(fetch_attempted);
            fetch_attempted++;            
        }
        else {
            hide_spinner();
        }
    }
}

function on_fetch_error(req) {
    // something happened with the fetch, aborting.
    debug("on_fetch_error: error fetching");
    document.getElementById("albumart").src = get_blank_albumart();
    hide_spinner();
}


// ---------------------------------------------------------------------------
// ui components
// ---------------------------------------------------------------------------

function html_escape(sss) {
    return sss.replace("&","&amp;");
}

function show_spinner() {
    var spinner = document.getElementById("spinner-layer");
    spinner.style.display = "block";
}

function hide_spinner() {
    var spinner = document.getElementById("spinner-layer");
    spinner.style.display = "none";
}

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

function saveArt() {
    if (window.AlbumArt) {
        if ((fetch_save_url != "") && (current_song_id != "")) {
            show_spinner();
            AlbumArt.addAlbumArtToCurrentSong_withContentsOfURL_(current_song_id, fetch_save_url);
            fetch_save_url = ""; // prevent updating twice
            hide_spinner();
        }
    }
}        

function refreshArt() {
    fetch_result = "";
    fetch_save_url = "";
    fetch_attempted = 0;
    redisplay_values();
}

/* called from AlbumArt object ! */
function reloadImage(status) {
    var songChanged = false;

    if (window.AlbumArt) {
        AlbumArt.reload();

        if ((AlbumArt.trackType() == "Radio") && (status == "Playing")) {
            songChanged = true;
        }

        if (AlbumArt.trackLocation() != current_song_id) {
            songChanged = true;
        }
        if (AlbumArt.trackLocation() == null) {
            songChanged = true; // this happens for shared tracks
        }
        
        debug("songchanged: " + AlbumArt.trackLocation());

        if (songChanged) {        
            fetch_attempted = 0;
            fetch_result = "";
            fetch_save_url = "";
        }
        
        current_song_id = AlbumArt.trackLocation();
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
    
    if (trackRating == 100) {    
        if (starColor == "rainbow")
            document.getElementById("rateimg5").src = starColor + "-Star5.png";                
        else
            document.getElementById("rateimg5").src = starColor + "-StarOn.png";    
    }
    if (trackRating >= 80) {
        if (starColor == "rainbow")
            document.getElementById("rateimg4").src = starColor + "-Star4.png";                
        else
            document.getElementById("rateimg4").src = starColor + "-StarOn.png";    
    }
    if (trackRating >= 60) {
        if (starColor == "rainbow")
            document.getElementById("rateimg3").src = starColor + "-Star3.png";                
        else
            document.getElementById("rateimg3").src = starColor + "-StarOn.png";            
    }
    
    if (trackRating >= 40) {
        if (starColor == "rainbow")
            document.getElementById("rateimg2").src = starColor + "-Star2.png";                
        else
            document.getElementById("rateimg2").src = starColor + "-StarOn.png";            
    }
    
    if (trackRating >= 20) {
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
        trackName  = str_default_title;
    }
    if (!trackArtist) {
        trackArtist = str_default_artist;
    }
    
    if (!trackAlbum) {
        trackAlbum = str_default_album;
    }
    
    if (!trackArt) {
        trackArt = fetch_album_art(trackArtist, trackAlbum, trackName);
    }
    else {
        trackArt = "file://" + trackArt;
    }
    
    document.getElementById("track-name").innerHTML = html_escape(trackName);
    document.getElementById("track-artist").innerHTML = html_escape(trackArtist);
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
        var trackName = html_escape(AlbumArt.trackName());
        var trackArtist = html_escape(AlbumArt.trackArtist());
        var trackAlbum = html_escape(AlbumArt.trackAlbum());
        if (!trackName)
            trackName = str_default_title;
        if (!trackArtist)
            trackArtist = str_default_artist;
        if (!trackAlbum)
            trackAlbum = str_default_album;
    
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

    if (e.keyCode == key_debug) {
        if (debug_level > 0) {
            debug("debug mode disabled");
            debug_level = 0;
        }
        else {
            debug_level = 1;
            debug("debug mode enabled");
        }
    }
    
    if (e.keyCode == key_save) {
        saveArt();
    }
    
}
document.onkeydown = hotkeys;

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
        if (tracks == null) {
            playlist.appendChild(document.createTextNode("No tracks found"));
        }
        else {
 
            ol = document.createElement("ol");
            for (var i = 0; i < tracks.length; i++) {
                var trackNum = tracks[i][0];
                x = document.createTextNode(" " + tracks[i][2] + " ");
                a = document.createElement("a");
                a.style.color = "white";
                a.appendChild(x);
                a.href = "javascript:playTrack('" + tracks[i][1] + "');";
                li = document.createElement("li");
                li.value = trackNum;
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
    var newColor = selection;
    var oldColor = widget.preferenceForKey(pref_stars);
    
    star_select = document.getElementById(oldColor + "-star-link");
    star_select.style.border = "0";
    
    if (window.widget) {
        widget.setPreferenceForKey(newColor, pref_stars);
    }
    
    star_select = document.getElementById(newColor + "-star-link");
    star_select.style.border = pref_start_selected_border_style;
    
    redisplay_values();
}

function changeFetchMethod(selection) {
    fetch_method = selection.value;
    if (window.widget) {
        widget.setPreferenceForKey(fetch_method, pref_fetch);
    }
    
    // if we change fetch method, invalidate the cache and force
    // a re-fetch
    fetch_cache = new Array();
    fetch_result = "";
    fetch_save_url = "";
    fetch_attempted = 0;
}
