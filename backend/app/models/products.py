from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class WarehouseProduct(Base):
    """仓库商品模型"""
    __tablename__ = "warehouse_products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), unique=True, index=True, nullable=False, comment="商品SKU")
    name = Column(String(200), nullable=False, comment="商品名称")
    category = Column(String(100), comment="商品类别")
    cost_price = Column(Numeric(10, 2), comment="成本价")
    spec = Column(Text, comment="规格说明")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    shop_products = relationship("ShopProduct", back_populates="warehouse_product")
    inventory = relationship("Inventory", back_populates="warehouse_product", uselist=False)


class ShopProduct(Base):
    """店铺商品模型"""
    __tablename__ = "shop_products"

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False, comment="店铺ID")
    warehouse_product_id = Column(Integer, ForeignKey("warehouse_products.id"), nullable=False, comment="仓库商品ID")
    product_url = Column(String(500), comment="商品链接")
    title = Column(String(200), nullable=False, comment="商品标题")
    price = Column(Numeric(10, 2), comment="售价")
    status = Column(String(20), default="on_shelf", comment="状态：on_shelf/off_shelf")
    stock = Column(Integer, default=0, comment="库存")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    shop = relationship("Shop", back_populates="products")
    warehouse_product = relationship("WarehouseProduct", back_populates="shop_products")
    sales = relationship("Sale", back_populates="shop_product")


class Inventory(Base):
    """库存模型"""
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_product_id = Column(Integer, ForeignKey("warehouse_products.id"), unique=True, nullable=False, comment="仓库商品ID")
    quantity = Column(Integer, default=0, comment="库存数量")
    warehouse_location = Column(String(100), comment="仓库位置")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    warehouse_product = relationship("WarehouseProduct", back_populates="inventory")

