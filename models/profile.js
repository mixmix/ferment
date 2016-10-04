var Value = require('@mmckegg/mutant/value')
var Struct = require('@mmckegg/mutant/struct')
var MutantDict = require('@mmckegg/mutant/dict')
var MutantArray = require('@mmckegg/mutant/array')
var MutantSet = require('@mmckegg/mutant/set')
var computed = require('@mmckegg/mutant/computed')
var mlib = require('ssb-msgs')

module.exports = function (id, myId) {
  var obj = Struct({
    displayNames: SocialValue(),
    images: SocialValue(),
    descriptions: SocialValue(),
    followers: MutantSet(),
    following: MutantSet(),
    postCount: Value(0),
    likes: MutantSet()
  })

  obj.id = id
  obj.self = Assigned(obj, id)
  obj.byMe = Assigned(obj, myId)
  obj.description = computed([obj.self.description, obj.byMe.description, obj.descriptions], getSocialValue, { nextTick: true })
  obj.displayName = computed([obj.self.displayName, obj.byMe.displayName, obj.displayNames], getSocialValue, { nextTick: true })
  obj.image = computed([obj.self.image, obj.byMe.image, obj.images], getSocialValue, { nextTick: true })
  obj.updateFrom = updateFrom.bind(null, obj)

  return obj
}

function Assigned (profile, id) {
  return Struct({
    displayName: profile.displayNames.valueBy(id),
    description: profile.descriptions.valueBy(id),
    image: profile.images.valueBy(id)
  })
}

function updateFrom (profile, sourceId, msg) {
  var c = msg.value.content

  // name: a non-empty string
  if (nonEmptyStr(c.name)) {
    var safeName = makeNameSafe(c.name)
    profile.displayNames.assignValue(sourceId, safeName)
  }

  // image: link to image
  if ('image' in c) {
    var imageLink = mlib.link(c.image, 'blob')
    if (imageLink) {
      profile.images.assignValue(sourceId, imageLink.link)
    }
  }

  if ('description' in c) {
    profile.descriptions.assignValue(sourceId, c.description)
  }
}

function getSocialValue (self, assigned, all) {
  return self || assigned || mostPopular(all)
}

function mostPopular (obj) {
  var max = 0
  var value = null

  for (var k in obj) {
    if (obj[k].length > max) {
      max = obj[k].length
      value = obj[k]
    }
  }

  return value
}

// allow space!
var badNameCharsRegex = /[^A-z0-9\._-\s]/g
function makeNameSafe (str) {
  str = str.replace(badNameCharsRegex, '_')
  if (str.charAt(str.length - 1) === '.') {
    str = str.slice(0, -1) + '_'
  }
  return str
}

function nonEmptyStr (str) {
  return (typeof str === 'string' && !!('' + str).trim())
}

function SocialValue () {
  var result = MutantDict()
  result.assignValue = assignValue.bind(null, result)
  result.valueBy = getValueBy.bind(null, result)
  return result
}

function assignValue (dict, assignerId, value) {
  dict.keys().forEach((v) => {
    var current = dict.get(v)
    current.delete(assignerId)
    if (!current.getLength()) {
      dict.delete(v)
    }
  })

  // add new assignment
  if (!dict.get(value)) {
    dict.put(value, MutantArray())
  }
  dict.get(value).push(assignerId)
}

function getValueBy (dict, assignerId) {
  return computed([dict, assignerId], valueAssignedBy, { nextTick: true })
}

function valueAssignedBy (assignments, id) {
  for (var k in assignments) {
    if (assignments[k].includes(id)) {
      return k
    }
  }
}
