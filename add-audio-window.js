var h = require('./lib/h')
var electron = require('electron')
var Path = require('path')
var AudioOverview = require('./widgets/audio-overview')
var computed = require('@mmckegg/mutant/computed')
var when = require('@mmckegg/mutant/when')
var Value = require('@mmckegg/mutant/value')
var convert = require('./lib/convert')
var generateMeta = require('./lib/generate-meta')
var shasum = require('./lib/shasum')
var fs = require('fs')
var extend = require('xtend')

module.exports = function (config) {
  var context = {
    config,
    db: require('./lib/db')(config),
    background: require('./models/background-remote')(config)
  }

  var mediaPath = config.mediaPath
  var artworkInput = h('input', {type: 'file', accept: 'image/*'})
  var audioInput = h('input', {type: 'file', accept: 'audio/*'})
  var title = h('input -title', { placeholder: 'Choose a title' })

  setTimeout(() => title.focus(), 50)

  var audioInfo = Value()
  var waitingToSave = Value(false)
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
      if (!description.value || description.value === lastAutoTitle) {
        var fileName = file.name
        var ext = Path.extname(fileName)
        var base = Path.basename(fileName, ext)
        title.value = base
        lastAutoTitle = title.value
      }

      audioInfo.set({ processing: true })

      cancelLastImport && cancelLastImport()
      cancelLastImport = prepareAudio(file.path, function (err, info) {
        if (err) throw err
        audioInfo.set(info)
        if (waitingToSave()) {
          save()
        }
      })
    }
  }

  return h('AddAudioPost', [
    h('section', [
      h('div.artwork', [
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
      when(waitingToSave, [
        h('button', {'disabled': true}, ['Processing, please wait...']),
        h('button -stop', {'ev-click': cancelPost}, ['Cancel Post'])
      ], [
        h('button -save', {'ev-click': save}, ['Post to Feed']),
        h('button -cancel', {'ev-click': cancel}, ['Cancel'])
      ])
    ])
  ])

  // scoped

  function cancelPost () {
    waitingToSave.set(false)
  }

  function save () {
    if (!audioInfo() || audioInfo().processing) {
      waitingToSave.set(true)
      return
    }
    var item = extend(audioInfo(), {
      type: 'ferment/audio',
      title: title.value,
      description: description.value
    })

    console.log('publishing', item)
    context.db.publish(item, function (err) {
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
      if (err) throw err
      console.log('generated meta', meta)
      var toPath = Path.join(mediaPath, `importing-${Date.now()}.ogg`)
      convert(path, toPath, function (err) {
        if (cancelled) return
        if (err) throw err
        console.log('converted to ogg')
        shasum(toPath, function (err, hash) {
          if (cancelled) return
          if (err) throw err
          var finalPath = Path.join(mediaPath, `${hash}.ogg`)
          console.log('generate hash', hash)
          fs.rename(toPath, finalPath, function (err) {
            if (cancelled) return
            if (err) throw err
            context.background.createTorrent(finalPath, hash, function (err, magnetURI) {
              if (cancelled) return
              if (err) throw err
              cb(null, extend({
                audioSrc: magnetURI
              }, meta))
            })
          })
        })
      })
    })

    return () => {
      cancelled = true
    }
  }
}
