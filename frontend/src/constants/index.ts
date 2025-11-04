/**
 * 常量定义
 */

// 商品状态
export const PRODUCT_STATUS = {
  ON_SHELF: 'on_shelf',
  OFF_SHELF: 'off_shelf',
} as const

export const PRODUCT_STATUS_TEXT = {
  [PRODUCT_STATUS.ON_SHELF]: '在售',
  [PRODUCT_STATUS.OFF_SHELF]: '下架',
}

// 店铺状态
export const SHOP_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

export const SHOP_STATUS_TEXT = {
  [SHOP_STATUS.ACTIVE]: '启用',
  [SHOP_STATUS.INACTIVE]: '禁用',
}

// 用户角色
export const USER_ROLE = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
} as const

export const USER_ROLE_TEXT = {
  [USER_ROLE.ADMIN]: '管理员',
  [USER_ROLE.OPERATOR]: '运营',
}

// 导入状态
export const IMPORT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  PARTIAL_SUCCESS: 'partial_success',
  FAILED: 'failed',
} as const

export const IMPORT_STATUS_TEXT = {
  [IMPORT_STATUS.PENDING]: '处理中',
  [IMPORT_STATUS.SUCCESS]: '成功',
  [IMPORT_STATUS.PARTIAL_SUCCESS]: '部分成功',
  [IMPORT_STATUS.FAILED]: '失败',
}

// 电商平台
export const PLATFORMS = [
  '淘宝',
  '京东',
  '拼多多',
  '天猫',
  '抖音',
  '快手',
  '其他',
]

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100, 200],
}

