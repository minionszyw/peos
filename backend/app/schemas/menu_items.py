from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class MenuItemBase(BaseModel):
    name: str = Field(..., max_length=100, description="菜单名称")
    icon: Optional[str] = Field(None, max_length=50, description="图标名称")
    path: Optional[str] = Field(None, max_length=255, description="路由路径")
    parent_id: Optional[int] = Field(None, description="父菜单ID")
    sort_order: int = Field(default=0, description="排序")
    is_visible: int = Field(default=1, description="是否可见")
    required_role: Optional[str] = Field(None, max_length=50, description="所需角色")
    component: Optional[str] = Field(None, max_length=255, description="组件路径")


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    path: Optional[str] = None
    parent_id: Optional[int] = None
    sort_order: Optional[int] = None
    is_visible: Optional[int] = None
    required_role: Optional[str] = None
    component: Optional[str] = None


class MenuItemResponse(MenuItemBase):
    id: int
    created_at: datetime
    updated_at: datetime
    children: Optional[List['MenuItemResponse']] = []

    class Config:
        from_attributes = True


class MenuItemSort(BaseModel):
    id: int
    sort_order: int


class MenuItemBatchSort(BaseModel):
    items: List[MenuItemSort]
