# 项目开发文档

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

### 数据库设计

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

### 0. 系统灵活配置功能 ✅ 

**功能描述**:
- 系统基本设置（系统名称、Logo、版权信息）
- 菜单管理（固定菜单，支持编辑名称和排序）
- 电商平台管理（新增、编辑、删除平台）
- 用户管理（完整的用户CRUD功能）
- 个人信息管理（头像上传、密码修改）

**实现方式**:
- **后端**: 
  - `SystemSetting`模型：存储系统配置（JSONB灵活配置）
  - `MenuItem`模型：动态菜单配置（支持多级菜单）
  - `Platform`模型：电商平台配置
  - `User`模型：用户管理（支持头像、邮箱、手机号）
- **前端**: 
  - 动态菜单加载（从API获取、权限过滤、图标动态渲染）
  - 系统设置页面（Tabs多标签：系统设置、菜单管理、平台管理、用户管理）
  - 完整的个人信息页面（编辑资料、修改密码、上传头像）
  - Logo上传功能

**API接口**:
- `GET/PUT /api/settings` - 系统设置管理
- `GET/PUT /api/menus/{id}` - 菜单编辑（名称、排序）
- `GET/POST/PUT/DELETE /api/platforms` - 平台管理
- `GET/POST/PUT/DELETE /api/users` - 用户管理
- `PUT /api/users/{id}/password` - 修改密码
- `PUT /api/users/{id}/avatar` - 上传头像

**数据库表**: 
- `system_settings` - 系统配置表
- `menu_items` - 菜单配置表（支持父子关系）
- `platforms` - 平台配置表
- `users` - 用户表（扩展字段：avatar, email, phone）

**优化点**:
- 菜单固定，仅支持编辑名称和排序（避免误操作）
- 支持动态添加和管理电商平台
- 完整的用户管理功能
- 管理员可通过个人信息页面管理自己的资料

---

### 1. 用户认证与权限系统 ✅

**功能描述**:
- JWT Token认证
- 用户登录/登出
- 前端路由守卫
- 完整的用户管理（CRUD操作）
- 个人信息管理（编辑资料、修改密码、上传头像）
- 头像上传
- 密码修改

**实现方式**:
- **后端**: FastAPI + python-jose (JWT) + passlib (BCrypt密码加密)
- **前端**: Zustand状态管理 + localStorage持久化
- **路由守卫**: PrivateRoute组件包裹需要认证的路由
- **个人中心**: 完整的个人信息页面（/profile）
- **API**: 
  - `POST /api/auth/login` - 用户登录
  - `GET /api/auth/me` - 获取当前用户信息
  - `GET /api/users` - 用户列表（支持搜索筛选）
  - `POST /api/users` - 创建用户
  - `GET /api/users/{id}` - 用户详情
  - `PUT /api/users/{id}` - 更新用户信息
  - `DELETE /api/users/{id}` - 删除用户
  - `PUT /api/users/{id}/password` - 修改密码
  - `PUT /api/users/{id}/avatar` - 上传头像

**数据库表**: `users` (扩展字段: avatar, email, phone)

---

### 2. 完整的布局系统与动态菜单 ✅

**功能描述**:
- 响应式主布局
- 动态加载侧边栏菜单（从API获取）
- 基于角色的权限控制
- 图标动态渲染
- 顶部导航栏（用户信息、设置、退出）
- 面包屑导航
- 统一的SCSS样式系统

**实现方式**:
- **组件**: Layout/Header/Sider/Breadcrumb
- **样式**: SCSS模块化（variables.scss + mixins.scss + global.scss）
- **UI库**: Ant Design Layout
- **路由**: React Router 6 嵌套路由
- **动态菜单**: 从 `/api/menus` 获取，支持多级菜单和权限控制

**关键文件**:
- `frontend/src/components/Layout/`
- `frontend/src/styles/`
- `frontend/src/services/menus.ts`

---

### 3. 店铺管理 ✅

**功能描述**:
- 店铺列表展示
- 创建/编辑/删除店铺
- 店铺筛选（按平台、状态）
- 分配管理员
- 支持多平台（淘宝、京东、拼多多、天猫、抖音、快手）
- **入口位置**：系统设置 → 店铺管理（标签页）

**实现方式**:
- **后端**: FastAPI + SQLAlchemy ORM + 操作日志记录
- **前端**: Ant Design Table + Modal表单（集成在系统设置页面）
- **API**:
  - `GET /api/shops` - 获取店铺列表（支持分页、筛选）
  - `POST /api/shops` - 创建店铺
  - `PUT /api/shops/{id}` - 更新店铺
  - `DELETE /api/shops/{id}` - 删除店铺

**数据库表**: `shops`

**数据模型**:
```python
- id: 主键
- name: 店铺名称
- platform: 平台
- account: 店铺账号
- manager_id: 管理员ID（外键关联users）
- status: 状态（active/inactive）
- created_at, updated_at
```

---

### 4. 数据导入系统 ✅

**功能描述**:
- 支持Excel (.xlsx, .xls) 和CSV文件
- 4种数据类型导入：
  1. 仓库商品
  2. 店铺商品
  3. 库存数据
  4. 销售数据
- 数据验证和错误提示
- 批量导入进度跟踪
- 导入历史记录

**实现方式**:
- **文件处理**: pandas + openpyxl
- **验证**: 逐行验证数据完整性
- **导入**: 批量插入/更新数据库
- **错误处理**: 记录每行错误信息
- **API**:
  - `POST /api/import/upload` - 上传并导入数据
  - `GET /api/import/history` - 获取导入历史
  - `GET /api/import/templates/{type}` - 查看导入模板

**数据库表**: `import_history`

**核心服务**: `ImportService` (backend/app/services/import_service.py)

**支持的数据格式**:

1. **仓库商品**:
   - 必填: sku, name
   - 可选: category, cost_price, spec

2. **店铺商品**:
   - 必填: shop_id, sku, title, price
   - 可选: product_url, status, stock

3. **库存数据**:
   - 必填: sku, quantity
   - 可选: warehouse_location

4. **销售数据**:
   - 必填: shop_id, shop_product_id, quantity, amount, sale_date
   - 可选: order_id, profit

---

### 5. 工作表系统 ✅

**功能描述**:
- 自定义工作表视图（基于店铺商品数据）
- 工作表管理（创建、编辑、删除、切换）
- 数据筛选（店铺、状态、关键词搜索）
- 批量操作：
  - 批量上架/下架
  - 批量改价
- 操作自动记录到操作日志
- 支持分页和大数据量展示

**实现方式**:
- **后端**: FastAPI + SQLAlchemy
- **前端**: Ant Design Table + 行选择 + 批量操作
- **API**:
  - `GET/POST/PUT/DELETE /api/worksheets` - 工作表CRUD
  - `POST /api/worksheets/data/query` - 查询工作表数据
  - `POST /api/products/shop/batch/status` - 批量更新状态
  - `POST /api/products/shop/batch/price` - 批量改价

**数据库表**: 
- `worksheets` - 工作表配置（用户级）
- `shop_products` - 店铺商品数据源
- `warehouse_products` - 仓库商品关联
- `shops` - 店铺信息关联

**核心特性**:
- 用户级工作表隔离
- 灵活的配置存储（JSONB）
- 支持自定义视图和筛选条件
- 所有操作自动生成日志

---

### 6. 操作日志系统 ✅

**功能描述**:
- 完整的操作记录追溯
- 多维度筛选（操作人、操作类型、操作表、时间范围）
- 操作详情查看（变更前后对比）
- 操作统计分析
- 支持日志导出

**实现方式**:
- **后端**: 
  - 操作日志装饰器（自动记录）
  - 手动日志记录函数
  - 多维度查询API
- **前端**: 
  - 日志列表（分页、筛选）
  - 详情弹窗（JSON对比展示）
- **API**:
  - `GET /api/logs` - 查询日志列表
  - `GET /api/logs/{id}` - 日志详情
  - `GET /api/logs/count` - 日志统计
  - `GET /api/logs/stats/summary` - 统计概览

**数据库表**: `operation_logs`

**记录内容**:
- 操作人、操作时间
- 操作类型（create/update/delete）
- 操作表名、记录ID
- 变更前后的数据（JSON格式）

**集成点**:
- 店铺管理（创建、更新、删除）
- 批量操作（上下架、改价）
- 其他关键业务操作

---

### 7. 数据看板 ✅ 

**功能描述**:
- 数据汇总展示（销售额、订单数、活跃店铺、客单价）
- 销售趋势图表（按日期维度）
- 商品销售排行（TOP 10）
- 多维度筛选（日期范围、平台、店铺）
- 数据实时查询与刷新

**实现方式**:
- **后端**: 
  - 数据聚合API：支持多维度查询（日期、店铺、平台）
  - 统计分析：销售趋势、销售排行、商品分析、店铺对比
- **前端**: 
  - 统计卡片展示（4个核心指标）
  - ECharts图表可视化（折线图、柱状图）
  - 筛选条件组件（日期选择器、下拉选择）

**API接口**:
- `GET /api/dashboard-data/summary` - 数据汇总
- `GET /api/dashboard-data/sales/trend` - 销售趋势
- `GET /api/dashboard-data/sales/ranking` - 销售排行
- `GET /api/dashboard-data/products/analysis` - 商品分析
- `GET /api/dashboard-data/shops/comparison` - 店铺对比

**数据源**:
- `sales` - 销售数据
- `shop_products` - 店铺商品
- `shops` - 店铺信息

**优化点**:
- 支持复杂的SQL聚合查询
- 灵活的时间范围筛选（默认最近7天）
- 支持多店铺、多平台对比
- 响应式布局适配

---

### 8. 平台数据管理 ✅

**功能描述**:
- 按平台维度组织数据管理
- 左侧平台列表（显示各平台店铺数量）
- 右侧标签页：店铺列表、数据导入
- 平台筛选与快速切换

**实现方式**:
- **页面**: `/platform-data`
- **布局**: 左右分栏（平台侧边栏 + 内容区）
- **店铺列表**: 展示当前平台下的所有店铺（表格形式）
- **数据导入**: 集成导入功能组件

**核心特性**:
- 平台级数据隔离与展示
- 实时统计平台店铺数量
- 支持平台间快速切换
- 复用现有导入功能

---

**项目状态**: ✅ 生产就绪  
**核心功能**: ✅ 已完成  
**管理功能**: ✅ 完善  
**用户体验**: ⭐⭐⭐⭐⭐  
**可扩展性**: ⭐⭐⭐⭐⭐  
**最后更新**: 2025-11-06

**最新更新**:
- ✅ 工作表系统完整实现（自定义视图、批量操作、数据筛选）
- ✅ 操作日志系统完整实现（操作追溯、变更对比、统计分析）
- ✅ 店铺管理整合到系统设置（简化菜单结构）
- ✅ 移除独立商品管理（功能整合到工作表系统）
- ✅ 菜单优化（数据看板、平台数据、工作表、操作日志、系统设置）
- ✅ 操作日志自动记录（店铺管理、批量操作）
- ✅ 数据看板简化版实现（统计展示、趋势图表、排行榜）
- ✅ 平台数据简化版实现（平台分组、店铺列表、数据导入）

---

