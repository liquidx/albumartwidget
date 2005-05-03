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
	if ((!strncmp(name, "trackName", strlen("trackName")))||
		(!strncmp(name, "trackArtist", strlen("trackArtist")))||
		(!strncmp(name, "trackRating", strlen("trackRating")))) {
		return NO;
	}
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

- (NSString *)artFilename
{
	if (albumArt) {
		return [albumArt filename];
	}
	else {
		return nil;
	}
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
#pragma mark Once Off Applescript Goodies

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
		NSLog(@"plugin.setTrackRating: error executing script: %@", error);
		return;
	}
	
	return;
}

- (BOOL) getTrackInfo
{
	// Load AppleScript that fetches Album Artwork
	NSDictionary	*error;
	NSAppleScript   *script;
	NSBundle *bundle = [NSBundle bundleWithIdentifier:AAF_BUNDLE_ID];
	if (!bundle) {
		NSLog(@"plugin.gettrackinfo: Unable to find plugin's bundle");
		return NO;
	}
	
	NSString *path = [bundle pathForResource:@"GetTrackInfo" ofType:@"scpt"];
	if (!path) {
		NSLog(@"plugin.gettrackinfo: Unable to find AppleScript in bundle path");
		NSLog(@"%@", path);
		return NO;
	}
	
	NSURL	 *url = [NSURL fileURLWithPath:path];
	if (!url) {
		NSLog(@"plugin.gettrackinfo: Unable to construct URL to path: %@", path);
		return NO;
	}
	
	script = [[NSAppleScript alloc] initWithContentsOfURL:url
													error:&error];
	
	if (!script) {
		NSLog(@"plugin.gettrackinfo: Unable to parse/load GetTrackInfo script: %@", &error);
		return NO;
	}
	
	// run script
	if ([self iTunesIsRunning]) {
		NSAppleEventDescriptor *aEventDesc;
		NSDictionary *error;
		
		aEventDesc = [script executeAndReturnError:&error];
		if ([[aEventDesc stringValue] isEqualToString:@"Script Failed"]) {
			NSLog(@"plugin.gettrackinfo: script failed: %@", error);
			return NO;
		}
		
		if ([aEventDesc numberOfItems] == 4) {
			[trackName release];
			trackName = [[[aEventDesc descriptorAtIndex:1L] stringValue] retain];
			[trackArtist release];
			trackArtist = [[[aEventDesc descriptorAtIndex:2L] stringValue] retain];
			trackRating = [[aEventDesc descriptorAtIndex:3L] int32Value];
			[trackLocation release];
			
			const OSType dataType = [[aEventDesc descriptorAtIndex:4L] typeCodeValue];
			NDAlias *alias = [NDAlias aliasWithData:[[aEventDesc descriptorAtIndex:4L] data]];
			trackLocation = [[[alias url] absoluteString] retain];
		}
		else {
			NSLog(@"plugin.gettrackinfo: returned unexpected results: %d",
				  [aEventDesc numberOfItems]);
			return NO;
		}
	}
	
	// cleanup
	[script release];
	return YES;
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
		trackRating = [[playerInfo objectForKey:@"Rating"] intValue];
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
