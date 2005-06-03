//
//  AlbumArtFetcher.h
//  AlbumArtPlugin
//
//  Created by Alastair on 01/05/2005.
//  Copyright 2005 __MyCompanyName__. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import <Webkit/Webkit.h>
#import "NDAlias.h"
#import "AlbumArtHolder.h"
#import "AlbumArtConstants.h"

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
	"		set the beginning of trackNameList to trackName\n"\
	"		set the beginning of trackNameList to trackNumber\n"\
	"	end repeat\n"\
	"	return trackNameList\n"\
	"	end tell\n"\
	"end try\n"\
	"return {}\n"


typedef enum {
	itPLAYING,
	itPAUSED,
	itSTOPPED,
	itUNKNOWN
} iTunesState;  

@interface AlbumArtPlugin : NSObject {
	WebView			*webview;
	AlbumArtHolder	*albumArt;
	
	// current track info
	NSString		*trackName;
	NSString		*trackArtist;
	NSString		*trackLocation;
	NSString		*trackAlbum;
	int				trackNumber;
	int				trackYear;
	int				trackID;
	int				trackRating;
	
	iTunesState		playerState;
}

- (NSString *)trackArt;
- (NSString *)trackName;
- (NSString *)trackArtist;
- (NSString *)trackLocation;
- (NSString *)trackAlbum;
- (int) trackNumber;
- (int) trackYear;
- (int) trackID;
- (int) trackRating;

- (BOOL) iTunesIsRunning;
- (void)reload;
- (void)remove;
- (void)updateRating:(id)newRating;
- (NSArray *) getCurrentAlbumTracks;
@end
