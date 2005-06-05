#define AAP_SET_RATING_SCRIPT \
@"try\n" \
"	tell application \"iTunes\"\n" \
"		set aTrack to current track\n" \
"		set the rating of aTrack to %d\n" \
"	end tell\n" \
"end try\n"

#define AAP_GET_TRACK_INFO_SCRIPT \
@"try\n" \
"   tell application \"iTunes\"\n" \
"      set aTrack to current track\n" \
"      set trackName to name of aTrack\n" \
"      set trackArtist to artist of aTrack\n" \
"      set trackAlbum to album of aTrack\n" \
"      set trackRating to rating of aTrack\n" \
"      set trackID to database ID of aTrack\n" \
"      set trackNumber to track number of aTrack\n" \
"      set trackYear to year of aTrack\n" \
"      try\n" \
"         set trackLocation to location of aTrack\n" \
"      on error\n" \
"         try\n" \
"            set trackLocation to address of aTrack\n" \
"         on error\n" \
"             set trackLocation to \"\"\n" \
"         end try\n"\
"     end try\n"\
"     return {trackName, trackArtist, trackAlbum, trackRating, trackID, trackNumber, trackYear, trackLocation}\n"\
"   end tell\n" \
" end try\n" \
" return \"failed\"\n"

#define AAP_GET_TRACKS_IN_ALBUM_SCRIPT \
@"try\n"\
"	tell application \"iTunes\"\n"\
"	set trackAlbum to album of current track\n"\
"	set aLibrary to item 1 of library playlists\n"\
"	set foundTracks to search aLibrary for trackAlbum only albums\n"\
"	set trackNameList to {}\n"\
"	repeat with i from 1 to the count of foundTracks\n"\
"		set aTrack to item i of foundTracks\n"\
"		set trackNumber to track number of aTrack\n"\
"		set trackName to name of aTrack\n"\
"		try\n"\
"			set trackLocation to location of aTrack\n"\
"		on error\n"\
"			set trackLocation to \"\"\n"\
"		end try\n"\
"		set the beginning of trackNameList to trackName\n"\
"		set the beginning of trackNameList to trackLocation\n"\
"		set the beginning of trackNameList to trackNumber\n"\
"	end repeat\n"\
"	return trackNameList\n"\
"	end tell\n"\
"end try\n"\
"return {}\n"

#define AAP_NEXT_TRACK \
	@"try\n"\
	"	tell application \"iTunes\"\n"\
	"		next track\n"\
	"	end tell\n"\
	"end try\n"

#define AAP_PREV_TRACK \
@"try\n"\
"	tell application \"iTunes\"\n"\
"		back track\n"\
"	end tell\n"\
"end try\n"

#define AAP_PLAYPAUSE \
@"try\n"\
"	tell application \"iTunes\"\n"\
"		playpause\n"\
"	end tell\n"\
"end try\n"

#define AAP_PLAY_SONG_FILE \
@"try\n"\
"	tell application \"iTunes\"\n"\
"		set playSong to \"%@\" as string\n"\
"		play playSong\n"\
"	end tell\n"\
"end try\n"

#define AAP_PLAY_SONG \
@"try\n"\
"	tell application \"iTunes\"\n"\
"		play track %d of library playlist 1\n"\
"	end tell\n"\
"end try\n"
