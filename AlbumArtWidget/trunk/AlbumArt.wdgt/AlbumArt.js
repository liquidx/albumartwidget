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

function debug(msg) {
    if (!debug.box) {
        debug.box = document.createElement("div");
        debug.box.setAttribute("style", "background-color: white; " +
        "font-family: monospace; " +
        "border: solid black 1px; font-size: x-small; " +
        "position: absolute;top:0px; left: 0px; height: 100px;" +
        "padding: 10px; z-index: 100; overflow: scroll;");
        document.body.appendChild(debug.box);
    }
        
    debug.box.insertBefore(document.createElement("br"), debug.box.firstChild);
    debug.box.insertBefore(document.createTextNode(msg), debug.box.firstChild);
}



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
        redisplay_values();
        if ((status == "Paused") || (status == "Stopped")) {
            document.getElementById("playerstate-layer").visibility = "visible";
            document.getElementById("playerstate").src = "Paused.png";
        }
        else {
            document.getElementById("playerstate-layer").visibility = "hidden";
        }
    }
}

function redisplay_rating() {
    var trackRating = AlbumArt.trackRating();
    for (i = 1; i < 6; i++) {
        document.getElementById("rateimg" + i).src = "StarOff.png";
    }
        
    switch (trackRating) {
    case 100:
        document.getElementById("rateimg5").src = "StarOn.png";    
    case 80:
        document.getElementById("rateimg4").src = "StarOn.png";
    case 60:
        document.getElementById("rateimg3").src = "StarOn.png";    
    case 40:
        document.getElementById("rateimg2").src = "StarOn.png";
    case 20:
        document.getElementById("rateimg1").src = "StarOn.png";   
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
        trackArt = "Blank.png";
    }
    else {
        
        trackArt = "file://" + trackArt;
    }
    
    nameNode = document.getElementById("track-name");
    while (nameNode.firstChild != null) {
        nameNode.removeChild(nameNode.firstChild);
    }
    nameNode.appendChild(document.createTextNode(" " + trackName + " "));
    document.getElementById("track-artist").innerHTML = trackArtist;
    document.getElementById("albumart").src = trackArt;
    redisplay_rating();

}

function rotatefield() {
     if (!window.AlbumArt) {
        return;
    }
    
    var trackName = AlbumArt.trackName();
    var trackArtist = AlbumArt.trackArtist();
    var trackAlbum = AlbumArt.trackAlbum();
    
    debug("");
    
    if (field.nodeValue == trackName) {
        field.innerHTML = trackArtist;
    }
    else if (field.nodeValue == trackArtist) {
        field.innerHTML = trackAlbum;
    }
    else if (field.nodeValue == trackAlbum) {
        field.innerHTML = trackName;
    }
    else {
        if (field.id == "track-name") {
            field.innerHTML = trackName;
        }
        else if (field.id == "track-artist") {
            field.innerHTML = trackArtist;
        }
    }
}

function trackListCompare(a, b) {
    return a[0] - b[0];
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
                x = document.createTextNode(" " + tracks[i][1] + " ");
                li = document.createElement("li");
                li.value = tracks[i][0];
                li.appendChild(x);
                ol.appendChild(li);
            }
            playlist.appendChild(ol);
        }
    }
}



//
// showing i-button and flip-button
//

var isBack = false;
var flipShown = false;
var animation = {duration:0, starttime:0, to:1.0, now:0.0, from:0.0, firstElement:null, secondElement:null, timer:null};

function mousemove (event)
{
    if (!flipShown)
    {
        showFlipButtons();
        flipShown = true;
    }
}

function mouseexit (event)
{
    if (flipShown)
    {
       hideFlipButtons();
       flipShown = false;
    }
    exitPrefsFlip();
    exitAlbumFlip();
}

function showFlipButtons()
{
    if (animation.timer != null)
    {
        clearInterval (animation.timer);
        animation.timer  = null;
    }
            
    var starttime = (new Date).getTime() - 13;
            
    animation.duration = 500;
    animation.starttime = starttime;
    if (!isBack) {
        animation.firstElement = document.getElementById ('flipprefs');
        animation.secondElement = document.getElementById('flipalbum');
    }
    else {
        animation.firstElement = document.getElementById ('flipalbumback');    
    }
    //debug("second_element: " + animation.secondElement);
    animation.timer = setInterval ("animate();", 13);
    animation.from = animation.now;
    animation.to = 1.0;
    animate();
}

function hideFlipButtons() 
{
 // fade in the info button
    if (animation.timer != null)
    {
        clearInterval (animation.timer);
        animation.timer  = null;
    }
            
    var starttime = (new Date).getTime() - 13;
            
    animation.duration = 500;
    animation.starttime = starttime;
   if (!isBack) {
        animation.firstElement = document.getElementById ('flipprefs');
        animation.secondElement = document.getElementById('flipalbum');
    }
    else {
        animation.firstElement = document.getElementById ('flipalbumback');    
    }
    animation.timer = setInterval ("animate();", 13);
    animation.from = animation.now;
    animation.to = 0.0;
    animate();
}

function animate()
{
    var T;
    var ease;
    var time = (new Date).getTime();
                
        
    T = limit_3(time-animation.starttime, 0, animation.duration);
        
    if (T >= animation.duration)
    {
        clearInterval (animation.timer);
        animation.timer = null;
        animation.now = animation.to;
    }
    else
    {
        ease = 0.5 - (0.5 * Math.cos(Math.PI * T / animation.duration));
        animation.now = computeNextFloat (animation.from, animation.to, ease);
    }
    
    if (animation.firstElement != null)
        animation.firstElement.style.opacity = animation.now;
    if (animation.secondElement != null)
        animation.secondElement.style.opacity = animation.now;    
}
function limit_3 (a, b, c)
{
    return a < b ? b : (a > c ? c : a);
}
function computeNextFloat (from, to, ease)
{
    return from + (to - from) * ease;
}


function enterAlbumFlip(event)
{
        document.getElementById('flipalbumrollie').style.display = 'block';
}

function exitAlbumFlip(event)
{
        document.getElementById('flipalbumrollie').style.display = 'none';
}

function enterPrefsFlip(event)
{
        document.getElementById('flipprefsrollie').style.display = 'block';
}

function exitPrefsFlip(event)
{
        document.getElementById('flipprefsrollie').style.display = 'none';
}

// 
// switch to showing preferences
//

function showPrefs() 
{
    var front = document.getElementById("front");
    var prefs = document.getElementById("prefs");
        
    if (window.widget)
        widget.prepareForTransition("ToBack");
                
    front.style.display="none";
    prefs.style.display="block";
        
    if (window.widget)
        setTimeout ('widget.performTransition();', 0);  
}

function hidePrefs()
{
    var front = document.getElementById("front");
    var prefs = document.getElementById("prefs");
        
    if (window.widget)
        widget.prepareForTransition("ToFront");
                
    prefs.style.display="none";
    front.style.display="block";
        
    if (window.widget)
        setTimeout ('widget.performTransition();', 0);
}

function showAlbumBack()
{
    var front = document.getElementById("front");
    var back = document.getElementById("back");
        
    if (window.widget)
        widget.prepareForTransition("ToBack");
                
    front.style.display="none";
    back.style.display="block";
    isBack = true;
    
    if (flipShown) {
        hideFlipButtons();
        flipShown = false;
        exitAlbumFlip();
        exitPrefsFlip();
    }
    
    updateTrackList();
     
    if (window.widget)
        setTimeout ('widget.performTransition();', 0);  
}

function hideAlbumBack()
{
    var front = document.getElementById("front");
    var back = document.getElementById("back");
        
    if (window.widget)
        widget.prepareForTransition("ToFront");
                
    back.style.display="none";
    front.style.display="block";
    isBack = false;
        
    if (flipShown) {
        hideFlipButtons();
        flipShown = false;
        exitAlbumFlip();
    }
        
    if (window.widget)
        setTimeout ('widget.performTransition();', 0);
}

