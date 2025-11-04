/**
 * 商品相关类型定义
 */

// 仓库商品
export interface WarehouseProduct {
  id: number
  sku: string
  name: string
  category?: string
  cost_price?: number
  spec?: string
  created_at: string
  updated_at: string
}

// 店铺商品
export interface ShopProduct {
  id: number
  shop_id: number
  warehouse_product_id: number
  product_url?: string
  title: string
  price: number
  status: string
  stock: number
  created_at: string
  updated_at: string
  // 额外信息
  shop_name?: string
  sku?: string
  warehouse_product_name?: string
}

export interface ShopProductCreate {
  shop_id: number
  warehouse_product_id: number
  product_url?: string
  title: string
  price: number
  status?: string
  stock?: number
}

export interface BatchUpdateStatus {
  ids: number[]
  status: string
}

export interface BatchUpdatePrice {
  ids: number[]
  price: number
}

