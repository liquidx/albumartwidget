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

// ---------------------------------------------------------------------------
// constants
// ---------------------------------------------------------------------------

var shade_x = 32;
var shade_y = 149;
var shade_w = 160;
var shade_h = 38;

var key_next = 190; // ">"
var key_prev = 188; // "<"
var key_playpause = 32; //"space"
var key_debug = 68; // 'd'
var key_itms = 73; // 'i'

var str_default_artist = "Unknown Artist";
var str_default_album  = "No Album";
var str_default_title  = "Untitled";

var lx = "http://www.liquidx.net/albumartwidget/";

var current_version = 2.91; // needs to be a valid floating point number
var current_version_string = "2.9.1";

// --------------------------------------------------------------------------
// itunes music store affiliate links
// 
// this deserves an explanation about why this is here. after the amount of
// effort developing this widget, i decided that the least evil way for users
// to support this project is to take advantage of the itunes music store
// affiliate scheme implemented by linkshare.
//
// the way this works is pretty unobtrustive, there'll be a preference to
// turn on itms links (just like itunes), and what will happen is a small
// (>) arrow will appear on the top corner of the widget where the album
// art is displayed. it will only appear on a mouse over. this link will
// jump to the linkshare redirect page and then to apple's servers that
// does the search to find the most appropriate itms page to show a use
// and redirect the user's itunes to the itms page.
//
// if you hate this, then don't use the itms link at all, that way i don't
// get anything from apple if you decide to buy anything from itunes.
//
// if you object about anything that is said here, please feel free to email
// me at alastair@liquidx.net and maybe i can work out a better scheme for
// my work to be supported and remain totally free and open source.
// --------------------------------------------------------------------------

var itms_ref = "http://click.linksynergy.com/fs-bin/stat?id=UyUintSDYWY&offerid=78941&type=3&subid=0&tmpid=1826&RD_PARM1=";
var itms_base = "http://phobos.apple.com/WebObjects/MZSearch.woa/wa/libraryLink?";

function make_itms_link(track, artist, album) {
    var params = "";
    if (track) {
        params = params + "n=" + encodeURIComponent(track) + "&";
    }
    if (artist) {
        params = params + "an=" + encodeURIComponent(artist) + "&";
    }
    /* disabled because album names are usually wrong (esp for radio streams)
    if (album) {
        params = params + "pn=" + encodeURIComponent(album) + "&";
    }
    */
    params = params + "originStoreFront=143441&partnerId=30";
    
    // do bad trick of replacing all single and double quotes
    s = new String(params);
    s = s.replace(/\'/g, "%27");
    s = s.replace(/\"/g, "%22");
    params = s;
    
    var parm1 = encodeURIComponent(itms_base + params);
    return itms_ref + parm1;
}
