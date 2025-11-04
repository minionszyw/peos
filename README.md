# 电商运营系统

## 项目简介

电商运营管理系统，支持30人团队管理30家店铺、9万+商品，提供数据导入、商品管理、批量操作等核心功能。

### 技术栈

**前端**: React 18 + TypeScript + Ant Design + SCSS  
**后端**: FastAPI + PostgreSQL + SQLAlchemy + Pandas  
**部署**: Docker + Docker Compose

### 核心功能

- ✅ 用户认证（JWT）
- ✅ 店铺管理（增删改查）
- ✅ 数据导入（Excel/CSV：仓库商品、店铺商品、库存、销售）
- ✅ 商品管理（批量上下架、批量改价）
- ✅ 完整的布局系统

### 快速启动

**开发环境（推荐）：**

```bash
# 一键启动所有开发服务
./start-dev.sh

# 访问系统
# 前端: http://localhost:3000
# 后端: http://localhost:8000
# 登录: admin / admin123

# 停止所有服务
./stop-dev.sh
```

**生产环境（Docker）：**

```bash
# 启动服务
docker-compose up -d

# 初始化数据库
docker-compose exec backend python init_db.py

# 访问系统
# 浏览器: http://localhost
# 登录: admin / admin123
```

> 💡 详细配置请参考 [DEPLOY.md](DEPLOY.md)

---

## 📚 文档导航

| 文档 | 说明 |
|------|------|
| [DEPLOY.md](DEPLOY.md) | 开发环境配置、生产环境部署、常用命令、数据导入说明、性能优化、安全配置、故障排查、更新升级、监控维护、技术支持 |
| [NORM.md](NORM.md) | 开发规范（命名、目录、Git、API、数据库、代码、安全、性能） |
| [PROJECT.md](PROJECT.md) | 已完成功能、待开发功能、技术架构、性能指标、开发统计、下一步计划 |

---

## 许可证

本项目为公司内部使用。
