# 製品一覧模块重构

当前分支：`新主题`。模块已接入 `templates/collection.json`，未推送主题。

## 页面拆分

| 页面模块 | Section / 后台预设 | 原模块 |
| --- | --- | --- |
| 首屏 Banner | `jp-collection-hero` / JP 製品一覧・バナー | `custom_banner_Dh9Pw6` |
| 推荐产品 | `jp-collection-recommended` | `multicolumn_HcXPHt` |
| 销售店限定产品 | `jp-collection-dealer-products` | `multicolumn_6P6VHg` |
| 配件 | `jp-collection-accessories` | 原禁用尾部模块；已替换为配件模块 |

后三块是三个独立 Section 类型和实例，可分别排序、删除和编辑。仅产品卡片抽出为 `snippets/jp-collection-card.liquid`，网格骨架抽出为 `snippets/jp-collection-grid.liquid`；样式与交互分别在 `assets/jp-collection.css`、`assets/jp-collection.js`。

## 编辑与图片

- Banner：PC/M 图片、可换行标题、两端标题距顶部百分比、文字颜色。建议上传不带标题的 1920×826 / 375×488 图片。未上传时仅显示标题。
- 产品组：标题、副标题、PC/M 上下留白、移动端初始产品数、查看更多文案、配件布局开关。
- 产品卡片：关联商品、PC/M 图片、产品名、标签、副标题、折叠摘要、展开正文、链接文案与地址。留空图片、名称、链接时回退到关联商品。
- 推荐与销售店预设保留当前集合模板中启用产品的图片、链接和说明；配件使用已有配件集合数据。没有修改现有实例的数据。
- PC 产品图片容器约 487×500，M 端同比例缩放；配件 M 端约 160×193。默认完整显示上传图片，不裁切。
- Figma 使用了新的场景图；目前预设沿用旧图，需在后台上传对应 PC/M 新图才能完成视觉还原。没有把 Figma 临时资产地址写入主题。

## 布局与交互

参考 PC 节点 `3547:10147`、详情节点 `3549:11005`、M 节点 `3554:11923`。

- PC 内容最大宽 1520px，三列、列间距30px、行间距80px；标题36px，产品名24px，正文14px。
- M 内容左右21px、单列，标题20px、产品名16px、说明10px；推荐先显示4个、销售店先显示2个。配件保留两列。
- 设计主要画板为1920px和375px；750px/1100px/1680px断点以及中间宽度的双列、字号调整为实现时推导值。
- 原生 `details/summary` 独立展开、收起，正文自然增高；未使用设计稿中的固定正文高度，以免不同商品文案被截断。
- 查看更多仅影响当前产品组；显示后把键盘焦点移到首个新增商品。JavaScript未加载时全部商品保持可见。
- 支持 Shopify 编辑器 Section 重载和隐藏 Block 选中时展开。
- Figma 的 Me 展开示例包含其他型号的参数；预设保留现有对应商品说明，未把示例参数覆盖到 Me。

## 已完成验证

- 四个独立 Section schema JSON 解析、JavaScript 语法检查、`git diff --check`。
- 使用实际 Liquid 通过 LiquidJS 渲染，并与现有 `theme.css` 一起做本机浏览器验证；商品与图片对象由现有模板数据模拟，不等同于 Shopify 服务端预览。
- 375 / 390 / 430 / 768 / 1440 / 1920px 无横向溢出；移动端初始可见数量为4/2/2，桌面为6/5/2。
- 推荐查看更多由4变6，销售店由2变5；详情展开显示完整正文。

## 接入步骤

已按上表替换 Banner、两组 multicolumn 和末尾禁用模块；现有产品 Block 数据保留在对应的新模块中。全站页头页脚没有改动。随后在 Shopify 后台检查图片选择、产品引用和 Section 重载效果。
