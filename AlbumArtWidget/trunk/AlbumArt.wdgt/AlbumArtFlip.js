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
// showing i-button and flip-button
//

var isBack = false;
var flipShown = false;
var animation = {duration:0, starttime:0, to:1.0, now:0.0, from:0.0, elements:null, timer:null};

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
        animation.elements = new Array();
        animation.elements[0] = document.getElementById('flipprefs');
        animation.elements[1] = document.getElementById('flipalbum');
        animation.elements[2] = document.getElementById('saveart');
        animation.elements[3] = document.getElementById('refresh');        
    }
    else {
        animation.elements = new Array();
        animation.elements[0]  = document.getElementById ('flipalbumback');    
    }
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
        animation.elements = new Array();
        animation.elements[0] = document.getElementById('flipprefs');
        animation.elements[1] = document.getElementById('flipalbum');
        animation.elements[2] = document.getElementById('saveart');
        animation.elements[3] = document.getElementById('refresh');        
    }
    else {
        animation.elements = new Array();
        animation.elements[0]  = document.getElementById ('flipalbumback');    
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
    
    for (var i = 0; i < animation.elements.length; i++) {
        animation.elements[i].style.opacity = animation.now;
    }    
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

function enterAlbumBackFlip(event)
{
        document.getElementById('flipalbumrollieback').style.display = 'block';
}

function exitAlbumBackFlip(event)
{
        document.getElementById('flipalbumrollieback').style.display = 'none';
}


function enterPrefsFlip(event)
{
        document.getElementById('flipprefsrollie').style.display = 'block';
}

function exitPrefsFlip(event)
{
        document.getElementById('flipprefsrollie').style.display = 'none';
}

function enterSaveArt(event)
{
        document.getElementById('saveartrollie').style.display = 'block';
}

function exitSaveArt(event)
{
        document.getElementById('saveartrollie').style.display = 'none';
}

function enterRefresh(event)
{
        document.getElementById('refreshrollie').style.display = 'block';
}

function exitRefresh(event)
{
        document.getElementById('refreshrollie').style.display = 'none';
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
        exitAlbumBackFlip();
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
        exitAlbumBackFlip();
    }
        
    if (window.widget)
        setTimeout ('widget.performTransition();', 0);
}
