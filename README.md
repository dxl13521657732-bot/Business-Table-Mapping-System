# 业务表映射系统

帮助数据开发人员快速查找业务系统模块对应的底层数据库表。

## 功能

- **快速搜索**：按业务系统、模块、数据库名、表名、描述等多字段实时过滤
- **手工维护**：支持新增、编辑、删除映射记录
- **Excel 批量导入**：上传 Excel 文件，预览校验后批量写入
- **数据持久化**：数据存储在 [Teable](https://teable.io) 多维表平台

## 快速开始

### 1. 访问应用

GitHub Pages 地址：`https://<your-username>.github.io/Business-Table-Mapping-System/`

### 2. 配置 Teable 连接

首次使用会弹出设置对话框，需要填写：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| Teable Base URL | Teable 服务地址（末尾加 `/api`）| `https://app.teable.io/api` |
| Table ID | 映射表的 ID，在表格 URL 中获取 | `tblXXXXXXXXXX` |
| API Token | 在 Teable 个人设置中生成 | `tqpXXXXXX...` |

> 配置保存在本地浏览器（localStorage），不会上传到服务器。

### 3. 在 Teable 中创建映射表

在 Teable 中新建表格，添加以下字段：

| 字段名 | 类型 |
|--------|------|
| 业务系统名称 | 单行文本（设为主字段）|
| 模块功能名称 | 单行文本 |
| 数据库名称 | 单行文本 |
| 底层表名 | 单行文本 |
| 数据层级 | 单选（选项：ODS、DWD、DWS、ADS、不确定）|
| 描述用途 | 长文本 |
| 负责人 | 单行文本 |
| 更新时间 | 日期 |

## Excel 导入格式

支持 `.xlsx` / `.xls` 文件，列名支持中英文：

| 中文列名 | 英文列名 |
|---------|---------|
| 业务系统 / 业务系统名称 | system |
| 模块 / 模块功能名称 | module |
| 数据库 / 数据库名称 | database / db |
| 底层表名 / 表名 | table_name / table |
| 数据层级 / 层级 | data_layer / layer |
| 描述 / 用途 / 备注 | description |
| 负责人 | owner |

> 导入前会显示预览，可检查校验错误（标红行）再确认导入。

## 本地开发

```bash
npm install
npm run dev
```

## 部署

推送到 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。

**前提条件**：在仓库 Settings → Pages 中将 Source 设置为 **GitHub Actions**。
