from pydantic import BaseModel, Field
from typing import Optional, Any, Dict, List
from datetime import datetime


class FieldConfig(BaseModel):
    """字段配置Schema"""
    name: str = Field(..., description="字段名称")
    type: str = Field(..., description="字段类型：text/number/date/boolean")
    required: bool = Field(False, description="是否必填")
    description: Optional[str] = Field(None, description="字段描述")


class DataTableBase(BaseModel):
    """数据表基础Schema"""
    name: str = Field(..., min_length=1, max_length=100, description="数据表名称")
    table_type: str = Field(..., min_length=1, max_length=50, description="表类型分类")
    description: Optional[str] = Field(None, description="数据表描述")
    fields: List[FieldConfig] = Field(..., description="字段配置列表")
    sort_order: int = Field(0, description="排序")
    is_active: int = Field(1, description="是否启用（0=禁用，1=启用）")


class DataTableCreate(DataTableBase):
    """创建数据表Schema"""
    shop_id: int = Field(..., description="店铺ID")


class DataTableUpdate(BaseModel):
    """更新数据表Schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="数据表名称")
    description: Optional[str] = Field(None, description="数据表描述")
    fields: Optional[List[FieldConfig]] = Field(None, description="字段配置列表")
    sort_order: Optional[int] = Field(None, description="排序")
    is_active: Optional[int] = Field(None, description="是否启用（0=禁用，1=启用）")


class DataTableResponse(DataTableBase):
    """数据表响应Schema"""
    id: int
    shop_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DataTableTreeNode(BaseModel):
    """数据表树形节点Schema"""
    id: int
    name: str
    type: str  # 'platform', 'shop', 'data_table'
    table_type: Optional[str] = None
    children: Optional[list] = None
    shop_id: Optional[int] = None
    is_active: Optional[int] = None
    fields: Optional[List[FieldConfig]] = None  # 字段配置（仅 data_table 类型有）
    description: Optional[str] = None  # 描述
    sort_order: Optional[int] = None  # 排序
    platform_id: Optional[int] = None
    platform_name: Optional[str] = None
    status: Optional[str] = None  # 店铺状态
    
    class Config:
        from_attributes = True


class TableDataCreate(BaseModel):
    """数据创建Schema"""
    data: Dict[str, Any] = Field(..., description="数据内容")


class TableDataResponse(BaseModel):
    """数据响应Schema"""
    id: int
    data_table_id: int
    data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DataTableDataQuery(BaseModel):
    """数据表数据查询Schema"""
    table_type: str = Field(..., description="表类型")
    shop_id: Optional[int] = Field(None, description="店铺ID")
    filters: Optional[Dict[str, Any]] = Field(None, description="筛选条件")
    data_table_id: Optional[int] = Field(None, description="数据表ID")
    sort_by: Optional[str] = Field(None, description="排序字段")
    sort_order: Optional[str] = Field(None, description="排序方向 asc/desc")
    skip: int = Field(0, ge=0, description="跳过记录数")
    limit: int = Field(20, ge=1, le=100, description="返回记录数")

