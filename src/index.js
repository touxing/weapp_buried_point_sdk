import {
  useAppLaunch,
  useAppShow,
  useAppHide,
  usePageShow,
  usePageHide,
  usePageUnload,
  usePageClickEvent,
  useComponentClickEvent,
  getActivePage,
  getBoundingClientRect,
  isClickTrackArea,
  getCurrentPageUrl,
  getCurrentPageFromUrl,
  isEmptyObject,
  parsePath,
  parsePathLast,
} from './helper'
import { PAGE_LIFE_METHOD } from './config.js'
import Reporter from './reporter'
import Wrapper from './wrapper'

let reporter
export const init = (config) => {
  if (!reporter) {
    reporter = new Reporter(config)
  }
  new Tracker(config)
  typeof config.success === 'function' && config.success(reporter)
}

class Tracker extends Wrapper {
  defaultConf = {
    collector: {
      oldApp: App,
      oldPage: Page,
      oldComponent: Component,
    },
    tracks: {},
  }
  // 公共方法埋点，例如：分享埋点
  strategies = {
    onShareAppMessage() {
      reporter.track('onShareAppMessage', {
        eventId: 'web_on_share_app_message',
        toUrl: getCurrentPageUrl(),
        fromUrl: getCurrentPageFromUrl(),
        time: Date.now(),
      })
    },
  }
  constructor(config = {}) {
    super()
    if (Tracker.instance) return Tracker.instance
    this.config = Object.assign(this.defaultConf, config)
    this.tracks = this.config.tracks
    const { collector } = this.config
    // 自动给每个page增加elementTracker方法，用作元素埋点
    this.addPageMethodExtra(this.elementTracker())
    // 重写App Page Component 方法
    App = (options) => collector.oldApp(this._proxyAppOptions(options, config))
    Page = (options) =>
      collector.oldPage(this._proxyPageOptions(options, config))
    Component = (options) =>
      collector.oldComponent(this._proxyComponentOptions(options, config))

    Tracker.instance = this
  }

  static getInstance(...args) {
    if (!this.instance) {
      this.instance = new Tracker(...args)
    }
    return this.instance
  }
  /**
   * @desc 重写App的options参数
   * @param {Object} options
   * @param {Object} config
   * @returns {Object} 新的options
   */
  _proxyAppOptions = (options, config = {}) => {
    // 向 App 注入手动埋点的方法
    options.$ta = {
      track: reporter.track.bind(reporter),
    }

    // onLaunch 事件监听
    if (config.autoTrack.appLaunch) {
      options.onLaunch = useAppLaunch(options.onLaunch)
    }
    // onShow 事件监听
    if (config.autoTrack.appShow) {
      options.onShow = useAppShow(options.onShow)
    }
    // onHide 事件监听
    if (config.autoTrack.onHide) {
      options.onHide = useAppHide(options.onHide)
    }

    return options
  }

  /**
   * 重写Page中的options参数
   * @param {Object} options 原始的options参数
   * @param {Object} config
   * @returns 新的options参数
   */
  _proxyPageOptions = (options, config = {}) => {
    // Object.keys(options)
    //   .filter((prop) => typeof options[prop] == 'function')
    //   .forEach((method) => {
    //     method = usePageClickEvent(method, (name, e) => {
    //       this.methodTracker(name, e)
    //     })
    //   })
    // 自定义事件监听
    for (let prop in options) {
      // 需要保证是函数，并且不是原生的生命周期函数
      // && !PAGE_LIFE_METHOD.includes(prop)
      // 生命周期不排除劫持，同样作为“方法”劫持，在配置文件按需配置 生命周期函数 触发的埋点
      if (options.hasOwnProperty(prop) && typeof options[prop] == 'function') {
        // 重写options身上的自定义方法
        // 自动给每个page增加elementTracker方法，用作元素埋点
        // this.elementTracker()
        // 自动给page下预先定义的方法进行监听，用作方法执行埋点
        // this.methodTracker()
        options[prop] = usePageClickEvent(options[prop], (name, e) => {
          this.methodTracker(name, e)
        })
      }
    }

    this.addExtraMethod(options, this.extraPageMethods)

    options.$ta = {
      track: reporter.track.bind(reporter),
    }

    // onShow 事件监听
    if (config.autoTrack.pageShow) {
      options.onShow = usePageShow(options.onShow)
    }
    if (config.autoTrack.pageHide) {
      options.onHide = usePageHide(options.onHide)
    }
    if (config.autoTrack.pageUnload) {
      options.onUnload = usePageUnload(options.onUnload)
    }
    return options
  }

  /**
   * @desc 重写 Component 组件
   * @param {Object} options
   * @param {*} config
   * @returns {Object} new options
   */
  _proxyComponentOptions = (options, config = {}) => {
    const methods = options?.methods
    for (let key in methods) {
      if (methods.hasOwnProperty(key) && typeof methods[key] === 'function') {
        methods[key] = useComponentClickEvent(methods[key], (name, e) => {
          this.comMethodTracker(name, e, options.data)
        })
      }
    }
    options.$ta = {
      track: reporter.track.bind(reporter),
    }
    // 组件没有 onShow onHide ,组件有自己的 lifetimes
    // https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/lifetimes.html
    return options
  }

  elementTracker() {
    // elementTracker变量名尽量不要修改，因为他和wxml下的名字是相对应的
    const elementTracker = (e) => {
      const tracks = this.findActivePageTracks('element')
      const { data } = getActivePage()
      tracks &&
        tracks.forEach((track) => {
          getBoundingClientRect(track.element).then((res) => {
            res.boundingClientRect.forEach((item) => {
              const isHit = isClickTrackArea(e, item, res.scrollOffset)
              track.dataset = item.dataset
              isHit && reporter.track(track, data)
            })
          })
        })
    }
    return elementTracker
  }

  /**
   * @ 监听触发页面 method 方法
   * @param {String} methodName 要监听的Page方法名
   * @param {*} args 事件触发的对象或传递的参数
   */
  methodTracker(methodName, args) {
    const tracks = this.findActivePageTracks('method')
    const { data } = getActivePage() // 当前页面的数据
    if (this.commonPoint(methodName)) {
      return
    }
    this.tapPoint(methodName, tracks, data, args)
  }

  /**
   * function函数改变上下文this指针，指向组件
   * @param {String} methodName 方法名
   * @param {Object|Any} args wxml 方法触发 对象参数
   * @param {Object} data 组件 data 参数
   */
  comMethodTracker(methodName, args, data) {
    const tracks = this.findActivePageTracks('comMethod')
    this.tapPoint(methodName, tracks, data, args)
  }
  /**
   * 触发埋点公共方法
   * @param {*} methodName
   * @param {*} tracks
   * @param {*} data
   * @param {*} args
   */
  tapPoint(methodName, tracks, data, args) {
    // 页面的 dataset 参数或组件的传参 detail
    let dataset = !isEmptyObject(args?.currentTarget?.dataset)
      ? args.currentTarget.dataset
      : { detail: args?.detail || {} }

    tracks &&
      tracks.forEach((track) => {
        if (track.method === methodName) {
          const postData = {
            eventId: `${track.feature}`,
            label: `${track.label}`,
            param: Object.create(null),
          }
          // 动态的 label key 取 dataset
          if (track.labelKey) {
            postData.label = parsePath(track.labelKey)(dataset)
          }
          if (Array.isArray(track.dataKeys)) {
            track.dataKeys.forEach((item) => {
              if (Object.prototype.toString.call(item) === '[object Object]') {
                Object.entries(item).forEach(([key, value]) => {
                  postData.param[key] = parsePath(value)(data)
                })
              } else if (parsePathLast(item)) {
                postData.param[parsePathLast(item)] = parsePath(item)(data)
              } else {
                postData.param[item] = parsePath(item)(data)
              }
            })
          }
          if (Array.isArray(track.objKeys)) {
            track.objKeys.forEach((item) => {
              if (Object.prototype.toString.call(item) === '[object Object]') {
                Object.entries(item).forEach(([key, value]) => {
                  postData.param[key] = parsePath(value)(dataset)
                })
              } else if (parsePathLast(item)) {
                postData.param[parsePathLast(item)] = parsePath(item)(dataset)
              } else {
                postData.param[item] = parsePath(item)(dataset)
              }
            })
          }

          reporter.track(methodName, postData)
        }
      })
  }

  commonPointStrategy(strategy) {
    typeof this.strategies[strategy] === 'function' &&
      this.strategies[strategy]()
  }

  commonPoint(methodName) {
    if (Object.keys(this.strategies).includes(methodName)) {
      this.commonPointStrategy(methodName)
      return true
    }
    return false
  }
  /**
   * 获取当前页面的埋点配置
   * @param {String} type 返回的埋点配置，options: method/element/comMethod
   * @returns {Object}
   */
  findActivePageTracks(type) {
    try {
      const { route } = getActivePage()
      const pageTrackConfig = this.tracks.filter((item) => item.path === route)
      let tracks = []
      if (type === 'method') {
        tracks = pageTrackConfig[0].methodTracks
      } else if (type === 'element') {
        tracks = pageTrackConfig[0].elementTracks
      } else if (type === 'comMethod') {
        tracks = pageTrackConfig[0].comMethodTracks
      }
      return tracks
    } catch (e) {
      return []
    }
  }
}
