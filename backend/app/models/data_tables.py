from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class DataTable(Base):
    """数据表模型 - 每个店铺的数据表实例"""
    __tablename__ = "data_tables"

    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="CASCADE"), nullable=False, index=True, comment="店铺ID")
    name = Column(String(100), nullable=False, comment="数据表名称")
    table_type = Column(String(50), nullable=False, index=True, comment="表类型分类（product/sales/inventory/custom）")
    description = Column(Text, comment="数据表描述")
    fields = Column(JSON, nullable=False, comment="字段配置列表（JSONB）")
    sort_order = Column(Integer, default=0, comment="排序")
    is_active = Column(Integer, default=1, comment="是否启用（0=禁用，1=启用）")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    shop = relationship("Shop", back_populates="data_tables")
    table_data = relationship("TableData", back_populates="data_table", cascade="all, delete-orphan")


class TableData(Base):
    """通用数据存储表 - 存储所有数据表的实际数据"""
    __tablename__ = "table_data"

    id = Column(Integer, primary_key=True, index=True)
    data_table_id = Column(Integer, ForeignKey("data_tables.id", ondelete="CASCADE"), nullable=False, index=True, comment="数据表ID")
    data = Column(JSON, nullable=False, comment="数据内容（JSONB）")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    data_table = relationship("DataTable", back_populates="table_data")

