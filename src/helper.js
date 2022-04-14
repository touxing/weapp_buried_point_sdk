export function isFunction(val) {
  return typeof val === 'function'
}

export function isPlainObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

export function isPromise(val) {
  return isPlainObject(val) && isFunction(val.then) && isFunction(val.catch)
}

export function isDef(val) {
  return typeof val !== 'undefined' && val !== 'undefined'
}
export function isEmptyObject(obj) {
  return Object.keys(obj).length === 0
}

/** 获取当前页面的地址 */
export function getCurrentPageUrl() {
  return getCurrentPage().route
}

/**
 * @desc 获取当前url的跳转来源
 * @returns {String} url
 */
export function getCurrentPageFromUrl() {
  const pages = getCurrentPages()
  if (pages.length >= 2) {
    const currentPage = pages[pages.length - 2]
    const url = currentPage.route
    return url
  }
}

export const useAppLaunch = (oldOnLunch) =>
  _proxyHooks(oldOnLunch, function () {
    const data = {
      event: 'appLaunch',
      path: this.route || '',
      title: 'cmbc_FUN',
    }
    this.$ta.track('devices', data)
  })

export const useAppShow = (oldOnShow) => {
  return _proxyHooks(oldOnShow, function () {
    const data = {
      event: 'appShow',
      toUrl: getCurrentPageUrl(),
      fromUrl: getCurrentPageFromUrl(),
    }
    this.$ta.track('devices', data)
  })
}

export const useAppHide = (oldOnHide) => {
  _proxyHooks(oldOnHide, function () {
    const data = {
      event: 'appHide',
    }
    this.$ta.track('devices', data)
  })
}

export const usePageShow = (oldOnShow) => {
  return _proxyHooks(oldOnShow, function () {
    const data = {
      event: 'pageShow',
      toUrl: getCurrentPageUrl(),
      fromUrl: getCurrentPageFromUrl(),
    }
    this.$ta.track('devices', data)
  })
}
export const usePageHide = (oldOnHide) => {
  return _proxyHooks(oldOnHide, function () {
    const data = {
      event: 'pageHide',
      toUrl: getCurrentPageUrl(),
      fromUrl: getCurrentPageFromUrl(),
    }
    this.$ta.track('devices', data)
  })
}

export const usePageUnload = (oldUnload) => {
  return _proxyHooks(oldUnload, function () {
    const data = {
      event: 'pageUnload',
      toUrl: getCurrentPageUrl(),
      fromUrl: getCurrentPageFromUrl(),
    }
    this.$ta.track('devices', data)
  })
}

/**
 * 监听页面的点击事件
 * @param {Function} oldEvent 原生的page自定义事件
 */
export const usePageClickEvent = (oldEvent, cb) => {
  return _proxyHooks(oldEvent, function (e) {
    // 全局拦截点击事件
    // if (e?.type === 'tap') {
    //   this.$ta.track('event', {
    //     event: 'pageClick',
    //     toUrl: getCurrentPageUrl(),
    //     fromUrl: getCurrentPageFromUrl(),
    //     userInfo: this.userInfo,
    //     timeStamp: e.timeStamp,
    //     time: Date.now(),
    //   })
    // }

    // 注入额外方法，按需埋点
    typeof cb === 'function' && cb(oldEvent.name, e)
  })
}

export const useComponentClickEvent = (oldEvent, cb) => {
  return _proxyHooks(oldEvent, function (e) {
    // 注入额外方法，按需埋点
    typeof cb === 'function' && cb(oldEvent.name, e)
  })
}

/**
 * 代理原始方法，并执行回调函数
 * @param {*} fn 需要代理的方法
 * @param {*} cb 需要执行的回调
 */
function _proxyHooks(fn, cb) {
  return function () {
    // 如果回调存在
    typeof cb === 'function' && cb.apply(this, [...arguments])
    // 执行原函数，需要返回，因为有些是 Promise 函数，如果没有返回找不到 then 方法
    return typeof fn === 'function' && fn.apply(this, arguments)
  }
}

/**
 * 获取页面元素信息
 * @param {String} element 元素class或者id
 * @returns {Promise}
 */
export const getBoundingClientRect = function (element) {
  return new Promise((reslove) => {
    const query = wx.createSelectorQuery()
    query.selectAll(element).boundingClientRect()
    query.selectViewport().scrollOffset()
    query.exec((res) =>
      reslove({ boundingClientRect: res[0], scrollOffset: res[1] })
    )
  })
}
/**
 * 判断点击是否落在目标元素
 * @param {Object} clickInfo 用户点击坐标
 * @param {Object} boundingClientRect 目标元素信息
 * @param {Object} scrollOffset 页面位置信息
 * @returns {Boolean}
 */
export const isClickTrackArea = function (
  clickInfo,
  boundingClientRect,
  scrollOffset
) {
  if (!boundingClientRect) return false
  const { x, y } = clickInfo.detail // 点击的x y坐标
  const { left, right, top, height } = boundingClientRect
  const { scrollTop } = scrollOffset
  if (
    left < x &&
    x < right &&
    scrollTop + top < y &&
    y < scrollTop + top + height
  ) {
    return true
  }
  return false
}
/**
 * 获取当前页面
 * @returns {Object} 当前页面Page对象
 */
export const getActivePage = function () {
  const curPages = getCurrentPages()
  if (curPages.length) {
    return curPages[curPages.length - 1]
  }
  return {}
}

/**
 * 获取前一页面
 * @returns {Object} 当前页面Page对象
 */
export const getPrevPage = function () {
  const curPages = getCurrentPages()
  if (curPages.length > 1) {
    return curPages[curPages.length - 2]
  }
  return {}
}

/**
 * Parse simple path.
 */
const bailRE = /[^\w.$]/
export function parsePath(path) {
  if (bailRE.test(path)) {
    return
  }
  const segments = path.split('.')
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return
      obj = obj[segments[i]]
    }
    return obj
  }
}

/**
 * @desc . 切割对象，返回最后一个对象key
 * @param {String} path
 * @returns
 */
export function parsePathLast(path) {
  if (bailRE.test(path)) {
    return
  }
  const segments = path.split('.')
  return segments[segments.length - 1]
}

/**
 * @desc 下划线命名转驼峰命名
 * @param {String} name
 * @returns
 */
export function toHump(name) {
  if (!name) return name
  return name.replace(/\_(\w)/g, function (all, letter) {
    return letter.toUpperCase()
  })
}

/**
 * @desc 驼峰命名转下划线命名
 * @param {String} name
 * @returns
 */
export function toLine(name) {
  if (!name) return name
  return name.replace(/([A-Z])/g, '_$1').toLowerCase()
}
