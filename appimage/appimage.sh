if [ -z "${NW_VERSION}" ]; then
  NW_VERSION="0.53.0"
fi
cd ..
rm -rf node_modules
yarn
yarn dist:linux64
yarn grunt linux64
cd appimage
rm pkg2appimage
wget https://raw.githubusercontent.com/AppImage/pkg2appimage/master/pkg2appimage
ARCH=x86_64 NO_GLIBC_VERSION=1 bash -ex ./pkg2appimage obyte.yml
mv ./out/obyte--x86_64.AppImage ../../obytebuilds/obyte-x86_64.AppImage