"""工作表管理API"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.worksheets import Worksheet
from app.models.users import User
from app.models.products import ShopProduct, WarehouseProduct
from app.models.shops import Shop
from app.schemas.worksheets import (
    WorksheetCreate, WorksheetUpdate, WorksheetResponse, WorksheetDataQuery
)
from app.api.deps import get_current_user

router = APIRouter()


@router.post("", response_model=WorksheetResponse, status_code=status.HTTP_201_CREATED)
def create_worksheet(
    worksheet_data: WorksheetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建工作表"""
    # 检查同名工作表
    existing = db.query(Worksheet).filter(
        Worksheet.user_id == current_user.id,
        Worksheet.name == worksheet_data.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="工作表名称已存在",
        )
    
    # 创建工作表
    worksheet = Worksheet(
        user_id=current_user.id,
        **worksheet_data.model_dump()
    )
    db.add(worksheet)
    db.commit()
    db.refresh(worksheet)
    
    return worksheet


@router.get("", response_model=List[WorksheetResponse])
def list_worksheets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取当前用户的工作表列表"""
    worksheets = db.query(Worksheet).filter(
        Worksheet.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return worksheets


@router.get("/{worksheet_id}", response_model=WorksheetResponse)
def get_worksheet(
    worksheet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取工作表详情"""
    worksheet = db.query(Worksheet).filter(
        Worksheet.id == worksheet_id,
        Worksheet.user_id == current_user.id
    ).first()
    
    if not worksheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="工作表不存在"
        )
    
    return worksheet


@router.put("/{worksheet_id}", response_model=WorksheetResponse)
def update_worksheet(
    worksheet_id: int,
    worksheet_data: WorksheetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新工作表"""
    worksheet = db.query(Worksheet).filter(
        Worksheet.id == worksheet_id,
        Worksheet.user_id == current_user.id
    ).first()
    
    if not worksheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="工作表不存在"
        )
    
    # 检查名称是否与其他工作表重复
    if worksheet_data.name:
        existing = db.query(Worksheet).filter(
            Worksheet.user_id == current_user.id,
            Worksheet.name == worksheet_data.name,
            Worksheet.id != worksheet_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="工作表名称已存在"
            )
    
    # 更新字段
    update_data = worksheet_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(worksheet, field, value)
    
    db.commit()
    db.refresh(worksheet)
    
    return worksheet


@router.delete("/{worksheet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_worksheet(
    worksheet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除工作表"""
    worksheet = db.query(Worksheet).filter(
        Worksheet.id == worksheet_id,
        Worksheet.user_id == current_user.id
    ).first()
    
    if not worksheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="工作表不存在"
        )
    
    db.delete(worksheet)
    db.commit()
    
    return None


@router.post("/data/query")
def query_worksheet_data(
    query: WorksheetDataQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """查询工作表数据（基于shop_products）"""
    # 验证工作表是否存在且属于当前用户
    worksheet = db.query(Worksheet).filter(
        Worksheet.id == query.worksheet_id,
        Worksheet.user_id == current_user.id
    ).first()
    
    if not worksheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="工作表不存在"
        )
    
    # 构建查询
    db_query = db.query(ShopProduct)
    
    # 应用筛选条件
    if query.shop_id:
        db_query = db_query.filter(ShopProduct.shop_id == query.shop_id)
    if query.status:
        db_query = db_query.filter(ShopProduct.status == query.status)
    if query.keyword:
        db_query = db_query.filter(ShopProduct.title.contains(query.keyword))
    
    # 分页
    total = db_query.count()
    offset = (query.page - 1) * query.page_size
    products = db_query.offset(offset).limit(query.page_size).all()
    
    # 构建结果
    result_data = []
    for product in products:
        product_dict = {
            "id": product.id,
            "shop_id": product.shop_id,
            "warehouse_product_id": product.warehouse_product_id,
            "title": product.title,
            "price": float(product.price) if product.price else None,
            "status": product.status,
            "stock": product.stock,
            "product_url": product.product_url,
            "created_at": product.created_at.isoformat() if product.created_at else None,
            "updated_at": product.updated_at.isoformat() if product.updated_at else None,
        }
        
        # 获取店铺信息
        shop = db.query(Shop).filter(Shop.id == product.shop_id).first()
        if shop:
            product_dict["shop_name"] = shop.name
            product_dict["platform"] = shop.platform
        
        # 获取仓库商品信息
        if product.warehouse_product_id:
            warehouse_product = db.query(WarehouseProduct).filter(
                WarehouseProduct.id == product.warehouse_product_id
            ).first()
            if warehouse_product:
                product_dict["sku"] = warehouse_product.sku
                product_dict["warehouse_product_name"] = warehouse_product.name
                product_dict["cost_price"] = float(warehouse_product.cost_price) if warehouse_product.cost_price else None
        
        result_data.append(product_dict)
    
    return {
        "total": total,
        "page": query.page,
        "page_size": query.page_size,
        "data": result_data,
        "worksheet": {
            "id": worksheet.id,
            "name": worksheet.name,
            "config_json": worksheet.config_json
        }
    }

