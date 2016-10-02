npm_config_target=$ELECTRON_VERSION npm_config_arch=x64 npm_config_target_arch=x64 npm_config_disturl=https://atom.io/download/atom-shell npm_config_runtime=electron npm_config_build_from_source=true HOME=~/.electron-gyp npm rebuild

# Manually rebuild sodium
cd node_modules/sodium-prebuilt
make sodium
HOME=~/.electron-gyp node-gyp rebuild --target=$ELECTRON_VERSION --arch=x64 --dist-url=https://atom.io/download/atom-shell

# Manually rebuild leveldown
cd ../leveldown
HOME=~/.electron-gyp node-gyp rebuild --target=$ELECTRON_VERSION --arch=x64 --dist-url=https://atom.io/download/atom-shell
