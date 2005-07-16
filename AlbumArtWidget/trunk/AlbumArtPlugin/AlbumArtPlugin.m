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

#import "AlbumArtPlugin.h"

#define distNotifyCenter [NSDistributedNotificationCenter defaultCenter]

@interface AlbumArtPlugin (Private)
- (BOOL) getTrackInfo;
- (void) setTrackRating:(int)newRating;
@end

#pragma mark -
@implementation AlbumArtPlugin
#pragma mark -

#pragma mark WebScripting Protocol

- (id) initWithWebView:(WebView*)aWebview
{
	self = [super init];
	if (self) {
		webview = aWebview;
		albumArt = [[AlbumArtHolder alloc] init];
		
		// register for iTunes notifications
		[distNotifyCenter addObserver:self
							 selector:@selector(songChanged:)
								 name:@"com.apple.iTunes.playerInfo"
							   object:nil];
		
		NSStringBig5Encoding = CFStringConvertEncodingToNSStringEncoding(kCFStringEncodingBig5_HKSCS_1999);
		NSStringGBEncoding = CFStringConvertEncodingToNSStringEncoding(kCFStringEncodingHZ_GB_2312);		
		
	}
	return self;
}

- (void) dealloc
{
	[self remove];
	[super dealloc];
}

- (void) windowScriptObjectAvailable:(WebScriptObject *)windowScriptObject
{
	[windowScriptObject setValue:self forKey:@"AlbumArt"];
	[self getTrackInfo];
}

- (id)invokeUndefinedMethodFromWebScript:(NSString *)name 
						   withArguments:(NSArray *)args
{
#if AAP_DEBUG
	NSLog(@"invokeUndefined: %@ %@", name, args);
#endif
	return nil;
}

+ (BOOL)isSelectorExcludedFromWebScript:(SEL)aSelector
{
	//NSLog(@"isSelectorExcludedFromWebScript: %s", sel_getName(aSelector));
	return NO;
}

+ (BOOL)isKeyExcludedFromWebScript:(const char *)name
{
	return YES;
}

- (void)finalizeForWebScript
{
#if AAP_DEBUG
	NSLog(@"finalizeForWebScript");
#endif
}

#pragma mark -
#pragma mark External Functions

- (NSString *)trackArt
{
	if (albumArt) {
		return [albumArt filename];
	}
	else {
		return nil;
	}
}

- (NSString *)trackName
{
	return trackName;
}

- (NSString *)trackArtist
{
	return trackArtist;
}

- (NSString *)trackLocation
{
	return trackLocation;
}

- (NSString *)trackAlbum
{
	return trackAlbum;
}

- (int) trackNumber
{
	return trackNumber;
}

- (int) trackYear
{
	return trackYear;
}

- (int) trackTime
{
	return trackTime;
}

- (int) trackRating
{
	return trackRating;
}

- (NSString *)trackType
{
	return trackType;
}


- (NSString *)playerState
{
	return playerState;
}

- (BOOL) iTunesIsRunning
{
	if (albumArt) {
		return [albumArt iTunesIsRunning];
	}
	else {
		return NO;
	}
}

- (void)remove
{
	[albumArt release];
	[[NSDistributedNotificationCenter defaultCenter] removeObserver:self];
	[trackName release];
	[trackArtist release];
}
	

- (void)reload
{
	if (albumArt) {
		[albumArt reload];
	}
}

- (void)updateRating:(id)newRating
{
	[self setTrackRating:[newRating intValue]];
	trackRating = [newRating intValue];
}

#pragma mark -
#pragma mark Applescript Goodies

- (void) setTrackRating:(int)newRating
{
	[[[EyeTunes sharedInstance] currentTrack] setRating:newRating];
}

- (BOOL) getTrackInfo
{
	if ([self iTunesIsRunning]) {
		ETTrack *currentTrack = [[EyeTunes sharedInstance] currentTrack];
		if (currentTrack != nil) {
			[trackName release];
			trackName = [[currentTrack name] retain];
			[trackArtist release];
			trackArtist = [[currentTrack artist] retain];
			[trackAlbum release];
			trackAlbum = [[currentTrack album] retain];
			[trackLocation release];
			trackLocation = [[currentTrack location] retain];
			
			trackRating = [currentTrack rating];
			trackTime = [currentTrack duration];
			trackNumber = [currentTrack trackNumber];
			trackYear = [currentTrack year];
		}
		else {
			return NO;
		}
	}
	
	return YES;
}


int trackSort(id track1, id track2, void *context)
{
    int v1 = [[track1 objectAtIndex:0] intValue];
    int v2 = [[track2 objectAtIndex:0] intValue];
    if (v1 < v2)
        return NSOrderedAscending;
    else if (v1 > v2)
        return NSOrderedDescending;
    else
        return NSOrderedSame;
}

- (NSArray *) getCurrentAlbumTracks
{
	
	NSMutableArray *trackNumberLocationNameList = nil;
	
	if ([self iTunesIsRunning] && ([self trackAlbum] != nil) && ([[self trackAlbum] length] > 0)) {
		EyeTunes *itunes = [EyeTunes sharedInstance];
		NSArray *tracks = [itunes search:[itunes libraryPlaylist] 
							   forString:[self trackAlbum] 
								 inField:kETSearchAttributeAlbums];
		
		if (tracks) {
			trackNumberLocationNameList = [NSMutableArray arrayWithCapacity:[tracks count]];
			NSEnumerator *e = [tracks objectEnumerator];
			ETTrack *track = nil;
			
			while (track = [e nextObject]) {
				NSArray *trackInfoArray = [NSArray arrayWithObjects:
					[NSNumber numberWithInt:[track trackNumber]],
					[track location],
					[track name], nil];
				[trackNumberLocationNameList addObject:trackInfoArray];
			}
			
		}
		
	}
	
	return trackNumberLocationNameList;
}

- (void)playerPrev
{
	[[EyeTunes sharedInstance] previousTrack];
}

- (void)playerNext
{
	[[EyeTunes sharedInstance] nextTrack];
}

- (void)playerPlayPause
{
	[[EyeTunes sharedInstance] playPause];
}

- (void)playSongFile:(NSString *)filename
{
	[[EyeTunes sharedInstance] playTrackWithPath:filename];
}

- (BOOL)addAlbumArtToCurrentSong:(NSString *)songURL withContentsOfURL:(NSString *)url
{
	
#if AAP_DEBUG
	NSLog(@"addAlbumArtToCurrentSong:withContentsOfURL:");
#endif
	if (!songURL || !url || ([songURL length] == 0) || ([url length] == 0))  {
		return NO;
	}
	
	if (![[NSURL URLWithString:songURL] isFileURL]) {
#if AAP_DEBUG		
		NSLog(@"plugin.addAlbumArt: songURL is not local file");
#endif
		return NO;
	}
	
	NSImage *image = [[[NSImage alloc] initWithContentsOfURL:[NSURL URLWithString:url]] autorelease];
	if (!image) {
		NSLog(@"plugin.addAlbumArt: unable to load image from URL");
		return NO;
	}
	
	ETTrack *currentTrack = [[EyeTunes sharedInstance] currentTrack];
	if ([[currentTrack location]  isEqualToString:songURL]) {
		[currentTrack setArtwork:image atIndex:0];
	}
	return YES;

}

- (NSString *)trackNameInEncoding:(NSString *)encoding
{
	return [self uriEncodedString:[self trackName] withEncoding:encoding];
}

- (NSString *)trackArtistInEncoding:(NSString *)encoding
{
	return [self uriEncodedString:[self trackArtist] withEncoding:encoding];
}

- (NSString *)trackAlbumInEncoding:(NSString *)encoding
{
	return [self uriEncodedString:[self trackAlbum] withEncoding:encoding];
}

- (NSString *)uriEncodedString:(NSString *)utf8String withEncoding:(NSString *)encoding
{
	UInt32 encodingType;
	
	if ([encoding isEqualTo:@"gb"]) {
		encodingType = NSStringGBEncoding;
	}
	else if ([encoding isEqualTo:@"b5"]) {
		encodingType = NSStringBig5Encoding;
	}
	else {
		encodingType = NSUTF8StringEncoding;
	}
	
	const char *encodedString = [utf8String cStringUsingEncoding:encodingType];
	NSMutableString *uriEncodedString = [NSMutableString string];
	int i, len;
	
	if (!encodedString) {
		return @"";
	}
		
	len	= strlen(encodedString);
	
	for (i = 0; i < len; i++) {
		[uriEncodedString appendString:[NSString stringWithFormat:@"%%%2x",(encodedString[i] & 0xff)]];
	}

	return uriEncodedString;
}


#pragma mark -
#pragma mark iTunes Notification

- (void) songChanged:(NSNotification *)aNotification
{
	NSDictionary *playerInfo = [aNotification userInfo];
	
	// update player state
	[playerState release];
	playerState = [[playerInfo objectForKey:@"Player State"] retain];
	
#if AAP_DEBUG
	NSLog(@"%@", playerInfo);
#endif
	
	// for radio
	if ([playerInfo objectForKey:@"Stream Title"] != nil) {
		[trackType release];
		trackType = [@"Radio" retain];
		NSArray *streamTitle = [[playerInfo objectForKey:@"Stream Title"] componentsSeparatedByString:@" - "];
		if ([streamTitle count] > 1) {
			[trackName release];
			trackName = [[streamTitle objectAtIndex:1] retain];
			[trackArtist release];
			trackArtist = [[streamTitle objectAtIndex:0] retain];
			[trackAlbum release];
			trackAlbum = [[playerInfo objectForKey:@"Name"] retain];
			[trackLocation release];
			trackLocation = [[playerInfo objectForKey:@"Location"] retain];
			
			trackYear = 0;
			trackRating = 0;
			trackNumber = 0;
			trackTime = 0;
		}
		else {
			[trackName release];
			trackName = [[playerInfo objectForKey:@"Name"] retain];
			[trackArtist release];
			trackArtist = [[playerInfo objectForKey:@"Genre"] retain];
			[trackAlbum release];
			trackAlbum = nil;
			[trackLocation release];
			trackLocation = [[playerInfo objectForKey:@"Location"] retain];
			
			trackYear = 0;
			trackRating = 0;
			trackNumber = 0;
			trackTime = 0;
		}
	}
	else {
		[trackType release];
		trackType = [@"File" retain];
		// stream urls, shared tracks, file, store tracks
		[trackName release];
		trackName = [[playerInfo objectForKey:@"Name"] retain];
		[trackArtist release];
		trackArtist = [[playerInfo objectForKey:@"Artist"] retain];
		[trackAlbum release];
		trackAlbum = [[playerInfo objectForKey:@"Album"] retain];
		[trackLocation release];
		trackLocation = [[playerInfo objectForKey:@"Location"] retain];
		
		trackTime = [[playerInfo objectForKey:@"Total Time"] intValue]/1000;
		trackRating = [[playerInfo objectForKey:@"Rating"] intValue];
		trackYear = [[playerInfo objectForKey:@"Year"] intValue];
		trackNumber = [[playerInfo objectForKey:@"Number"] intValue];
		
	}
	
	[[webview windowScriptObject] callWebScriptMethod:@"reloadImage"
										withArguments:[NSArray arrayWithObject:playerState]];
}


@end
