window.UlikeCommon = window.UlikeCommon || {};

(function (namespace) {
    /**
     * 生成请求唯一标识 requestId
     *
     * 优先使用浏览器原生的 crypto.randomUUID，
     * 不支持时再使用自定义规则生成 GUID。
     *
     * @returns {string} 唯一标识字符串
     */
    function generateGUID() {
        // 优先使用浏览器原生能力，生成更标准的 UUID
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }

        // 生成 4 位十六进制随机字符串
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        // 按常见 GUID 格式进行拼接
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    /**
     * 通用 Ulike 接口请求方法
     *
     * 说明：
     * 1. 自动补充站点公共参数，如 siteCode、merchantCode、language、requestId
     * 2. 默认将相对路径拼接到 Ulike API 域名上
     * 3. 使用 jQuery.ajax 发起 POST 请求，并统一返回 Promise
     *
     * @param {string} url - 接口地址，支持相对路径或完整 http/https 地址
     * @param {Object} data - 请求参数对象
     * @returns {Promise<any>} - 返回接口请求结果
     */
    function sendUlikeApi(url, data) {
        // 复制一份入参，避免直接修改外部传入的 data 对象
        var payload = Object.assign({}, data || {});

        // 补充接口公共字段
        payload.siteCode = 'JP';
        payload.merchantCode = 'ULIKE';
        payload.language = window.Shopify && window.Shopify.locale ? window.Shopify.locale : 'ja';
        payload.requestId = generateGUID();

        // 如果传入的是相对路径，则自动补全接口域名
        var baseUrl = 'https://api.ulike.com';
        var requestUrl = /^https?:\/\//i.test(url) ? url : baseUrl + url;

        // jQuery.ajax 请求配置
        var settings = {
            url: requestUrl,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify(payload),
            xhrFields: {
                // 允许跨域请求时携带 cookie
                withCredentials: true,
            },
        };

        // 统一封装为 Promise，便于外部使用 then/catch 或 async/await
        return new Promise(function (resolve, reject) {
            // 某些页面如果未加载 jQuery，则直接抛出错误
            if (typeof $ === 'undefined' || typeof $.ajax !== 'function') {
                reject(new Error('jQuery.ajax is not available'));
                return;
            }

            $.ajax(settings)
                .done(function (response) {
                    // 请求成功，返回接口响应数据
                    resolve(response);
                })
                .fail(function (xhr, textStatus, errorThrown) {
                    // 请求失败时输出更完整的日志，便于排查问题
                    console.error('Error during API call:', {
                        url: requestUrl,
                        status: xhr && xhr.status,
                        statusText: xhr && xhr.statusText,
                        textStatus: textStatus,
                        error: errorThrown,
                        response: xhr && xhr.responseText,
                    });

                    // 统一返回失败对象
                    reject({
                        xhr: xhr,
                        textStatus: textStatus,
                        error: errorThrown,
                    });
                });
        });
    }

    /**
     * GTM / GA 事件上报通用方法
     *
     * @param {string} category - 事件名称
     * @param {string} operating - 事件操作字段
     * @param {string} label - 事件标签字段
     */
    function commonGtmEvent(category, operating, label) {
        // 通过 gtag 上报自定义事件
        gtag('event', category, {
            operating: operating,
            label: label,
        });
    }

    /**
     * 验证邮箱格式是否正确
     *
     * @param {string} email - 待验证的邮箱地址
     * @returns {boolean} true 表示邮箱格式正确，false 表示邮箱格式错误
     */
    function validateEmail(email) {
        // 基础邮箱格式校验规则
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // 返回校验结果
        return emailRegex.test(email);
    }

    namespace.generateGUID = generateGUID;
    namespace.sendUlikeApi = sendUlikeApi;
    namespace.commonGtmEvent = commonGtmEvent;
    namespace.validateEmail = validateEmail;


    
})(window.UlikeCommon);