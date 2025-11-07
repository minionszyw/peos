"""用户管理API（增强版）"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.users import User
from app.schemas.users import UserResponse, UserCreate, UserUpdate
from app.api.deps import get_current_admin, get_current_user
from pydantic import BaseModel

router = APIRouter()


class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str


class BatchDeleteRequest(BaseModel):
    user_ids: List[int]


class BatchRoleUpdate(BaseModel):
    user_ids: List[int]
    role: str


@router.get("", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """获取用户列表（支持搜索、筛选）- 所有登录用户可访问"""
    query = db.query(User)
    
    # 角色筛选
    if role:
        query = query.filter(User.role == role)
    
    # 搜索（用户名或姓名）
    if search:
        query = query.filter(
            (User.username.like(f"%{search}%")) |
            (User.name.like(f"%{search}%"))
        )
    
    users = query.offset(skip).limit(limit).all()
    return [UserResponse.from_orm(user) for user in users]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户详情"""
    # 只能查看自己或者管理员可以查看所有人
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    return UserResponse.from_orm(user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新用户信息"""
    # 只能修改自己或者管理员可以修改所有人
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 非管理员不能修改role
    if current_user.role != "admin" and user_data.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改角色"
        )
    
    # 如果修改username，检查是否冲突
    if user_data.username and user_data.username != user.username:
        existing = db.query(User).filter(
            User.username == user_data.username,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已存在"
            )
    
    # 更新字段
    for field, value in user_data.model_dump(exclude_unset=True).items():
        if field != "password":  # 密码单独处理
            setattr(user, field, value)
    
    # 如果提供了新密码
    if user_data.password:
        user.password_hash = get_password_hash(user_data.password)
    
    db.commit()
    db.refresh(user)
    
    return UserResponse.from_orm(user)


@router.delete("/{user_id}", response_model=dict)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """删除用户（仅管理员）"""
    # 不能删除自己
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除自己"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "用户已删除"}


@router.put("/{user_id}/password", response_model=dict)
def change_password(
    user_id: int,
    request: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """修改密码"""
    from app.core.security import verify_password
    
    # 只能修改自己的密码
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改他人密码"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 验证旧密码
    if not verify_password(request.old_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="旧密码错误"
        )
    
    # 设置新密码
    user.password_hash = get_password_hash(request.new_password)
    db.commit()
    
    return {"message": "密码修改成功"}


@router.put("/{user_id}/avatar", response_model=dict)
async def upload_avatar(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """上传头像"""
    # 只能修改自己的头像或管理员可以修改所有人
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 验证文件类型
    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不支持的文件类型，仅支持：PNG, JPEG, JPG, GIF"
        )
    
    # 生成唯一文件名
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"avatar_{user_id}_{uuid.uuid4()}{file_ext}"
    
    # 确保上传目录存在
    upload_dir = "uploads/avatars"
    os.makedirs(upload_dir, exist_ok=True)
    
    # 保存文件
    file_path = os.path.join(upload_dir, unique_filename)
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # 更新数据库
    avatar_url = f"/{file_path}"
    user.avatar = avatar_url
    db.commit()
    
    return {
        "message": "头像上传成功",
        "url": avatar_url,
        "filename": unique_filename
    }


@router.post("/batch/delete", response_model=dict)
def batch_delete_users(
    request: BatchDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """批量删除用户（仅管理员）"""
    # 检查是否包含当前用户
    if current_user.id in request.user_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除自己"
        )
    
    deleted_count = db.query(User).filter(User.id.in_(request.user_ids)).delete(synchronize_session=False)
    db.commit()
    
    return {
        "message": f"成功删除 {deleted_count} 个用户",
        "deleted_count": deleted_count
    }


@router.put("/batch/role", response_model=dict)
def batch_update_role(
    request: BatchRoleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    """批量修改角色（仅管理员）"""
    # 验证角色
    valid_roles = ["admin", "operator"]
    if request.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无效的角色，必须是：{', '.join(valid_roles)}"
        )
    
    updated_count = db.query(User).filter(
        User.id.in_(request.user_ids)
    ).update({"role": request.role}, synchronize_session=False)
    
    db.commit()
    
    return {
        "message": f"成功更新 {updated_count} 个用户的角色",
        "updated_count": updated_count
    }
