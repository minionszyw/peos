# 电商运营系统

企业级电商运营管理系统，支持30人在线使用，帮助运营团队提高数据管理和分析效率。

## 技术栈

### 前端
- React 18 + TypeScript + Vite
- Ant Design 5.x
- SCSS + CSS Modules
- ECharts
- Zustand
- Axios

### 后端
- FastAPI 0.100+
- PostgreSQL 15+
- SQLAlchemy 2.0
- Pydantic
- JWT认证
- Celery + Redis

### 部署
- Docker + Docker Compose
- Nginx

## 快速开始

### 开发环境要求
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose

### 本地开发

1. 启动数据库和Redis
```bash
docker-compose up -d postgres redis
```

2. 启动后端
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

3. 启动前端
```bash
cd frontend
npm install
npm run dev
```

### 生产部署

```bash
docker-compose up -d
```

系统将在 http://localhost 上运行

## 功能模块

- 用户认证与权限管理
- 店铺管理
- 商品管理（仓库商品、店铺商品）
- 数据导入（Excel/CSV）
- 工作表自定义
- 操作日志记录
- 数据看板与报表
- 周报自动生成

## 目录结构

```
.
├── frontend/          # 前端应用
├── backend/           # 后端API
├── docker-compose.yml # Docker编排文件
└── nginx.conf         # Nginx配置
```

## 许可证

私有项目 - 仅供公司内部使用

