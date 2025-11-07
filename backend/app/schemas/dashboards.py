from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DashboardBase(BaseModel):
    name: str = Field(..., max_length=100, description="看板名称")
    config_json: Optional[dict] = Field(None, description="配置JSON")


class DashboardCreate(DashboardBase):
    pass


class DashboardUpdate(BaseModel):
    name: Optional[str] = None
    config_json: Optional[dict] = None


class DashboardResponse(DashboardBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DashboardCloneRequest(BaseModel):
    name: str = Field(..., description="新看板名称")


# 看板数据查询相关
class DashboardDataQuery(BaseModel):
    metric: str = Field(..., description="指标类型")
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    shop_ids: Optional[list[int]] = None
    platform_ids: Optional[list[int]] = None
    group_by: Optional[str] = None


class SalesTrendResponse(BaseModel):
    dates: list[str]
    amounts: list[float]
    quantities: list[int]


class SalesRankingItem(BaseModel):
    id: int
    name: str
    amount: float
    quantity: int
    rank: int


class SalesRankingResponse(BaseModel):
    products: list[SalesRankingItem]
    shops: list[SalesRankingItem]
