"""数据表管理API"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import pandas as pd
import io
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models import User, DataTable, Shop, Platform, TableData
from app.schemas.data_tables import (
    DataTableCreate, DataTableUpdate, DataTableResponse,
    DataTableTreeNode, FieldConfig
)

router = APIRouter()


@router.get("/tree", response_model=List[DataTableTreeNode])
def get_data_table_tree(
    platform_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取数据表树形结构（平台-店铺-数据表）
    """
    # 查询平台
    platform_query = db.query(Platform).filter(Platform.is_active == 1)
    if platform_id:
        platform_query = platform_query.filter(Platform.id == platform_id)
    platforms = platform_query.order_by(Platform.sort_order).all()
    
    tree = []
    for platform in platforms:
        platform_node = DataTableTreeNode(
            id=platform.id,
            name=platform.name,
            type="platform",
            children=[]
        )
        
        # 查询该平台下的店铺
        shops = db.query(Shop).filter(
            Shop.platform_id == platform.id,
            Shop.status == "active"
        ).all()
        
        for shop in shops:
            shop_node = DataTableTreeNode(
                id=shop.id,
                name=shop.name,
                type="shop",
                children=[]
            )
            
            # 查询该店铺下的数据表
            data_tables = db.query(DataTable).filter(
                DataTable.shop_id == shop.id,
                DataTable.is_active == 1
            ).order_by(DataTable.sort_order).all()
            
            for data_table in data_tables:
                table_node = DataTableTreeNode(
                    id=data_table.id,
                    name=data_table.name,
                    type="data_table",
                    table_type=data_table.table_type,
                    shop_id=data_table.shop_id,
                    is_active=data_table.is_active,
                    fields=data_table.fields,  # 包含字段配置
                    description=data_table.description,
                    sort_order=data_table.sort_order
                )
                shop_node.children.append(table_node)
            
            platform_node.children.append(shop_node)
        
        tree.append(platform_node)
    
    return tree


@router.get("", response_model=List[DataTableResponse])
def get_data_tables(
    shop_id: Optional[int] = None,
    table_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取数据表列表
    """
    query = db.query(DataTable)
    
    if shop_id:
        query = query.filter(DataTable.shop_id == shop_id)
    if table_type:
        query = query.filter(DataTable.table_type == table_type)
    
    query = query.order_by(DataTable.sort_order, DataTable.id)
    data_tables = query.offset(skip).limit(limit).all()
    
    return data_tables


@router.get("/{data_table_id}", response_model=DataTableResponse)
def get_data_table(
    data_table_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取数据表详情
    """
    data_table = db.query(DataTable).filter(DataTable.id == data_table_id).first()
    if not data_table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="数据表不存在"
        )
    return data_table


@router.post("", response_model=DataTableResponse)
def create_data_table(
    data_table_data: DataTableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建数据表（仅管理员）- 支持自定义字段
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，仅管理员可创建数据表"
        )
    
    # 验证店铺存在
    shop = db.query(Shop).filter(Shop.id == data_table_data.shop_id).first()
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="店铺不存在"
        )
    
    # 验证字段配置
    if not data_table_data.fields or len(data_table_data.fields) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="至少需要配置一个字段"
        )
    
    # 验证字段类型
    valid_types = ["text", "number", "date", "boolean"]
    for field in data_table_data.fields:
        if field.type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"字段类型必须是: {', '.join(valid_types)}"
            )
    
    # 转换字段配置为JSON格式
    fields_json = [field.model_dump() for field in data_table_data.fields]
    
    # 创建数据表
    data_table = DataTable(
        shop_id=data_table_data.shop_id,
        name=data_table_data.name,
        table_type=data_table_data.table_type,
        description=data_table_data.description,
        fields=fields_json,
        sort_order=data_table_data.sort_order,
        is_active=data_table_data.is_active
    )
    db.add(data_table)
    db.commit()
    db.refresh(data_table)
    
    return data_table


@router.put("/{data_table_id}", response_model=DataTableResponse)
def update_data_table(
    data_table_id: int,
    data_table_data: DataTableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新数据表（仅管理员）
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，仅管理员可更新数据表"
        )
    
    # 查询数据表
    data_table = db.query(DataTable).filter(DataTable.id == data_table_id).first()
    if not data_table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="数据表不存在"
        )
    
    # 更新字段
    update_data = data_table_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(data_table, key, value)
    
    db.commit()
    db.refresh(data_table)
    
    return data_table


@router.delete("/{data_table_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_data_table(
    data_table_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    删除数据表（仅管理员）
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，仅管理员可删除数据表"
        )
    
    # 查询数据表
    data_table = db.query(DataTable).filter(DataTable.id == data_table_id).first()
    if not data_table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="数据表不存在"
        )
    
    # 删除数据表
    db.delete(data_table)
    db.commit()
    
    return None


@router.post("/parse-excel")
async def parse_excel_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    解析Excel/CSV文件，自动识别字段和类型
    """
    try:
        # 读取文件内容
        contents = await file.read()
        
        # 根据文件扩展名判断文件类型
        filename = file.filename.lower()
        
        if filename.endswith('.csv'):
            # 解析CSV文件
            df = pd.read_csv(io.BytesIO(contents), encoding='utf-8', nrows=100)
        elif filename.endswith(('.xlsx', '.xls')):
            # 解析Excel文件
            df = pd.read_excel(io.BytesIO(contents), nrows=100)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="不支持的文件格式，请上传 .xlsx、.xls 或 .csv 文件"
            )
        
        # 解析字段配置
        fields = []
        for column in df.columns:
            # 识别字段类型
            col_data = df[column].dropna()
            
            if len(col_data) == 0:
                field_type = "text"
            elif pd.api.types.is_numeric_dtype(col_data):
                field_type = "number"
            elif pd.api.types.is_datetime64_any_dtype(col_data):
                field_type = "date"
            elif pd.api.types.is_bool_dtype(col_data):
                field_type = "boolean"
            else:
                # 尝试解析为日期
                try:
                    pd.to_datetime(col_data, errors='raise')
                    field_type = "date"
                except:
                    field_type = "text"
            
            # 构建字段配置
            field_config = {
                "name": str(column),
                "type": field_type,
                "required": False,  # 默认非必填
                "description": f"{column}"  # 默认描述为字段名
            }
            fields.append(field_config)
        
        return {
            "success": True,
            "fields": fields,
            "total_rows": len(df),
            "preview_rows": df.head(5).to_dict('records')
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件为空或格式错误"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"文件解析失败: {str(e)}"
        )


@router.post("/import-data")
async def import_table_data(
    data_table_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    将Excel/CSV文件数据导入到指定数据表
    """
    try:
        # 查询数据表
        data_table = db.query(DataTable).filter(DataTable.id == data_table_id).first()
        if not data_table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="数据表不存在"
            )
        
        # 读取文件内容
        contents = await file.read()
        filename = file.filename.lower()
        
        # 解析文件
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents), encoding='utf-8')
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="不支持的文件格式"
            )
        
        # 获取数据表的字段配置
        fields = data_table.fields
        if not fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="数据表未配置字段"
            )
        
        # 验证文件列是否与字段配置匹配
        field_names = [f['name'] for f in fields]
        missing_fields = set(field_names) - set(df.columns)
        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"文件缺少必要的列: {', '.join(missing_fields)}"
            )
        
        # 导入数据
        imported_count = 0
        for _, row in df.iterrows():
            # 构建数据记录
            data_record = {}
            for field in fields:
                field_name = field['name']
                if field_name in df.columns:
                    value = row[field_name]
                    # 处理NaN值
                    if pd.isna(value):
                        value = None
                    data_record[field_name] = value
            
            # 创建数据记录
            table_data = TableData(
                data_table_id=data_table_id,
                data=data_record
            )
            db.add(table_data)
            imported_count += 1
        
        db.commit()
        
        return {
            "success": True,
            "imported_rows": imported_count,
            "total_rows": len(df)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据导入失败: {str(e)}"
        )

