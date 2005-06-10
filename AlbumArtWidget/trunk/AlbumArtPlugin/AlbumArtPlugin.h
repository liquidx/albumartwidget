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
#import "NSURL+NDCarbonUtilities.h"
#import "AlbumArtHolder.h"
#import "AlbumArtConstants.h"
#import "AlbumArtApplescript.h"

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
	
	NSString		*trackType;
	
	NSString 		*playerState;
}

- (NSString *)trackArt;
- (NSString *)trackName;
- (NSString *)trackArtist;
- (NSString *)trackLocation;
- (NSString *)trackAlbum;
- (NSString *)trackType;
- (int) trackNumber;
- (int) trackYear;
- (int) trackID;
- (int) trackRating;

- (NSString *)playerState;

- (BOOL) iTunesIsRunning;
- (void)reload;
- (void)remove;

- (void)updateRating:(id)newRating;
- (NSArray *) getCurrentAlbumTracks;
- (void)playerPrev;
- (void)playerNext;
- (void)playerPlayPause;
- (void)playSong:(int)songID;
- (void)playSongFile:(NSString *)filename;

@end
