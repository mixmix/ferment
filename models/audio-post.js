var Value = require('@mmckegg/mutant/value')
var Struct = require('@mmckegg/mutant/struct')

module.exports = AudioPost

function AudioPost (id, author) {
  var result = Struct({
    title: Value(),
    description: Value(),
    license: Value(),
    overview: Value(),
    duration: Value(0, {defaultValue: 0}),
    audioSrc: Value(),
    artworkSrc: Value()
  })

  result.id = id
  result.author = author
  result.position = Value(0)
  result.state = Value()

  return result
}
