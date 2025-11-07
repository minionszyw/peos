"""数据看板API"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.worksheets import Dashboard
from app.models.users import User
from app.schemas.dashboards import (
    DashboardCreate,
    DashboardUpdate,
    DashboardResponse,
    DashboardCloneRequest
)
from app.api.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[DashboardResponse])
def get_dashboards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户的看板列表"""
    dashboards = db.query(Dashboard).filter(
        Dashboard.user_id == current_user.id
    ).all()
    return dashboards


@router.get("/{dashboard_id}", response_model=DashboardResponse)
def get_dashboard(
    dashboard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取指定看板"""
    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.user_id == current_user.id
    ).first()
    
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="看板不存在或无权访问"
        )
    
    return dashboard


@router.post("", response_model=DashboardResponse)
def create_dashboard(
    dashboard_data: DashboardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建看板"""
    dashboard = Dashboard(
        user_id=current_user.id,
        **dashboard_data.model_dump()
    )
    db.add(dashboard)
    db.commit()
    db.refresh(dashboard)
    
    return dashboard


@router.put("/{dashboard_id}", response_model=DashboardResponse)
def update_dashboard(
    dashboard_id: int,
    dashboard_data: DashboardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新看板配置"""
    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.user_id == current_user.id
    ).first()
    
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="看板不存在或无权访问"
        )
    
    # 更新字段
    for field, value in dashboard_data.model_dump(exclude_unset=True).items():
        setattr(dashboard, field, value)
    
    db.commit()
    db.refresh(dashboard)
    
    return dashboard


@router.delete("/{dashboard_id}", response_model=dict)
def delete_dashboard(
    dashboard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除看板"""
    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.user_id == current_user.id
    ).first()
    
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="看板不存在或无权访问"
        )
    
    db.delete(dashboard)
    db.commit()
    
    return {"message": "看板已删除"}


@router.post("/{dashboard_id}/clone", response_model=DashboardResponse)
def clone_dashboard(
    dashboard_id: int,
    request: DashboardCloneRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """克隆看板"""
    # 获取原看板
    original = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.user_id == current_user.id
    ).first()
    
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="看板不存在或无权访问"
        )
    
    # 创建副本
    cloned = Dashboard(
        user_id=current_user.id,
        name=request.name,
        config_json=original.config_json
    )
    db.add(cloned)
    db.commit()
    db.refresh(cloned)
    
    return cloned
