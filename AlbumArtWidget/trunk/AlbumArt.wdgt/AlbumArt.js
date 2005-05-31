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
function onfocus() { }
function onblur() { }
function onhide() { }

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
    
    if (!trackName) {
        trackName  = "Untitled";
    }
    if (!trackArtist) {
        trackArtist = "Unnamed";
    }
    if (!trackArt) {
        trackArt = "Dummy.png";
    }
    else {
        
        trackArt = "file://" + trackArt;
    }
    document.getElementById("track-name").innerHTML = trackName;
    document.getElementById("track-artist").innerHTML = trackArtist;
    document.getElementById("albumart").src = trackArt;
    redisplay_rating();

}
