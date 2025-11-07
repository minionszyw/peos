from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SystemSettingBase(BaseModel):
    key: str = Field(..., max_length=100, description="配置键")
    value: Optional[str] = Field(None, description="配置值")
    value_type: str = Field(default="string", description="值类型")
    description: Optional[str] = Field(None, max_length=255, description="配置描述")
    group_name: Optional[str] = Field(None, max_length=50, description="配置分组")
    is_public: int = Field(default=0, description="是否公开")


class SystemSettingCreate(SystemSettingBase):
    pass


class SystemSettingUpdate(BaseModel):
    value: Optional[str] = None
    value_type: Optional[str] = None
    description: Optional[str] = None
    group_name: Optional[str] = None
    is_public: Optional[int] = None


class SystemSettingResponse(SystemSettingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SystemSettingsBatchUpdate(BaseModel):
    settings: dict[str, str] = Field(..., description="设置键值对")
