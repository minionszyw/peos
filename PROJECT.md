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

5. **数据导入** (`/api/import`)
   - `POST /import/upload` - 上传并导入数据
   - `GET /import/history` - 导入历史
   - `GET /import-templates/{type}` - 导入模板配置

6. **工作表** (`/api/worksheets`)
   - `GET/POST/PUT/DELETE /worksheets` - 工作表CRUD
   - `POST /worksheets/data/query` - 查询工作表数据

7. **操作日志** (`/api/logs`)
   - `GET /logs` - 日志列表（多维度筛选）
   - `GET /logs/{id}` - 日志详情
   - `GET /logs/count` - 日志统计
   - `GET /logs/stats/summary` - 统计概览

8. **数据看板** (`/api/dashboard-data`)
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

6. **import_templates** - 导入模板配置表 (新增)
   - id, table_type (唯一), field_mappings (JSONB)
   - validation_rules (JSONB), custom_fields (JSONB)
   - created_at, updated_at

7. **warehouse_products** - 仓库商品表
   - id, sku (唯一), name, category, cost_price, spec
   - created_at, updated_at

8. **shop_products** - 店铺商品表
   - id, shop_id, warehouse_product_id, product_url
   - title, price, status, stock
   - created_at, updated_at

9. **inventory** - 库存表
   - id, warehouse_product_id (唯一), quantity, warehouse_location
   - updated_at

10. **sales** - 销售记录表
    - id, shop_id, shop_product_id, order_id
    - quantity, amount, profit, sale_date
    - created_at

11. **operation_logs** - 操作日志表
    - id, user_id, action_type, table_name, record_id
    - old_value (JSON), new_value (JSON)
    - created_at

12. **worksheets** - 工作表配置表
    - id, user_id, name, config_json
    - created_at, updated_at

13. **dashboards** - 看板配置表
    - id, user_id, name, config_json
    - created_at, updated_at

14. **import_history** - 导入记录表
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
- **数据导入**: Excel/CSV文件导入（仓库商品、店铺商品、库存数据、销售数据）
- 按平台维度组织数据（左侧平台列表 + 右侧标签页切换）
- 支持多平台（淘宝、京东、拼多多、天猫、抖音、快手）

**实现方式**:
- **后端**: FastAPI + SQLAlchemy + pandas数据处理 + 操作日志记录
- **前端**: 左右分栏布局（平台侧边栏 + 内容区标签页）
- **API**: `/api/platforms`、`/api/shops`、`/api/import`

**数据库表**: `platforms`、`shops`、`import_history`、`warehouse_products`、`shop_products`、`inventory`、`sales`

**核心特性**:
- 平台级数据隔离与展示
- 实时统计平台店铺数量
- 数据验证和错误提示
- 批量导入进度跟踪
- 支持4种数据类型导入（仓库商品、店铺商品、库存、销售）

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
- ✅ API设计文档补充完成（8个核心接口分组）
- ✅ 功能模块重组（系统配置、用户认证、系统布局、平台数据、工作表格、操作日志、数据看板）
- ✅ 平台数据模块合并（整合平台管理、店铺管理、数据导入功能）
- ✅ 文档精简优化（保持简洁、突出核心功能）

---

