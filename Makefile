VERSION=`cut -d '"' -f2 $BUILDDIR/../version.js`


cordova-base:
	grunt dist-mobile

# ios:  cordova-base
# 	make -C cordova ios
# 	open cordova/project/platforms/ios/Copay
#
# android: cordova-base
# 	make -C cordova run-android
#
# release-android: cordova-base
# 	make -C cordova release-android
#
wp8-prod:
	cordova/build.sh WP8 --clear
	cordova/wp/fix-svg.sh
	echo -e "\a"

wp8-debug:
	cordova/build.sh WP8 --dbgjs
	cordova/wp/fix-svg.sh
	echo -e "\a"

ios-prod:
	cordova/build.sh IOS --clear
	cd ../obytebuilds/project-IOS && cordova build ios
	open -a xcode ../obytebuilds/project-IOS/platforms/ios

ios-prod-fast:
	cordova/build.sh IOS
	cd ../obytebuilds/project-IOS && cordova build ios
	open -a xcode ../obytebuilds/project-IOS/platforms/ios

ios-debug:
	cordova/build.sh IOS --dbgjs --clear
	cd ../obytebuilds/project-IOS && cordova build ios
	open -a xcode ../obytebuilds/project-IOS/platforms/ios

ios-debug-fast:
	cordova/build.sh IOS --dbgjs
	cd ../obytebuilds/project-IOS && cordova build ios
	#cd ../obytebuilds/project-IOS && cordova run ios --device --developmentTeam="96S944NY84"
	open -a xcode ../obytebuilds/project-IOS/platforms/ios

android-prod:
	cordova/build.sh ANDROID --clear
#	cp ./etc/beep.ogg ./cordova/project/plugins/phonegap-plugin-barcodescanner/src/android/LibraryProject/res/raw/beep.ogg
	cd ../obytebuilds/project-ANDROID && cordova run android --device
	
android-prod-fast:
	cordova/build.sh ANDROID
	cd ../obytebuilds/project-ANDROID && cordova run android --device

android-debug:
	cordova/build.sh ANDROID --dbgjs --clear
#	cp ./etc/beep.ogg ./cordova/project/plugins/phonegap-plugin-barcodescanner/src/android/LibraryProject/res/raw/beep.ogg
	cd ../obytebuilds/project-ANDROID && cordova run android --device

android-debug-fast:
	cordova/build.sh ANDROID --dbgjs
#	cp ./etc/beep.ogg ./cordova/project/plugins/phonegap-plugin-barcodescanner/src/android/LibraryProject/res/raw/beep.ogg
	cd ../obytebuilds/project-ANDROID && cordova run android --device
#	cd ../obytebuilds/project-ANDROID && cordova build android