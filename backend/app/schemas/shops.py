from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ShopBase(BaseModel):
    """店铺基础模型"""
    name: str = Field(..., min_length=1, max_length=100, description="店铺名称")
    account: Optional[str] = Field(None, max_length=100, description="店铺账号")
    manager_id: Optional[int] = Field(None, description="管理员ID")
    status: str = Field(default="active", description="状态：active/inactive")


class ShopCreate(ShopBase):
    """创建店铺"""
    platform_id: int = Field(..., description="平台ID")


class ShopUpdate(BaseModel):
    """更新店铺"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    platform_id: Optional[int] = None
    account: Optional[str] = None
    manager_id: Optional[int] = None
    status: Optional[str] = None


class ShopResponse(ShopBase):
    """店铺响应"""
    id: int
    platform_id: Optional[int] = Field(None, description="平台ID")
    platform_name: Optional[str] = Field(None, description="平台名称")
    platform: Optional[str] = Field(None, description="平台名称（兼容字段）")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ShopWithManager(ShopResponse):
    """带管理员信息的店铺"""
    manager_name: Optional[str] = None

