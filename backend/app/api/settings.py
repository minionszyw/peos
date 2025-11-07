"""系统设置API"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
from app.core.database import get_db
from app.models.system_settings import SystemSetting
from app.schemas.system_settings import (
    SystemSettingCreate,
    SystemSettingUpdate,
    SystemSettingResponse,
    SystemSettingsBatchUpdate
)
from app.api.deps import get_current_admin, get_current_user
from app.models.users import User

router = APIRouter()


@router.get("", response_model=List[SystemSettingResponse])
def get_settings(
    group_name: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取系统设置（支持按分组筛选）"""
    query = db.query(SystemSetting)
    
    # 非管理员只能看公开配置
    if current_user.role != "admin":
        query = query.filter(SystemSetting.is_public == 1)
    
    # 按分组筛选
    if group_name:
        query = query.filter(SystemSetting.group_name == group_name)
    
    settings = query.all()
    return settings


@router.get("/{key}", response_model=SystemSettingResponse)
def get_setting_by_key(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取指定配置项"""
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="配置项不存在"
        )
    
    # 检查权限
    if setting.is_public == 0 and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问此配置"
        )
    
    return setting


@router.post("", response_model=SystemSettingResponse)
def create_setting(
    setting_data: SystemSettingCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """创建系统设置（仅管理员）"""
    # 检查键是否已存在
    existing = db.query(SystemSetting).filter(SystemSetting.key == setting_data.key).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="配置键已存在"
        )
    
    setting = SystemSetting(**setting_data.model_dump())
    db.add(setting)
    db.commit()
    db.refresh(setting)
    
    return setting


@router.put("/{key}", response_model=SystemSettingResponse)
def update_setting(
    key: str,
    setting_data: SystemSettingUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """更新系统设置（仅管理员）"""
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="配置项不存在"
        )
    
    # 更新字段
    for field, value in setting_data.model_dump(exclude_unset=True).items():
        setattr(setting, field, value)
    
    db.commit()
    db.refresh(setting)
    
    return setting


@router.put("", response_model=dict)
def batch_update_settings(
    batch_data: SystemSettingsBatchUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """批量更新系统设置（仅管理员）"""
    updated_count = 0
    
    for key, value in batch_data.settings.items():
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if setting:
            setting.value = value
            updated_count += 1
    
    db.commit()
    
    return {
        "message": f"成功更新 {updated_count} 个配置项",
        "updated_count": updated_count
    }


@router.post("/logo", response_model=dict)
async def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """上传Logo（仅管理员）"""
    # 验证文件类型
    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/svg+xml"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不支持的文件类型，仅支持：PNG, JPEG, JPG, GIF, SVG"
        )
    
    # 生成唯一文件名
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"logo_{uuid.uuid4()}{file_ext}"
    
    # 确保上传目录存在
    upload_dir = "uploads/logos"
    os.makedirs(upload_dir, exist_ok=True)
    
    # 保存文件
    file_path = os.path.join(upload_dir, unique_filename)
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # 更新数据库中的logo_url配置
    logo_url = f"/{file_path}"
    setting = db.query(SystemSetting).filter(SystemSetting.key == "logo_url").first()
    if setting:
        setting.value = logo_url
    else:
        # 如果不存在，创建新配置
        setting = SystemSetting(
            key="logo_url",
            value=logo_url,
            value_type="string",
            description="Logo URL",
            group_name="basic",
            is_public=1
        )
        db.add(setting)
    
    db.commit()
    
    return {
        "message": "Logo上传成功",
        "url": logo_url,
        "filename": unique_filename
    }


@router.delete("/{key}", response_model=dict)
def delete_setting(
    key: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """删除系统设置（仅管理员）"""
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="配置项不存在"
        )
    
    db.delete(setting)
    db.commit()
    
    return {"message": "配置项已删除"}
