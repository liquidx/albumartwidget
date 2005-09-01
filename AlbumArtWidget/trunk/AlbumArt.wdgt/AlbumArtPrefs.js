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
// Global Prefs Constants
//
var pref_color = "widget_color";
var pref_color_default = "metal";
var pref_color_choices = new Array("metal", "blue", "black");

var pref_stars = "stars_color";
var pref_stars_default = "rainbow";
var pref_stars_choices = new Array("rainbow", "grey", "blue");
var pref_stars_selected_border_style = "1px dashed #999";

var pref_info_opacity = "overlay_opacity";
var pref_info_opacity_default = 0.2;
var pref_info_opacity_choices = new Array(0.0, 0.2, 0.4, 0.6, 0.8);

var pref_info_hide = "info_hide";
var pref_info_hide_default = 0;

var pref_itms_link = "itms_link";
var pref_itms_link_default = 1;

var pref_fetch = "fetch_method";
var pref_fetch_default = "none";
var pref_fetch_choices = new Array("amazon_us", "amazon_uk", "amazon_jp", "amazon_de", "amazon_fr", "amazon_ca", "google", "yesasia_b5", "yesasia_gb");

var pref_choices = new Array();
pref_choices[pref_color] = pref_color_choices;
pref_choices[pref_stars] = pref_stars_choices;
pref_choices[pref_fetch] = pref_fetch_choices;
pref_choices[pref_info_opacity] = pref_info_opacity_choices;

var pref_defaults = new Array();
pref_defaults[pref_color] = pref_color_default;
pref_defaults[pref_stars] = pref_stars_default;
pref_defaults[pref_fetch] = pref_fetch_default;
pref_defaults[pref_info_opacity] = pref_info_opacity_default;

function verify_pref(pref_value, pref_name) {
    var choices = pref_choices[pref_name];
    var def = pref_defaults[pref_name];
    if (pref_value == null) {
        return def;
    }
    
    if (choices != null) {
        for (var i = 0; i < choices.length; i++) {
            if (choices[i] == pref_value) {
                return pref_value;
            }
        }
    }
    
    return def;
}

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


