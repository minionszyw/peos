from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ImportHistoryResponse(BaseModel):
    """导入记录响应"""
    id: int
    user_id: int
    file_name: str
    table_type: str
    status: str
    total_rows: int
    success_rows: int
    error_message: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ImportResult(BaseModel):
    """导入结果"""
    total_rows: int
    success_rows: int
    error_count: int
    errors: list[str]
    status: str

