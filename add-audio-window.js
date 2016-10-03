var h = require('./lib/h')
var electron = require('electron')
var Path = require('path')
var AudioOverview = require('./widgets/audio-overview')
var computed = require('@mmckegg/mutant/computed')
var when = require('@mmckegg/mutant/when')
var Value = require('@mmckegg/mutant/value')
var convert = require('./lib/convert')
var generateMeta = require('./lib/generate-meta')
var parseTorrentFile = require('parse-torrent-file')
var createTorrent = require('create-torrent')
var fs = require('fs')
var extend = require('xtend')
var sanitizeFileName = require('sanitize-filename')

module.exports = function (client, config) {
  var context = {
    config,
    api: require('./api')(client, config),
    background: require('./models/background-remote')(config)
  }

  var mediaPath = config.mediaPath
  var artworkPath = Value()
  var artworkInput = h('input', {type: 'file', accept: 'image/*'})
  var audioInput = h('input', {type: 'file', accept: 'audio/*'})
  var title = h('input -title', { placeholder: 'Choose a title' })

  setTimeout(() => title.focus(), 50)

  var audioInfo = Value()
  var waitingToSave = Value(false)
  var publishing = Value(false)
  var processing = computed(audioInfo, (info) => info && info.processing)
  var overview = computed(audioInfo, (info) => info && info.overview)

  var description = h('textarea -description', {
    rows: 5,
    placeholder: 'Describe your audio'
  })

  var audioSvg = AudioOverview(overview, 600, 100)
  var lastAutoTitle = title.value
  var cancelLastImport = null

  audioInput.onchange = function () {
    var file = audioInput.files[0]
    if (file) {
      if (!title.value || title.value === lastAutoTitle) {
        var fileName = file.name
        var ext = Path.extname(fileName)
        var base = Path.basename(fileName, ext)
        title.value = base
        lastAutoTitle = title.value
      }

      audioInfo.set({ processing: true })

      cancelLastImport && cancelLastImport()
      cancelLastImport = prepareAudio(file.path, function (err, info) {
        if (err) {
          electron.remote.dialog.showMessageBox(electron.remote.getCurrentWindow(), {
            type: 'error',
            title: 'Error',
            buttons: ['OK'],
            message: 'An error occured while processing audio file.'
          })
          audioInfo.set({error: err})
          throw err
        }
        audioInfo.set(info)
        if (waitingToSave()) {
          save()
        }
      })
    }
  }

  artworkInput.onchange = function () {
    var file = artworkInput.files[0]
    if (file) {
      artworkPath.set(file.path)
    }
  }

  return h('AddAudioPost', [
    h('section', [
      h('div.artwork', {
        style: {
          'background-image': computed(artworkPath, p => p ? `url('file://${p}')` : '')
        }
      }, [
        h('span', ['🖼 Choose Artwork...']), artworkInput
      ]),
      h('div.main', [
        h('div.info', [
          title, description
        ]),
        h('div.audio', {
          classList: [
            when(processing, '-processing')
          ]
        }, [
          audioSvg,
          h('span', ['📂 Choose Audio File...']),
          audioInput
        ])
      ])
    ]),
    h('footer', [
      when(publishing,
        h('button', {'disabled': true}, ['Publishing...']),
        when(waitingToSave, [
          h('button', {'disabled': true}, ['Processing, please wait...']),
          h('button -stop', {'ev-click': cancelPost}, ['Cancel Post'])
        ], [
          h('button -save', {'ev-click': save}, ['Publish Audio']),
          h('button -cancel', {'ev-click': cancel}, ['Cancel'])
        ])
      )
    ])
  ])

  // scoped

  function cancelPost () {
    waitingToSave.set(false)
  }

  function save () {
    if (audioInfo() && !audioInfo().error) {
      if (audioInfo().processing) {
        waitingToSave.set(true)
        return
      }
    } else {
      electron.remote.dialog.showMessageBox(electron.remote.getCurrentWindow(), {
        type: 'info',
        title: 'Cannot Publish',
        buttons: ['OK'],
        message: 'You need to choose an audio file before publishing.'
      })
      return
    }

    publishing.set(true)
    commitAndSeed(extend(audioInfo(), {
      type: 'ferment/audio',
      title: title.value,
      description: description.value
    }), function (err, item) {
      if (err) throw err
      if (artworkPath()) {
        context.api.addBlob(artworkPath(), (err, hash) => {
          if (err) throw err
          console.log('added blob', hash)
          item.artworkSrc = `blobstore:${hash}`
          publish(item)
        })
      } else {
        publish(item)
      }
    })
  }

  function commitAndSeed (info, cb) {
    var tempDir = info.tempDir
    var tempFile = Path.join(tempDir, info.fileName)
    var newFileName = getFileName(info)
    var renamed = Path.join(tempDir, newFileName)

    info = extend(info, {
      fileName: newFileName
    })

    delete info.tempDir

    console.log('renaming', tempFile, 'to', renamed)
    fs.rename(tempFile, renamed, function (err) {
      if (err) throw err
      createTorrent(renamed, function (err, torrentFile) {
        if (err) return cb(err)
        var torrent = parseTorrentFile(torrentFile)
        var torrentPath = Path.join(mediaPath, `${torrent.infoHash}.torrent`)
        var finalPath = Path.join(mediaPath, `${torrent.infoHash}`)
        console.log('created torrent', torrentPath)

        fs.rename(audioInfo().tempDir, finalPath, (err) => {
          if (err) return cb(err)
          fs.writeFile(torrentPath, torrentFile, (err) => {
            if (err) return cb(err)
            context.background.seedTorrent(torrent.infoHash, function (err, magnetURI) {
              if (err) throw err
              console.log('seeding torrent', magnetURI)
              info.audioSrc = magnetURI
              cb(null, info)
            })
          })
        })
      })
    })
  }

  function publish (item) {
    console.log('publishing', item)
    context.api.publish(item, function (err) {
      if (err) throw err
      var window = electron.remote.getCurrentWindow()
      window.close()
    })
  }

  function cancel () {
    var window = electron.remote.getCurrentWindow()
    window.close()
  }

  function prepareAudio (path, cb) {
    var cancelled = false

    generateMeta(path, function (err, meta) {
      if (cancelled) return
      if (err) return cb && cb(err)
      console.log('generated meta', meta)
      var tempDir = Path.join(mediaPath, `importing-${Date.now()}`)
      fs.mkdir(tempDir, function (err) {
        if (err) return cb && cb(err)
        var fileName = `${Path.basename(path)}.ogg`
        var toPath = Path.join(tempDir, fileName)
        convert(path, toPath, function (err) {
          if (cancelled) return
          if (err) return cb && cb(err)
          console.log('converted to ogg')
          cb(null, extend(meta, {
            fileName, tempDir
          }))
        })
      })
    })

    return () => {
      cancelled = true
    }
  }
}
function getFileName (audioInfo) {
  var ext = Path.extname(audioInfo.fileName)
  return `${sanitizeFileName(audioInfo.title.trim()) || 'audio'}${ext}`
}
