# 开发部署指南

## 开发环境配置

### 前置要求

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose（用于数据库和Redis）

### 快速开始（推荐）🚀

```bash
./start-dev.sh    # 启动前端、后端、数据库
./stop-dev.sh     # 停止所有开发服务
```

**脚本自动完成：**

- 依赖检查（Docker、Python、Node.js、npm）
- 启动 PostgreSQL、Redis 容器
- 准备 Python 虚拟环境并安装后端依赖
- 同步 `.env` 配置并初始化数据库（含默认管理员）
- 启动 FastAPI（端口 8000）和 Vite 前端（端口 3000）

**访问与日志：**

- 前端：http://localhost:3000
- 后端：http://localhost:8000
- API 文档：http://localhost:8000/docs
- 默认账号：`admin` / `admin123`
- 后端日志：`tail -f backend.log`
- 前端日志：`tail -f frontend.log`

**注意事项：**

- 确保宿主机未占用 `5432`、`6379` 端口。若系统自带 `redis-server` 正在运行，可执行 `sudo systemctl stop redis-server` 释放端口。
- 如需修改前后端端口，调整 `backend/.env` 与前端 `vite.config.ts` 后重启脚本。

---

### 手动启动（高级）

#### 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # 按需修改数据库/Redis配置
docker-compose up -d postgres redis
python init_db.py
uvicorn app.main:app --reload --port 8000
```

后端运行后，可访问 `http://localhost:8000`，接口文档位于 `http://localhost:8000/docs`。

#### 前端

```bash
cd frontend
npm install
cp .env.example .env          # 可选
npm run dev
```

访问 `http://localhost:3000` 查看前端页面。

#### 数据库迁移

```bash
# 创建迁移文件
alembic revision --autogenerate -m "描述变更内容"

# 应用迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

---

## 生产环境部署

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 服务器最低配置：2核4G内存

### 1. 快速部署

```bash
# 克隆或上传项目到服务器
cd /home/w/Peos

# 配置环境变量（重要！）
cp backend/.env.example backend/.env
vim backend/.env
# 修改以下配置：
# - POSTGRES_PASSWORD: 数据库密码（必须修改）
# - SECRET_KEY: JWT密钥（必须修改，使用长随机字符串）

# 启动所有服务
docker-compose up -d

# 初始化数据库
docker-compose exec backend python init_db.py
```

**访问**: http://your-server-ip  
**默认账号**: admin / admin123

### 2. 环境变量配置

编辑 `backend/.env`:

```bash
# 数据库配置（必须修改密码）
POSTGRES_SERVER=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here  # 修改为强密码
POSTGRES_DB=ecommerce_ops
POSTGRES_PORT=5432

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379

# JWT配置（必须修改密钥）
SECRET_KEY=your-secret-key-use-random-string-at-least-32-chars  # 修改为随机字符串
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# 文件上传配置
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE=104857600
```

### 3. Docker Compose 服务说明

```yaml
服务列表：
- postgres:15-alpine    # PostgreSQL数据库
- redis:7-alpine       # Redis缓存
- backend              # FastAPI后端
- frontend             # React前端
- nginx（可选）         # 反向代理
```

### 4. 端口映射

- **前端**: 80端口（http://localhost）
- **后端**: 8000端口（http://localhost:8000）
- **数据库**: 5432端口（仅内部访问）
- **Redis**: 6379端口（仅内部访问）

如需修改端口，编辑 `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 修改为其他端口
```

---

## 常用操作命令

### 服务管理

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart backend
docker-compose restart frontend

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 数据库操作

```bash
# 进入数据库
docker-compose exec postgres psql -U postgres ecommerce_ops

# 备份数据库
docker-compose exec postgres pg_dump -U postgres ecommerce_ops > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres ecommerce_ops < backup_20240101.sql

# 查看数据库大小
docker-compose exec postgres psql -U postgres -c "\l+"
```

### 容器操作

```bash
# 进入后端容器
docker-compose exec backend bash

# 进入前端容器
docker-compose exec frontend sh

# 查看容器资源使用
docker stats

# 清理无用镜像
docker system prune -a
```

---

## 更新升级

### 代码更新

```bash
# 拉取最新代码
git pull

# 重新构建镜像
docker-compose build

# 重启服务
docker-compose down
docker-compose up -d

# 应用数据库迁移
docker-compose exec backend alembic upgrade head
```

### 依赖更新

```bash
# 更新后端依赖
cd backend
pip install -r requirements.txt --upgrade

# 更新前端依赖
cd frontend
npm update

# 重新构建
docker-compose build
```
