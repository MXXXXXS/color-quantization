interface Color {
  r: string
  g: string
  b: string
}

function flat(arr1) {
  return arr1.reduce((acc, val) => Array.isArray(val) ? acc.concat(flat(val)) : acc.concat(val), []);
}

function pad(number: string, length: number) {
  while (number.length < length) {
    number = '0' + number;
  }
  return number;
}

export default class OctreeNode {
  private dead: boolean
  parent: OctreeNode | undefined
  private acc: [[number, string]?]
  private accValue: string
  maxDepth: number
  private isLeaf: boolean
  value: string
  level: number
  count: number
  children: OctreeNode[]
  constructor(value: string, level: number, maxDepth: number = 7) {
    this.dead = false
    this.acc = [] // accumulater, 累计合并的像素值
    this.children = []
    this.maxDepth = maxDepth
    this.isLeaf = level === maxDepth
    this.count = 0
    this.value = value
    this.level = level
    this.accValue = ''
  }
  // 只是转换一下格式
  addColor(color: [number, number, number]) {
    const r = pad(color[0].toString(2), 8)
    const g = pad(color[1].toString(2), 8)
    const b = pad(color[2].toString(2), 8)
    this.acceptNode({ r, g, b })
  }
  // 递归插入节点
  private  acceptNode(color: Color) {
    const value = color.r[this.level + 1] + color.g[this.level + 1] + color.b[this.level + 1]
    if (!this.isLeaf) {
      const exists = this.children.map(child => child.value).indexOf(value)
      if (exists === -1) {
        const newNode = new OctreeNode(value, this.level + 1)
        newNode.parent = this
        this.children.push(newNode)
        newNode.acceptNode(color)
      } else {
        this.children[exists].acceptNode(color)
      }
    } else {
      // 只有末端叶子计数不为零, 并且accValue等于value
      this.count += 1
      this.accValue = this.value
    }
  }
  reduce(level: number = this.maxDepth) {
    this.clean()
    this._reduce(level)
  }
  private  clean() {
    // 清除上一次reduce的数据
    this.traverse((node) => {
      if (node.level < node.maxDepth) {
        node.accValue = ''
        node.acc = []
        node.count = 0
        node.isLeaf = false
      }
      node.dead = false
    })
  }
  private _reduce(level?: number) {
    if (this.isLeaf && this.level > level) {
      // 信息传递到上一级
      this.parent.acc.push([this.count, this.level === this.maxDepth ? this.value : this.accValue])
      this.parent.count += this.count
      // 枯萎, 而不是在parent.children中删除自己, 因为会导致this.children长度改变, forEach遍历出错
      this.dead = true
    } else if (!this.isLeaf) {
      // 深度优先, 直到叶子
      this.children.forEach((child, i, children) => {
        child._reduce(level)
        if (children.length - 1 === i && child.dead) {
          // children数据全部传递完成并且枯萎, this变成叶子
          const leftOffset = (this.maxDepth - this.level) * 3
          this.accValue = pad(((parseInt(this.value, 2) << leftOffset) + this.evalAcc)
            .toString(2), (this.maxDepth - this.level + 1) * 3)
          this.isLeaf = true
        }
      })
      //收集完信息, reduce自身, 依据设定的reduce级别
      if (this.level > level) {
        this._reduce(level)
      }
    }
  }
  get isLiveNode() {
    return !this.isLeaf && !this.dead
  }
  get isLiveLeaf() {
    return this.isLeaf && !this.dead
  }
  private binColors(_ = { value: '', count: 0 }) {
    if (this.isLiveLeaf) {
      return { value: _.value + this.accValue, count: this.count + _.count }
    } else if (this.isLiveNode) {
      return this.children.map(child => child.binColors({ value: _.value + this.value, count: this.count + _.count }))
    }
  }
  get liveLeafNum() {
    let n = 0
    this.traverse((node: OctreeNode) => {
      if (node.isLiveLeaf) n++
    })
    return n
  }
  get leafNum() {
    let n = 0
    this.traverse((node: OctreeNode) => {
      if (node.isLeaf) n++
    })
    return n
  }
  traverse(cb: (node: OctreeNode) => void) {
    cb(this)
    if (this.level < this.maxDepth) {
      // 注意这里有个this指向的问题, bind是以防cb不是箭头函数
      this.children.forEach(child => child.traverse(cb.bind(child)))
    }
  }
  get data() {
    return {
      name: `V:${this.accValue}|D:${this.dead}|L:${this.isLeaf}`,
      children: this.children.map(child => child.data)
    }
  }

  get themeColors(): Array<[number, number, number]> {
    const binColors = flat(this.binColors())
      .sort((a, b) => b.count - a.count) //从多到少
      .map(item => item.value)
    // console.log(binColors.slice(0, 5))
    return binColors.map(binColor => {
      let r = ''
      let g = ''
      let b = ''
      for (let i = 0; i < binColor.length; i += 3) {
        r += binColor[i]
        g += binColor[i + 1]
        b += binColor[i + 2]
      }
      return [parseInt(r, 2), parseInt(g, 2), parseInt(b, 2)]
    })
  }
  private  get evalAcc(): number {
    return Math.round(this.acc.reduce((acc, countValue) => {
      const [count, value] = countValue
      return acc + parseInt(value, 2) * count
    }, 0) / this.count)
  }
}