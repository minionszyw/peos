from sqlalchemy import Column, Integer, String, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Platform(Base):
    """电商平台模型"""
    __tablename__ = "platforms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True, comment="平台名称")
    code = Column(String(50), nullable=False, unique=True, index=True, comment="平台代码")
    icon = Column(String(255), comment="平台图标")
    description = Column(Text, comment="平台描述")
    is_active = Column(Integer, default=1, comment="是否启用（0=禁用，1=启用）")
    sort_order = Column(Integer, default=0, comment="排序")
    config = Column(JSON, comment="平台配置（JSONB）")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    shops = relationship("Shop", back_populates="platform_obj")
