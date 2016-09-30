var childProcess = require('child_process')

module.exports = function (input, cb) {
  childProcess.execFile('shasum', [ input ], {
    cwd: process.cwd()
  }, function (err, stdout) {
    if (err) return cb(err)
    cb(null, stdout.split(' ')[0].trim())
  })
}
