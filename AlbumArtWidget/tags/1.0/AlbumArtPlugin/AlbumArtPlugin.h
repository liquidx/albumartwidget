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
	int				trackRating;
	
	iTunesState		playerState;
}

- (NSString *)trackArt;
- (NSString *)trackName;
- (NSString *)trackArtist;
- (NSString *)trackLocation;
- (int) trackRating;

- (BOOL) iTunesIsRunning;
- (void)reload;
- (void)remove;
- (void)updateRating:(id)newRating;
@end
