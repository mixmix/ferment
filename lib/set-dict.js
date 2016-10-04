var MutantSet = require('@mmckegg/mutant/set')
var MutantDict = require('@mmckegg/mutant/dict')

module.exports = SetDict

function SetDict () {
  var result = MutantDict()
  result.getValue = function (key) {
    var value = result.get(key)
    if (!value) {
      value = MutantSet()
      result.put(key, value)
    }
    return value
  }
  result.addValue = function (key, value) {
    if (!result.get(key)) {
      result.put(key, MutantSet())
    }
    result.get(key).add(value)
  }
  result.deleteValue = function (key, value) {
    var set = result.get(key)
    if (set) {
      set.delete(value)
    }
  }
  return result
}
