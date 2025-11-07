"""工作表相关的数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class WorksheetBase(BaseModel):
    """工作表基础模型"""
    name: str = Field(..., min_length=1, max_length=100, description="工作表名称")
    config_json: Optional[Dict[str, Any]] = Field(None, description="配置JSON：字段、筛选条件等")


class WorksheetCreate(WorksheetBase):
    """创建工作表"""
    pass


class WorksheetUpdate(BaseModel):
    """更新工作表"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="工作表名称")
    config_json: Optional[Dict[str, Any]] = Field(None, description="配置JSON")


class WorksheetResponse(WorksheetBase):
    """工作表响应"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorksheetDataQuery(BaseModel):
    """工作表数据查询参数"""
    worksheet_id: int = Field(..., description="工作表ID")
    shop_id: Optional[int] = Field(None, description="店铺ID筛选")
    status: Optional[str] = Field(None, description="状态筛选")
    keyword: Optional[str] = Field(None, description="关键词搜索")
    page: int = Field(1, ge=1, description="页码")
    page_size: int = Field(50, ge=1, le=500, description="每页数量")

