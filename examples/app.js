import { init as trackerInit } from '../dist/weapptracker.js'
import { tracks } from './buried_point_conf/index.js'

// 初始化埋点
trackerInit({
  url: 'https://httpbin.org/post', // 测试地址
  autoTrack: {
    appLaunch: true,
    appHide: false,
    appShow: false,
    pageShow: false,
    pageHide: false,
    pageUnload: false,
    onShare: false,
  },
  delay: 2000,
  tracks,
  success(reporterInstance) {
    // 根据需要对接第三方埋点系统
    // test_thried_ok().then((reporter) => {
    //   let buriedSystem = reporterInstance.getSingleton()
    //   buriedSystem.changeReporterEngine(reporter)
    // })
  },
})

App({
  // ...
})
