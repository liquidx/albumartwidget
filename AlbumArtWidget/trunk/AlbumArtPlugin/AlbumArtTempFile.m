//
//  AlbumArtTempFile.m
//  AlbumArtPlugin
//
//  Created by Alastair on 09/07/2005.
//  Copyright 2005 __MyCompanyName__. All rights reserved.
//

#import "AlbumArtTempFile.h"


@implementation AlbumArtTempFile

+ (NSString *)randomTemporaryPathWithExtension:(NSString *)ext
{	
	return [NSTemporaryDirectory() stringByAppendingPathComponent:[NSString stringWithFormat:@"%@_%x%x.%@", AAF_PREFIX, Random(), Random(), ext]];
}

@end
