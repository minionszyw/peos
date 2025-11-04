from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class OperationLog(Base):
    """操作日志模型"""
    __tablename__ = "operation_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="操作用户ID")
    action_type = Column(String(50), nullable=False, index=True, comment="操作类型：create/update/delete")
    table_name = Column(String(50), nullable=False, comment="操作表名")
    record_id = Column(Integer, comment="记录ID")
    old_value = Column(JSON, comment="旧值")
    new_value = Column(JSON, comment="新值")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True, comment="创建时间")

