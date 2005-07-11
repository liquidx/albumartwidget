//
//  AlbumArtFetcher.m
//  AlbumArtPlugin
//
//  Created by Alastair on 01/05/2005.
//  Copyright 2005 __MyCompanyName__. All rights reserved.
//

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
	NSString *scriptContents = [NSString stringWithFormat:AAP_SET_RATING_SCRIPT, newRating];
	NSAppleScript *script = [[[NSAppleScript alloc] initWithSource:scriptContents] autorelease];
	NSDictionary *error;
	
	if (!script) {
		NSLog(@"plugin.setTrackRating: error initialising script");
		return;
	}
	
	NSAppleEventDescriptor *desc = [script executeAndReturnError:&error];
	if (!desc) {
		//NSLog(@"plugin.setTrackRating: error executing script: %@", error);
		return;
	}
	
	return;
}

- (BOOL) getTrackInfo
{
	// Load AppleScript that fetches Album Artwork
	NSString *scriptContents = AAP_GET_TRACK_INFO_SCRIPT;
	NSAppleScript   *script = [[[NSAppleScript alloc] initWithSource:scriptContents] autorelease];
	
	if (!script) {
		NSLog(@"plugin.getTrackInfo: error initialising applescript");
		return NO;
	}
	
	// run script
	if ([self iTunesIsRunning]) {
		NSAppleEventDescriptor *aEventDesc;
		NSDictionary *error;
		
		aEventDesc = [script executeAndReturnError:&error];
		if ([[aEventDesc stringValue] isEqualToString:@"failed"]) {
			//NSLog(@"plugin.gettrackinfo: script failed: %@", error);
			return NO;
		}
		
		if ([aEventDesc numberOfItems] == 8) {
			[trackName release];
			trackName = [[[aEventDesc descriptorAtIndex:1L] stringValue] retain];
			[trackArtist release];
			trackArtist = [[[aEventDesc descriptorAtIndex:2L] stringValue] retain];
			[trackAlbum release];
			trackAlbum = [[[aEventDesc descriptorAtIndex:3L] stringValue] retain];
			trackRating = [[aEventDesc descriptorAtIndex:4L] int32Value];
			trackTime = [[aEventDesc descriptorAtIndex:5L] int32Value];
			trackNumber = [[aEventDesc descriptorAtIndex:6L] int32Value];
			trackYear = [[aEventDesc descriptorAtIndex:7L] int32Value];
			[trackLocation release];
			
			NDAlias *alias = [NDAlias aliasWithData:[[aEventDesc descriptorAtIndex:8L] data]];
			trackLocation = [[[alias url] absoluteString] retain];
		}
		else {
			NSLog(@"plugin.gettrackinfo: returned unexpected results: %d",
				  [aEventDesc numberOfItems]);
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
	// Load AppleScript that fetches Album Artwork
	NSString *scriptContents = AAP_GET_TRACKS_IN_ALBUM_SCRIPT;
	NSAppleScript   *script = [[[NSAppleScript alloc] initWithSource:scriptContents] autorelease];
	NSMutableArray *albumTracks = nil;
	
	if (!script) {
		NSLog(@"plugin.getTrackInfo: error initialising applescript");
		return nil;
	}
	
	// run script
	if ([self iTunesIsRunning]) {
		NSAppleEventDescriptor *aEventDesc;
		NSDictionary *error;
		long int i;
		
		aEventDesc = [script executeAndReturnError:&error];
		albumTracks = [[NSMutableArray alloc] init];
		for (i = 0; i < [aEventDesc numberOfItems]/3; i++) {
			int num = [[aEventDesc descriptorAtIndex:i*3L + 1L] int32Value];
			NSString *name = [[aEventDesc descriptorAtIndex:(i+1)*3L] stringValue];
			NDAlias *alias = [NDAlias aliasWithData:[[aEventDesc descriptorAtIndex:i*3L + 2L] data]];
			NSString *location = [[[alias url] fileSystemPathHFSStyle] retain];
			
			NSArray *newtrack = [NSArray arrayWithObjects:[NSNumber numberWithInt:num],
														  location,
														  name,nil];
			[albumTracks addObject:newtrack];
		}
		
		[albumTracks sortUsingFunction:trackSort context:nil];
		return albumTracks;
	}
	
	return nil;
}

- (void)playerPrev
{
	// Load AppleScript that fetches Album Artwork
	NSString *scriptContents = AAP_PREV_TRACK;
	NSAppleScript   *script = [[[NSAppleScript alloc] initWithSource:scriptContents] autorelease];
	
	if (!script) {
		NSLog(@"plugin.playerPrev: error initialising applescript");
		return;
	}
	
	// run script
	if ([self iTunesIsRunning]) {
		NSAppleEventDescriptor *aEventDesc;
		NSDictionary *error;
		aEventDesc = [script executeAndReturnError:&error];
	}
}

- (void)playerNext
{
	// Load AppleScript that fetches Album Artwork
	NSString *scriptContents = AAP_NEXT_TRACK;
	NSAppleScript   *script = [[[NSAppleScript alloc] initWithSource:scriptContents] autorelease];

	if (!script) {
		NSLog(@"plugin.playerNext: error initialising applescript");
		return;
	}
	
	// run script
	if ([self iTunesIsRunning]) {
		NSAppleEventDescriptor *aEventDesc;
		NSDictionary *error;
		aEventDesc = [script executeAndReturnError:&error];
	}
}

- (void)playerPlayPause
{
	// Load AppleScript that fetches Album Artwork
	NSString *scriptContents = AAP_PLAYPAUSE;
	NSAppleScript   *script = [[[NSAppleScript alloc] initWithSource:scriptContents] autorelease];
	
	if (!script) {
		NSLog(@"plugin.playerPlayPause: error initialising applescript");
		return;
	}
	
	// run script
	if ([self iTunesIsRunning]) {
		NSAppleEventDescriptor *aEventDesc;
		NSDictionary *error;
		aEventDesc = [script executeAndReturnError:&error];
	}
}

- (void)playSong:(int)songID
{
	// Load AppleScript that fetches Album Artwork
	NSString *scriptContents = [NSString stringWithFormat:AAP_PLAY_SONG, songID];
	NSAppleScript   *script = [[[NSAppleScript alloc] initWithSource:scriptContents] autorelease];
	
	if (!script) {
		NSLog(@"plugin.playSong: error initialising applescript");
		return;
	}
	
	// run script
	if ([self iTunesIsRunning]) {
		NSAppleEventDescriptor *aEventDesc;
		NSDictionary *error;
		aEventDesc = [script executeAndReturnError:&error];
#if  AAP_DEBUG		
		NSLog(@"playSong: %d", songID);
#endif
	}
}

- (void)playSongFile:(NSString *)filename
{
	// Load AppleScript that fetches Album Artwork
	NSString *scriptContents = [NSString stringWithFormat:AAP_PLAY_SONG_FILE, filename];
	NSAppleScript   *script = [[[NSAppleScript alloc] initWithSource:scriptContents] autorelease];
	
	if (!script) {
		NSLog(@"plugin.playSong: error initialising applescript");
		return;
	}
	
	// run script
	if ([self iTunesIsRunning]) {
		NSAppleEventDescriptor *aEventDesc;
		NSDictionary *error;
		aEventDesc = [script executeAndReturnError:&error];
	}
}

- (BOOL)addAlbumArtToCurrentSong:(NSString *)songURL withContentsOfURL:(NSString *)url
{
	
#if AAP_DEBUG
	NSLog(@"addAlbumArtToCurrentSong:withContentsOfURL:");
#endif
	
	int songDuration = [self trackTime];
	
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
	
	
	NSArray *reps = [image representations];
	if (!reps || ([reps count] == 0)) {
		NSLog(@"plugin.addAlbumArt: image has no representations");
		return NO;
	}
	
	NSEnumerator *e = [reps objectEnumerator];
	NSBitmapImageRep *r;
	NSData *imageData;
	while (r = [e nextObject]) {
		imageData = [r representationUsingType:NSJPEGFileType properties:nil];
		if (imageData)
			break;
	}
	if (!imageData) {
		NSLog(@"plugin.addAlbumArt: cannot convert to JPEG");
		return NO;
	}
	
	NSString *tempFilename = [AlbumArtTempFile randomTemporaryPathWithExtension:@"jpg"];
	if (![imageData writeToFile:tempFilename atomically:YES]) {
		NSLog(@"plugin.addAlbumArt: unable to write to temporary file");
		return NO;
	}
	
	// Load AppleScript that fetches Album Artwork
	NSString *tempPictname = [[AlbumArtTempFile randomTemporaryPathWithExtension:@"pic"] fileSystemPathHFSStyle];
	NSString *scriptContents = [NSString stringWithFormat:AAP_ADD_ALBUM_ART,tempFilename,
										tempPictname, songDuration, tempPictname, tempPictname];
	NSAppleScript   *script = [[[NSAppleScript alloc] initWithSource:scriptContents] autorelease];
	if (!script) {
		NSLog(@"plugin.addAlbumArt: error initialising applescript");
		[[NSFileManager defaultManager] removeFileAtPath:tempFilename handler:nil];
		return NO;			
	}
	
	// run script
	if ([self iTunesIsRunning]) {
		NSAppleEventDescriptor *aEventDesc;
		NSDictionary *myerror = nil;
		aEventDesc = [script executeAndReturnError:&myerror];
		if (myerror != nil) {
			NSLog(@"plugin.addAlbumArt: error executing applescript: %@", myerror);
			[[NSFileManager defaultManager] removeFileAtPath:tempPictname handler:nil];
			[[NSFileManager defaultManager] removeFileAtPath:tempFilename handler:nil];			
			return NO;			
		}
	}
	
	[[NSFileManager defaultManager] removeFileAtPath:tempFilename handler:nil];	
#if AAP_DEBUG	
	NSLog(@"plugin.addAlbumArt: added artwork to (%d) file \"%@\" with URL \"%@\"", songDuration, songPath, url);
#endif
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
	int i, len = strlen(encodedString);
	
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
