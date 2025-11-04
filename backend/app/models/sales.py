from sqlalchemy import Column, Integer, String, DateTime, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Sale(Base):
    """销售记录模型"""
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False, comment="店铺ID")
    shop_product_id = Column(Integer, ForeignKey("shop_products.id"), nullable=False, comment="店铺商品ID")
    order_id = Column(String(100), index=True, comment="订单号")
    quantity = Column(Integer, nullable=False, comment="销售数量")
    amount = Column(Numeric(10, 2), nullable=False, comment="销售金额")
    profit = Column(Numeric(10, 2), comment="利润")
    sale_date = Column(Date, nullable=False, index=True, comment="销售日期")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")

    # 关系
    shop = relationship("Shop", back_populates="sales")
    shop_product = relationship("ShopProduct", back_populates="sales")

