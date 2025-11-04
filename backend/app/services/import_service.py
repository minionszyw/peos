"""数据导入服务"""
import pandas as pd
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.products import WarehouseProduct, ShopProduct, Inventory
from app.models.sales import Sale
from app.models.shops import Shop


class ImportService:
    """数据导入服务类"""

    @staticmethod
    def read_file(file_path: str) -> pd.DataFrame:
        """
        根据文件扩展名读取Excel或CSV文件
        """
        if file_path.endswith('.csv'):
            return pd.read_csv(file_path)
        else:
            return pd.read_excel(file_path)

    @staticmethod
    def validate_and_import_warehouse_products(
        file_path: str,
        db: Session
    ) -> Tuple[int, int, List[str]]:
        """
        导入仓库商品
        返回：(总行数, 成功行数, 错误信息列表)
        """
        errors = []
        success_count = 0
        
        try:
            # 读取文件
            df = ImportService.read_file(file_path)
            total_rows = len(df)
            
            # 验证必需列
            required_columns = ['sku', 'name']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                errors.append(f"缺少必需列: {', '.join(missing_columns)}")
                return (total_rows, 0, errors)
            
            # 逐行导入
            for index, row in df.iterrows():
                try:
                    # 检查SKU是否已存在
                    existing = db.query(WarehouseProduct).filter(
                        WarehouseProduct.sku == str(row['sku'])
                    ).first()
                    
                    if existing:
                        # 更新现有商品
                        existing.name = str(row.get('name', ''))
                        if 'category' in row and pd.notna(row['category']):
                            existing.category = str(row['category'])
                        if 'cost_price' in row and pd.notna(row['cost_price']):
                            existing.cost_price = float(row['cost_price'])
                        if 'spec' in row and pd.notna(row['spec']):
                            existing.spec = str(row['spec'])
                    else:
                        # 创建新商品
                        product = WarehouseProduct(
                            sku=str(row['sku']),
                            name=str(row.get('name', '')),
                            category=str(row.get('category', '')) if pd.notna(row.get('category')) else None,
                            cost_price=float(row.get('cost_price', 0)) if pd.notna(row.get('cost_price')) else None,
                            spec=str(row.get('spec', '')) if pd.notna(row.get('spec')) else None,
                        )
                        db.add(product)
                    
                    success_count += 1
                    
                except Exception as e:
                    errors.append(f"第{index + 2}行错误: {str(e)}")
            
            db.commit()
            
        except Exception as e:
            errors.append(f"文件读取错误: {str(e)}")
            return (0, 0, errors)
        
        return (total_rows, success_count, errors)

    @staticmethod
    def validate_and_import_shop_products(
        file_path: str,
        db: Session
    ) -> Tuple[int, int, List[str]]:
        """
        导入店铺商品
        返回：(总行数, 成功行数, 错误信息列表)
        """
        errors = []
        success_count = 0
        
        try:
            df = ImportService.read_file(file_path)
            total_rows = len(df)
            
            # 验证必需列
            required_columns = ['shop_id', 'sku', 'title', 'price']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                errors.append(f"缺少必需列: {', '.join(missing_columns)}")
                return (total_rows, 0, errors)
            
            # 逐行导入
            for index, row in df.iterrows():
                try:
                    # 验证店铺是否存在
                    shop = db.query(Shop).filter(Shop.id == int(row['shop_id'])).first()
                    if not shop:
                        errors.append(f"第{index + 2}行: 店铺ID {row['shop_id']} 不存在")
                        continue
                    
                    # 查找仓库商品
                    warehouse_product = db.query(WarehouseProduct).filter(
                        WarehouseProduct.sku == str(row['sku'])
                    ).first()
                    
                    if not warehouse_product:
                        errors.append(f"第{index + 2}行: SKU {row['sku']} 在仓库中不存在")
                        continue
                    
                    # 创建店铺商品
                    shop_product = ShopProduct(
                        shop_id=int(row['shop_id']),
                        warehouse_product_id=warehouse_product.id,
                        product_url=str(row.get('product_url', '')) if pd.notna(row.get('product_url')) else None,
                        title=str(row['title']),
                        price=float(row['price']),
                        status=str(row.get('status', 'on_shelf')),
                        stock=int(row.get('stock', 0)) if pd.notna(row.get('stock')) else 0,
                    )
                    db.add(shop_product)
                    success_count += 1
                    
                except Exception as e:
                    errors.append(f"第{index + 2}行错误: {str(e)}")
            
            db.commit()
            
        except Exception as e:
            errors.append(f"文件读取错误: {str(e)}")
            return (0, 0, errors)
        
        return (total_rows, success_count, errors)

    @staticmethod
    def validate_and_import_inventory(
        file_path: str,
        db: Session
    ) -> Tuple[int, int, List[str]]:
        """
        导入库存数据
        返回：(总行数, 成功行数, 错误信息列表)
        """
        errors = []
        success_count = 0
        
        try:
            df = ImportService.read_file(file_path)
            total_rows = len(df)
            
            # 验证必需列
            required_columns = ['sku', 'quantity']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                errors.append(f"缺少必需列: {', '.join(missing_columns)}")
                return (total_rows, 0, errors)
            
            # 逐行导入
            for index, row in df.iterrows():
                try:
                    # 查找仓库商品
                    warehouse_product = db.query(WarehouseProduct).filter(
                        WarehouseProduct.sku == str(row['sku'])
                    ).first()
                    
                    if not warehouse_product:
                        errors.append(f"第{index + 2}行: SKU {row['sku']} 不存在")
                        continue
                    
                    # 检查库存是否已存在
                    existing = db.query(Inventory).filter(
                        Inventory.warehouse_product_id == warehouse_product.id
                    ).first()
                    
                    if existing:
                        # 更新库存
                        existing.quantity = int(row['quantity'])
                        if 'warehouse_location' in row and pd.notna(row['warehouse_location']):
                            existing.warehouse_location = str(row['warehouse_location'])
                    else:
                        # 创建新库存
                        inventory = Inventory(
                            warehouse_product_id=warehouse_product.id,
                            quantity=int(row['quantity']),
                            warehouse_location=str(row.get('warehouse_location', '')) if pd.notna(row.get('warehouse_location')) else None,
                        )
                        db.add(inventory)
                    
                    success_count += 1
                    
                except Exception as e:
                    errors.append(f"第{index + 2}行错误: {str(e)}")
            
            db.commit()
            
        except Exception as e:
            errors.append(f"文件读取错误: {str(e)}")
            return (0, 0, errors)
        
        return (total_rows, success_count, errors)

    @staticmethod
    def validate_and_import_sales(
        file_path: str,
        db: Session
    ) -> Tuple[int, int, List[str]]:
        """
        导入销售数据
        返回：(总行数, 成功行数, 错误信息列表)
        """
        errors = []
        success_count = 0
        
        try:
            df = ImportService.read_file(file_path)
            total_rows = len(df)

            # 验证必需列
            required_columns = ['shop_id', 'shop_product_id', 'quantity', 'amount', 'sale_date']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                errors.append(f"缺少必需列: {', '.join(missing_columns)}")
                return (total_rows, 0, errors)
            
            # 逐行导入
            for index, row in df.iterrows():
                try:
                    # 验证店铺是否存在
                    shop = db.query(Shop).filter(Shop.id == int(row['shop_id'])).first()
                    if not shop:
                        errors.append(f"第{index + 2}行: 店铺ID {row['shop_id']} 不存在")
                        continue
                    
                    # 验证店铺商品是否存在
                    shop_product = db.query(ShopProduct).filter(
                        ShopProduct.id == int(row['shop_product_id'])
                    ).first()
                    if not shop_product:
                        errors.append(f"第{index + 2}行: 店铺商品ID {row['shop_product_id']} 不存在")
                        continue
                    
                    # 创建销售记录
                    sale = Sale(
                        shop_id=int(row['shop_id']),
                        shop_product_id=int(row['shop_product_id']),
                        order_id=str(row.get('order_id', '')) if pd.notna(row.get('order_id')) else None,
                        quantity=int(row['quantity']),
                        amount=float(row['amount']),
                        profit=float(row.get('profit', 0)) if pd.notna(row.get('profit')) else None,
                        sale_date=pd.to_datetime(row['sale_date']).date(),
                    )
                    db.add(sale)
                    success_count += 1
                    
                except Exception as e:
                    errors.append(f"第{index + 2}行错误: {str(e)}")
            
            db.commit()
            
        except Exception as e:
            errors.append(f"文件读取错误: {str(e)}")
            return (0, 0, errors)
        
        return (total_rows, success_count, errors)

