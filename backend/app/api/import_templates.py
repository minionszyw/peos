"""导入模板管理API"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.import_templates import ImportTemplate
from app.models.users import User
from app.schemas.import_templates import (
    ImportTemplateCreate,
    ImportTemplateUpdate,
    ImportTemplateResponse,
    DataValidationRequest,
    DataValidationResponse
)
from app.api.deps import get_current_admin, get_current_user

router = APIRouter()


@router.get("", response_model=List[ImportTemplateResponse])
def get_templates(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """获取所有导入模板"""
    templates = db.query(ImportTemplate).all()
    return templates


@router.get("/{table_type}", response_model=ImportTemplateResponse)
def get_template_by_type(
    table_type: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """获取指定类型的模板"""
    template = db.query(ImportTemplate).filter(
        ImportTemplate.table_type == table_type
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="模板不存在"
        )
    
    return template


@router.post("", response_model=ImportTemplateResponse)
def create_template(
    template_data: ImportTemplateCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """创建导入模板（仅管理员）"""
    # 检查table_type是否已存在
    existing = db.query(ImportTemplate).filter(
        ImportTemplate.table_type == template_data.table_type
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该类型的模板已存在"
        )
    
    template = ImportTemplate(**template_data.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return template


@router.put("/{table_type}", response_model=ImportTemplateResponse)
def update_template(
    table_type: str,
    template_data: ImportTemplateUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """更新导入模板（仅管理员）"""
    template = db.query(ImportTemplate).filter(
        ImportTemplate.table_type == table_type
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="模板不存在"
        )
    
    # 更新字段
    for field, value in template_data.model_dump(exclude_unset=True).items():
        setattr(template, field, value)
    
    db.commit()
    db.refresh(template)
    
    return template


@router.delete("/{table_type}", response_model=dict)
def delete_template(
    table_type: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """删除导入模板（仅管理员）"""
    template = db.query(ImportTemplate).filter(
        ImportTemplate.table_type == table_type
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="模板不存在"
        )
    
    db.delete(template)
    db.commit()
    
    return {"message": "模板已删除"}


@router.post("/validate", response_model=DataValidationResponse)
def validate_data(
    request: DataValidationRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """验证数据（根据模板）"""
    # 获取模板
    template = db.query(ImportTemplate).filter(
        ImportTemplate.table_type == request.table_type
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="模板不存在"
        )
    
    errors = []
    warnings = []
    
    # 验证数据
    for index, row in enumerate(request.data):
        row_num = index + 1
        
        # 检查必填字段
        if template.validation_rules:
            for field, rules in template.validation_rules.items():
                if rules.get("required", False):
                    if field not in row or not row[field]:
                        errors.append({
                            "row": row_num,
                            "field": field,
                            "message": f"第 {row_num} 行：{field} 为必填项"
                        })
        
        # 检查字段映射
        if template.field_mappings:
            for field in row.keys():
                if field not in template.field_mappings and field not in (template.custom_fields or {}):
                    warnings.append({
                        "row": row_num,
                        "field": field,
                        "message": f"第 {row_num} 行：{field} 不在模板定义中"
                    })
    
    return DataValidationResponse(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings
    )
