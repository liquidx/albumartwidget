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
