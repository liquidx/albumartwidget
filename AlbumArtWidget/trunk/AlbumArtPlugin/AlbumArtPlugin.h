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
#import "NSString+NDCarbonUtilities.h"
#import "AlbumArtHolder.h"
#import "AlbumArtTempFile.h"
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
	int				trackTime; // we use this as a rough track id
	int				trackRating;
	
	NSString		*trackType;
	
	NSString 		*playerState;
	
	UInt32			NSStringBig5Encoding;
	UInt32			NSStringGBEncoding;
}

- (NSString *)trackArt;
- (NSString *)trackName;
- (NSString *)trackArtist;
- (NSString *)trackLocation;
- (NSString *)trackAlbum;
- (NSString *)trackType;
- (int) trackNumber;
- (int) trackYear;
- (int) trackTime;
- (int) trackRating;

- (NSString *)playerState;

- (BOOL)iTunesIsRunning;
- (void)reload;
- (void)remove;

- (void)playerPrev;
- (void)playerNext;
- (void)playerPlayPause;
- (void)playSong:(int)songID;
- (void)playSongFile:(NSString *)filename;

- (void)updateRating:(id)newRating;
- (NSArray *)getCurrentAlbumTracks;
- (BOOL)addAlbumArtToCurrentSong:(NSString *)songURL withContentsOfURL:(NSString *)url;

- (NSString *)trackNameInEncoding:(NSString *)encoding;
- (NSString *)trackArtistInEncoding:(NSString *)encoding;
- (NSString *)trackAlbumInEncoding:(NSString *)encoding;

- (NSString *)uriEncodedString:(NSString *)utf8String withEncoding:(NSString *)encoding;

@end
