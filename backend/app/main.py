from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="电商运营系统API",
    version="1.0.0",
)

# CORS中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "电商运营系统API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


# 导入路由
from app.api import (
    auth, shops, import_data,
    settings, menus, platforms, import_templates,
    users, dashboards, dashboard_data, worksheets, logs
)

# 认证和用户
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(users.router, prefix="/api/users", tags=["用户管理"])

# 系统配置
app.include_router(settings.router, prefix="/api/settings", tags=["系统设置"])
app.include_router(menus.router, prefix="/api/menus", tags=["菜单管理"])
app.include_router(platforms.router, prefix="/api/platforms", tags=["平台管理"])
app.include_router(import_templates.router, prefix="/api/import-templates", tags=["导入模板"])

# 业务功能
app.include_router(shops.router, prefix="/api/shops", tags=["店铺"])
app.include_router(import_data.router, prefix="/api/import", tags=["数据导入"])

# 数据看板
app.include_router(dashboards.router, prefix="/api/dashboards", tags=["看板"])
app.include_router(dashboard_data.router, prefix="/api/dashboard-data", tags=["看板数据"])

# 工作表
app.include_router(worksheets.router, prefix="/api/worksheets", tags=["工作表"])

# 操作日志
app.include_router(logs.router, prefix="/api/logs", tags=["操作日志"])

# TODO: 待开发
# app.include_router(sales.router, prefix="/api/sales", tags=["销售"])

