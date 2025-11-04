# 电商运营系统 - 部署指南

## 系统概述

这是一个为30人团队设计的电商运营管理系统，支持本地服务器部署，帮助运营团队高效管理30家店铺和9万+商品。

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 5
- Ant Design 5
- ECharts 5
- SCSS模块化样式
- Zustand状态管理

### 后端
- FastAPI 0.100+
- PostgreSQL 15
- SQLAlchemy 2.0
- Alembic数据库迁移
- JWT认证
- Pandas数据处理

### 部署
- Docker + Docker Compose
- Nginx反向代理

## 功能模块

### ✅ 已完成功能

1. **用户认证系统**
   - JWT token认证
   - 登录/登出
   - 路由守卫
   - 默认管理员账号

2. **店铺管理**
   - 店铺CRUD操作
   - 店铺筛选
   - 管理员分配

3. **数据导入**
   - Excel/CSV文件上传
   - 仓库商品导入
   - 店铺商品导入
   - 库存数据导入
   - 销售数据导入
   - 导入历史记录
   - 错误提示

4. **商品管理**
   - 店铺商品列表
   - 批量上下架
   - 批量改价
   - 商品筛选（按店铺、状态）
   - 商品搜索
   - 单品编辑

5. **基础架构**
   - 响应式布局
   - 侧边栏导航
   - 面包屑导航
   - SCSS样式系统
   - 统一的API错误处理

### 📋 可扩展功能

- 操作日志系统
- 自定义工作表
- 数据看板（销售趋势、商品排行）
- 周报生成
- 数据导出
- 虚拟滚动优化

## 快速开始

### 前置条件

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (仅开发环境)
- Python 3.11+ (仅开发环境)

### 生产环境部署（推荐）

1. **克隆项目**
```bash
cd /home/w/Peos
```

2. **配置环境变量**
```bash
cp backend/.env.example backend/.env
# 编辑 .env 文件，修改数据库密码、JWT密钥等
vim backend/.env
```

3. **启动所有服务**
```bash
docker-compose up -d
```

4. **初始化数据库**
```bash
docker-compose exec backend python init_db.py
```

5. **访问系统**
```
http://localhost 或 http://your-server-ip
```

6. **默认账号**
```
用户名：admin
密码：admin123
```

### 开发环境

#### 后端开发

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env

# 启动数据库和Redis
docker-compose up -d postgres redis

# 初始化数据库
python init_db.py

# 启动开发服务器
uvicorn app.main:app --reload --port 8000
```

#### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## Docker服务说明

### 服务列表

- **postgres**: PostgreSQL 15数据库
- **redis**: Redis 7缓存
- **backend**: FastAPI后端服务（端口8000）
- **frontend**: React前端服务（端口80）
- **nginx**: 反向代理（端口8080，可选）

### 常用命令

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 停止所有服务
docker-compose stop

# 重启服务
docker-compose restart backend

# 停止并删除所有容器
docker-compose down

# 停止并删除所有容器和数据
docker-compose down -v
```

## 数据库迁移

如果修改了数据库模型，需要创建和应用迁移：

```bash
# 进入后端容器
docker-compose exec backend bash

# 创建迁移文件
alembic revision --autogenerate -m "描述变更"

# 应用迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

## 目录结构

```
Peos/
├── backend/                 # 后端代码
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 数据库模型
│   │   ├── schemas/        # Pydantic模式
│   │   ├── services/       # 业务逻辑
│   │   └── main.py         # 应用入口
│   ├── alembic/            # 数据库迁移
│   ├── requirements.txt    # Python依赖
│   ├── Dockerfile         # 后端镜像
│   └── init_db.py         # 数据库初始化
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/    # 通用组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API服务
│   │   ├── stores/        # 状态管理
│   │   ├── styles/        # SCSS样式
│   │   ├── types/         # TypeScript类型
│   │   └── utils/         # 工具函数
│   ├── package.json       # npm依赖
│   └── Dockerfile        # 前端镜像
├── docker-compose.yml     # Docker编排
├── nginx.conf            # Nginx配置
└── README.md            # 项目说明
```

## 数据导入说明

### 支持的数据类型

1. **仓库商品** (warehouse_products)
   - 必填列：sku, name
   - 可选列：category, cost_price, spec

2. **店铺商品** (shop_products)
   - 必填列：shop_id, sku, title, price
   - 可选列：product_url, status, stock

3. **库存数据** (inventory)
   - 必填列：sku, quantity
   - 可选列：warehouse_location

4. **销售数据** (sales)
   - 必填列：shop_id, shop_product_id, quantity, amount, sale_date
   - 可选列：order_id, profit

### 导入流程

1. 登录系统
2. 进入"数据导入"页面
3. 选择导入类型
4. 点击"查看模板"了解数据格式
5. 上传准备好的Excel或CSV文件
6. 点击"开始导入"
7. 查看导入结果和错误信息

## 性能优化建议

### 数据库优化

1. **添加索引**（已在模型中定义）
   - 商品SKU
   - 店铺ID
   - 销售日期
   - 用户名

2. **定期清理**
   - 旧的操作日志
   - 临时文件

3. **连接池配置**
   - 已配置pool_size=10
   - 可根据实际负载调整

### 前端优化

1. **表格虚拟滚动**（针对超大数据量）
   - 使用Ant Design Table的虚拟滚动
   - 分页加载

2. **图片懒加载**
   - 商品图片延迟加载

3. **代码分割**
   - 路由级别的懒加载（已实现）

## 安全建议

1. **修改默认密码**
   - 首次登录后立即修改admin密码

2. **配置强密钥**
   - 修改.env中的SECRET_KEY为随机字符串

3. **数据库密码**
   - 使用强密码
   - 定期更换

4. **HTTPS配置**
   - 生产环境使用SSL证书
   - 配置Nginx SSL

5. **防火墙设置**
   - 只开放必要端口
   - 限制数据库访问

## 备份策略

### 数据库备份

```bash
# 手动备份
docker-compose exec postgres pg_dump -U postgres ecommerce_ops > backup_$(date +%Y%m%d).sql

# 恢复备份
docker-compose exec -T postgres psql -U postgres ecommerce_ops < backup_20240101.sql
```

### 自动备份（建议）

创建定时任务（crontab）:
```bash
# 每天凌晨2点备份
0 2 * * * cd /home/w/Peos && docker-compose exec postgres pg_dump -U postgres ecommerce_ops > /backup/ecommerce_$(date +\%Y\%m\%d).sql
```

## 故障排查

### 常见问题

1. **无法连接数据库**
   - 检查PostgreSQL容器是否运行
   - 检查.env中的数据库配置

2. **前端无法访问后端API**
   - 检查CORS配置
   - 检查Nginx配置

3. **文件上传失败**
   - 检查uploads目录权限
   - 检查文件大小限制

4. **内存不足**
   - 调整Docker内存限制
   - 优化查询语句

## 技术支持

如有问题，请检查：
1. Docker日志：`docker-compose logs`
2. 数据库连接：`docker-compose exec postgres psql -U postgres`
3. 后端API文档：http://localhost:8000/docs

## 系统要求

### 最小配置
- CPU: 2核
- 内存: 4GB
- 硬盘: 20GB

### 推荐配置
- CPU: 4核+
- 内存: 8GB+
- 硬盘: 50GB+ SSD

## 许可证

本项目为公司内部使用，禁止外部传播。

