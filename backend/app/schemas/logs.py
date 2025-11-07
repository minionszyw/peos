"""操作日志相关的数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class OperationLogResponse(BaseModel):
    """操作日志响应"""
    id: int
    user_id: int
    user_name: Optional[str] = None
    action_type: str = Field(..., description="操作类型：create/update/delete")
    table_name: str = Field(..., description="操作表名")
    record_id: Optional[int] = Field(None, description="记录ID")
    old_value: Optional[Dict[str, Any]] = Field(None, description="旧值")
    new_value: Optional[Dict[str, Any]] = Field(None, description="新值")
    created_at: datetime

    class Config:
        from_attributes = True


class OperationLogQuery(BaseModel):
    """操作日志查询参数"""
    user_id: Optional[int] = Field(None, description="用户ID筛选")
    action_type: Optional[str] = Field(None, description="操作类型筛选")
    table_name: Optional[str] = Field(None, description="表名筛选")
    start_date: Optional[datetime] = Field(None, description="开始时间")
    end_date: Optional[datetime] = Field(None, description="结束时间")
    page: int = Field(1, ge=1, description="页码")
    page_size: int = Field(50, ge=1, le=500, description="每页数量")

