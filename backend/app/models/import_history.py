from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.core.database import Base


class ImportHistory(Base):
    """数据导入记录模型"""
    __tablename__ = "import_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="操作用户ID")
    file_name = Column(String(255), nullable=False, comment="文件名")
    table_type = Column(String(50), nullable=False, comment="导入表类型")
    status = Column(String(20), default="pending", comment="状态：pending/success/failed")
    total_rows = Column(Integer, default=0, comment="总行数")
    success_rows = Column(Integer, default=0, comment="成功行数")
    error_message = Column(Text, comment="错误信息")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True, comment="创建时间")

