"""平台管理API"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.platforms import Platform
from app.models.shops import Shop
from app.models.users import User
from app.schemas.platforms import PlatformCreate, PlatformUpdate, PlatformResponse
from app.api.deps import get_current_admin, get_current_user

router = APIRouter()


@router.get("", response_model=List[PlatformResponse])
def get_platforms(
    is_active: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """获取平台列表"""
    query = db.query(Platform)
    
    if is_active is not None:
        query = query.filter(Platform.is_active == is_active)
    
    platforms = query.order_by(Platform.sort_order, Platform.id).offset(skip).limit(limit).all()
    return platforms


@router.get("/{platform_id}", response_model=PlatformResponse)
def get_platform(
    platform_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """获取指定平台"""
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="平台不存在"
        )
    
    return platform


@router.get("/{platform_id}/shops", response_model=List[dict])
def get_platform_shops(
    platform_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """获取平台下的店铺"""
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="平台不存在"
        )
    
    shops = db.query(Shop).filter(Shop.platform_id == platform_id).all()
    
    return [{
        "id": shop.id,
        "name": shop.name,
        "platform_id": shop.platform_id,
        "account": shop.account,
        "status": shop.status,
        "manager_id": shop.manager_id,
        "created_at": shop.created_at,
        "updated_at": shop.updated_at
    } for shop in shops]


@router.post("", response_model=PlatformResponse)
def create_platform(
    platform_data: PlatformCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """创建平台（仅管理员）"""
    # 检查平台代码是否已存在
    existing = db.query(Platform).filter(Platform.code == platform_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="平台代码已存在"
        )
    
    # 检查平台名称是否已存在
    existing_name = db.query(Platform).filter(Platform.name == platform_data.name).first()
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="平台名称已存在"
        )
    
    platform = Platform(**platform_data.model_dump())
    db.add(platform)
    db.commit()
    db.refresh(platform)
    
    return platform


@router.put("/{platform_id}", response_model=PlatformResponse)
def update_platform(
    platform_id: int,
    platform_data: PlatformUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """更新平台（仅管理员）"""
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="平台不存在"
        )
    
    # 如果更新code，检查是否冲突
    if platform_data.code and platform_data.code != platform.code:
        existing = db.query(Platform).filter(
            Platform.code == platform_data.code,
            Platform.id != platform_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="平台代码已存在"
            )
    
    # 如果更新name，检查是否冲突
    if platform_data.name and platform_data.name != platform.name:
        existing_name = db.query(Platform).filter(
            Platform.name == platform_data.name,
            Platform.id != platform_id
        ).first()
        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="平台名称已存在"
            )
    
    # 更新字段
    for field, value in platform_data.model_dump(exclude_unset=True).items():
        setattr(platform, field, value)
    
    db.commit()
    db.refresh(platform)
    
    return platform


@router.delete("/{platform_id}", response_model=dict)
def delete_platform(
    platform_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """删除平台（仅管理员）"""
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="平台不存在"
        )
    
    # 检查是否有关联的店铺
    shops_count = db.query(Shop).filter(Shop.platform_id == platform_id).count()
    if shops_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"该平台下还有 {shops_count} 个店铺，请先删除或迁移店铺"
        )
    
    db.delete(platform)
    db.commit()
    
    return {"message": "平台已删除"}
