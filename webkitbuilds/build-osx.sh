#!/bin/bash

# by Andy Maloney
# http://asmaloney.com/2013/07/howto/packaging-a-mac-os-x-application-using-a-dmg/

# make sure we are in the correct dir when we double-click a .command file
dir=${0%/*}
if [ -d "$dir" ]; then
  cd "$dir"
fi

# set up your app name, architecture, and background image file name
APP_NAME="Obyte"
ARCH="$1"
DMG_BACKGROUND_IMG="Background.png"

PATH_NAME="./"
# you should not need to change these
APP_EXE="${PATH_NAME}${APP_NAME}.app/Contents/MacOS/nwjs"

VOL_NAME="${APP_NAME}-${ARCH}"
DMG_TMP="${VOL_NAME}-temp.dmg"
DMG_FINAL="${VOL_NAME}.dmg"
STAGING_DIR="tmp"
SIGNING_IDENTITY="41A1F53FEF8E816A45B9EE4A6005CA6DC66114F4"

echo "Signing the app ..."

# the same for both main app and nested binaries
CHILD_ARGS=('--sign' "$SIGNING_IDENTITY" '--verbose=3' '--options' 'runtime' '--timestamp' '--deep' '--force' '--entitlements' 'app.entitlements')
APP_ARGS=('--sign' "$SIGNING_IDENTITY" '--verbose=3' '--options' 'runtime' '--timestamp' '--deep' '--force' '--entitlements' 'app.entitlements')

codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Frameworks/nwjs Framework.framework/Helpers/nwjs Helper (GPU).app"
codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Frameworks/nwjs Framework.framework/Helpers/nwjs Helper (Plugin).app"
codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Frameworks/nwjs Framework.framework/Helpers/nwjs Helper.app/Contents/MacOS/nwjs Helper"
codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Frameworks/nwjs Framework.framework/Helpers/nwjs Helper.app"
codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Frameworks/nwjs Framework.framework/Helpers/app_mode_loader"
codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Frameworks/nwjs Framework.framework/Helpers/chrome_crashpad_handler"

codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Frameworks/nwjs Framework.framework/Libraries/libEGL.dylib"
codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Frameworks/nwjs Framework.framework/Libraries/libGLESv2.dylib"
codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Frameworks/nwjs Framework.framework/Libraries/libswiftshader_libEGL.dylib"
codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Frameworks/nwjs Framework.framework/Libraries/libswiftshader_libGLESv2.dylib"
codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Frameworks/nwjs Framework.framework/Libraries/libvk_swiftshader.dylib"

codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Frameworks/nwjs Framework.framework/XPCServices/AlertNotificationService.xpc"

codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Frameworks/nwjs Framework.framework/Versions/Current/libnode.dylib"
codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Frameworks/nwjs Framework.framework/Versions/Current/libffmpeg.dylib"
codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Frameworks/nwjs Framework.framework/Versions/Current/nwjs Framework"

codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Resources/app.nw/node_modules/sqlite3/lib/binding/napi-v3-darwin-x64/node_sqlite3.node"
codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Resources/app.nw/node_modules/secp256k1/build/Release/secp256k1.node"
codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/Resources/app.nw/node_modules/rocksdb/prebuilds/darwin-x64+arm64/node.napi.node"

codesign "${CHILD_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app/Contents/MacOS/${APP_NAME}"
codesign "${APP_ARGS[@]}" "${PATH_NAME}${APP_NAME}.app"

# clear out any old data
echo "Clearing ..."
rm -rf "${STAGING_DIR}" "${DMG_TMP}" "${DMG_FINAL}"

# copy over the stuff we want in the final disk image to our staging dir
echo "Copying ..."
mkdir -p "${STAGING_DIR}"
cp -Rpfa "${PATH_NAME}${APP_NAME}.app" "${STAGING_DIR}"
# ... cp anything else you want in the DMG - documentation, etc.

SIZE=1024

if [ $? -ne 0 ]; then
   echo "Error: Cannot compute size of staging dir"
   exit
fi

# create the temp DMG file
hdiutil create -srcfolder "${STAGING_DIR}" -volname "${VOL_NAME}" -fs HFS+ \
      -fsargs "-c c=64,a=16,e=16" -format UDRW -megabytes ${SIZE} "${DMG_TMP}"

echo "Created DMG: ${DMG_TMP}"

# mount it and save the device
DEVICE=$(hdiutil attach -readwrite -noverify "${DMG_TMP}" | \
         egrep '^/dev/' | sed 1q | awk '{print $1}')

sleep 2

# add a link to the Applications dir
echo "Add link to /Applications"
pushd /Volumes/"${VOL_NAME}"
ln -s /Applications
popd

# add a background image
mkdir /Volumes/"${VOL_NAME}"/.background
cp "${DMG_BACKGROUND_IMG}" /Volumes/"${VOL_NAME}"/.background/

# tell the Finder to resize the window, set the background,
#  change the icon size, place the icons in the right position, etc.
echo '
   tell application "Finder"
     tell disk "'${VOL_NAME}'"
           open
           set current view of container window to icon view
           set toolbar visible of container window to false
           set statusbar visible of container window to false
           set the bounds of container window to {400, 100, 920, 440}
           set viewOptions to the icon view options of container window
           set arrangement of viewOptions to not arranged
           set icon size of viewOptions to 72
           set background picture of viewOptions to file ".background:'${DMG_BACKGROUND_IMG}'"
           set position of item "'${APP_NAME}'.app" of container window to {160, 205}
           set position of item "Applications" of container window to {360, 205}
           close
           open
           update without registering applications
           delay 2
     end tell
   end tell
' | osascript

sync

# unmount it
hdiutil detach "${DEVICE}"

# now make the final image a compressed disk image
echo "Creating compressed image"
hdiutil convert "${DMG_TMP}" -format UDZO -imagekey zlib-level=9 -o "${DMG_FINAL}"

# clean up
rm -rf "${DMG_TMP}"
rm -rf "${STAGING_DIR}"

echo 'Done.'

exit
