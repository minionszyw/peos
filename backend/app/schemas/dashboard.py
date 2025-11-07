"""数据看板Schema"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import date


class DashboardDataQuery(BaseModel):
    """看板数据查询参数"""
    metric: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    shop_ids: Optional[List[int]] = None
    platform_ids: Optional[List[int]] = None
    group_by: Optional[str] = None

