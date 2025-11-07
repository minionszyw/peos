"""看板数据源API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import Optional, List
from app.core.database import get_db
from app.models.sales import Sale
from app.models.shops import Shop
from app.models.products import ShopProduct
from app.models.users import User
from app.schemas.dashboards import DashboardDataQuery
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/query")
def query_data(
    query: DashboardDataQuery,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """灵活的数据查询（支持多种维度）"""
    # 基础查询
    base_query = db.query(Sale)
    
    # 日期筛选
    if query.start_date:
        base_query = base_query.filter(Sale.sale_date >= query.start_date)
    if query.end_date:
        base_query = base_query.filter(Sale.sale_date <= query.end_date)
    
    # 店铺筛选
    if query.shop_ids:
        base_query = base_query.filter(Sale.shop_id.in_(query.shop_ids))
    
    # 平台筛选
    if query.platform_ids:
        base_query = base_query.join(Shop).filter(Shop.platform_id.in_(query.platform_ids))
    
    # 根据指标类型返回不同的结果
    if query.metric == "sales_total":
        result = base_query.with_entities(
            func.sum(Sale.amount).label("total_amount"),
            func.sum(Sale.quantity).label("total_quantity"),
            func.count(Sale.id).label("total_orders")
        ).first()
        
        return {
            "total_amount": float(result.total_amount or 0),
            "total_quantity": int(result.total_quantity or 0),
            "total_orders": int(result.total_orders or 0)
        }
    
    elif query.metric == "sales_by_date":
        results = base_query.with_entities(
            Sale.sale_date,
            func.sum(Sale.amount).label("amount"),
            func.sum(Sale.quantity).label("quantity")
        ).group_by(Sale.sale_date).order_by(Sale.sale_date).all()
        
        return {
            "data": [{
                "date": str(r.sale_date),
                "amount": float(r.amount or 0),
                "quantity": int(r.quantity or 0)
            } for r in results]
        }
    
    else:
        raise HTTPException(status_code=400, detail="不支持的指标类型")


@router.get("/summary")
def get_dashboard_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    shop_id: Optional[int] = None,
    platform: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """获取数据汇总"""
    # 默认最近30天
    if not end_date:
        end_date = datetime.now().date().isoformat()
    if not start_date:
        start_date = (datetime.now().date() - timedelta(days=30)).isoformat()
    
    # 基础查询
    query = db.query(Sale).filter(
        Sale.sale_date >= start_date,
        Sale.sale_date <= end_date
    )
    
    # 店铺筛选
    if shop_id:
        query = query.filter(Sale.shop_id == shop_id)
    
    # 平台筛选
    if platform:
        query = query.join(Shop).filter(Shop.platform == platform)
    
    # 统计数据
    stats = query.with_entities(
        func.sum(Sale.amount).label("total_sales"),
        func.count(Sale.id).label("total_orders"),
        func.avg(Sale.amount).label("avg_order_amount")
    ).first()
    
    # 活跃店铺数
    active_shops = db.query(func.count(func.distinct(Sale.shop_id))).filter(
        Sale.sale_date >= start_date,
        Sale.sale_date <= end_date
    ).scalar()
    
    return {
        "total_sales": float(stats.total_sales or 0),
        "total_orders": int(stats.total_orders or 0),
        "avg_order_amount": float(stats.avg_order_amount or 0),
        "active_shops": int(active_shops or 0)
    }


@router.get("/sales/trend")
def get_sales_trend(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    shop_id: Optional[int] = None,
    platform: Optional[str] = None,
    group_by: str = "day",
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """获取销售趋势数据"""
    # 默认最近30天
    if not end_date:
        end_date = datetime.now().date().isoformat()
    if not start_date:
        start_date = (datetime.now().date() - timedelta(days=30)).isoformat()
    
    query = db.query(
        Sale.sale_date,
        func.sum(Sale.amount).label("total_amount"),
        func.sum(Sale.quantity).label("quantity")
    ).filter(
        Sale.sale_date >= start_date,
        Sale.sale_date <= end_date
    )
    
    # 店铺筛选
    if shop_id:
        query = query.filter(Sale.shop_id == shop_id)
    
    # 平台筛选
    if platform:
        query = query.join(Shop).filter(Shop.platform == platform)
    
    results = query.group_by(Sale.sale_date).order_by(Sale.sale_date).all()
    
    return [{
        "date": str(r.sale_date),
        "total_amount": float(r.total_amount or 0),
        "quantity": int(r.quantity or 0)
    } for r in results]


@router.get("/sales/ranking")
def get_sales_ranking(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    shop_id: Optional[int] = None,
    platform: Optional[str] = None,
    type: str = "product",
    limit: int = 10,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """获取销售排行"""
    # 默认最近30天
    if not end_date:
        end_date = datetime.now().date().isoformat()
    if not start_date:
        start_date = (datetime.now().date() - timedelta(days=30)).isoformat()
    
    if type == "product":
        # 商品排行
        query = db.query(
            Sale.shop_product_id,
            ShopProduct.title,
            func.sum(Sale.amount).label("total_amount"),
            func.sum(Sale.quantity).label("quantity")
        ).join(ShopProduct).filter(
            Sale.sale_date >= start_date,
            Sale.sale_date <= end_date
        )
        
        if shop_id:
            query = query.filter(Sale.shop_id == shop_id)
        if platform:
            query = query.join(Shop).filter(Shop.platform == platform)
        
        results = query.group_by(
            Sale.shop_product_id,
            ShopProduct.title
        ).order_by(desc("total_amount")).limit(limit).all()
        
        return [{
            "product_id": r.shop_product_id,
            "product_name": r.title,
            "total_amount": float(r.total_amount or 0),
            "quantity": int(r.quantity or 0)
        } for r in results]
    
    else:
        # 店铺排行
        query = db.query(
            Sale.shop_id,
            Shop.name,
            func.sum(Sale.amount).label("total_amount"),
            func.sum(Sale.quantity).label("quantity")
        ).join(Shop).filter(
            Sale.sale_date >= start_date,
            Sale.sale_date <= end_date
        )
        
        if platform:
            query = query.filter(Shop.platform == platform)
        
        results = query.group_by(
            Sale.shop_id,
            Shop.name
        ).order_by(desc("total_amount")).limit(limit).all()
        
        return [{
            "shop_id": r.shop_id,
            "shop_name": r.name,
            "total_amount": float(r.total_amount or 0),
            "quantity": int(r.quantity or 0)
        } for r in results]


@router.get("/products/analysis")
def get_products_analysis(
    shop_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """商品分析"""
    # 默认最近30天
    if not end_date:
        end_date = datetime.now().date().isoformat()
    if not start_date:
        start_date = (datetime.now().date() - timedelta(days=30)).isoformat()
    
    query = db.query(
        Sale.shop_product_id,
        ShopProduct.title,
        func.sum(Sale.amount).label("total_amount"),
        func.sum(Sale.quantity).label("total_quantity"),
        func.avg(Sale.amount / Sale.quantity).label("avg_price"),
        func.count(Sale.id).label("order_count")
    ).join(ShopProduct).filter(
        Sale.sale_date >= start_date,
        Sale.sale_date <= end_date
    )
    
    if shop_id:
        query = query.filter(Sale.shop_id == shop_id)
    
    results = query.group_by(
        Sale.shop_product_id,
        ShopProduct.title
    ).all()
    
    return {
        "data": [{
            "product_id": r.shop_product_id,
            "product_name": r.title,
            "total_amount": float(r.total_amount or 0),
            "total_quantity": int(r.total_quantity or 0),
            "avg_price": float(r.avg_price or 0),
            "order_count": int(r.order_count or 0)
        } for r in results]
    }


@router.get("/shops/comparison")
def get_shops_comparison(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """店铺对比分析"""
    # 默认最近30天
    if not end_date:
        end_date = datetime.now().date().isoformat()
    if not start_date:
        start_date = (datetime.now().date() - timedelta(days=30)).isoformat()
    
    results = db.query(
        Sale.shop_id,
        Shop.name,
        Shop.platform,
        func.sum(Sale.amount).label("total_amount"),
        func.sum(Sale.quantity).label("total_quantity"),
        func.sum(Sale.profit).label("total_profit"),
        func.count(Sale.id).label("order_count")
    ).join(Shop).filter(
        Sale.sale_date >= start_date,
        Sale.sale_date <= end_date
    ).group_by(
        Sale.shop_id,
        Shop.name,
        Shop.platform
    ).all()
    
    return {
        "data": [{
            "shop_id": r.shop_id,
            "shop_name": r.name,
            "platform": r.platform,
            "total_amount": float(r.total_amount or 0),
            "total_quantity": int(r.total_quantity or 0),
            "total_profit": float(r.total_profit or 0) if r.total_profit else 0,
            "order_count": int(r.order_count or 0),
            "profit_rate": (float(r.total_profit or 0) / float(r.total_amount or 1)) * 100 if r.total_amount else 0
        } for r in results]
    }
