# 项目文档

## 技术架构

### 前端技术栈
```
React 18.2
├── TypeScript 5.2
├── Vite 5.0.8
├── Ant Design 5.12
├── ECharts 5.4.3
├── Zustand 4.4
├── Axios 1.6
├── React Router 6.20
├── dayjs 1.11
└── SCSS（模块化样式）
```

### 后端技术栈
```
FastAPI 0.108
├── Pydantic 2.5（数据验证）
├── SQLAlchemy 2.0.23（ORM）
├── Alembic 1.13.1（数据库迁移）
├── PostgreSQL 15
├── psycopg2-binary 2.9
├── JWT（python-jose + passlib）
├── Pandas 2.1.4（数据处理）
├── python-multipart 0.0.6（文件上传）
└── Uvicorn 0.25（ASGI服务器）
```
> 说明：任务队列暂未接入。

### 部署技术栈
```
Docker 20.10+
├── Docker Compose 2.0
├── Nginx
└── PostgreSQL容器
```

### API设计

RESTful架构，遵循标准HTTP方法和状态码。

核心接口分组（按功能模块）：

**基础功能**
1. 用户认证 (`/api/auth`, `/api/users`)
   - `POST /auth/login` 用户登录
   - `GET /auth/me` 当前用户信息
   - `POST /auth/users` 创建用户（管理员）
   - `GET/PUT/DELETE /users` 用户管理
   - `PUT /users/{id}/password` 修改密码
   - `PUT /users/{id}/avatar` 上传头像
   - `POST /users/batch/delete`、`PUT /users/batch/role` 批量操作

2. 系统配置 (`/api/settings`, `/api/menus`)
   - `GET /settings` 查询配置（支持分组与公开范围）
   - `GET/POST/PUT/DELETE /settings/{key}` 单项维护，`PUT /settings` 批量更新
   - `POST /settings/logo` 上传 Logo
   - `GET /menus` 可见菜单，`GET /menus/tree` 菜单树
   - `GET/POST/PUT/DELETE /menus/{id}` 菜单维护
   - `PUT /menus/sort/batch` 批量排序

**拓展功能**
3. 平台数据 (`/api/platforms`, `/api/shops`, `/api/data-tables`, `/api/data-table-data`)
   - 平台：`GET/POST/PUT/DELETE /platforms`，`GET /platforms/{id}/shops`
   - 店铺：`GET/POST/PUT/DELETE /shops`，`GET /shops/{id}`，`GET /shops/count/total`
   - 数据表：`GET /data-tables/tree`，`GET/POST/PUT/DELETE /data-tables`，`GET /data-tables/{id}`
   - 数据表数据：`GET /data-table-data/{id}/data`，`POST /data-table-data/{id}/data`，`DELETE /data-table-data/{id}/data/{data_id}`，`POST /data-table-data/query`
   - 状态：平台/店铺/数据表链路已贯通，`POST /data-table-data/query` 提供统一查询能力。

4. 工作表格（保留后端模型，前端暂未接入）
   - 相关 API 在下线过程中，暂不提供。

5. 数据看板（保留统计需求，接口暂时停用）
   - 原 `/api/dashboard-data` 系列接口暂无实现。

6. 操作日志 (`/api/logs`)
   - `GET /logs` 多条件列表
   - `GET /logs/{id}` 日志详情
   - `GET /logs/count` 总数
   - `GET /logs/stats/summary` 操作统计
   - 状态：日志查询完备；写入目前主要由店铺模块触发，其它模块需接入 `create_operation_log`。

技术特性：
- JWT Token认证（所有接口需登录）
- 权限分级（普通用户/管理员）
- 统一错误处理（HTTP标准状态码）
- 分页与多维度筛选
- Pydantic 数据验证
- 导入流程支持 append/overwrite、错误策略与字段自动解析

---

## 数据库设计

基础功能：

1. users - 用户表
   - id, username, password_hash, name, role
   - avatar, email, phone, permissions
   - created_at, updated_at

2. system_settings - 系统配置表
   - id, key, value, value_type, description, group_name, is_public
   - created_at, updated_at

3. menu_items - 菜单配置表
   - id, name, icon, path, parent_id, sort_order
   - is_visible, required_role, component
   - created_at, updated_at

拓展功能 · 平台数据：

4. platforms - 平台配置表
   - id, name, code, icon, is_active
   - import_template_config (JSONB)
   - created_at, updated_at

5. shops - 店铺表
   - id, name, platform_id（外键）
   - platform（兼容字段，用于保留旧数据）
   - account, manager_id, status
   - created_at, updated_at

6. data_tables - 自定义数据表
   - id, shop_id, name, table_type
   - description, fields (JSONB) - 字段配置列表
   - sort_order, is_active
   - created_at, updated_at
   - 字段配置格式：`[{name, type, required, description}, ...]`

7. table_data - 通用数据存储
   - id, data_table_id
   - data (JSONB) - 实际数据内容
   - created_at, updated_at
   - 说明：所有数据表的数据统一存储在此表，字段由 data_tables.fields 定义

拓展功能 · 工作表格：

8. worksheets - 工作表配置表（保留，未接入前端）
    - id, user_id, name, config_json
    - created_at, updated_at

拓展功能 · 数据看板：

9. [未启用] dashboard_data - 看板统计（后续可根据需求新增统计表或视图）
    - 当前依赖的数据表已移除，接口处于停用状态

拓展功能 · 操作日志：

10. operation_logs - 操作日志表
    - id, user_id, action_type, table_name, record_id
    - old_value (JSON), new_value (JSON)
    - created_at

数据库技术:
- PostgreSQL 15
- SQLAlchemy 2.0 ORM
- Alembic 数据库迁移
- 外键/索引覆盖（sku, username, sale_date, platform_id等）
- JSONB字段支持灵活配置存储

---

## 功能模块

### 用户认证
功能描述:
- JWT Token认证
- 用户登录/登出
- 前端路由守卫
- 个人信息管理（编辑资料、修改密码、上传头像）
- 用户批量管理（批量删除、批量变更角色）

---

### 系统布局
功能描述:
- 响应式主布局（Header + Sider + Content）
- 动态侧边栏菜单（从API获取，基于角色权限）
- 顶部导航栏（用户信息、个人信息、退出登录）
- 面包屑导航

---

### 系统配置
功能描述:
- 系统基本设置（系统名称、Logo、版权信息）
- 菜单管理（固定菜单，支持编辑名称和排序）
- 用户管理（完整的用户CRUD功能）
- 设置接口区分普通用户与管理员可见范围

---

### 平台数据
功能描述:
- 平台管理: 电商平台配置（新增、编辑、删除平台）
- 店铺管理: 店铺列表展示、创建/编辑/删除店铺、按平台和状态筛选、分配管理员
- 数据表管理: 自定义字段数据表配置（创建、编辑、删除数据表）
- 数据导入: Excel/CSV文件导入到指定数据表 已修复优化 - 支持字段类型验证和必填验证
  - 详细错误信息提示
  - 部分导入成功处理
- 树形结构展示（平台 -> 店铺 -> 数据表）
- `table_data` 通用存储，支持 append / overwrite、错误策略（skip/abort）
- 提供 `POST /data-table-data/query` 支持分页、筛选与排序；店铺实体统一走 `platform_id`，兼容输出 `platform_name`

核心特性:
- 三层树形结构（平台-店铺-数据表）
- 管理员可管理平台、店铺、数据表
- 用户可导入数据到数据表（支持 Excel/CSV）
- 完全自定义字段配置（无需预定义模板）
- 动态表格展示数据表内容
- 数据验证和详细错误提示
权限控制:
- 管理员: 可管理平台、店铺、数据表（增删改）
- 普通用户: 可查看和导入数据，不能管理结构

导入功能 全新策略配置：
- 导入模式选择：追加模式（默认）/ 覆盖模式（清空后导入）
- 错误处理策略：跳过错误（默认）/ 遇错中止（立即停止）
- 自动解析 Excel/CSV 文件字段
- 验证必填字段和数据类型
- 批量导入数据（支持万级数据）
- 显示详细错误信息（最多50条）
- 配置界面友好，说明清晰
- `POST /data-table-data/query` 支持复杂筛选、分页、排序

---

### 操作日志
功能描述:
- 完整的操作记录追溯
- 多维度筛选（操作人、操作类型、操作表、时间范围）
- 操作详情查看（变更前后对比）
- 记录内容: 操作人、操作时间、操作类型、操作表名、变更前后数据（JSON）
- 现状：日志查询可用，写入主要由店铺模块触发，其它场景可按需接入 `create_operation_log`

---

### 工作表格（暂未上线）
功能描述:
- 后端保留 `worksheets` 表结构以兼容历史数据，如需启用可扩展 CRUD 与前端页面

---

### 数据看板（暂未上线）
功能描述:
- 原 `/api/dashboard-data` 统计接口已下线，若需恢复仪表盘能力，可基于现有数据表重新设计统计接口

---
