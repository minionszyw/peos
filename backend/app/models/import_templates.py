from sqlalchemy import Column, Integer, String, DateTime, JSON, Text
from sqlalchemy.sql import func
from app.core.database import Base


class ImportTemplate(Base):
    """数据导入模板模型"""
    __tablename__ = "import_templates"

    id = Column(Integer, primary_key=True, index=True)
    table_type = Column(String(50), nullable=False, unique=True, index=True, comment="表类型")
    name = Column(String(100), nullable=False, comment="模板名称")
    description = Column(Text, comment="模板描述")
    field_mappings = Column(JSON, nullable=False, comment="字段映射配置（JSONB）")
    validation_rules = Column(JSON, comment="验证规则配置（JSONB）")
    custom_fields = Column(JSON, comment="自定义字段配置（JSONB）")
    example_data = Column(JSON, comment="示例数据")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
