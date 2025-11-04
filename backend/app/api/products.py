"""商品管理API"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.products import WarehouseProduct, ShopProduct
from app.models.shops import Shop
from app.schemas.products import (
    WarehouseProductCreate, WarehouseProductUpdate, WarehouseProductResponse,
    ShopProductCreate, ShopProductUpdate, ShopProductResponse, ShopProductWithDetails,
    BatchUpdateStatus, BatchUpdatePrice
)
from app.api.deps import get_current_user
from app.models.users import User

router = APIRouter()


# 仓库商品API
@router.post("/warehouse", response_model=WarehouseProductResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse_product(
    product_data: WarehouseProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建仓库商品"""
    # 检查SKU是否已存在
    existing = db.query(WarehouseProduct).filter(WarehouseProduct.sku == product_data.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SKU {product_data.sku} 已存在",
        )
    
    product = WarehouseProduct(**product_data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/warehouse", response_model=List[WarehouseProductResponse])
def list_warehouse_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    category: str = None,
    keyword: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取仓库商品列表"""
    query = db.query(WarehouseProduct)
    
    if category:
        query = query.filter(WarehouseProduct.category == category)
    if keyword:
        query = query.filter(
            (WarehouseProduct.sku.contains(keyword)) |
            (WarehouseProduct.name.contains(keyword))
        )
    
    products = query.offset(skip).limit(limit).all()
    return products


@router.get("/warehouse/{product_id}", response_model=WarehouseProductResponse)
def get_warehouse_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取仓库商品详情"""
    product = db.query(WarehouseProduct).filter(WarehouseProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在")
    return product


@router.put("/warehouse/{product_id}", response_model=WarehouseProductResponse)
def update_warehouse_product(
    product_id: int,
    product_data: WarehouseProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新仓库商品"""
    product = db.query(WarehouseProduct).filter(WarehouseProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在")
    
    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    return product


@router.delete("/warehouse/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_warehouse_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除仓库商品"""
    product = db.query(WarehouseProduct).filter(WarehouseProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在")
    
    db.delete(product)
    db.commit()
    return None


# 店铺商品API
@router.post("/shop", response_model=ShopProductResponse, status_code=status.HTTP_201_CREATED)
def create_shop_product(
    product_data: ShopProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建店铺商品"""
    # 验证店铺是否存在
    shop = db.query(Shop).filter(Shop.id == product_data.shop_id).first()
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="店铺不存在")
    
    # 验证仓库商品是否存在
    warehouse_product = db.query(WarehouseProduct).filter(
        WarehouseProduct.id == product_data.warehouse_product_id
    ).first()
    if not warehouse_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="仓库商品不存在")
    
    product = ShopProduct(**product_data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/shop", response_model=List[ShopProductWithDetails])
def list_shop_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    shop_id: int = None,
    status: str = None,
    keyword: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取店铺商品列表"""
    query = db.query(ShopProduct)
    
    if shop_id:
        query = query.filter(ShopProduct.shop_id == shop_id)
    if status:
        query = query.filter(ShopProduct.status == status)
    if keyword:
        query = query.filter(ShopProduct.title.contains(keyword))
    
    products = query.offset(skip).limit(limit).all()
    
    # 添加额外信息
    result = []
    for product in products:
        product_dict = ShopProductResponse.from_orm(product).model_dump()
        
        # 获取店铺名称
        shop = db.query(Shop).filter(Shop.id == product.shop_id).first()
        product_dict['shop_name'] = shop.name if shop else None
        
        # 获取仓库商品信息
        warehouse_product = db.query(WarehouseProduct).filter(
            WarehouseProduct.id == product.warehouse_product_id
        ).first()
        if warehouse_product:
            product_dict['sku'] = warehouse_product.sku
            product_dict['warehouse_product_name'] = warehouse_product.name
        
        result.append(ShopProductWithDetails(**product_dict))
    
    return result


@router.put("/shop/{product_id}", response_model=ShopProductResponse)
def update_shop_product(
    product_id: int,
    product_data: ShopProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新店铺商品"""
    product = db.query(ShopProduct).filter(ShopProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在")
    
    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    return product


@router.post("/shop/batch/status")
def batch_update_status(
    data: BatchUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """批量更新商品状态（上下架）"""
    if data.status not in ['on_shelf', 'off_shelf']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="状态必须是 on_shelf 或 off_shelf"
        )
    
    updated_count = db.query(ShopProduct).filter(
        ShopProduct.id.in_(data.ids)
    ).update({"status": data.status}, synchronize_session=False)
    
    db.commit()
    
    return {"updated_count": updated_count, "message": "批量更新成功"}


@router.post("/shop/batch/price")
def batch_update_price(
    data: BatchUpdatePrice,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """批量改价"""
    updated_count = db.query(ShopProduct).filter(
        ShopProduct.id.in_(data.ids)
    ).update({"price": data.price}, synchronize_session=False)
    
    db.commit()
    
    return {"updated_count": updated_count, "message": "批量改价成功"}


@router.delete("/shop/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shop_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除店铺商品"""
    product = db.query(ShopProduct).filter(ShopProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在")
    
    db.delete(product)
    db.commit()
    return None

