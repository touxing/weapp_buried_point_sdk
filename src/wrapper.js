export default class Wrapper {
  constructor() {
    this.extraPageMethods = []
  }

  /**
   * 追加函数到Page/App对象
   * @param {Object} target page对象或者app对象
   * @param {Array} methods 需要追加的函数数组
   */
  addExtraMethod(target, methods) {
    methods.forEach((fn) => {
      const methodName = fn.name
      // 不能覆盖业务逻辑已存在的方法
      if(typeof target[methodName] !== 'function') {
        target[methodName] = fn
      }
    })
  }

  addPageMethodExtra(fn) {
    this.extraPageMethods.push(fn)
  }
}
