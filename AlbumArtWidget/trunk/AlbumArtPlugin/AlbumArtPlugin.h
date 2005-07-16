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

#import <Cocoa/Cocoa.h>
#import <Webkit/Webkit.h>
#import <EyeTunes/EyeTunes.h>

//#import "NDAlias.h"
//#import "NSURL+NDCarbonUtilities.h"
//#import "NSString+NDCarbonUtilities.h"

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
- (void)playSongFile:(NSString *)filename;

- (void)updateRating:(id)newRating;
- (NSArray *)getCurrentAlbumTracks;
- (BOOL)addAlbumArtToCurrentSong:(NSString *)songURL withContentsOfURL:(NSString *)url;

- (NSString *)trackNameInEncoding:(NSString *)encoding;
- (NSString *)trackArtistInEncoding:(NSString *)encoding;
- (NSString *)trackAlbumInEncoding:(NSString *)encoding;

- (NSString *)uriEncodedString:(NSString *)utf8String withEncoding:(NSString *)encoding;

@end
