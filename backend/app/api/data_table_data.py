"""数据表数据查询API"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import List, Dict, Any, Optional
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models import User, DataTable, TableData, Shop
from app.schemas.data_tables import TableDataCreate, TableDataResponse

router = APIRouter()


@router.post("/{data_table_id}/data", response_model=TableDataResponse)
def create_table_data(
    data_table_id: int,
    data: TableDataCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建数据（添加一条记录）
    """
    # 验证数据表存在
    data_table = db.query(DataTable).filter(DataTable.id == data_table_id).first()
    if not data_table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="数据表不存在"
        )
    
    # 验证必填字段
    for field in data_table.fields:
        if field.get("required") and field["name"] not in data.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"缺少必填字段: {field['name']}"
            )
    
    # 创建数据
    table_data = TableData(
        data_table_id=data_table_id,
        data=data.data
    )
    db.add(table_data)
    db.commit()
    db.refresh(table_data)
    
    return table_data


@router.delete("/{data_table_id}/data/{data_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_table_data(
    data_table_id: int,
    data_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    删除数据
    """
    # 查询数据
    table_data = db.query(TableData).filter(
        TableData.id == data_id,
        TableData.data_table_id == data_table_id
    ).first()
    
    if not table_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="数据不存在"
        )
    
    db.delete(table_data)
    db.commit()
    
    return None


@router.get("/{data_table_id}/data")
def get_data_by_table_id(
    data_table_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    通过数据表ID获取数据（从table_data表查询）
    """
    # 查询数据表配置
    data_table = db.query(DataTable).filter(DataTable.id == data_table_id).first()
    if not data_table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="数据表不存在"
        )
    
    # 查询该数据表的所有数据
    query = db.query(TableData).filter(TableData.data_table_id == data_table_id)
    
    # 获取总数
    total = query.count()
    
    # 分页查询
    items = query.order_by(TableData.id.desc()).offset(skip).limit(limit).all()
    
    # 转换为字典列表
    items_dict = []
    for item in items:
        # 添加ID到数据中
        data_with_id = {"_id": item.id, **item.data}
        items_dict.append(data_with_id)
    
    return {
        "total": total,
        "items": items_dict,
        "skip": skip,
        "limit": limit,
        "fields": data_table.fields  # 返回字段配置
    }


@router.get("/shop/{shop_id}/summary")
def get_shop_data_summary(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取店铺数据概览
    """
    # 验证店铺存在
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="店铺不存在"
        )
    
    # 统计各类数据
    shop_products_count = db.query(ShopProduct).filter(
        ShopProduct.shop_id == shop_id
    ).count()
    
    sales_count = db.query(Sale).filter(
        Sale.shop_id == shop_id
    ).count()
    
    # 获取数据表列表
    data_tables = db.query(DataTable).filter(
        DataTable.shop_id == shop_id,
        DataTable.is_active == 1
    ).all()
    
    return {
        "shop_id": shop_id,
        "shop_name": shop.name,
        "shop_products_count": shop_products_count,
        "sales_count": sales_count,
        "data_tables": [
            {
                "id": dt.id,
                "name": dt.name,
                "table_type": dt.table_type,
                "description": dt.description
            }
            for dt in data_tables
        ]
    }

