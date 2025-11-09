from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Shop(Base):
    """店铺模型"""
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True, comment="店铺名称")
    platform = Column(String(50), comment="平台名称（兼容旧数据）")
    platform_id = Column(Integer, ForeignKey("platforms.id"), nullable=True, comment="平台ID")
    account = Column(String(100), comment="店铺账号")
    manager_id = Column(Integer, ForeignKey("users.id"), comment="管理员ID")
    status = Column(String(20), default="active", comment="状态：active/inactive")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    manager = relationship("User", backref="managed_shops")
    platform_obj = relationship("Platform", back_populates="shops")
    data_tables = relationship("DataTable", back_populates="shop")

