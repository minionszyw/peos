from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class SystemSetting(Base):
    """系统配置模型"""
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True, comment="配置键")
    value = Column(Text, comment="配置值")
    value_type = Column(String(20), default="string", comment="值类型：string/json/number/boolean")
    description = Column(String(255), comment="配置描述")
    group_name = Column(String(50), comment="配置分组")
    is_public = Column(Integer, default=0, comment="是否公开（0=仅管理员，1=所有用户）")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
