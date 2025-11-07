from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PlatformBase(BaseModel):
    name: str = Field(..., max_length=100, description="平台名称")
    code: str = Field(..., max_length=50, description="平台代码")
    icon: Optional[str] = Field(None, max_length=255, description="平台图标")
    description: Optional[str] = Field(None, description="平台描述")
    is_active: int = Field(default=1, description="是否启用")
    sort_order: int = Field(default=0, description="排序")
    config: Optional[dict] = Field(None, description="平台配置")


class PlatformCreate(PlatformBase):
    pass


class PlatformUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[int] = None
    sort_order: Optional[int] = None
    config: Optional[dict] = None


class PlatformResponse(PlatformBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
