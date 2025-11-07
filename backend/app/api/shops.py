"""店铺管理API"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.shops import Shop
from app.models.users import User
from app.schemas.shops import ShopCreate, ShopUpdate, ShopResponse, ShopWithManager
from app.api.deps import get_current_user
from app.utils.log_decorator import create_operation_log

router = APIRouter()


@router.post("", response_model=ShopResponse, status_code=status.HTTP_201_CREATED)
def create_shop(
    shop_data: ShopCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建店铺"""
    # 检查店铺名称是否已存在
    existing_shop = db.query(Shop).filter(Shop.name == shop_data.name).first()
    if existing_shop:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="店铺名称已存在",
        )
    
    # 创建新店铺
    new_shop = Shop(**shop_data.model_dump())
    db.add(new_shop)
    db.commit()
    db.refresh(new_shop)
    
    # 记录操作日志
    create_operation_log(
        db=db,
        user_id=current_user.id,
        action_type="create",
        table_name="shops",
        record_id=new_shop.id,
        new_value={"name": new_shop.name, "platform": new_shop.platform}
    )
    
    return new_shop


@router.get("", response_model=List[ShopWithManager])
def list_shops(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    platform: str = None,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取店铺列表"""
    query = db.query(Shop)
    
    # 筛选条件
    if platform:
        query = query.filter(Shop.platform == platform)
    if status:
        query = query.filter(Shop.status == status)
    
    shops = query.offset(skip).limit(limit).all()
    
    # 添加管理员姓名
    result = []
    for shop in shops:
        shop_dict = ShopResponse.from_orm(shop).model_dump()
        manager_name = None
        if shop.manager_id:
            manager = db.query(User).filter(User.id == shop.manager_id).first()
            if manager:
                manager_name = manager.name
        shop_dict['manager_name'] = manager_name
        result.append(ShopWithManager(**shop_dict))
    
    return result


@router.get("/{shop_id}", response_model=ShopWithManager)
def get_shop(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取店铺详情"""
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="店铺不存在",
        )
    
    shop_dict = ShopResponse.from_orm(shop).model_dump()
    manager_name = None
    if shop.manager_id:
        manager = db.query(User).filter(User.id == shop.manager_id).first()
        if manager:
            manager_name = manager.name
    shop_dict['manager_name'] = manager_name
    
    return ShopWithManager(**shop_dict)


@router.put("/{shop_id}", response_model=ShopResponse)
def update_shop(
    shop_id: int,
    shop_data: ShopUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新店铺"""
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="店铺不存在",
        )
    
    # 保存旧值
    old_value = {"name": shop.name, "platform": shop.platform, "status": shop.status}
    
    # 更新字段
    update_data = shop_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(shop, field, value)
    
    db.commit()
    db.refresh(shop)
    
    # 记录操作日志
    create_operation_log(
        db=db,
        user_id=current_user.id,
        action_type="update",
        table_name="shops",
        record_id=shop.id,
        old_value=old_value,
        new_value={"name": shop.name, "platform": shop.platform, "status": shop.status}
    )
    
    return shop


@router.delete("/{shop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shop(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除店铺"""
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="店铺不存在",
        )
    
    # 保存旧值用于日志
    old_value = {"name": shop.name, "platform": shop.platform}
    
    db.delete(shop)
    db.commit()
    
    # 记录操作日志
    create_operation_log(
        db=db,
        user_id=current_user.id,
        action_type="delete",
        table_name="shops",
        record_id=shop_id,
        old_value=old_value
    )
    
    return None


@router.get("/count/total")
def get_shop_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取店铺总数"""
    count = db.query(Shop).count()
    return {"total": count}

