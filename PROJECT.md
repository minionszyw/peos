# 项目文档

## 最新更新（2025-11-07）

### 自定义字段功能 ✨
数据表现已支持完全自定义字段模式，无需预定义模板：

**核心功能**：
- **字段配置器**：管理员创建数据表时可自定义字段（名称、类型、必填、描述）
- **字段类型**：支持文本、数字、日期、布尔值四种类型
- **灵活存储**：使用 JSONB 字段存储数据，支持任意字段组合
- **动态渲染**：数据表自动根据字段配置生成列和表单

**数据库变更**：
- 新增 `table_data` 表（通用数据存储，使用 JSONB）
- 修改 `data_tables` 表（移除 `template_id`，新增 `fields` JSONB 字段）
- 迁移脚本：`1cb5d6703e9a_refactor_custom_fields.py`

**工作流程**：
1. 管理员创建数据表 → 配置字段（商品ID、标题、价格等）
2. 编辑数据表 → 树形结构包含完整字段配置，可直接编辑
3. 用户导入数据 → 根据字段配置验证和存储（待实现）
4. 查看数据 → 动态渲染字段列

**重要修复**：
- 树形结构 API 现已返回完整的 `fields`、`description`、`sort_order` 字段
- 编辑数据表时能正确显示已配置的自定义字段

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

**RESTful架构**，遵循标准HTTP方法和状态码。

**核心接口分组**：

1. **认证模块** (`/api/auth`)
   - `POST /login` - 用户登录
   - `GET /me` - 获取当前用户信息

2. **用户管理** (`/api/users`)
   - `GET /users` - 用户列表（登录用户可访问）
   - `GET /users/{id}` - 用户详情
   - `POST /users` - 创建用户（仅管理员）
   - `PUT /users/{id}` - 更新用户
   - `DELETE /users/{id}` - 删除用户
   - `PUT /users/{id}/password` - 修改密码
   - `PUT /users/{id}/avatar` - 上传头像

3. **系统配置** (`/api/settings`, `/api/menus`, `/api/platforms`)
   - `GET/PUT /api/settings` - 系统设置
   - `GET /api/menus` - 菜单列表
   - `PUT /api/menus/{id}` - 编辑菜单
   - `GET/POST/PUT/DELETE /api/platforms` - 平台管理

4. **店铺管理** (`/api/shops`)
   - `GET /shops` - 店铺列表（支持平台、状态筛选）
   - `GET /shops/{id}` - 店铺详情
   - `POST /shops` - 创建店铺
   - `PUT /shops/{id}` - 更新店铺
   - `DELETE /shops/{id}` - 删除店铺
   - `GET /shops/count/total` - 店铺统计

5. **数据表管理** (`/api/data-tables`) ✨ 支持自定义字段
   - `GET /data-tables/tree` - 获取树形结构（包含完整字段配置）
   - `GET /data-tables` - 数据表列表
   - `GET /data-tables/{id}` - 数据表详情（包含 fields）
   - `POST /data-tables` - 创建数据表（需提供 fields 字段配置，仅管理员）
   - `PUT /data-tables/{id}` - 更新数据表（可更新字段配置，仅管理员）
   - `DELETE /data-tables/{id}` - 删除数据表（仅管理员）
   - **树形结构返回**: 包含 fields、description、sort_order 等完整信息

6. **数据表数据** (`/api/data-table-data`) ✨ 基于 table_data 通用存储
   - `GET /data-table-data/{id}/data` - 获取数据表数据（返回 fields 和数据）
   - `POST /data-table-data/{id}/data` - 创建数据（添加记录）
   - `DELETE /data-table-data/{id}/data/{data_id}` - 删除数据

7. **数据导入** (`/api/import`)
   - `POST /import/upload` - 上传并导入数据（支持按数据表导入）
   - `GET /import/history` - 导入历史
   - `GET /import-templates/{type}` - 导入模板配置

8. **工作表** (`/api/worksheets`)
   - `GET/POST/PUT/DELETE /worksheets` - 工作表CRUD
   - `POST /worksheets/data/query` - 查询工作表数据

9. **操作日志** (`/api/logs`)
   - `GET /logs` - 日志列表（多维度筛选）
   - `GET /logs/{id}` - 日志详情
   - `GET /logs/count` - 日志统计
   - `GET /logs/stats/summary` - 统计概览

10. **数据看板** (`/api/dashboard-data`)
    - `GET /dashboard-data/summary` - 数据汇总
    - `GET /dashboard-data/sales/trend` - 销售趋势
    - `GET /dashboard-data/sales/ranking` - 销售排行
    - `GET /dashboard-data/products/analysis` - 商品分析
    - `GET /dashboard-data/shops/comparison` - 店铺对比

**技术特性**：
- JWT Token认证（所有接口需登录）
- 权限分级（普通用户/管理员）
- 统一错误处理（HTTP标准状态码）
- 分页支持（skip/limit）
- 多维度筛选（查询参数）
- Pydantic数据验证

---

## 数据库设计

**核心表结构**:

1. **users** - 用户表
   - id, username, password_hash, name, role
   - avatar, email, phone, permissions (新增)
   - created_at, updated_at

2. **shops** - 店铺表
   - id, name, platform, platform_id (新增), account, manager_id, status
   - created_at, updated_at

3. **platforms** - 平台配置表 (新增)
   - id, name, code, icon, is_active
   - import_template_config (JSONB)
   - created_at, updated_at

4. **system_settings** - 系统配置表 (新增)
   - id, key (唯一), value, config_json (JSONB), description
   - created_at, updated_at

5. **menu_items** - 菜单配置表 (新增)
   - id, name, icon, path, parent_id, sort_order
   - is_visible, required_role
   - created_at, updated_at

7. **data_tables** - 数据表配置表 ✨ 支持自定义字段
   - id, shop_id (外键), name, table_type（分类）
   - description, **fields (JSONB)** - 字段配置列表
   - sort_order, is_active
   - created_at, updated_at
   - **字段配置格式**：`[{name, type, required, description}, ...]`

7.5. **table_data** - 通用数据存储表 ✨ 新增
   - id, data_table_id (外键)
   - **data (JSONB)** - 实际数据内容
   - created_at, updated_at
   - **说明**：所有数据表的数据统一存储在此表，字段由 data_tables.fields 定义

8. **warehouse_products** - 仓库商品表
   - id, sku (唯一), name, category, cost_price, spec
   - created_at, updated_at

9. **shop_products** - 店铺商品表
   - id, shop_id, warehouse_product_id, product_url
   - title, price, status, stock
   - created_at, updated_at

10. **inventory** - 库存表
   - id, warehouse_product_id (唯一), quantity, warehouse_location
   - updated_at

11. **sales** - 销售记录表
    - id, shop_id, shop_product_id, order_id
    - quantity, amount, profit, sale_date
    - created_at

12. **operation_logs** - 操作日志表
    - id, user_id, action_type, table_name, record_id
    - old_value (JSON), new_value (JSON)
    - created_at

13. **worksheets** - 工作表配置表
    - id, user_id, name, config_json
    - created_at, updated_at

14. **dashboards** - 看板配置表 ⚠️ 保留但未使用
    - id, user_id, name, config_json
    - created_at, updated_at
    - **说明**：表结构保留，但Dashboard页面直接使用dashboard-data接口，不使用配置管理功能

15. **import_history** - 导入记录表
    - id, user_id, file_name, table_type
    - status, total_rows, success_rows, error_message
    - created_at

**数据库技术**:
- PostgreSQL 15
- SQLAlchemy 2.0 ORM
- Alembic数据库迁移
- 外键关联保证数据完整性
- 索引优化（sku, username, sale_date, platform_id等）
- JSONB字段支持灵活配置存储

---

## 项目需求

### 业务背景

**公司规模**：
- 运营团队：30名运营人员
- 店铺数量：30家电商店铺
- 商品规模：每店铺约3000+商品链接，总计约90,000个商品

**现状问题**：
- 当前使用WPS/Excel管理数据，已无法满足精细化运营需求
- 数据统计和跟进耗费大量时间
- 缺乏系统化的操作记录和数据分析能力

### 核心痛点

#### 痛点1：运营优化追踪困难

**场景**：老板询问运营"昨天优化了多少个商品？做了哪些动作？优化有没有效果？"

**问题**：
- 无法快速统计每日优化的商品数量
- 操作记录分散，无法系统化追溯
- 效果数据需要手动对比分析，耗时且易出错

#### 痛点2：周报数据统计耗时巨大

**场景**：老板要求提供周报数据

**需要的数据**：
- 本周销售额、毛利率、客单价
- 对比上周数据（上涨/下降）
- 销售趋势分析
- 商品排行榜变化（哪些商品上涨、哪些下降）
- 单品优化记录（上涨/下降是做了什么优化）
- 推广花费统计
- 下周计划制定

**问题**：
- 数据分散在多个Excel表格中
- 需要手动汇总、计算、对比
- 统计一份周报可能需要半天甚至一天时间

### 解决方案

#### 1. 数据导入系统

**功能**：
- 支持手动上传Excel表格（前期）
- 支持的数据类型：
  - 仓库商品表
  - 库存表
  - 店铺商品表
  - 店铺销售表
- 预留API接口（后期自动同步数据）

**价值**：
- 统一数据源，避免数据分散
- 减少手动维护工作量
- 为后续功能提供数据基础

#### 2. 工作表和操作记录

**功能**：
- 用系统数据构建工作表视图
- 在系统上执行操作：
  - 商品上架/下架
  - 批量改价
  - 其他运营操作
- 自动生成操作日志：
  - 记录操作人
  - 记录操作时间
  - 记录操作内容（改了什么）
  - 记录变更前后的数据

**价值**：
- 所有操作可追溯
- 快速回答"昨天做了什么优化"
- 为效果分析提供操作依据

#### 3. 数据看板

**功能**：
- 销售额趋势图（日/周/月）
- 销售完成率
- 毛利率分析
- 客单价统计
- 商品排行榜
- 环比/同比分析

**价值**：
- 可视化数据，一目了然
- 自动生成周报所需数据
- 减少手动统计时间
- 支持实时决策

### 系统要求

#### 性能要求
- **并发用户**：支持30人同时在线使用
- **数据规模**：支持90,000+商品数据
- **响应速度**：页面加载 < 2秒，操作响应 < 1秒

#### 部署要求
- **部署方式**：本地服务器部署
- **数据安全**：公司数据不外泄，完全内网使用
- **稳定性**：7×24小时稳定运行

#### 用户体验要求
- **使用简单**：界面直观，运营人员无需培训即可上手
- **页面简洁**：去除冗余功能，聚焦核心业务
- **响应式设计**：适配不同屏幕尺寸

#### 技术要求
- **可扩展性**：架构灵活，便于后期功能开发
- **成熟框架**：优先使用成熟的框架和模块，确保系统稳定、减少bug
- **样式管理**：使用SCSS样式管理系统，确保风格统一
- **代码质量**：代码结构清晰，易于维护

### 预期收益

#### 效率提升
- **数据统计时间**：从半天缩短至5分钟
- **周报生成**：从手动制作到一键导出
- **操作追溯**：从无法统计到秒级查询

#### 管理提升
- **数据透明**：所有操作和数据可追溯
- **决策支持**：实时数据支持快速决策
- **绩效考核**：基于操作日志的客观考核

#### 成本节约
- **人力成本**：减少数据统计和报表制作的时间投入
- **试错成本**：通过数据分析减少决策失误
- **培训成本**：系统简单易用，新人快速上手

---

## 功能模块

### 系统配置 ✅ 

**功能描述**:
- 系统基本设置（系统名称、Logo、版权信息）
- 菜单管理（固定菜单，支持编辑名称和排序）
- 用户管理（完整的用户CRUD功能）
- 个人信息管理（头像上传、密码修改）

**实现方式**:
- **后端**: `SystemSetting`、`MenuItem`、`User`模型
- **前端**: 系统设置页面（多标签：系统设置、菜单管理、用户管理）
- **API**: `/api/settings`、`/api/menus`、`/api/users`

**数据库表**: `system_settings`、`menu_items`、`users`

---

### 用户认证 ✅

**功能描述**:
- JWT Token认证
- 用户登录/登出
- 前端路由守卫
- 个人信息管理（编辑资料、修改密码、上传头像）

**实现方式**:
- **后端**: FastAPI + JWT (python-jose) + BCrypt密码加密
- **前端**: Zustand状态管理 + localStorage持久化 + 路由守卫
- **API**: `/api/auth/login`、`/api/auth/me`

**数据库表**: `users`

---

### 系统布局 ✅

**功能描述**:
- 响应式主布局（Header + Sider + Content）
- 动态侧边栏菜单（从API获取，基于角色权限）
- 顶部导航栏（用户信息、设置、退出）
- 面包屑导航

**实现方式**:
- **前端**: Ant Design Layout + React Router 6
- **样式**: SCSS模块化（全局变量、混入）
- **API**: `/api/menus`

**关键组件**: `Layout/`、`Header/`、`Sider/`、`Breadcrumb/`

---

### 平台数据 ✅

**功能描述**:
- **平台管理**: 电商平台配置（新增、编辑、删除平台）
- **店铺管理**: 店铺列表展示、创建/编辑/删除店铺、按平台和状态筛选、分配管理员
- **数据表管理**: 自定义数据表配置（基于模板创建、管理数据表）
- **数据导入**: Excel/CSV文件导入到指定数据表
- 树形结构展示（平台 -> 店铺 -> 数据表）
- 支持多平台（淘宝、京东、拼多多、天猫、抖音、快手）

**实现方式**:
- **后端**: FastAPI + SQLAlchemy + pandas数据处理 + 操作日志记录
- **前端**: 左右分栏布局（树形结构 + 数据表格展示）
- **API**: `/api/platforms`、`/api/shops`、`/api/data-tables`、`/api/data-table-data`、`/api/import`

**数据库表**: `platforms`、`shops`、`data_tables`、`table_data`、`import_history`、`warehouse_products`、`shop_products`、`inventory`、`sales`

**核心特性**:
- 三层树形结构（平台-店铺-数据表）
- 管理员可管理平台、店铺、数据表
- 用户可导入数据到数据表
- 基于模板的灵活数据表配置
- 动态表格展示数据表内容
- 数据验证和错误提示

**权限控制**:
- **管理员**: 可管理平台、店铺、数据表（增删改）
- **普通用户**: 可查看和导入数据，不能管理结构

---

### 工作表格 ✅

**功能描述**:
- 自定义工作表视图（基于店铺商品数据）
- 工作表管理（创建、编辑、删除、切换）
- 数据筛选（店铺、状态、关键词搜索）
- 批量操作（批量上架/下架、批量改价）
- 操作自动记录到操作日志

**实现方式**:
- **后端**: FastAPI + SQLAlchemy
- **前端**: Ant Design Table + 行选择 + 批量操作
- **API**: `/api/worksheets`

**数据库表**: `worksheets`、`shop_products`、`warehouse_products`、`shops`

**核心特性**: 用户级工作表隔离、灵活配置（JSONB）、自动生成操作日志

---

### 操作日志 ✅

**功能描述**:
- 完整的操作记录追溯
- 多维度筛选（操作人、操作类型、操作表、时间范围）
- 操作详情查看（变更前后对比）
- 操作统计分析

**实现方式**:
- **后端**: 操作日志装饰器（自动记录）+ 多维度查询API
- **前端**: 日志列表（分页、筛选）+ 详情弹窗（JSON对比展示）
- **API**: `/api/logs`

**数据库表**: `operation_logs`

**记录内容**: 操作人、操作时间、操作类型、操作表名、变更前后数据（JSON）

**集成点**: 店铺管理、批量操作、关键业务操作

---

### 数据看板 ✅ 

**功能描述**:
- 数据汇总展示（销售额、订单数、活跃店铺、客单价）
- 销售趋势图表（按日期维度）
- 商品销售排行（TOP 10）
- 多维度筛选（日期范围、平台、店铺）

**实现方式**:
- **后端**: 数据聚合API（支持多维度查询）
- **前端**: 统计卡片 + ECharts图表可视化（折线图、柱状图）
- **API**: `/api/dashboard-data`

**数据源**: `sales`、`shop_products`、`shops`

**核心特性**: SQL聚合查询、灵活时间范围筛选、多店铺/平台对比

---

**项目状态**: ✅ 生产就绪  
**核心功能**: ✅ 已完成  
**最后更新**: 2025-11-07

**最新更新**:
- ✅ 平台数据模块重构（树形结构：平台-店铺-数据表）
- ✅ 新增数据表管理（基于模板的灵活配置）
- ✅ 优化数据导入（支持按数据表导入）
- ✅ 权限控制（管理员管理结构，用户导入数据）
- ✅ API接口扩展（新增data_tables、data_table_data接口组）
- ✅ 数据库设计更新（新增data_tables表）

---

