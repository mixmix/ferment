var childProcess = require('child_process')

module.exports = function (input, output, cb) {
  childProcess.execFile('ffmpeg', [
    '-i', input,
    '-codec', 'libvorbis',
    '-qscale:a', 8,
    output
  ], {
    cwd: process.cwd(),
    encoding: 'buffer',
    maxBuffer: 1024 * 1024 * 16
  }, cb)
}
