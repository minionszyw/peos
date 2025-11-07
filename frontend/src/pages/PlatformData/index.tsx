/**
 * 平台数据管理页面（整合平台管理 + 店铺管理 + 数据导入）
 */
import { useState, useEffect } from 'react'
import { Row, Col, Tree, Button, Space, Modal, Form, Input, Select, message, Tag, Tooltip } from 'antd'
import type { DataNode } from 'antd/es/tree'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShopOutlined,
  AppstoreOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { getPlatforms, createPlatform, updatePlatform, deletePlatform, Platform } from '@/services/platforms'
import { getShopList, createShop, updateShop, deleteShop } from '@/services/shop'
import { getUserList } from '@/services/auth'
import { Shop } from '@/types/shop'
import { User } from '@/types/user'
import DataTable from './DataTable'
import styles from './index.module.scss'

interface TreeDataNode extends DataNode {
  type: 'platform' | 'shop'
  data: Platform | Shop
}

const PlatformData = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [treeData, setTreeData] = useState<TreeDataNode[]>([])
  const [selectedNode, setSelectedNode] = useState<TreeDataNode | null>(null)
  const [loading, setLoading] = useState(false)

  // 平台弹窗
  const [platformModalVisible, setPlatformModalVisible] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null)
  const [platformForm] = Form.useForm()

  // 店铺弹窗
  const [shopModalVisible, setShopModalVisible] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [shopForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([loadPlatforms(), loadShops(), loadUsers()])
  }

  const loadPlatforms = async () => {
    try {
      setLoading(true)
      const data = await getPlatforms()
      setPlatforms(data)
    } catch (error) {
      message.error('加载平台失败')
    } finally {
      setLoading(false)
    }
  }

  const loadShops = async () => {
    try {
      const data = await getShopList()
      setShops(data)
    } catch (error) {
      message.error('加载店铺失败')
    }
  }

  const loadUsers = async () => {
    try {
      const data = await getUserList()
      setUsers(data)
    } catch (error) {
      console.error('加载用户失败:', error)
    }
  }

  // 构建树形数据
  useEffect(() => {
    const tree: TreeDataNode[] = platforms.map((platform) => {
      const platformShops = shops.filter((shop) => shop.platform === platform.name)
      return {
        title: (
          <div className={styles.treeNode}>
            <AppstoreOutlined />
            <span className={styles.nodeName}>{platform.name}</span>
            <Tag color="blue">{platformShops.length}</Tag>
          </div>
        ),
        key: `platform-${platform.id}`,
        type: 'platform' as const,
        data: platform,
        children: platformShops.map((shop) => ({
          title: (
            <div className={styles.treeNode}>
              <ShopOutlined />
              <span className={styles.nodeName}>{shop.name}</span>
              <Tag color={shop.status === 'active' ? 'green' : 'red'}>
                {shop.status === 'active' ? '启用' : '禁用'}
              </Tag>
            </div>
          ),
          key: `shop-${shop.id}`,
          type: 'shop' as const,
          data: shop,
          isLeaf: true,
        })),
      }
    })
    setTreeData(tree)
  }, [platforms, shops])

  // 树节点选择
  const handleTreeSelect = (keys: React.Key[], info: any) => {
    if (keys.length > 0) {
      setSelectedNode(info.node as TreeDataNode)
    }
  }

  // ========== 平台管理 ==========
  const handleAddPlatform = () => {
    setEditingPlatform(null)
    platformForm.resetFields()
    setPlatformModalVisible(true)
  }

  const handleEditPlatform = (platform: Platform) => {
    setEditingPlatform(platform)
    platformForm.setFieldsValue(platform)
    setPlatformModalVisible(true)
  }

  const handleSavePlatform = async () => {
    try {
      const values = await platformForm.validateFields()
      if (editingPlatform) {
        await updatePlatform(editingPlatform.id, values)
        message.success('更新平台成功')
      } else {
        await createPlatform(values)
        message.success('新建平台成功')
      }
      setPlatformModalVisible(false)
      loadPlatforms()
    } catch (error) {
      console.error('保存平台失败:', error)
    }
  }

  const handleDeletePlatform = (platform: Platform) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除平台"${platform.name}"吗？`,
      onOk: async () => {
        try {
          await deletePlatform(platform.id)
          message.success('删除成功')
          loadPlatforms()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // ========== 店铺管理 ==========
  const handleAddShop = (platform?: Platform) => {
    setEditingShop(null)
    shopForm.resetFields()
    if (platform) {
      shopForm.setFieldsValue({ platform: platform.name })
    }
    setShopModalVisible(true)
  }

  const handleEditShop = (shop: Shop) => {
    setEditingShop(shop)
    shopForm.setFieldsValue(shop)
    setShopModalVisible(true)
  }

  const handleSaveShop = async () => {
    try {
      const values = await shopForm.validateFields()
      if (editingShop) {
        await updateShop(editingShop.id, values)
        message.success('更新店铺成功')
      } else {
        await createShop(values)
        message.success('新建店铺成功')
      }
      setShopModalVisible(false)
      loadShops()
    } catch (error) {
      console.error('保存店铺失败:', error)
    }
  }

  const handleDeleteShop = (shop: Shop) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除店铺"${shop.name}"吗？`,
      onOk: async () => {
        try {
          await deleteShop(shop.id)
          message.success('删除成功')
          loadShops()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // 渲染右侧操作栏
  const renderActions = () => {
    if (!selectedNode) {
      return (
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPlatform}>
          新建平台
        </Button>
      )
    }

    if (selectedNode.type === 'platform') {
      const platform = selectedNode.data as Platform
      return (
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddShop(platform)}>
            新建店铺
          </Button>
          <Button icon={<EditOutlined />} onClick={() => handleEditPlatform(platform)}>
            编辑平台
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeletePlatform(platform)}>
            删除平台
          </Button>
        </Space>
      )
    }

    if (selectedNode.type === 'shop') {
      const shop = selectedNode.data as Shop
      return (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditShop(shop)}>
            编辑店铺
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteShop(shop)}>
            删除店铺
          </Button>
        </Space>
      )
    }
  }

  return (
    <div className={styles.platformData}>
      <div className={styles.header}>
        <h2>平台数据管理</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>
          {renderActions()}
        </Space>
      </div>

      <Row gutter={16} className={styles.content}>
        {/* 左侧树形结构 */}
        <Col span={6}>
          <div className={styles.treePanel}>
            <div className={styles.treeHeader}>
              <h3>平台与店铺</h3>
              <Tooltip title="新建平台">
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={handleAddPlatform}
                />
              </Tooltip>
            </div>
            <Tree
              showLine
              defaultExpandAll
              treeData={treeData}
              onSelect={handleTreeSelect}
              className={styles.tree}
            />
          </div>
        </Col>

        {/* 右侧数据表 */}
        <Col span={18}>
          <DataTable
            selectedNode={selectedNode}
            shops={shops}
            onRefresh={loadShops}
          />
        </Col>
      </Row>

      {/* 平台弹窗 */}
      <Modal
        title={editingPlatform ? '编辑平台' : '新建平台'}
        open={platformModalVisible}
        onOk={handleSavePlatform}
        onCancel={() => setPlatformModalVisible(false)}
        width={600}
      >
        <Form form={platformForm} layout="vertical">
          <Form.Item name="name" label="平台名称" rules={[{ required: true, message: '请输入平台名称' }]}>
            <Input placeholder="例如：淘宝、京东" />
          </Form.Item>
          <Form.Item name="code" label="平台代码" rules={[{ required: true, message: '请输入平台代码' }]}>
            <Input placeholder="例如：taobao、jd" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="平台描述信息" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="图标URL或类名" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序" initialValue={0}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 店铺弹窗 */}
      <Modal
        title={editingShop ? '编辑店铺' : '新建店铺'}
        open={shopModalVisible}
        onOk={handleSaveShop}
        onCancel={() => setShopModalVisible(false)}
        width={600}
      >
        <Form form={shopForm} layout="vertical">
          <Form.Item name="name" label="店铺名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="platform" label="平台" rules={[{ required: true }]}>
            <Select placeholder="请选择平台">
              {platforms.map((platform) => (
                <Select.Option key={platform.id} value={platform.name}>
                  {platform.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="account" label="店铺账号">
            <Input />
          </Form.Item>
          <Form.Item name="manager_id" label="管理员">
            <Select placeholder="请选择管理员" allowClear>
              {users.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PlatformData
