var Value = require('@mmckegg/mutant/value')
var Struct = require('@mmckegg/mutant/struct')

module.exports = AudioPost

function AudioPost (context, item, opts) {
  var result = Struct({
    title: Value(),
    description: Value(),
    license: Value(),
    overview: Value(),
    duration: Value(0, {defaultValue: 0}),
    audioSrc: Value(),
    artworkSrc: Value()
  })

  result.context = context
  result.feedTitle = Value(opts && opts.feedTitle || null)
  result.position = Value(0)
  result.state = Value()

  if (item) {
    result.set(item.content)
  }

  return result
}
