# Shopify 主题同步交接

日期：2026-09-11  
本地项目：`ulike-jp`  
目标主题：`Focal_luke_新主题升级`（Theme ID：`143816491056`）  
正式主题：`Concept 1.3.1`（Theme ID：`127270748208`，live）

## 本次目标

将本地 `templates` 的内容同步到测试主题 `143816491056`；正式主题未做发布或直接修改。

## 已完成

- 已使用 `shopify theme push --theme 143816491056 --only "templates/*" --nodelete` 同步模板。
- 遇到模板引用的 section 缺失时，仅根据报错模板和其引用关系补传相应的 `sections/*.liquid`，没有整体同步 `sections` 目录。
- 已处理由目标主题 section schema 版本不一致造成的 block 错误，涉及：
  - `sections/main-cart.liquid`
  - `sections/image-with-text-overlay.liquid`
  - `sections/faq.liquid`
- 已处理模板中不符合 Shopify 富文本根节点要求的内容：
  - 多个产品模板的 disabled `vendor` block 改为 `<p>{{ product.vendor }}</p>`。
  - `templates/page.air10_lp.json` 中的早割文案改为以 `<p>` 作为根节点。
- 已补回 `sections/me-triple-guarantee-blue.liquid`：
  - 该文件从 Git 提交 `11e29b361b3b632286dde84c59c7f9422dec1062` 恢复。
  - 已与该历史版本核对一致。
  - 已连同 `templates/page.ulike-me.json` 上传。

## 最终校验结果

最后一个缺失引用 `me-triple-guarantee-blue` 已补齐并上传。目标主题上传成功，未发布为 live。

主题预览：

https://ulikejp.myshopify.com?preview_theme_id=143816491056

主题编辑器：

https://ulikejp.myshopify.com/admin/themes/143816491056/editor

## 后续建议

1. 在预览主题中重点检查 Ulike ME 页面、购物车、FAQ、首页旧模块及产品页的 vendor 文案。
2. 若要再次同步模板，优先使用：

   ```bash
   shopify theme push --theme 143816491056 --only "templates/*" --nodelete
   ```

3. 若报“分区类型不能引用现有分区文件”，先从报错模板的 `sections.*.type` 找到对应的本地 `sections/<type>.liquid`，只上传该文件；不要直接全量覆盖 `sections`。
4. 正式发布前，必须在 Shopify 后台手动确认预览无误，再执行发布操作；本次未执行发布。
