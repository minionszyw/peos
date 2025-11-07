"""操作日志装饰器"""
from functools import wraps
from typing import Callable, Any
from sqlalchemy.orm import Session
from app.models.logs import OperationLog
from app.models.users import User
import json


def log_operation(action_type: str, table_name: str):
    """
    操作日志装饰器
    
    Args:
        action_type: 操作类型 (create/update/delete)
        table_name: 表名
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 获取参数
            db: Session = kwargs.get('db')
            current_user: User = kwargs.get('current_user')
            
            # 执行原函数
            result = await func(*args, **kwargs) if hasattr(func, '__await__') else func(*args, **kwargs)
            
            # 记录日志
            if db and current_user:
                try:
                    # 获取记录ID
                    record_id = None
                    new_value = None
                    
                    if action_type == 'create' and hasattr(result, 'id'):
                        record_id = result.id
                        # 将结果转换为字典
                        if hasattr(result, '__dict__'):
                            new_value = {k: v for k, v in result.__dict__.items() if not k.startswith('_')}
                            # 转换不可序列化的对象
                            new_value = json.loads(json.dumps(new_value, default=str))
                    
                    elif action_type == 'update':
                        # 对于更新操作，可以从kwargs中获取ID
                        record_id = kwargs.get('shop_id') or kwargs.get('product_id') or kwargs.get('id')
                        if hasattr(result, '__dict__'):
                            new_value = {k: v for k, v in result.__dict__.items() if not k.startswith('_')}
                            new_value = json.loads(json.dumps(new_value, default=str))
                    
                    elif action_type == 'delete':
                        record_id = kwargs.get('shop_id') or kwargs.get('product_id') or kwargs.get('id')
                    
                    # 创建日志记录
                    log = OperationLog(
                        user_id=current_user.id,
                        action_type=action_type,
                        table_name=table_name,
                        record_id=record_id,
                        old_value=None,  # 可以在需要时添加旧值记录
                        new_value=new_value
                    )
                    db.add(log)
                    db.commit()
                except Exception as e:
                    # 日志记录失败不影响主业务
                    print(f"Failed to log operation: {e}")
                    db.rollback()
            
            return result
        return wrapper
    return decorator


def create_operation_log(
    db: Session,
    user_id: int,
    action_type: str,
    table_name: str,
    record_id: int = None,
    old_value: dict = None,
    new_value: dict = None
):
    """
    手动创建操作日志
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        action_type: 操作类型
        table_name: 表名
        record_id: 记录ID
        old_value: 旧值
        new_value: 新值
    """
    try:
        log = OperationLog(
            user_id=user_id,
            action_type=action_type,
            table_name=table_name,
            record_id=record_id,
            old_value=old_value,
            new_value=new_value
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Failed to create operation log: {e}")
        db.rollback()

