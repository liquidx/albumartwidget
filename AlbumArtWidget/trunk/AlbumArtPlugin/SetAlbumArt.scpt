FasdUAS 1.101.10   ��   ��    k             l     �� ��    &   tell application "Image Events"       	  l     ������  ��   	  
  
 l     ��  r         m        Y S/private/var/tmp/folders.501/TemporaryItems/net.liquidx.AlbumArtWidget_41a73af1.jpg     o      ���� 0 	posixpath 	posixPath��        l   
 ��  r    
    4    �� 
�� 
psxf  o    ���� 0 	posixpath 	posixPath  o      ���� 0 pf  ��        l     ������  ��        l   5 ��  O    5    k    4       r       !   I   �� "��
�� .aevtodocnull  �    alis " l    #�� # c     $ % $ o    ���� 0 pf   % m    ��
�� 
file��  ��   ! o      ���� 0 im     & ' & l   �� (��   ( @ :	save im as PICT in (file "McBook:Users:liquidx:test.pic")    '  ) * ) r     + , + m     - -  /Users/liquidx/xxx.pic    , o      ���� 0 temppath tempPath *  . / . r    % 0 1 0 l   # 2�� 2 c    # 3 4 3 4    !�� 5
�� 
psxf 5 o     ���� 0 temppath tempPath 4 m   ! "��
�� 
file��   1 o      ���� 0 ptf   /  6 7 6 l  & &�� 8��   8 7 1 set tf to (file "McBook:Users:liquidx:test.pic")    7  9 : 9 I  & 2�� ; <
�� .coresavealis       obj  ; o   & '���� 0 im   < �� = >
�� 
fltp = m   ( )��
�� typvPICT > �� ?��
�� 
kfil ? l  * . @�� @ 4   * .�� A
�� 
file A m   , - B B # McBook:Users:liquidx:test.pic   ��  ��   :  C�� C l  3 3������  ��  ��    m     D D�null     cߺ��  �Image Events.appD�r�$ � ���p�������-�����    �-$Ȑ�(     �imev   alis    x  McBook                     ��<�H+    �Image Events.app                                                 k��c�.        ����  	                CoreServices    ��.r      �c�.      �  �  �  3McBook:System:Library:CoreServices:Image Events.app   "  I m a g e   E v e n t s . a p p    M c B o o k  ,System/Library/CoreServices/Image Events.app  / ��  ��     E F E l     ������  ��   F  G H G l     �� I��   I  	 end tell    H  J K J l     ������  ��   K  L�� L l      �� M��   Md^
tell application "iTunes"
	set myTrack to current track
	set artworkCount to count of artwork of myTrack
	set myArt to read (POSIX file testPictname) from 513 as picture
	log (myArt)
	if artworkCount > 0 then
		set data of artwork (artworkCount + 1) of current track to myArt
	else
		set data of artwork 1 of current track to myArt
	end if
end tell
   ��       
�� N O  P Q - R������   N ����������������
�� .aevtoappnull  �   � ****�� 0 	posixpath 	posixPath�� 0 pf  �� 0 im  �� 0 temppath tempPath�� 0 ptf  ��  ��   O �� S���� T U��
�� .aevtoappnull  �   � **** S k     5 V V  
 W W   X X  ����  ��  ��   T   U  ������ D������ -���������� B������ 0 	posixpath 	posixPath
�� 
psxf�� 0 pf  
�� 
file
�� .aevtodocnull  �    alis�� 0 im  �� 0 temppath tempPath�� 0 ptf  
�� 
fltp
�� typvPICT
�� 
kfil�� 
�� .coresavealis       obj �� 6�E�O*��/E�O� '��&j E�O�E�O*��/�&E�O����*��/� OPU P gfurlfile://localhost/private/var/tmp/folders.501/TemporaryItems/net.liquidx.AlbumArtWidget_41a73af1.jpg Q  Y Y  D�� Z
�� 
imag Z � [ [ N n e t . l i q u i d x . A l b u m A r t W i d g e t _ 4 1 a 7 3 a f 1 . j p g R Jfss �� �xxx.pic &furl ;1@file�E7���    �EĐ \�   ��䰿��file���� :��  ��   ascr  ��ޭ