from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ImportTemplateBase(BaseModel):
    table_type: str = Field(..., max_length=50, description="表类型")
    name: str = Field(..., max_length=100, description="模板名称")
    description: Optional[str] = Field(None, description="模板描述")
    field_mappings: dict = Field(..., description="字段映射配置")
    validation_rules: Optional[dict] = Field(None, description="验证规则配置")
    custom_fields: Optional[dict] = Field(None, description="自定义字段配置")
    example_data: Optional[dict] = Field(None, description="示例数据")


class ImportTemplateCreate(ImportTemplateBase):
    pass


class ImportTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    field_mappings: Optional[dict] = None
    validation_rules: Optional[dict] = None
    custom_fields: Optional[dict] = None
    example_data: Optional[dict] = None


class ImportTemplateResponse(ImportTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DataValidationRequest(BaseModel):
    table_type: str = Field(..., description="表类型")
    data: list[dict] = Field(..., description="待验证的数据")


class DataValidationResponse(BaseModel):
    valid: bool
    errors: list[dict] = []
    warnings: list[dict] = []
