# Roadmap

## Data Source

1. 索引列表:
  - `bangumi-data` 包
  - bangumi calendar API
  - 手动提交索引
2. 周历:
  - yuc.wiki
  - 手动设置 bangumi id 关联
  - 手动提交 / 删除周历
3. 详情:
  - bangumi subject API
  - 手动修正数据
4. 详情关联:
  - bangumi relation API
  - 搜索 tmdb 数据, 推测匹配的关联
  - 手动修正关联

## Architecture

- Web 服务开放接口: 提供 API 接口
- CLI 应用: 定时任务脚本, 本地操作远端
- 数据持久化: 服务端数据库, 本地拉数据到 SQLite 操作后向远端同步
  - bangumis: bangumi 详情数据
  - tmdbs: tmdb 详情数据
  - revisions: 修订数据
  - logs: 执行和错误日志

目录结构:

- `packages/bgmc`: 连接 bangumi API 的 SDK
- `packages/bgmd`: 导出的静态动画 JSON 数据
- `packages/bgmt`: 共享的类型定义和工具函数
- `packages/tmdbc`: 连接 tmdb API 的 SDK
- `apps/bgmx`: CLI 应用
- `apps/bgmw`: Cloudflare Worker 服务
