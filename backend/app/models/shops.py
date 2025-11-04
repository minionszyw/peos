from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Shop(Base):
    """店铺模型"""
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True, comment="店铺名称")
    platform = Column(String(50), nullable=False, comment="平台：淘宝/京东/拼多多等")
    account = Column(String(100), comment="店铺账号")
    manager_id = Column(Integer, ForeignKey("users.id"), comment="管理员ID")
    status = Column(String(20), default="active", comment="状态：active/inactive")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    manager = relationship("User", backref="managed_shops")
    products = relationship("ShopProduct", back_populates="shop")
    sales = relationship("Sale", back_populates="shop")

