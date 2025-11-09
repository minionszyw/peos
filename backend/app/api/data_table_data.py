"""数据表数据查询API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models import User, DataTable, TableData
from app.schemas.data_tables import (
    TableDataCreate,
    TableDataResponse,
    DataTableDataQuery,
)

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
        data_with_id = {"id": item.id, "_id": item.id, **item.data}
        items_dict.append(data_with_id)
    
    return {
        "total": total,
        "items": items_dict,
        "skip": skip,
        "limit": limit,
        "fields": data_table.fields  # 返回字段配置
    }


@router.post("/query")
def query_table_data(
    query: DataTableDataQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    通用数据表查询接口
    """
    table_query = db.query(DataTable).filter(DataTable.table_type == query.table_type)

    if query.shop_id is not None:
        table_query = table_query.filter(DataTable.shop_id == query.shop_id)
    if query.data_table_id is not None:
        table_query = table_query.filter(DataTable.id == query.data_table_id)

    data_table = table_query.order_by(DataTable.sort_order, DataTable.id).first()

    if not data_table:
        raise HTTPException(
            status_code=404,
            detail="未找到匹配的数据表"
        )

    data_query = db.query(TableData).filter(TableData.data_table_id == data_table.id)

    if query.filters:
        for field, value in query.filters.items():
            if value is None:
                continue
            data_query = data_query.filter(TableData.data[field].astext == str(value))

    total = data_query.count()

    if query.sort_by:
        sort_expression = TableData.data[query.sort_by].astext
        if (query.sort_order or "").lower() == "asc":
            data_query = data_query.order_by(asc(sort_expression))
        else:
            data_query = data_query.order_by(desc(sort_expression))
    else:
        data_query = data_query.order_by(TableData.id.desc())

    items = data_query.offset(query.skip).limit(query.limit).all()

    items_dict = []
    for item in items:
        payload = dict(item.data)
        payload["id"] = item.id
        payload["_id"] = item.id  # 兼容旧字段
        items_dict.append(payload)

    return {
        "total": total,
        "items": items_dict,
        "skip": query.skip,
        "limit": query.limit,
        "fields": data_table.fields,
        "data_table": {
            "id": data_table.id,
            "name": data_table.name,
            "table_type": data_table.table_type,
            "shop_id": data_table.shop_id,
        }
    }

