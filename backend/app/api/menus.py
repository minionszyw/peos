"""菜单管理API"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.menu_items import MenuItem
from app.models.users import User
from app.schemas.menu_items import (
    MenuItemCreate,
    MenuItemUpdate,
    MenuItemResponse,
    MenuItemBatchSort
)
from app.api.deps import get_current_admin, get_current_user

router = APIRouter()


def build_menu_tree(items: List[MenuItem]) -> List[dict]:
    """构建菜单树"""
    # 创建字典用于快速查找
    item_dict = {item.id: {
        "id": item.id,
        "name": item.name,
        "icon": item.icon,
        "path": item.path,
        "parent_id": item.parent_id,
        "sort_order": item.sort_order,
        "is_visible": item.is_visible,
        "required_role": item.required_role,
        "component": item.component,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
        "children": []
    } for item in items}
    
    # 构建树结构
    tree = []
    for item in items:
        if item.parent_id is None:
            tree.append(item_dict[item.id])
        else:
            if item.parent_id in item_dict:
                item_dict[item.parent_id]["children"].append(item_dict[item.id])
    
    return tree


@router.get("", response_model=List[MenuItemResponse])
def get_menus(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取当前用户可见的菜单"""
    query = db.query(MenuItem).filter(MenuItem.is_visible == 1)
    
    # 根据角色筛选
    if current_user.role != "admin":
        query = query.filter(
            (MenuItem.required_role == "all") | 
            (MenuItem.required_role == current_user.role)
        )
    
    items = query.order_by(MenuItem.sort_order, MenuItem.id).all()
    
    # 返回扁平列表，前端可以自行构建树
    return items


@router.get("/tree", response_model=List[dict])
def get_menu_tree(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取菜单树结构"""
    query = db.query(MenuItem).filter(MenuItem.is_visible == 1)
    
    # 根据角色筛选
    if current_user.role != "admin":
        query = query.filter(
            (MenuItem.required_role == "all") | 
            (MenuItem.required_role == current_user.role)
        )
    
    items = query.order_by(MenuItem.sort_order, MenuItem.id).all()
    
    return build_menu_tree(items)


@router.get("/all", response_model=List[MenuItemResponse])
def get_all_menus(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """获取所有菜单（仅管理员）"""
    items = db.query(MenuItem).order_by(MenuItem.sort_order, MenuItem.id).all()
    return items


@router.get("/{menu_id}", response_model=MenuItemResponse)
def get_menu(
    menu_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """获取指定菜单"""
    menu = db.query(MenuItem).filter(MenuItem.id == menu_id).first()
    
    if not menu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="菜单不存在"
        )
    
    return menu


@router.post("", response_model=MenuItemResponse)
def create_menu(
    menu_data: MenuItemCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """创建菜单（仅管理员）"""
    # 验证父菜单是否存在
    if menu_data.parent_id:
        parent = db.query(MenuItem).filter(MenuItem.id == menu_data.parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="父菜单不存在"
            )
    
    menu = MenuItem(**menu_data.model_dump())
    db.add(menu)
    db.commit()
    db.refresh(menu)
    
    return menu


@router.put("/{menu_id}", response_model=MenuItemResponse)
def update_menu(
    menu_id: int,
    menu_data: MenuItemUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """更新菜单（仅管理员）"""
    menu = db.query(MenuItem).filter(MenuItem.id == menu_id).first()
    
    if not menu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="菜单不存在"
        )
    
    # 验证父菜单
    if menu_data.parent_id is not None:
        if menu_data.parent_id == menu_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="不能将自己设置为父菜单"
            )
        if menu_data.parent_id > 0:
            parent = db.query(MenuItem).filter(MenuItem.id == menu_data.parent_id).first()
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="父菜单不存在"
                )
    
    # 更新字段
    for field, value in menu_data.model_dump(exclude_unset=True).items():
        setattr(menu, field, value)
    
    db.commit()
    db.refresh(menu)
    
    return menu


@router.delete("/{menu_id}", response_model=dict)
def delete_menu(
    menu_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """删除菜单（仅管理员）"""
    menu = db.query(MenuItem).filter(MenuItem.id == menu_id).first()
    
    if not menu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="菜单不存在"
        )
    
    # 检查是否有子菜单
    children = db.query(MenuItem).filter(MenuItem.parent_id == menu_id).count()
    if children > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先删除子菜单"
        )
    
    db.delete(menu)
    db.commit()
    
    return {"message": "菜单已删除"}


@router.put("/sort/batch", response_model=dict)
def batch_sort_menus(
    sort_data: MenuItemBatchSort,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """批量更新菜单排序（仅管理员）"""
    for item in sort_data.items:
        menu = db.query(MenuItem).filter(MenuItem.id == item.id).first()
        if menu:
            menu.sort_order = item.sort_order
    
    db.commit()
    
    return {
        "message": f"成功更新 {len(sort_data.items)} 个菜单的排序",
        "count": len(sort_data.items)
    }
