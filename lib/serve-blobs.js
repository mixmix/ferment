var pull = require('pull-stream')
var cat = require('pull-cat')
var toPull = require('stream-to-pull-stream')
var ident = require('pull-identify-filetype')
var mime = require('mime-types')
var URL = require('url')
var Stack = require('stack')
var ip = require('ip')
var http = require('http')

module.exports = function (context, cb) {
  return http.createServer(BlobStack(context.db)).listen(context.config.blobsPort, cb)
}

function BlobStack (sbot, opts) {
  return ServeBlobs(sbot)
}

function ServeBlobs (sbot) {
  return function (req, res, next) {
    var parsed = URL.parse(req.url, true)
    var hash = decodeURIComponent(parsed.pathname.slice(1))
    sbot.blobs.want(hash, function (_, has) {
      if (!has) return respond(res, 404, 'File not found')
      // optional name override
      if (parsed.query.name) {
        res.setHeader('Content-Disposition', 'inline; filename=' + encodeURIComponent(parsed.query.name))
      }

      // serve
      res.setHeader('Content-Security-Policy', BlobCSP())
      respondSource(res, sbot.blobs.get(hash), false)
    })
  }
}

function respondSource (res, source, wrap) {
  if (wrap) {
    res.writeHead(200, {'Content-Type': 'text/html'})
    pull(
      cat([
        pull.once('<html><body><script>'),
        source,
        pull.once('</script></body></html>')
      ]),
      toPull.sink(res)
    )
  } else {
    pull(
      source,
      ident(function (type) {
        if (type) res.writeHead(200, {'Content-Type': mime.lookup(type)})
      }),
      toPull.sink(res)
    )
  }
}

function DeviceAccessControl (config) {
  return function (req, res, next) {
    if (config.allowRemoteAccess()) {
      return next() // remote & local access allowed
    } else if (ip.isLoopback(req.socket.remoteAddress)) {
      return next() // local access allowed
    } else {
      respond(res, 403, 'Remote access forbidden') // remote access disallowed
    }
  }
}

function respond (res, status, message) {
  res.writeHead(status)
  res.end(message)
}

function BlobCSP () {
  return 'default-src none; sandbox'
}
