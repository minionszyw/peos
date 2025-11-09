# 项目文档

## 技术架构

### 前端技术栈
```
React 18.2
├── TypeScript 5.2
├── Vite 5.0
├── Ant Design 5.28 (实际安装版本)
├── ECharts 5.4 (图表)
├── Zustand 4.4 (状态管理)
├── Axios 1.6 (HTTP)
├── React Router 6.20
└── SCSS (样式)
```

### 后端技术栈
```
FastAPI 0.108
├── Pydantic 2.5 (数据验证)
├── SQLAlchemy 2.0.23 (ORM)
├── Alembic 1.13 (数据库迁移)
├── PostgreSQL 15
├── Redis 7 (Docker容器)
├── JWT (python-jose + passlib)
├── Pandas 2.1 (数据处理)
└── Uvicorn 0.25 (ASGI服务器)
```

### 部署技术栈
```
Docker 20.10+
├── Docker Compose 2.0
├── Nginx
└── PostgreSQL容器
```

### API设计

RESTful架构，遵循标准HTTP方法和状态码。

核心接口分组：

1. 认证模块 (`/api/auth`)
   - `POST /login` - 用户登录
   - `GET /me` - 获取当前用户信息

2. 用户管理 (`/api/users`)
   - `GET /users` - 用户列表（登录用户可访问）
   - `GET /users/{id}` - 用户详情
   - `POST /users` - 创建用户（仅管理员）
   - `PUT /users/{id}` - 更新用户
   - `DELETE /users/{id}` - 删除用户
   - `PUT /users/{id}/password` - 修改密码
   - `PUT /users/{id}/avatar` - 上传头像

3. 系统配置 (`/api/settings`, `/api/menus`, `/api/platforms`)
   - `GET/PUT /api/settings` - 系统设置
   - `GET /api/menus` - 菜单列表
   - `PUT /api/menus/{id}` - 编辑菜单
   - `GET/POST/PUT/DELETE /api/platforms` - 平台管理

4. 店铺管理 (`/api/shops`)
   - `GET /shops` - 店铺列表（支持平台、状态筛选）
   - `GET /shops/{id}` - 店铺详情
   - `POST /shops` - 创建店铺
   - `PUT /shops/{id}` - 更新店铺
   - `DELETE /shops/{id}` - 删除店铺
   - `GET /shops/count/total` - 店铺统计

5. 数据表管理 (`/api/data-tables`) 支持自定义字段
   - `GET /data-tables/tree` - 获取树形结构（包含完整字段配置）
   - `GET /data-tables` - 数据表列表
   - `GET /data-tables/{id}` - 数据表详情（包含 fields）
   - `POST /data-tables` - 创建数据表（需提供 fields 字段配置，仅管理员）
   - `PUT /data-tables/{id}` - 更新数据表（可更新字段配置，仅管理员）
   - `DELETE /data-tables/{id}` - 删除数据表（仅管理员）
   - 树形结构返回: 包含 fields、description、sort_order 等完整信息

6. 数据表数据 (`/api/data-table-data`) 基于 table_data 通用存储
   - `GET /data-table-data/{id}/data` - 获取数据表数据（返回 fields 和数据）
   - `POST /data-table-data/{id}/data` - 创建数据（添加记录）
   - `DELETE /data-table-data/{id}/data/{data_id}` - 删除数据

7. 数据导入 支持策略配置的智能导入
   - 新数据表系统 (`/api/data-tables/import-data`):
     - `POST /data-tables/import-data` - 导入数据到自定义字段数据表
       - 参数：`import_mode` (append/overwrite)
       - 参数：`error_strategy` (skip/abort)
     - `POST /data-tables/parse-excel` - 解析 Excel/CSV 文件并自动识别字段
     - 导入模式：追加（默认）/ 覆盖（清空后导入）
     - 错误策略：跳过错误（默认）/ 遇错中止
     - 支持字段类型验证（text/number/date/boolean）
     - 支持必填字段验证
     - 返回详细错误信息（最多50条）+ 导入策略信息
   - 旧数据表系统 (`/api/import`):
     - `POST /import/upload` - 导入到固定表格（warehouse_products, shop_products 等）
     - `GET /import/history` - 导入历史
     - `GET /import-templates/{type}` - 导入模板配置

8. 工作表格 (`/api/worksheets`)
   - `GET/POST/PUT/DELETE /worksheets` - 工作表CRUD
   - `POST /worksheets/data/query` - 查询工作表数据

9. 操作日志 (`/api/logs`)
   - `GET /logs` - 日志列表（多维度筛选）
   - `GET /logs/{id}` - 日志详情
   - `GET /logs/count` - 日志统计
   - `GET /logs/stats/summary` - 统计概览

10. 数据看板 (`/api/dashboard-data`)
    - `GET /dashboard-data/summary` - 数据汇总
    - `GET /dashboard-data/sales/trend` - 销售趋势
    - `GET /dashboard-data/sales/ranking` - 销售排行
    - `GET /dashboard-data/products/analysis` - 商品分析
    - `GET /dashboard-data/shops/comparison` - 店铺对比

技术特性：
- JWT Token认证（所有接口需登录）
- 权限分级（普通用户/管理员）
- 统一错误处理（HTTP标准状态码）
- 分页支持（skip/limit）
- 多维度筛选（查询参数）
- Pydantic数据验证

---

## 数据库设计

核心表结构:

1. users - 用户表
   - id, username, password_hash, name, role
   - avatar, email, phone, permissions
   - created_at, updated_at

2. shops - 店铺表
   - id, name, platform, platform_id, account, manager_id, status
   - created_at, updated_at

3. platforms - 平台配置表
   - id, name, code, icon, is_active
   - import_template_config (JSONB)
   - created_at, updated_at

4. system_settings - 系统配置表
   - id, key, value, config_json (JSONB), description
   - created_at, updated_at

5. menu_items - 菜单配置表
   - id, name, icon, path, parent_id, sort_order
   - is_visible, required_role
   - created_at, updated_at

7. data_tables - 数据表配置表 支持自定义字段
   - id, shop_id, name, table_type
   - description, fields (JSONB) - 字段配置列表
   - sort_order, is_active
   - created_at, updated_at
   - 字段配置格式：`[{name, type, required, description}, ...]`

7.5. table_data - 通用数据存储表
   - id, data_table_id
   - data (JSONB) - 实际数据内容
   - created_at, updated_at
   - 说明：所有数据表的数据统一存储在此表，字段由 data_tables.fields 定义

8. warehouse_products - 仓库商品表
   - id, sku, name, category, cost_price, spec
   - created_at, updated_at

9. shop_products - 店铺商品表
   - id, shop_id, warehouse_product_id, product_url
   - title, price, status, stock
   - created_at, updated_at

10. inventory - 库存表
   - id, warehouse_product_id, quantity, warehouse_location
   - updated_at

11. sales - 销售记录表
    - id, shop_id, shop_product_id, order_id
    - quantity, amount, profit, sale_date
    - created_at

12. operation_logs - 操作日志表
    - id, user_id, action_type, table_name, record_id
    - old_value (JSON), new_value (JSON)
    - created_at

13. worksheets - 工作表配置表
    - id, user_id, name, config_json
    - created_at, updated_at

14. dashboards - 看板配置表 保留但未使用
    - id, user_id, name, config_json
    - created_at, updated_at
    - 说明：表结构保留，但Dashboard页面直接使用dashboard-data接口，不使用配置管理功能

15. import_history - 导入记录表
    - id, user_id, file_name, table_type
    - status, total_rows, success_rows, error_message
    - created_at

数据库技术:
- PostgreSQL 15
- SQLAlchemy 2.0 ORM
- Alembic数据库迁移
- 外键关联保证数据完整性
- 索引优化（sku, username, sale_date, platform_id等）
- JSONB字段支持灵活配置存储

---

## 功能模块

### 用户认证
功能描述:
- JWT Token认证
- 用户登录/登出
- 前端路由守卫
- 个人信息管理（编辑资料、修改密码、上传头像）

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
- 支持多平台（淘宝、京东、拼多多、天猫、抖音、快手）

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

---

### 工作表格
功能描述:
- 自定义工作表视图（基于店铺商品数据）
- 工作表管理（创建、编辑、删除、切换）
- 数据筛选（店铺、状态、关键词搜索）
- 批量操作（批量上架/下架、批量改价）
- 操作自动记录到操作日志
- 用户级工作表隔离、灵活配置（JSONB）、自动生成操作日志

---

### 操作日志
功能描述:
- 完整的操作记录追溯
- 多维度筛选（操作人、操作类型、操作表、时间范围）
- 操作详情查看（变更前后对比）
- 操作统计分析
- 记录内容: 操作人、操作时间、操作类型、操作表名、变更前后数据（JSON）
- 集成点: 店铺管理、批量操作、关键业务操作

---

### 数据看板
功能描述:
- 数据汇总展示（销售额、订单数、活跃店铺、客单价）
- 销售趋势图表（按日期维度）
- 商品销售排行（TOP 10）
- 多维度筛选（日期范围、平台、店铺）
- SQL聚合查询、灵活时间范围筛选、多店铺/平台对比
