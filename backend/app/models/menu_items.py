from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class MenuItem(Base):
    """菜单项模型"""
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, comment="菜单名称")
    icon = Column(String(50), comment="图标名称")
    path = Column(String(255), comment="路由路径")
    parent_id = Column(Integer, ForeignKey("menu_items.id"), nullable=True, comment="父菜单ID")
    sort_order = Column(Integer, default=0, comment="排序")
    is_visible = Column(Integer, default=1, comment="是否可见（0=隐藏，1=显示）")
    required_role = Column(String(50), comment="所需角色：admin/operator/all")
    component = Column(String(255), comment="前端组件路径")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 自引用关系：父子菜单
    children = relationship("MenuItem", backref="parent", remote_side=[id])
