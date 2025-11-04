"""数据导入API"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import shutil
from datetime import datetime
from app.core.database import get_db
from app.core.config import settings
from app.models.users import User
from app.models.import_history import ImportHistory
from app.schemas.import_history import ImportHistoryResponse, ImportResult
from app.api.deps import get_current_user
from app.services.import_service import ImportService

router = APIRouter()

# 确保上传目录存在
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=ImportResult)
async def upload_and_import(
    file: UploadFile = File(...),
    table_type: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    上传并导入数据
    table_type: warehouse_products, shop_products, inventory, sales
    """
    # 验证文件类型
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只支持Excel文件（.xlsx, .xls）和CSV文件（.csv）"
        )
    
    # 保存文件
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    file_path = os.path.join(settings.UPLOAD_DIR, f"{timestamp}_{file.filename}")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"文件保存失败: {str(e)}"
        )
    
    # 创建导入记录
    import_record = ImportHistory(
        user_id=current_user.id,
        file_name=file.filename,
        table_type=table_type,
        status="pending"
    )
    db.add(import_record)
    db.commit()
    db.refresh(import_record)
    
    # 导入数据
    try:
        service = ImportService()
        
        if table_type == "warehouse_products":
            total, success, errors = service.validate_and_import_warehouse_products(file_path, db)
        elif table_type == "shop_products":
            total, success, errors = service.validate_and_import_shop_products(file_path, db)
        elif table_type == "inventory":
            total, success, errors = service.validate_and_import_inventory(file_path, db)
        elif table_type == "sales":
            total, success, errors = service.validate_and_import_sales(file_path, db)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"不支持的表类型: {table_type}"
            )
        
        # 更新导入记录
        import_record.total_rows = total
        import_record.success_rows = success
        import_record.status = "success" if success == total else "partial_success" if success > 0 else "failed"
        import_record.error_message = "\n".join(errors) if errors else None
        db.commit()
        
        return ImportResult(
            total_rows=total,
            success_rows=success,
            error_count=len(errors),
            errors=errors,
            status=import_record.status
        )
        
    except Exception as e:
        # 更新导入记录为失败
        import_record.status = "failed"
        import_record.error_message = str(e)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"导入失败: {str(e)}"
        )
    finally:
        # 删除临时文件
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except:
            pass


@router.get("/history", response_model=list[ImportHistoryResponse])
def get_import_history(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取导入历史记录"""
    records = db.query(ImportHistory)\
        .order_by(ImportHistory.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return records


@router.get("/templates/{table_type}")
def download_template(table_type: str):
    """下载导入模板"""
    templates = {
        "warehouse_products": {
            "columns": ["sku", "name", "category", "cost_price", "spec"],
            "example": ["SKU001", "商品名称", "分类", "100.00", "规格说明"]
        },
        "shop_products": {
            "columns": ["shop_id", "sku", "product_url", "title", "price", "status", "stock"],
            "example": ["1", "SKU001", "https://...", "商品标题", "150.00", "on_shelf", "100"]
        },
        "inventory": {
            "columns": ["sku", "quantity", "warehouse_location"],
            "example": ["SKU001", "500", "A-01-01"]
        },
        "sales": {
            "columns": ["shop_id", "shop_product_id", "order_id", "quantity", "amount", "profit", "sale_date"],
            "example": ["1", "1", "ORDER001", "2", "300.00", "100.00", "2024-01-01"]
        }
    }
    
    if table_type not in templates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="模板不存在"
        )
    
    return templates[table_type]

