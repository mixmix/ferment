var childProcess = require('child_process')

module.exports = function (path, cb) {
  var count = 200
  childProcess.execFile('ffmpeg', [
    '-i', path,
    '-ac', 1,
    '-filter:a', 'aresample=1000',
    '-map', '0:a',
    '-c:a', 'pcm_s8',
    '-f', 'data',
    'pipe:1'
  ], {
    cwd: process.cwd(),
    encoding: 'buffer',
    maxBuffer: 1024 * 1024 * 16
  }, function (err, stdout, stderr) {
    if (err) return cb(err)
    var durationMatch = stderr.toString().match(/Duration: ([0-9]+):([0-9]{2}):([0-9]{2}.[0-9]{2})/)
    var duration = (parseInt(durationMatch[1], 10) * 3600) + (parseInt(durationMatch[2], 10) * 60) + parseFloat(durationMatch[3])

    var samples = new Int8Array(stdout.buffer)
    var frameLength = Math.floor(samples.length / count)
    var bins = new Uint8Array(count)
    for (var i = 0; i < count; i += 1) {
      var sum = 0
      for (var x = 0; x < frameLength; x++) {
        sum += Math.abs(samples[i * frameLength + x] * 2)
      }
      bins[i] = Math.floor(sum / frameLength)
    }
    cb(null, {
      overview: Buffer.from(bins.buffer).toString('base64'),
      duration: duration
    })
  })
}
