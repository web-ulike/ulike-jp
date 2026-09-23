# 本地 PageSpeed API

在主题目录启动 Shopify 预览，然后把终端显示的本地地址传给 API：

```bash
shopify theme dev --store ulikebeauty-jp.myshopify.com --theme 126048305200 --nodelete
SHOPIFY_PREVIEW_URL=http://127.0.0.1:9292 npm run pagespeed:api
```

如果 Shopify CLI 使用其他端口，把 `SHOPIFY_PREVIEW_URL` 改成终端显示的地址。API 只监听本机 `127.0.0.1:4178`，一次执行一个 Lighthouse 审核。

```bash
curl 'http://127.0.0.1:4178/api/pagespeed?path=/&device=mobile'
curl 'http://127.0.0.1:4178/api/pagespeed?path=/cart&device=desktop'
curl 'http://127.0.0.1:4178/health'
```

返回性能分数、FCP、LCP、TBT、CLS、Speed Index、优化机会和运行警告。结果是本地 Lighthouse 实验室数据，与 Google PageSpeed Insights 的线上数据可能不同。
