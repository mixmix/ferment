module.exports = function (data, width, height) {
  var bins = typeof data === 'string' ? Array.from(new Buffer(data, 'base64')) : []
  var barWidth = width / bins.length
  var multiplier = 256 / bins.reduce((x, y) => Math.max(x, y), 0)
  var result = bins.map((value, i) => `
    <rect
      x="${i * barWidth}"
      y="${height / 2}px"
      height="${(value / 256) * height * multiplier}"
      width="${width / bins.length * 0.8}"
    />
  `)
  return result.join('')
}
