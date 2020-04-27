function pad(number: string, length: number) {
  while (number.length < length) {
    number = '0' + number;
  }
  return number;
}

export default class Popularity {
  level: number
  private colors: string[][]
  private dict: Record<string, string[][]>
  constructor(level: number) {
    level = Math.round(level)
    if (level < 1){
      level = 1
    }
    if (level > 7){
      level = 7
    }
    this.colors = []
    this.level = level
    this.dict = {}
  }
  addColor(color: [number, number, number]) {
    const r = pad(color[0].toString(2), 8)
    const g = pad(color[1].toString(2), 8)
    const b = pad(color[2].toString(2), 8)

    const value: string[] = []
    for (let i = 0; i < 8; i++) {
      value.push(r[i] + g[i] + b[i])
    }
    this.colors.push(value)
    const colorKey = value.slice(0, this.level).join('-')
    if (!Array.isArray(this.dict[colorKey])) {
      this.dict[colorKey] = []
    }
    this.dict[colorKey].push(value.slice(this.level))
  }
  clean() {
    this.colors = []
    this.dict = {}
  }
  get n() {
    return this.colors.length
  }
  get themeColors(): Array<[number, number, number]> {
    const colors = Object.entries(this.dict)
      .map(entry => [entry[1], entry[0]] as [string[][], string])
      .sort((a, b) => b[0].length - a[0].length) //颜色从多到少
      .map(entry => {
        const colorPrefix = entry[1].split('-').reduce((acc, cur) => {
          acc[0] = acc[0] + cur[0]
          acc[1] = acc[1] + cur[1]
          acc[2] = acc[2] + cur[2]
          return acc
        }, ['', '', '']).map(char => parseInt(char, 2) << (8 - this.level))
        const colorsSuffix = entry[0].map(suffix => {
          return suffix.reduce((acc, cur) => {
            acc[0] = acc[0] + cur[0]
            acc[1] = acc[1] + cur[1]
            acc[2] = acc[2] + cur[2]
            return acc
          }, ['', '', '']).map(char => parseInt(char, 2))
        })
        const colorsLength = colorsSuffix.length
        const middle = Math.floor(colorsLength / 2)
        const themeColorSuffixRed = colorsSuffix.sort((a, b) => a[0] - b[0])[middle][0]
        const themeColorSuffixGreen = colorsSuffix.sort((a, b) => a[1] - b[1])[middle][0]
        const themeColorSuffixBlue = colorsSuffix.sort((a, b) => a[2] - b[2])[middle][0]
        const themeColor: [number, number, number] = [
          colorPrefix[0] + themeColorSuffixRed,
          colorPrefix[1] + themeColorSuffixGreen,
          colorPrefix[2] + themeColorSuffixBlue
        ]
        return themeColor
      })
    return colors
  }
}