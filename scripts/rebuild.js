var execSync = require('child_process').execSync
var Path = require('path')
var fs = require('fs')
var ELECTRON_VERSION = process.env.ELECTRON_VERSION
var dist = 'https://atom.io/download/atom-shell'
var home = '~/.electron-gyp'
var extend = require('xtend')

// SO MUCH NASTY IN THIS FILE :(

execSync('npm rebuild fsevents', {
  stdio: 'inherit',
  env: extend(process.env, {
    npm_config_target: ELECTRON_VERSION,
    npm_config_arch: 'x64',
    npm_config_target_arch: 'x64',
    npm_config_disturl: dist,
    npm_config_build_from_source: 'true',
    HOME: home
  })
})

var sodiumPath = Path.join(__dirname, '..', 'node_modules/sodium-prebuilt')
if (needToBuild(sodiumPath)) {
  execSync('make', {
    stdio: 'inherit',
    cwd: sodiumPath,
    env: process.env
  })

  execSync(`node-gyp rebuild --target=${ELECTRON_VERSION} --arch=x64 --dist-url=${dist}`, {
    stdio: 'inherit',
    env: extend(process.env, { HOME: home }),
    cwd: sodiumPath
  })
  storeVersion(sodiumPath)
}

var levelPath = Path.join(__dirname, '..', 'node_modules/leveldown')
if (needToBuild(levelPath)) {
  execSync(`node-gyp rebuild --target=${ELECTRON_VERSION} --arch=x64 --dist-url=${dist}`, {
    stdio: 'inherit',
    env: extend(process.env, { HOME: home }),
    cwd: levelPath
  })
  storeVersion(levelPath)
}

function needToBuild (path) {
  if (process.argv.includes('--force')) {
    return true
  }
  var file = Path.join(path, 'built_for_electron')
  return fs.exists(file) && fs.readFileSync(file, 'utf8').trim() === ELECTRON_VERSION.trim()
}

function storeVersion (path) {
  var file = Path.join(path, 'built_for_electron')
  return fs.writeFileSync(file, ELECTRON_VERSION)
}
