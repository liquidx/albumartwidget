//
//  AlbumArtHolder.m
//  AlbumArtPlugin
//
//  Created by Alastair on 02/05/2005.
//  Copyright 2005 __MyCompanyName__. All rights reserved.
//

#import "AlbumArtHolder.h"


@implementation AlbumArtHolder

#pragma mark -

- (id) init
{
	self = [super init];
	if (self) {

		// Load AppleScript that fetches Album Artwork
		NSDictionary	*error;
		NSBundle *bundle = [NSBundle bundleWithIdentifier:AAF_BUNDLE_ID];
		if (!bundle) {
			NSLog(@"holder.init: Unable to find plugin's bundle");
			[self release];
			return nil;
		}
		
		NSString *path = [bundle pathForResource:@"GetAlbumArt" ofType:@"scpt"];
		if (!path) {
			NSLog(@"holder.init: Unable to find AppleScript in bundle path");
			NSLog(@"%@", path);
			[self release];
			return nil;
		}
		
		NSURL	 *url = [NSURL fileURLWithPath:path];
		if (!url) {
			NSLog(@"holder.init: Unable to construct URL to path: %@", path);
			[self release];
			return nil;
		}
		
		fetchScript = [[NSAppleScript alloc] initWithContentsOfURL:url
															 error:&error];

		if (!fetchScript) {
			NSLog(@"holder.init: Unable to parse/load AlbumArt script: %@", &error);
			[self release];
			return nil;
		}
		
		// initialise current state
		playingAlbumArt = nil;
		temporaryFilename = nil;
		[self reload];
	}
	return self;
}
	
- (void) dealloc
{	
	NSLog(@"holder.dealloc");
	if (temporaryFilename != nil) {
		[[NSFileManager defaultManager] removeFileAtPath:temporaryFilename handler:nil];
		[temporaryFilename release];
	}
	
	[playingAlbumArt release];
	[fetchScript release];
	[super dealloc];
}	

- (BOOL) iTunesIsRunning
{
	NSEnumerator *e = [[[NSWorkspace sharedWorkspace] launchedApplications] objectEnumerator];
	NSDictionary *proc;
	while (proc = [e nextObject]) {
		NSString *procName = [proc objectForKey:@"NSApplicationBundleIdentifier"];
		if ([procName caseInsensitiveCompare:@"com.apple.iTunes"] == NSOrderedSame) {
			return YES;
		}
	}
	return NO;
}

- (void)reload
{
	NSFileManager *manager = [NSFileManager defaultManager];
	
	if ([self iTunesIsRunning]) {
		
		if (![self fetchAlbumArt]) {
			// remove old temporary file as well
			if (temporaryFilename != nil) {
				[[NSFileManager defaultManager] removeFileAtPath:temporaryFilename handler:nil];
				[temporaryFilename release];
				temporaryFilename = nil;
			}
			return;
		}

		// remove last temporary file if necessary
		if (temporaryFilename != nil) {
			[manager removeFileAtPath:temporaryFilename handler:nil];
			[temporaryFilename release];
			temporaryFilename = nil;
		}
		
		// generate a random name and make sure it is clean
		temporaryFilename = [[NSTemporaryDirectory() 
			stringByAppendingPathComponent:[self randomFilenameWithExtension:@"jpg"]]
			retain];
		if ([manager fileExistsAtPath:temporaryFilename]) {
			[manager removeFileAtPath:temporaryFilename handler:nil];
		}

		
		// reload artwork
		[self resizeImage:playingAlbumArt 
				   toSize:NSMakeSize(128,128) 
			 outputToFile:temporaryFilename];
	}
}

#pragma mark -
#pragma mark Getter/Setter

- (NSString *)filename
{
	return temporaryFilename;
}

- (void)setArtwork:(NSImage *)newArtwork
{
	if (newArtwork != playingAlbumArt) {
		[playingAlbumArt autorelease];
		playingAlbumArt = [newArtwork retain];
	}
}

- (NSImage *)artwork
{
	return playingAlbumArt;
}


@end

#pragma mark -

@implementation AlbumArtHolder (Private)

- (BOOL) fetchAlbumArt
{
	NSAppleEventDescriptor *aEventDesc;
	NSImage *artwork = nil;
	NSDictionary *error = nil;
	
	aEventDesc = [fetchScript executeAndReturnError:&error];
	if ([[aEventDesc stringValue] isEqualToString:@"Script Failed"]) {
		NSLog(@"holder.fetchAlbumArt: script failed.");
		return NO;
	}
	
	const OSType type = [aEventDesc typeCodeValue];
	if (type != 'null') {
		artwork = [[[NSImage alloc] initWithData:[aEventDesc data]] autorelease];
		if (artwork) {
			[self setArtwork:artwork];
			return YES;
		}
		else {
#if AAP_DEBUG
			NSLog(@"holder.fetchAlbumArt: failed to get artwork");
#endif
			return NO;
		}
	}
	else {
		// no artwork available
#if AAP_DEBUG
		NSLog(@"holder.fetchAlbumArt: artwork not available");
#endif
		return NO;
	}
	
}

- (NSString *)randomFilenameWithExtension:(NSString *)ext
{
	return [NSString stringWithFormat:@"%@_%x%x.%@", AAF_PREFIX, Random(), Random(), ext];
}

- (BOOL) resizeImage:(NSImage *)anImage toSize:(NSSize)newSize outputToFile:(NSString *)filename
{
	NSImage *resizedImage = nil;
	NSBitmapImageRep *outputBitmap = nil;
	NSData *bitmapData = nil;
	
	resizedImage = [[[NSImage alloc] initWithSize:NSMakeSize(newSize.width, newSize.height)] autorelease]; 
	[resizedImage lockFocus];
	[NSGraphicsContext saveGraphicsState];
	[[NSGraphicsContext currentContext] setImageInterpolation:NSImageInterpolationHigh];
	[anImage drawInRect:NSMakeRect(0, 0, newSize.width, newSize.height)
			   fromRect:NSMakeRect(0, 0, [anImage size].width, [anImage size].height)
			  operation:NSCompositeCopy
			   fraction:1.0];
	outputBitmap = [[[NSBitmapImageRep alloc] initWithFocusedViewRect:NSMakeRect(0, 0, newSize.width, newSize.height)] autorelease];
	[NSGraphicsContext restoreGraphicsState];
	[resizedImage unlockFocus];
	
	if (!outputBitmap) {
		NSLog(@"holder.resizeImage: failed miserablly");
		return NO;
	}
	
	bitmapData = [outputBitmap representationUsingType:NSJPEGFileType
											properties:nil];
	if (!bitmapData) {
		NSLog(@"holder.resizeImage: failed to convert to JPEG");
		return NO;
	}
	
	return [bitmapData writeToFile:filename atomically:YES];
}

@end