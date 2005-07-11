/*	Keeps state the Album Art in a consistant state with 
	caching so that it keeps AlbumArtPlugin free to maintain
	communication with Javascript stuff 
*/

#import <Cocoa/Cocoa.h>
#import "AlbumArtConstants.h"
#import "AlbumArtTempFile.h"

@interface AlbumArtHolder : NSObject {
	NSImage			*playingAlbumArt;
	NSString		*temporaryFilename;
	NSAppleScript	*fetchScript;
	
	NSDictionary	*jpegProperties;
}
- (NSString *) filename;
- (void) reload;
- (BOOL) iTunesIsRunning;
@end

@interface AlbumArtHolder (Private)
- (BOOL) resizeImage:(NSImage *)anImage 
			  toSize:(NSSize)newSize 
		outputToFile:(NSString *)filename;
- (BOOL) fetchAlbumArt;

@end

