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

- (int) trackID
{
	return trackID;
}

- (int) trackRating
{
	return trackRating;
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
			trackID = [[aEventDesc descriptorAtIndex:5L] int32Value];
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
			
			NSLog(@"location: %@", location);
			NSArray *newtrack = [NSArray arrayWithObjects:[NSNumber numberWithInt:num],
														  location,
														  name,nil];
			[albumTracks addObject:newtrack];
		}
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
		NSLog(@"playSong: %d", songID);
	}
}

- (void)playSongFile:(NSString *)filename
{
	// Load AppleScript that fetches Album Artwork
	NSString *scriptContents = [NSString stringWithFormat:AAP_PLAY_SONG_FILE, filename];
	NSAppleScript   *script = [[[NSAppleScript alloc] initWithSource:scriptContents] autorelease];
	
	NSLog(@"script to execute: %@", scriptContents);
	
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




#pragma mark -
#pragma mark iTunes Notification

- (void) songChanged:(NSNotification *)aNotification
{
	NSDictionary *playerInfo = [aNotification userInfo];
	playerState = [[playerInfo objectForKey:@"Player State"] intValue];
	
	if ((playerState == itPLAYING) || (playerState == itPAUSED)) {
		[trackName release];
		trackName = [[playerInfo objectForKey:@"Name"] retain];
		[trackArtist release];
		trackArtist = [[playerInfo objectForKey:@"Artist"] retain];
		[trackAlbum release];
		trackAlbum = [[playerInfo objectForKey:@"Album"] retain];
		trackRating = [[playerInfo objectForKey:@"Rating"] intValue];
		trackYear = [[playerInfo objectForKey:@"Year"] intValue];
		trackNumber = [[playerInfo objectForKey:@"Number"] intValue];
		[trackLocation release];
		trackLocation = [[playerInfo objectForKey:@"Location"] retain];
	}

#if AAP_DEBUG
	NSLog(@"plugin.songchanged: iTunes changed state: %d", playerState);
#endif
	
	// TODO: have default paused/stopped icons
	NSArray *args;
	if (playerState == itPLAYING) {
		args = [NSArray arrayWithObject:@"Playing"];
	}
	else if (playerState == itPAUSED) {
		args = [NSArray arrayWithObject:@"Paused"];
	}
	else if (playerState == itSTOPPED) {
		args = [NSArray arrayWithObject:@"Stopped"];
	}
	else {
		args = [NSArray arrayWithObject:@"Unknown"];
	}
	
	[[webview windowScriptObject] callWebScriptMethod:@"reloadImage"
										withArguments:args];
}

@end
