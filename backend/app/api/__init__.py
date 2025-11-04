"""API路由导出"""
from app.api import auth, shops, products, import_data

__all__ = [
    "auth",
    "shops",
    "products",
    "import_data",
]

