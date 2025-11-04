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
from app.api import auth, shops, import_data, products

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(shops.router, prefix="/api/shops", tags=["店铺"])
app.include_router(import_data.router, prefix="/api/import", tags=["数据导入"])
app.include_router(products.router, prefix="/api/products", tags=["商品"])
# app.include_router(sales.router, prefix="/api/sales", tags=["销售"])
# app.include_router(worksheets.router, prefix="/api/worksheets", tags=["工作表"])
# app.include_router(dashboards.router, prefix="/api/dashboards", tags=["看板"])
# app.include_router(logs.router, prefix="/api/logs", tags=["日志"])

