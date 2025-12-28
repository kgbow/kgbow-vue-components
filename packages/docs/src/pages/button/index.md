---
title: Button 按钮
description: 常用的操作按钮，支持多种状态和类型。
---

# Button 按钮

常用的操作按钮，支持多种状态和类型。

## 基础用法

使用 `type` 属性来定义按钮的样式类型。

<demo-block>
  <KgButton type="default">默认按钮</KgButton>
  <KgButton type="primary">主要按钮</KgButton>
  <KgButton type="success">成功按钮</KgButton>
  <KgButton type="warning">警告按钮</KgButton>
  <KgButton type="danger">危险按钮</KgButton>
</demo-block>

```vue
<KgButton type="default">默认按钮</KgButton>
<KgButton type="primary">主要按钮</KgButton>
<KgButton type="success">成功按钮</KgButton>
<KgButton type="warning">警告按钮</KgButton>
<KgButton type="danger">危险按钮</KgButton>
```

## 禁用状态

使用 `disabled` 属性来禁用按钮。

<demo-block>
  <KgButton type="primary" disabled>禁用按钮</KgButton>
  <KgButton type="default" disabled>禁用按钮</KgButton>
</demo-block>

```vue
<KgButton type="primary" disabled>禁用按钮</KgButton>
<KgButton type="default" disabled>禁用按钮</KgButton>
```

## API

### Props

| 属性名   | 说明     | 类型                                                           | 默认值      |
| -------- | -------- | -------------------------------------------------------------- | ----------- |
| type     | 按钮类型 | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'default'` | `'default'` |
| disabled | 是否禁用 | `boolean`                                                      | `false`     |
