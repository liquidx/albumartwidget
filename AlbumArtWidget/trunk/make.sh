#!/bin/sh

rm -rf dist/AlbumArt.wdgt
cp -pr AlbumArt.wdgt dist
find dist/AlbumArt.wdgt -name .svn -exec rm -rf {} \;
cp -pr AlbumArtPlugin/build/Deployment/AlbumArtPlugin.widgetplugin dist/AlbumArt.wdgt/
