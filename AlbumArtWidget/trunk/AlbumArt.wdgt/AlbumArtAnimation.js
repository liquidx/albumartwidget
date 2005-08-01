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

//
// Handle Animation of Song Info Layer
//

var song_info_top = 150;
var song_info_bottom = 190;
var song_info_duration = 5000;

var song_info_height = song_info_bottom - song_info_top;
var song_info_anim = {duration: 0, starttime:0, to:song_info_bottom, now:song_info_top, from:0.0, elements: null, timer:null};

var song_info_hide_timer = null;
var song_info_mouse_in = 0;

// TODO: add option to activate hiding behaviour

function song_info_mouseover() {
    song_info_show(0);
    song_info_mouse_in = 1;
}

function song_info_mouseout() {
    var should_hide = pref_info_hide_default;
    
    if (window.widget) {
        should_hide = widget.preferenceForKey(pref_info_hide);
    }
    
    if (should_hide) {
        song_info_hide();
    }
    song_info_mouse_in = 0;
}

function song_info_show(autohide) {
    if (song_info_anim.timer != null) {
        clearInterval(song_info_anim.timer);
        song_info_anim.timer = null;
    }
    
    var starttime = (new Date).getTime() - 10;
    song_info_anim.duration = 1000;
    song_info_anim.starttime = starttime;
    song_info_anim.elements = new Array();
    song_info_anim.elements[0] = document.getElementById('text-layer');
    song_info_anim.elements[1] = document.getElementById('shade-layer');    
    song_info_anim.timer = setInterval("song_info_animate();", 50);
    song_info_anim.from = song_info_anim.now;
    song_info_anim.to = song_info_top;
    song_info_animate();
    
    if (autohide || (song_info_hide_timer != null)) {
       clearInterval(song_info_hide_timer);
       song_info_hide_timer = null;
    }
    
    if (autohide && (song_info_mouse_in == 0)) {
        song_info_hide_timer = setInterval("song_info_hide();", song_info_duration);
    }        
}

function song_info_hide() {
    if (song_info_anim.timer != null) {
        clearInterval(song_info_anim.timer);
        song_info_anim.timer = null;
    }
    
     if (song_info_hide_timer != null) {
        clearInterval(song_info_hide_timer);
        song_info_hide_timer = null;
    }
   
    var starttime = (new Date).getTime() - 10;
    song_info_anim.duration = 1000;
    song_info_anim.starttime = starttime;
    song_info_anim.elements = new Array();
    song_info_anim.elements[0] = document.getElementById('text-layer');
    song_info_anim.elements[1] = document.getElementById('shade-layer');    
    song_info_anim.timer = setInterval("song_info_animate();", 50);
    song_info_anim.from = song_info_anim.now;
    song_info_anim.to = song_info_bottom;
    song_info_animate();

}

function song_info_animate() {
   var T;
    var ease;
    var time = (new Date).getTime();
    var info_opacity = pref_info_opacity_default;
    if (window.widget) {
        info_opacity = widget.preferenceForKey(pref_info_opacity);
    }
        
    T = limit_3(time-song_info_anim.starttime, 0, song_info_anim.duration);
        
    if (T >= song_info_anim.duration)
    {
        clearInterval (song_info_anim.timer);
        song_info_anim.timer = null;
        song_info_anim.now = song_info_anim.to;
    }
    else
    {
        ease = 0.5 - (0.5 * Math.cos(Math.PI * T / song_info_anim.duration));
        song_info_anim.now = computeNextFloat (song_info_anim.from, song_info_anim.to, ease);
    }

    for (var i = 0; i < song_info_anim.elements.length; i++) {
        song_info_anim.elements[i].style.top = parseInt(song_info_anim.now) 
        + "px";
        song_info_anim.elements[i].style.height = parseInt(song_info_bottom - song_info_anim.now) + "px";
    }
     song_info_anim.elements[1].style.opacity = ((song_info_bottom - song_info_anim.now)/song_info_height) * info_opacity;

}

function limit_3 (a, b, c)
{
    return a < b ? b : (a > c ? c : a);
}
function computeNextFloat (from, to, ease)
{
    return from + (to - from) * ease;
}
