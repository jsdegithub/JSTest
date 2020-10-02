/**
 * ajax请求封装
 * 1、调用客户端的加解密方法
 * 2、统一处理请求头，将post转成form-urlencoded的形式
 * 3、ajax请求默认设置，如过期时间、跨域携带cookie
 * 4、统一处理响应信息
 */
import axios from 'axios'
import { Loading, Message } from 'element-ui'
import config from './../config/index'
/**
 *  自定义配置新建一个 axios 实例
 * @type {AxiosInstance}
 */
const service = axios.create({
  timeout: 25000, // 请求超时时间
  // withCredentials: true, // 跨域携带cookie
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
  baseURL: config.baseApi
})
/**
 * 核心函数，可通过它处理一切请求数据，并做横向扩展
 * @param {url} 请求地址
 * @param {params} 请求参数
 * @param {options} 请求配置，针对当前本次请求；
 * @param loading 是否显示loading
 * @param mock 本次是否请求mock而非线上
 * @param error 本次是否显示错误
 */
function request(url, params, options) {
  // 请求前loading,PC项目暂未使用
  let loading = ''
  if (options.loading) {
    loading = Loading.service({
      text: '加载中...',
      spinner: 'el-icon-loading',
      background: 'rgba(0, 0, 0, 0.5)'
    })
  }
  return new Promise((resolve, reject) => {
    let data = {}
    // get请求使用params字段
    if (options.method === 'get')data = { params }
    // post请求使用data字段
    if (options.method === 'post')data = { data: params }
    // 局部接口mock
    if ((options.mock || config.mock) && process.env.NODE_ENV !== 'production')service.defaults.baseURL = config.mockApi
    // 设置headers
    const headers = service.defaults.headers
    if (!headers.TOKEN)headers.TOKEN = 'Bear XXXX'
    // 错误提示文案
    const errMessage = '接口请求失败，请联系开发人员'
    service({
      url,
      method: options.method,
      ...data,
    }).then((res) => {
      // 网络请求码
      if (res.status === 200) {
        // 接口返回结构
        const result = res.data
        // {code,data,message}
        if (result.code === 0) {
          // 返回数据，不包含状态码
          resolve(result.data)
        } else if (result.code === 2) {
          // 接口返回数据异常
          Message.error({
            message: result.message || errMessage
          })
        } else {
          loading && loading.close()

          reject(new Error(result.message || errMessage))
        }
      } else {
        Message.error({
          message: errMessage
        })

        reject(res.statusText)
      }
    }).catch(() => {
      Message.error({
        message: '网络异常，请稍后重试'
      })
      reject(new Error('网络异常，请稍后重试'))
    })
      .finally(() => {
        loading && loading.close()
      })
  })
}
// 生成GET、POST函数
const OcRequest = {};
['get', 'post'].forEach(item => {
  OcRequest[item] = (url, params, options = { }) => {
    options.method = item
    options = Object.assign({ loading: true, mock: false, method: 'post'}, options)
    return request(url, params, options)
  }
})

export default OcRequest
