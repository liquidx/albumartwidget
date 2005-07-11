//
//  AlbumArtTempFile.h
//  AlbumArtPlugin
//
//  Created by Alastair on 09/07/2005.
//  Copyright 2005 __MyCompanyName__. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import "AlbumArtConstants.h"

@interface AlbumArtTempFile : NSObject {

}

+ (NSString *)randomTemporaryPathWithExtension:(NSString *)ext;

@end
