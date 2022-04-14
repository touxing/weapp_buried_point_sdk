## 小程序自动埋点SDK

## 使用
### 1.初始化SDK

Examples
```js
// app.js

import { init as trackerInit } from './lib/weapptracker.js'
import { tracks } from './config/buried_point_conf/index.js'

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
    // 对接第三方埋点系统
    // test_thried_ok().then((reporter) => {
    //   let buriedSystem = reporterInstance.getSingleton()
    //   buriedSystem.changeReporterEngine(reporter)
    // })
  },
})

// ...
App({})
// ...
```

### 2.配置埋点

```js
const tracks = {
  path: 'pages/index/index',
  elementTracks: [
    {
      element: '.usermotto', // 声明需要监听的元素
      dataKeys: [], // 声明需要获取 data下的 userInfo 对象下的 nickName 字段
    },
  ],
  // 配置示例
  methodTracks: [
    {
      method: 'onShow',
      feature: 'web_on_index',
      label: ''
    },
    {
      method: 'testSend', // 监听的函数
      feature: 'testSend', // 埋点事件 eventId
      label: 'testSend', // 事件 label
      labelKey: 'dynLabel', // 插入动态 label key 替换 静态 label
      // 页面 data 下的值
      // 字符串支持 obj.member 对象.字段 方式配置，默认 key 是最后一个
      // 支持 对象方式赋值，key 是埋点请求传的key， value 是读取 data 中的 key，data.value，字符串支持 obj.member 方式
      dataKeys: ['userInfo.wxNickname', 'navTopHeight', { safeTop: 'navTopHeight' }],
      objKeys: [ // 埋点对象参数，额外获取传参
        {
          key: 'test', // 埋点传参的 key值 和 读取埋点对象的值
        }
      ]
    }
  ]
}
```

### 3.在wxml最外层插入监听方法[可选]

名字固定 `elementTracker`
```
<view catchtap='elementTracker'>
	<view></view>
</view>
```

### 4.验证

打开控制台，查看是否成功收集
![image](https://github.com/touxing/weapp_buried_point_sdk/blob/main/img/Snipaste_2022-04-14_14-37-00.jpg?raw=true)

## 参考

[小程序从手动埋点到自动埋点](https://github.com/zhengguorong/articles/issues/34)
[DEMO](https://github.com/touxing/miniprogram-webpack/tree/dev)
