/*
 * 基于Promise封装一个ajax库
 *   + 参考axios的语法
 *   + XMLHttpRequest
 * 
 * 基于语法：
 * ajax([config])
 * ajax.get/head/options/delete([url],[config])
 * ajax.post/put([url],[data],[config])
 * 
 * 二次配置：
 *   + 默认配置项
 *   + ajax.defaults.xxx 修改默认配置项
 *   + ajax([config]) 自己传递的配置项
 * 
 * {
 *    baseURL:'',
 *    url:'',
 *    method:'get',
 *    transformRequest:function(data){return data;},  请求主体传递信息的格式化
 *    headers:{
 *       'Content-Type':'application/json'
 *    },
 *    params:{},  URL传参数信息（拼接到URL的末尾）
 *    cache:true, GET系列请求中是否清除缓存（?_=随机数）
 *    data:{}, 请求主体传参信息
 *    timeout:0, 设置请求超时时间
 *    withCredentials:false, 跨域请求中允许携带资源凭证
 *    responseType:'json',  预设服务器返回结果的处理方案 'stream', 'document', 'json', 'text'
 *    validateStatus: function (status) {
 *       return status >= 200 && status < 300; // default
 *    }
 * }
 * 
 * 拦截器：
 *   + 请求拦截器  ajax.interceptors.request(function(config){})
 *   + 响应拦截器  ajax.interceptors.response(function(response){},function(reason){})
 *   + ajax.all([promise array])
 * 
 * 基于ajax请求回来的结果都是promise实例
 *   + response
 *     + data  响应主体信息
 *     + status 状态码
 *     + statusText 状态码的描述
 *     + headers 响应头信息
 *     + request XHR原生对象
 *   + reason
 *     + response
 *     + message
 *     + ...
 */
(function () {
    // 核心库的封装
    function ajax(config = {}) {
        return new init(config);
    }
    ajax.prototype = {
        constructor: ajax,
        version: '0.0.1',
        // 发送ajax请求
        send() {
            let {
                method,
                timeout,
                withCredentials,
                headers,
                validateStatus,
                adapter2
            } = this.config;

            return new Promise((resolve, reject) => {
                let xhr = new XMLHttpRequest;
                xhr.open(method, this.initURL());

                // 基础配置
                xhr.timeout = timeout;
                xhr.withCredentials = withCredentials;
                Object.keys(headers).forEach(key => {
                    xhr.setRequestHeader(key, headers[key]);
                });

                xhr.onreadystatechange = () => {
                    let status = xhr.status,
                        state = xhr.readyState;
                    if (!validateStatus(status)) {
                        // 状态码代表失败(有请求结果)
                        reject(this.initResult(false, xhr));
                        return;
                    }
                    // 成功
                    if (state === 4) {
                        resolve(this.initResult(true, xhr));
                    }
                };

                xhr.onerror = err => {
                    // 请求都是失败的
                    reject({
                        message: err.message
                    });
                };

                xhr.send(this.initData());

            }).then(
                // 响应拦截器：在返回的promise实例和自己调用then中拦截一道
                ...adapter2
            );
        },
        // 初始化URL
        initURL() {
            let {
                url,
                baseURL,
                params,
                cache
            } = this.config;
            url = baseURL + url;
            // 问号参数
            params = ajax.stringify(params);
            if (params) {
                url += `${url.includes('?')?'&':'?'}${params}`;
            }
            // 缓存处理
            if (!cache) {
                url += `${url.includes('?')?'&':'?'}_=${+new Date()}`;
            }
            return url;
        },
        // 请求主体信息处理 (只对POST有效)
        initData() {
            let {
                method,
                data,
                transformRequest
            } = this.config;
            if (this.GET_REG.test(method)) return null;
            return transformRequest(data);
        },
        // 构建成功失败的返回结果
        getHeaders(xhr) {
            let headersText = xhr.getAllResponseHeaders(),
                obj = {};
            headersText = headersText.split(/(?:\n)/g);
            headersText.forEach(item => {
                if (!item) return;
                let [key, value] = item.split(': ');
                obj[key] = value;
            });
            return obj;
        },
        initResult(flag, xhr) {
            let {
                responseType
            } = this.config;

            let response = {
                data: {},
                request: xhr,
                status: xhr.status,
                statusText: xhr.statusText,
                headers: this.getHeaders(xhr)
            };

            if (flag) {
                // 成功
                let res = xhr.responseText;
                switch (responseType.toLowerCase()) {
                    case 'json':
                        res = JSON.parse(res);
                        break;
                    case 'document':
                        res = xhr.responseXML;
                        break;
                    case 'stream':
                        res = xhr.response;
                        break;
                }
                response.data = res;
                return response;
            }

            // 失败
            return {
                response,
                message: xhr.statusText
            };
        }
    };

    function init(config) {
        // 自己传递的配置项替换默认配置项
        Object.keys(config).forEach(key => {
            ajax.defaults[key] = config[key];
        });

        // 请求拦截器：处理config
        defaults = defaults.adapter1[0](defaults);

        // 把配置项挂在到实例上
        this.config = defaults;
        this.GET_REG = /^(GET|HEAD|DELETE|OPTIONS)$/i;

        // 发送请求，但是最后返回的是一个promise实例
        return this.send();
    }
    init.prototype = ajax.prototype;

    // 默认配置项（基于Proxy劫持数据，控制只允许ajax.defaults.xxx=xxx来修改配置项）
    let defaultsType = {
        baseURL: 'string',
        url: 'string',
        method: 'string',
        params: 'object',
        cache: 'boolean',
        data: 'object',
        timeout: 'number',
        withCredentials: 'boolean',
        responseType: 'string',
        headers: 'object',
        transformRequest: 'function',
        validateStatus: 'function',
        adapter1: "array",
        adapter2: "array"
    };
    let defaults = {
        baseURL: '',
        url: '',
        method: 'get',
        params: {},
        cache: true,
        data: {},
        timeout: 0,
        withCredentials: false,
        responseType: 'json',
        headers: {
            'Content-Type': 'application/json'
        },
        transformRequest: data => JSON.stringify(data),
        validateStatus: status => status >= 200 && status < 300,
        // 拦截器参数 请求/响应
        adapter1: [function (config) {
            return config;
        }],
        adapter2: [function (response) {
            return Promise.resolve(response);
        }, function (reason) {
            return Promise.reject(reason);
        }]
    };
    ajax.defaults = new Proxy(defaults, {
        set(obj, prop, value) {
            // 拦截器不走这个配置
            if (prop === 'adapter1' || prop === "adapter2") {
                return;
            }
            // 格式是否合法的处理
            let defT = defaultsType[prop] || "string",
                valT = value === null ? 'null' : typeof value;
            if (defT !== valT) {
                throw new TypeError(`传参格式错误：${prop}参数的格式必须是${defT}！`);
            }
            // 和之前的HEADERS信息合并后再处理
            if (prop === 'headers') {
                value = Object.assign(defaults.headers, value);
            }
            obj[prop] = value;
        }
    });

    // 拦截器的处理
    ajax.interceptors = {
        request(callback) {
            if (typeof callback !== "function") {
                throw new TypeError(`传参格式错误：实参的格式必须是函数！`);
            }
            defaults.adapter1 = [callback];
        },
        response(success, error) {
            // null和undefined不管，其余的处理
            if (success != undefined) {
                if (typeof success !== "function") {
                    throw new TypeError(`传参格式错误：实参的格式必须是函数！`);
                }
                defaults.adapter2[0] = success;
            }
            if (error != undefined) {
                if (typeof error !== "function") {
                    throw new TypeError(`传参格式错误：实参的格式必须是函数！`);
                }
                defaults.adapter2[1] = error;
            }
        }
    };

    // 快捷调用的办法（最后本质回归总方法ajax，只不过提前知道了一些配置项而已）
    ['get', 'head', 'delete', 'options'].forEach(name => {
        ajax[name] = function (url, config = {}) {
            config = {
                url,
                method: name,
                ...config
            };
            return ajax(config);
        };
    });
    ['post', 'put'].forEach(name => {
        ajax[name] = function (url, data = {}, config = {}) {
            config = {
                url,
                method: name,
                data,
                ...config
            };
            return ajax(config);
        };
    });
    ajax['all'] = function (arr = []) {
        return Promise.all(arr);
    };
    ajax['stringify'] = function (obj) {
        // 把一个对象变为 x-www-form-urlencoded 格式
        let str = ``;
        Object.keys(obj).forEach(key => {
            str += `&${key}=${obj[key]}`;
        });
        return str.substring(1);
    };

    // 暴露API
    typeof window !== "undefined" ? window.ajax = ajax : null;
    typeof module !== "undefined" && typeof module.exports !== "undefined" ?
        module.exports = ajax :
        null;
})();