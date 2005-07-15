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
		
		
		jpegProperties = [[NSDictionary dictionaryWithObjectsAndKeys:[NSNumber numberWithFloat:1.0],
			NSImageCompressionFactor,
			nil] retain];
		
		[self reload];
	}
	return self;
}
	
- (void) dealloc
{	
#if AAP_DEBUG
	NSLog(@"holder.dealloc");
#endif
	if (temporaryFilename != nil) {
		[[NSFileManager defaultManager] removeFileAtPath:temporaryFilename handler:nil];
		[temporaryFilename release];
	}
	
	[playingAlbumArt release];
	[fetchScript release];
	[jpegProperties release];
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
		temporaryFilename = [[AlbumArtTempFile randomTemporaryPathWithExtension:@"jpg"] retain];
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
#if AAP_DEBUG
		NSLog(@"holder.fetchAlbumArt: script failed.");
#endif
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

- (BOOL) resizeImage:(NSImage *)anImage toSize:(NSSize)newSize outputToFile:(NSString *)filename
{
	NSImage *resizedImage = nil;
	NSBitmapImageRep *outputBitmap = nil;
	NSData *bitmapData = nil;
	double aspectRatio = 0.0;
	NSRect targetRect;
	
	resizedImage = [[[NSImage alloc] initWithSize:NSMakeSize(newSize.width, newSize.height)] autorelease]; 
	[resizedImage lockFocus];
	[NSGraphicsContext saveGraphicsState];
	[[NSGraphicsContext currentContext] setImageInterpolation:NSImageInterpolationHigh];
	[[NSColor whiteColor] drawSwatchInRect:NSMakeRect(0, 0, newSize.width, newSize.height)];
	// keep aspect ratio (by cutting extra bits)
	aspectRatio = [anImage size].width / [anImage size].height;
	if (newSize.width/newSize.height > aspectRatio) {
		double height = newSize.width / aspectRatio;
		targetRect = NSMakeRect(0, (newSize.height - height)/2, newSize.width, height);
	}
	else if (newSize.width/newSize.height < aspectRatio) {
		double width = newSize.height * aspectRatio;
		targetRect = NSMakeRect((newSize.width - width)/2, 0, width, newSize.height);
	}
	else {
		targetRect = NSMakeRect(0, 0, newSize.width, newSize.height);
	}
	
	[anImage drawInRect:targetRect
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
											properties:jpegProperties];
	if (!bitmapData) {
		NSLog(@"holder.resizeImage: failed to convert to JPEG");
		return NO;
	}
	
	return [bitmapData writeToFile:filename atomically:YES];
}

@end