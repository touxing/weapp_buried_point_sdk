import request from './request'
import { isDef } from './helper'

class Reporter {
  defaultOptions = {
    delay: 1000,
    timeout: 60 * 1000,
  }
  timerId = null
  constructor(config = {}) {
    if (Reporter.instance) return Reporter.instance
    this.config = Object.assign(this.defaultOptions, config)
    // 需要发送的追踪信息的队列
    this.queue = []

    Reporter.instance = this
  }
  static getInstance(...args) {
    if (!this.instance) {
      this.instance = new Reporter(...args)
    }
    return this.instance
  }
  getSingleton(...args) {
    if (!this.instance) {
      return Reporter.getInstance(...args)
    }
    return this.instance
  }
  /**
   * 追踪埋点数据
   * @param {*} data 需要上报的数据
   */
  track(type, data) {
    // 可以添加一些公共信息字段

    this.queue.push(data)

    if (!this.timerId) {
      // 为了不影响正常的业务请求，这里延时发出我们的埋点信息
      this.timerId = setTimeout(() => {
        this._flush()
      }, this.config.delay)
    }
  }
  /**
   * 执行队列中的任务(向后台发送追踪信息)
   */
  _flush() {
    // 队列中有数据时进行请求
    if (this.queue.length > 0) {
      const data = this.queue.shift()
      if (
        isDef(this.config.reporter) &&
        typeof this.config.reporter === 'function'
      ) {
        // todo: 这里接入第三方埋点系统
        if (data.eventId) {
          console.table(data)
        }
        setTimeout(() => {
          this._flush()
        }, this.config.delay)
      } else {
        let json
        try {
          json = JSON.stringify(data)
        } catch (error) {
          console.error(error)
        }
        let postData = {
          event_id: `web_${data.eventId}`, // 自动加上前缀，事件唯一标识
          label: data.label || '', // 功能名
          json: data, // 自定义上传数据
        }

        request
          .post(this.config.url, postData, {
            timeout: this.config.timeout,
            // header: { 'content-type': 'application/x-www-form-urlencoded' },
          })
          .then(() => {
            console.log('send 埋点', json)
          })
          .catch((error) => {
            // 发送失败的时候将该次信息从小存到 queue 队尾
            console.error(error)
            this.queue.push(data)
          })
          .finally(() => {
            // 执行完成后发送下一个信息
            setTimeout(() => {
              this._flush()
            }, this.config.delay)
          })
      }
    } else {
      this.timerId = null
    }
  }
  changeReporterEngine(reporter) {
    this.config.reporter = reporter
  }
}

export default Reporter
