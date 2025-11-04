# 开发部署指南

> 详细记录开发环境配置和生产环境部署步骤

---

## 一、开发环境配置

### 前置要求

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose（用于数据库和Redis）

### 快速开始（推荐）🚀

**使用一键启动脚本，自动完成所有配置和启动步骤：**

```bash
# 一键启动所有开发服务（前端、后端、数据库）
./start-dev.sh

# 一键停止所有开发服务
./stop-dev.sh
```

**脚本功能：**

`start-dev.sh` 会自动执行以下操作：
- ✓ 检查系统依赖（Docker、Python、Node.js等）
- ✓ 启动 PostgreSQL 和 Redis 容器
- ✓ 创建并配置 Python 虚拟环境
- ✓ 安装后端依赖（包括版本兼容性修复）
- ✓ 配置环境变量（自动适配本地开发环境）
- ✓ 初始化数据库和创建管理员账户
- ✓ 启动后端开发服务器（端口 8000）
- ✓ 安装前端依赖
- ✓ 启动前端开发服务器（端口 3000）

`stop-dev.sh` 会停止所有服务：
- ✓ 停止前端服务（释放端口 3000）
- ✓ 停止后端服务（释放端口 8000）
- ✓ 停止 PostgreSQL 和 Redis 容器

**启动后访问：**
- 前端应用：http://localhost:3000
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs
- 默认账号：`admin` / `admin123`

**日志查看：**
```bash
# 查看后端日志
tail -f backend.log

# 查看前端日志
tail -f frontend.log
```

---

### 手动启动（高级）

如果需要单独启动某个服务，可以参考以下步骤：

### 1. 后端开发环境

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Linux/Mac:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改数据库配置等

# 启动数据库和Redis（使用Docker）
docker-compose up -d postgres redis

# 初始化数据库
python init_db.py

# 启动开发服务器
uvicorn app.main:app --reload --port 8000
```

**访问**: http://localhost:8000  
**API文档**: http://localhost:8000/docs

### 2. 前端开发环境

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量（可选）
cp .env.example .env

# 启动开发服务器
npm run dev
```

**访问**: http://localhost:3000

### 3. 数据库迁移

```bash
# 创建迁移文件
alembic revision --autogenerate -m "描述变更内容"

# 应用迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

---

## 二、生产环境部署

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

## 三、常用操作命令

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

## 四、数据导入说明

### 支持的数据类型

1. **仓库商品** (warehouse_products)
   - 必填: sku, name
   - 可选: category, cost_price, spec

2. **店铺商品** (shop_products)
   - 必填: shop_id, sku, title, price
   - 可选: product_url, status, stock

3. **库存数据** (inventory)
   - 必填: sku, quantity
   - 可选: warehouse_location

4. **销售数据** (sales)
   - 必填: shop_id, shop_product_id, quantity, amount, sale_date
   - 可选: order_id, profit

### 导入步骤

1. 准备Excel或CSV文件（包含必填列）
2. 登录系统
3. 进入"数据导入"页面
4. 选择导入类型
5. 上传文件
6. 点击"开始导入"
7. 查看导入结果

### Excel模板示例

**仓库商品模板**:
| sku | name | category | cost_price | spec |
|-----|------|----------|------------|------|
| SKU001 | 商品名称 | 分类 | 100.00 | 规格说明 |

**店铺商品模板**:
| shop_id | sku | title | price | status | stock |
|---------|-----|-------|-------|--------|-------|
| 1 | SKU001 | 商品标题 | 150.00 | on_shelf | 100 |

---

## 五、性能优化

### 数据库优化

```sql
-- 查看慢查询
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

-- 添加索引
CREATE INDEX idx_products_sku ON warehouse_products(sku);
CREATE INDEX idx_sales_date ON sales(sale_date);

-- 清理旧数据（定期执行）
DELETE FROM operation_logs WHERE created_at < NOW() - INTERVAL '90 days';
```

### Docker优化

```bash
# 限制容器资源
docker-compose.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

# 查看容器资源使用
docker stats
```

---

## 六、安全配置

### 1. 修改默认密码

```bash
# 首次登录后立即修改admin密码
# 在系统中：个人信息 → 修改密码
```

### 2. 配置防火墙

```bash
# 只开放必要端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. 配置HTTPS（推荐）

使用Nginx + Let's Encrypt:

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 配置自动续期
sudo certbot renew --dry-run
```

### 4. 定期备份

创建定时任务（crontab）:

```bash
# 编辑定时任务
crontab -e

# 每天凌晨2点备份
0 2 * * * cd /home/w/Peos && docker-compose exec postgres pg_dump -U postgres ecommerce_ops > /backup/db_$(date +\%Y\%m\%d).sql
```

---

## 七、故障排查

### 1. 无法连接数据库

**症状**: 后端启动失败，日志显示数据库连接错误

**解决**:
```bash
# 检查PostgreSQL容器状态
docker-compose ps postgres

# 查看PostgreSQL日志
docker-compose logs postgres

# 重启PostgreSQL
docker-compose restart postgres

# 检查数据库配置
docker-compose exec postgres psql -U postgres -l
```

### 2. 前端页面空白

**症状**: 访问前端显示空白页面

**解决**:
```bash
# 检查前端容器状态
docker-compose ps frontend

# 查看前端日志
docker-compose logs frontend

# 检查后端API是否正常
curl http://localhost:8000/health

# 清除浏览器缓存，强制刷新（Ctrl+Shift+R）

# 重启前端服务
docker-compose restart frontend
```

### 3. 导入数据失败

**症状**: Excel文件上传后导入失败

**解决**:
- 检查Excel文件格式（必填列是否存在）
- 查看导入历史中的错误信息
- 查看后端日志: `docker-compose logs backend`
- 确保数据格式正确（如日期格式、数字格式）

### 4. 内存不足

**症状**: 容器频繁重启，系统响应缓慢

**解决**:
```bash
# 查看系统资源
free -h
df -h

# 查看Docker资源使用
docker stats

# 限制容器内存（修改docker-compose.yml）
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G

# 清理无用数据
docker system prune -a
```

### 5. 端口被占用

**症状**: docker-compose启动失败，提示端口已被占用

**解决**:
```bash
# 查看端口占用
sudo lsof -i :80
sudo lsof -i :8000

# 停止占用端口的进程
sudo kill -9 PID

# 或修改docker-compose.yml中的端口映射
```

---

## 八、更新升级

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

---

## 九、监控维护

### 日志管理

```bash
# 查看实时日志
docker-compose logs -f --tail=100

# 导出日志
docker-compose logs > logs_$(date +%Y%m%d).txt

# 清理旧日志
docker-compose logs --tail=0
```

### 定期维护

```bash
# 每周执行一次
# 1. 备份数据库
# 2. 清理旧日志
# 3. 检查磁盘空间
# 4. 更新系统补丁
```

---

## 十、技术支持

### 查看系统信息

```bash
# Docker版本
docker --version
docker-compose --version

# 系统信息
uname -a
free -h
df -h
```

### 常用检查命令

```bash
# 检查所有服务状态
docker-compose ps

# 检查网络连接
docker network ls
docker network inspect peos_app-network

# 检查数据卷
docker volume ls
```

---

**最后更新**: 2024-11-04  
**适用版本**: 1.0.0
