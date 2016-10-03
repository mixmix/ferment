var Value = require('@mmckegg/mutant/value')
var Struct = require('@mmckegg/mutant/struct')
var MutantDict = require('@mmckegg/mutant/dict')
var MutantArray = require('@mmckegg/mutant/array')
var computed = require('@mmckegg/mutant/computed')
var mlib = require('ssb-msgs')

module.exports = function (id, myId) {
  var obj = Struct({
    self: Struct({
      displayName: Value(),
      image: Value()
    }),

    byMe: Struct({
      displayName: Value(),
      image: Value()
    }),

    displayNames: MutantDict(),
    images: MutantDict()
  })

  obj.id = id
  obj.self = Assigned(obj, id)
  obj.byMe = Assigned(obj, myId)
  obj.displayName = computed([obj.self.displayName, obj.byMe.displayName, obj.displayNames], getSocialValue, { nextTick: true })
  obj.image = computed([obj.self.image, obj.byMe.image, obj.images], getSocialValue, { nextTick: true })
  obj.updateFrom = updateFrom.bind(null, obj)

  return obj
}

function Assigned (profile, id) {
  return Struct({
    displayName: computed([profile.displayNames, id], valueAssignedBy, { nextTick: true }),
    image: computed([profile.images, id], valueAssignedBy, { nextTick: true })
  })
}

function valueAssignedBy (assignments, id) {
  for (var k in assignments) {
    if (assignments[k].includes(id)) {
      return k
    }
  }
}

function updateFrom (profile, sourceId, msg) {
  var c = msg.value.content

  // name: a non-empty string
  if (nonEmptyStr(c.name)) {
    var safeName = makeNameSafe(c.name)

    // remove old assignment, if it exists
    profile.displayNames.keys().forEach((name) => {
      var currentName = profile.displayNames.get(name)
      currentName.delete(sourceId)
      if (!currentName.getLength()) {
        profile.displayNames.delete(name)
      }
    })

    // add new assignment
    if (!profile.displayNames.get(safeName)) {
      profile.displayNames.put(safeName, MutantArray())
    }
    profile.displayNames.get(safeName).push(sourceId)
  }

  // image: link to image
  if ('image' in c) {
    var imageLink = mlib.link(c.image, 'blob')
    if (imageLink) {
      // remove old assignment, if it exists

      profile.images.keys().forEach((blobId) => {
        var currentBlob = profile.displayNames.get(blobId)
        currentBlob.delete(sourceId)
        if (!currentBlob.getLength()) {
          profile.displayNames.delete(blobId)
        }
      })

      // add new assignment
      profile.self.image.set(imageLink)
      if (!profile.images.get(imageLink)) {
        profile.displayNames.put(imageLink, MutantArray())
      }
      profile.displayNames.get(imageLink).push(sourceId)
    }
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
