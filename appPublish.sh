#!/bin/sh
cd  /Users/kareemlewis/Documents/GitHub/bantter-app/platforms/android/build/outputs/apk
cordova build --release android

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore bantter-release-key.keystore android-release-unsigned.apk bantterAppKey
rm bantter.apk
/Users/kareemlewis/Documents/adt-bundle-mac-x86_64-20140702/sdk/build-tools/22.0.1/zipalign -v 4 /Users/kareemlewis/Documents/GitHub/bantter-app/platforms/android/build/outputs/apk/android-release-unsigned.apk bantter.apk
cd /Users/kareemlewis/Documents/GitHub/bantter-app