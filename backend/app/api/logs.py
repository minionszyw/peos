"""操作日志API"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.logs import OperationLog
from app.models.users import User
from app.schemas.logs import OperationLogResponse, OperationLogQuery
from app.api.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[OperationLogResponse])
def list_operation_logs(
    user_id: Optional[int] = Query(None, description="用户ID筛选"),
    action_type: Optional[str] = Query(None, description="操作类型筛选"),
    table_name: Optional[str] = Query(None, description="表名筛选"),
    start_date: Optional[datetime] = Query(None, description="开始时间"),
    end_date: Optional[datetime] = Query(None, description="结束时间"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(50, ge=1, le=500, description="每页数量"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取操作日志列表"""
    # 构建查询
    query = db.query(OperationLog)
    
    # 应用筛选条件
    if user_id:
        query = query.filter(OperationLog.user_id == user_id)
    if action_type:
        query = query.filter(OperationLog.action_type == action_type)
    if table_name:
        query = query.filter(OperationLog.table_name == table_name)
    if start_date:
        query = query.filter(OperationLog.created_at >= start_date)
    if end_date:
        query = query.filter(OperationLog.created_at <= end_date)
    
    # 按时间倒序排列
    query = query.order_by(OperationLog.created_at.desc())
    
    # 分页
    offset = (page - 1) * page_size
    logs = query.offset(offset).limit(page_size).all()
    
    # 添加用户名
    result = []
    for log in logs:
        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "action_type": log.action_type,
            "table_name": log.table_name,
            "record_id": log.record_id,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "created_at": log.created_at,
            "user_name": None
        }
        
        # 获取用户名
        user = db.query(User).filter(User.id == log.user_id).first()
        if user:
            log_dict["user_name"] = user.name
        
        result.append(OperationLogResponse(**log_dict))
    
    return result


@router.get("/count")
def get_log_count(
    user_id: Optional[int] = Query(None),
    action_type: Optional[str] = Query(None),
    table_name: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取日志总数"""
    query = db.query(OperationLog)
    
    if user_id:
        query = query.filter(OperationLog.user_id == user_id)
    if action_type:
        query = query.filter(OperationLog.action_type == action_type)
    if table_name:
        query = query.filter(OperationLog.table_name == table_name)
    if start_date:
        query = query.filter(OperationLog.created_at >= start_date)
    if end_date:
        query = query.filter(OperationLog.created_at <= end_date)
    
    total = query.count()
    return {"total": total}


@router.get("/{log_id}", response_model=OperationLogResponse)
def get_operation_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取操作日志详情"""
    log = db.query(OperationLog).filter(OperationLog.id == log_id).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="操作日志不存在"
        )
    
    log_dict = {
        "id": log.id,
        "user_id": log.user_id,
        "action_type": log.action_type,
        "table_name": log.table_name,
        "record_id": log.record_id,
        "old_value": log.old_value,
        "new_value": log.new_value,
        "created_at": log.created_at,
        "user_name": None
    }
    
    # 获取用户名
    user = db.query(User).filter(User.id == log.user_id).first()
    if user:
        log_dict["user_name"] = user.name
    
    return OperationLogResponse(**log_dict)


@router.get("/stats/summary")
def get_log_stats(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取操作日志统计"""
    query = db.query(OperationLog)
    
    if start_date:
        query = query.filter(OperationLog.created_at >= start_date)
    if end_date:
        query = query.filter(OperationLog.created_at <= end_date)
    
    # 按操作类型统计
    action_stats = {}
    for action_type in ['create', 'update', 'delete']:
        count = query.filter(OperationLog.action_type == action_type).count()
        action_stats[action_type] = count
    
    # 按表名统计
    table_stats = {}
    tables = db.query(OperationLog.table_name).distinct().all()
    for (table_name,) in tables:
        count = query.filter(OperationLog.table_name == table_name).count()
        table_stats[table_name] = count
    
    # 按用户统计
    user_stats = []
    users = db.query(OperationLog.user_id).distinct().all()
    for (user_id,) in users:
        count = query.filter(OperationLog.user_id == user_id).count()
        user = db.query(User).filter(User.id == user_id).first()
        user_stats.append({
            "user_id": user_id,
            "user_name": user.name if user else None,
            "count": count
        })
    
    return {
        "total": query.count(),
        "action_stats": action_stats,
        "table_stats": table_stats,
        "user_stats": user_stats
    }

