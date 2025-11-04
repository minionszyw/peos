from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# 仓库商品Schemas
class WarehouseProductBase(BaseModel):
    sku: str = Field(..., description="SKU")
    name: str = Field(..., description="商品名称")
    category: Optional[str] = None
    cost_price: Optional[float] = None
    spec: Optional[str] = None


class WarehouseProductCreate(WarehouseProductBase):
    pass


class WarehouseProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    cost_price: Optional[float] = None
    spec: Optional[str] = None


class WarehouseProductResponse(WarehouseProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# 店铺商品Schemas
class ShopProductBase(BaseModel):
    shop_id: int
    warehouse_product_id: int
    product_url: Optional[str] = None
    title: str
    price: float
    status: str = "on_shelf"
    stock: int = 0


class ShopProductCreate(ShopProductBase):
    pass


class ShopProductUpdate(BaseModel):
    product_url: Optional[str] = None
    title: Optional[str] = None
    price: Optional[float] = None
    status: Optional[str] = None
    stock: Optional[int] = None


class ShopProductResponse(ShopProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ShopProductWithDetails(ShopProductResponse):
    shop_name: Optional[str] = None
    sku: Optional[str] = None
    warehouse_product_name: Optional[str] = None


# 批量操作
class BatchUpdateStatus(BaseModel):
    ids: list[int] = Field(..., description="商品ID列表")
    status: str = Field(..., description="状态：on_shelf/off_shelf")


class BatchUpdatePrice(BaseModel):
    ids: list[int] = Field(..., description="商品ID列表")
    price: float = Field(..., description="价格")

