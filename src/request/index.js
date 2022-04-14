class Request {
  constructor(instanceConfig) {
    this.defaults = instanceConfig
    const methods = ['get', 'post']

    methods.forEach((method) => {
      Request.prototype[method] = function (url, data, config) {
        return this.request(url, data, { ...config, method: method.toUpperCase() })
      }
    })
  }

  request(url, data, config) {
    return new Promise((resolve, reject) => {
      wx.request({
        ...this.defaults,
        ...{
          url: url,
          data: data,
          ...config,
          success(res) {
            resolve(res.data)
          },
          fail(err) {
            console.error('request fail',err)
            reject(err)
          },
        },
      })
    })
  }
}

const defaults = {
  method: 'GET',
  header: {
    'content-type': 'application/json', // 默认值
  },
  timeout: 60000, // ms 60s
}

const request = new Request(defaults)

export default request
