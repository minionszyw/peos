/**
 * 平台数据管理页面（整合平台管理 + 店铺管理 + 数据表管理 + 数据导入）
 */
import { useState, useEffect } from 'react'
import { Row, Col, Tree, Button, Space, Modal, Form, Input, Select, message, Tag, Tooltip, Card, Upload, Alert } from 'antd'
import type { DataNode } from 'antd/es/tree'
import type { UploadProps } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShopOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  TableOutlined,
  UploadOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { getPlatforms, createPlatform, updatePlatform, deletePlatform, Platform } from '@/services/platforms'
import { getShopList, createShop, updateShop, deleteShop } from '@/services/shop'
import { getUserList } from '@/services/auth'
import { 
  getDataTableTree, 
  createDataTable, 
  updateDataTable, 
  deleteDataTable,
  getDataByTableId,
  DataTable as DataTableType,
} from '@/services/dataTable'
import { Shop } from '@/types/shop'
import { User } from '@/types/user'
import { useUserStore } from '@/stores/userStore'
import DataTable from './DataTable'
import FieldConfigEditor from './FieldConfigEditor'
import styles from './index.module.scss'

interface TreeDataNode extends DataNode {
  type: 'platform' | 'shop' | 'data_table'
  data?: Platform | Shop | DataTableType
  nodeData?: any
}

const PlatformData = () => {
  const { user } = useUserStore()
  const isAdmin = user?.role === 'admin'
  
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [treeData, setTreeData] = useState<TreeDataNode[]>([])
  const [selectedNode, setSelectedNode] = useState<TreeDataNode | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])

  // 平台弹窗
  const [platformModalVisible, setPlatformModalVisible] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null)
  const [platformForm] = Form.useForm()

  // 店铺弹窗
  const [shopModalVisible, setShopModalVisible] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [shopForm] = Form.useForm()

  // 数据表弹窗
  const [dataTableModalVisible, setDataTableModalVisible] = useState(false)
  const [editingDataTable, setEditingDataTable] = useState<DataTableType | null>(null)
  const [currentShopForTable, setCurrentShopForTable] = useState<Shop | null>(null)
  const [dataTableForm] = Form.useForm()

  // 数据表数据刷新
  const [dataTableRefreshKey, setDataTableRefreshKey] = useState(0)

  // 导入数据上传状态
  const [importLoading, setImportLoading] = useState(false)

  // 表格导入相关状态
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parsedFields, setParsedFields] = useState<any[]>([])
  const [parseLoading, setParseLoading] = useState(false)
  const [createMethod, setCreateMethod] = useState<'import' | 'custom'>('custom')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([loadPlatforms(), loadShops(), loadUsers(), loadTreeData()])
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

  const loadTreeData = async (keepSelection = false) => {
    try {
      const tree = await getDataTableTree()
      const treeNodes = buildTreeNodes(tree)
      setTreeData(treeNodes)
      // 默认展开所有节点
      const allKeys = getAllKeys(treeNodes)
      setExpandedKeys(allKeys)
      
      // 如果需要保持选中状态，重新找到并更新选中的节点
      if (keepSelection && selectedNode) {
        const updatedNode = findNodeInTree(treeNodes, selectedNode.key)
        if (updatedNode) {
          setSelectedNode(updatedNode)
        }
      }
    } catch (error) {
      message.error('加载数据失败')
    }
  }

  // 在树中查找节点
  const findNodeInTree = (nodes: TreeDataNode[], key: React.Key): TreeDataNode | null => {
    for (const node of nodes) {
      if (node.key === key) {
        return node
      }
      if (node.children) {
        const found = findNodeInTree(node.children, key)
        if (found) return found
      }
    }
    return null
  }

  // 获取所有节点的 key
  const getAllKeys = (nodes: TreeDataNode[]): React.Key[] => {
    const keys: React.Key[] = []
    const traverse = (nodeList: TreeDataNode[]) => {
      nodeList.forEach((node) => {
        if (!node.isLeaf) {
          keys.push(node.key)
        }
        if (node.children) {
          traverse(node.children)
        }
      })
    }
    traverse(nodes)
    return keys
  }

  // 递归构建树形节点
  const buildTreeNodes = (nodes: any[]): TreeDataNode[] => {
    return nodes.map((node) => {
      const treeNode: TreeDataNode = {
        key: `${node.type}-${node.id}`,
        type: node.type,
        nodeData: node,
        children: node.children ? buildTreeNodes(node.children) : undefined,
      }

      // 根据类型渲染不同的标题
      if (node.type === 'platform') {
        treeNode.title = (
          <div className={styles.treeNode}>
            <AppstoreOutlined />
            <span className={styles.nodeName}>{node.name}</span>
            {node.children && <Tag color="blue">{node.children.length}</Tag>}
          </div>
        )
      } else if (node.type === 'shop') {
        treeNode.title = (
          <div className={styles.treeNode}>
            <ShopOutlined />
            <span className={styles.nodeName}>{node.name}</span>
            {node.children && <Tag color="purple">{node.children.length}</Tag>}
          </div>
        )
      } else if (node.type === 'data_table') {
        treeNode.title = (
          <div className={styles.treeNode}>
            <TableOutlined />
            <span className={styles.nodeName}>{node.name}</span>
          </div>
        )
        treeNode.isLeaf = true
      }

      return treeNode
    })
  }

  // 树节点选择（点击节点时触发）
  const handleTreeSelect = (keys: React.Key[], info: any) => {
    const node = info.node as TreeDataNode
    
    // 总是设置选中的节点
    setSelectedNode(node)
    
    // 如果是非叶子节点（平台或店铺），切换展开/折叠状态
    if (!node.isLeaf && node.key) {
      const key = node.key
      setExpandedKeys((prevKeys) => {
        if (prevKeys.includes(key)) {
          // 如果已展开，则折叠
          return prevKeys.filter((k) => k !== key)
        } else {
          // 如果已折叠，则展开
          return [...prevKeys, key]
        }
      })
    }
  }

  // 树节点展开/折叠（点击+/-号时触发）
  const handleTreeExpand = (keys: React.Key[]) => {
    setExpandedKeys(keys)
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
          loadTreeData()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // ========== 数据表管理 ==========
  const handleAddDataTable = (shopNode: any) => {
    setEditingDataTable(null)
    setCurrentShopForTable({ id: shopNode.id, name: shopNode.name } as Shop)
    dataTableForm.resetFields()
    dataTableForm.setFieldsValue({ 
      shop_id: shopNode.id,
      create_method: 'custom',
      table_type: 'custom',
      fields: [],
      sort_order: 0,
      is_active: 1
    })
    // 重置表格导入状态
    setUploadedFile(null)
    setParsedFields([])
    setCreateMethod('custom')
    setDataTableModalVisible(true)
  }

  const handleEditDataTable = (dataTable: any) => {
    setEditingDataTable(dataTable as DataTableType)
    dataTableForm.setFieldsValue({
      name: dataTable.name,
      create_method: 'custom', // 编辑模式只能用自定义
      table_type: dataTable.table_type,
      description: dataTable.description,
      fields: dataTable.fields || [],
      sort_order: dataTable.sort_order,
      is_active: dataTable.is_active,
    })
    setCreateMethod('custom')
    setDataTableModalVisible(true)
  }

  const handleSaveDataTable = async () => {
    try {
      const values = await dataTableForm.validateFields()
      
      // 验证字段配置
      if (!values.fields || values.fields.length === 0) {
        message.error('请至少添加一个字段')
        return
      }
      
      if (editingDataTable) {
        await updateDataTable(editingDataTable.id, values)
        message.success('更新数据表成功')
        
        // 更新选中节点的字段信息，使右侧立即显示更新后的字段
        if (selectedNode && selectedNode.type === 'data_table' && selectedNode.nodeData.id === editingDataTable.id) {
          setSelectedNode({
            ...selectedNode,
            nodeData: {
              ...selectedNode.nodeData,
              ...values
            }
          })
        }
      } else {
        // 创建数据表
        const newTable = await createDataTable(values)
        
        // 如果是表格导入模式且有上传的文件，导入数据
        if (values.create_method === 'import' && uploadedFile) {
          try {
            message.loading({ content: '正在导入数据...', key: 'import', duration: 0 })
            
            const formData = new FormData()
            formData.append('file', uploadedFile)
            formData.append('data_table_id', newTable.id.toString())
            
            const response = await fetch('/api/data-tables/import-data', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
              body: formData,
            })
            
            if (!response.ok) {
              throw new Error('数据导入失败')
            }
            
            const result = await response.json()
            message.success({ 
              content: `数据表创建成功！已导入 ${result.imported_rows} 条数据`, 
              key: 'import' 
            })
          } catch (importError: any) {
            message.warning({ 
              content: `数据表创建成功，但数据导入失败: ${importError.message}`, 
              key: 'import' 
            })
          }
        } else {
          message.success('新建数据表成功')
        }
      }
      
      setDataTableModalVisible(false)
      // 重新加载树数据以更新显示，并保持当前选中状态
      await loadTreeData(true)
    } catch (error: any) {
      console.error('保存数据表失败:', error)
      message.error(error.message || '保存失败')
    }
  }

  // 处理文件上传和解析
  const handleFileUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      setParseLoading(true)
      const uploadFile = file as File
      
      // 调用后端API解析Excel文件
      const formData = new FormData()
      formData.append('file', uploadFile)
      
      const response = await fetch('/api/data-tables/parse-excel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('文件解析失败')
      }
      
      const result = await response.json()
      
      // 设置解析结果
      setParsedFields(result.fields)
      setUploadedFile(uploadFile)
      dataTableForm.setFieldsValue({ fields: result.fields })
      
      message.success('文件解析成功！请确认字段配置')
      onSuccess?.(result)
    } catch (error: any) {
      message.error(error.message || '文件上传失败')
      onError?.(error)
    } finally {
      setParseLoading(false)
    }
  }

  // 移除上传的文件
  const handleRemoveFile = () => {
    setUploadedFile(null)
    setParsedFields([])
    dataTableForm.setFieldsValue({ fields: [] })
  }

  const handleDeleteDataTable = (dataTable: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除数据表"${dataTable.name}"吗？`,
      onOk: async () => {
        try {
          await deleteDataTable(dataTable.id)
          message.success('删除成功')
          loadTreeData()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // 刷新数据表数据
  const handleRefreshTableData = () => {
    setDataTableRefreshKey(prev => prev + 1)
  }

  // 导入数据处理
  const handleImportData = () => {
    // 触发 DataTable 组件中的导入操作
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.xlsx,.xls,.csv'
    fileInput.onchange = async (e: any) => {
      const file = e.target.files?.[0]
      if (!file) return
      
      try {
        setImportLoading(true)
        const { uploadAndImport } = await import('@/services/import')
        const result = await uploadAndImport(
          file,
          selectedNode.nodeData.table_type,
          selectedNode.nodeData.id,
          selectedNode.nodeData.shop_id
        )

        if (result.status === 'success') {
          message.success(`导入成功！共${result.total_rows}条，成功${result.success_rows}条`)
          handleRefreshTableData()
          loadTreeData()
        } else if (result.status === 'partial_success') {
          Modal.warning({
            title: '部分导入成功',
            content: (
              <div>
                <p>共{result.total_rows}条，成功{result.success_rows}条，失败{result.error_count}条</p>
                {result.errors && result.errors.length > 0 && (
                  <div style={{ maxHeight: 200, overflow: 'auto' }}>
                    <p>错误信息：</p>
                    <ul>
                      {result.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ),
          })
          handleRefreshTableData()
          loadTreeData()
        } else {
          message.error('导入失败')
        }
      } catch (error: any) {
        message.error(error.message || '导入失败')
      } finally {
        setImportLoading(false)
      }
    }
    fileInput.click()
  }

  // 渲染右侧操作栏
  const renderActions = () => {
    if (!selectedNode) {
      return isAdmin ? (
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPlatform}>
          新建平台
        </Button>
      ) : null
    }

    if (selectedNode.type === 'platform' && isAdmin) {
      return (
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddShop(selectedNode.nodeData)}>
            新建店铺
          </Button>
          <Button icon={<EditOutlined />} onClick={() => handleEditPlatform(selectedNode.nodeData)}>
            编辑平台
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeletePlatform(selectedNode.nodeData)}>
            删除平台
          </Button>
        </Space>
      )
    }

    if (selectedNode.type === 'shop') {
      return (
        <Space>
          {isAdmin && (
            <>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddDataTable(selectedNode.nodeData)}>
                新建数据表
              </Button>
              <Button icon={<EditOutlined />} onClick={() => handleEditShop(selectedNode.nodeData)}>
                编辑店铺
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteShop(selectedNode.nodeData)}>
                删除店铺
              </Button>
            </>
          )}
        </Space>
      )
    }

    if (selectedNode.type === 'data_table') {
      return (
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefreshTableData}>
            刷新
          </Button>
          <Button type="primary" icon={<UploadOutlined />} loading={importLoading} onClick={handleImportData}>
            导入数据
          </Button>
          {isAdmin && (
            <>
              <Button icon={<EditOutlined />} onClick={() => handleEditDataTable(selectedNode.nodeData)}>
                编辑数据表
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteDataTable(selectedNode.nodeData)}>
                删除数据表
              </Button>
            </>
          )}
        </Space>
      )
    }
  }

  return (
    <div className={styles.platformData}>
      <div className={styles.header}>
        <h2>平台数据管理</h2>
        <Space>
          {/* 只在非数据表节点时显示总刷新按钮 */}
          {(!selectedNode || selectedNode.type !== 'data_table') && (
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
          )}
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
              treeData={treeData}
              expandedKeys={expandedKeys}
              onSelect={handleTreeSelect}
              onExpand={handleTreeExpand}
              className={styles.tree}
              blockNode
            />
          </div>
        </Col>

        {/* 右侧数据表 */}
        <Col span={18}>
          <DataTable
            selectedNode={selectedNode}
            shops={shops}
            onRefresh={loadShops}
            refreshKey={dataTableRefreshKey}
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

      {/* 数据表弹窗 */}
      <Modal
        title={editingDataTable ? '编辑数据表' : '新建数据表'}
        open={dataTableModalVisible}
        onOk={handleSaveDataTable}
        onCancel={() => setDataTableModalVisible(false)}
        width={800}
      >
        <Form form={dataTableForm} layout="vertical">
          {currentShopForTable && !editingDataTable && (
            <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
              <div>店铺：<strong>{currentShopForTable.name}</strong></div>
            </Card>
          )}
          
          <Form.Item name="shop_id" hidden>
            <Input />
          </Form.Item>
          
          <Form.Item 
            name="name" 
            label="数据表名称" 
            rules={[{ required: true, message: '请输入数据表名称' }]}
          >
            <Input placeholder="例如：商品管理表、销售统计表" />
          </Form.Item>

          <Form.Item 
            name="create_method" 
            label="创建方式" 
            rules={[{ required: true, message: '请选择创建方式' }]}
            initialValue="custom"
          >
            <Select 
              placeholder="选择创建方式" 
              disabled={!!editingDataTable}
              onChange={(value) => {
                // 切换创建方式时的处理
                setCreateMethod(value)
                if (value === 'import') {
                  // 清空字段配置，等待文件上传解析
                  dataTableForm.setFieldsValue({ fields: [] })
                  setParsedFields([])
                  setUploadedFile(null)
                }
              }}
            >
              <Select.Option value="import">表格导入</Select.Option>
              <Select.Option value="custom">自定义</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="table_type" 
            label="数据类型" 
            rules={[{ required: true, message: '请选择数据类型' }]}
            initialValue="custom"
          >
            <Select placeholder="用于数据分类" disabled={!!editingDataTable}>
              <Select.Option value="product">商品</Select.Option>
              <Select.Option value="sales">销售</Select.Option>
              <Select.Option value="inventory">库存</Select.Option>
              <Select.Option value="custom">自定义</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="数据表用途说明（可选）" />
          </Form.Item>

          {/* 表格导入时显示文件上传 */}
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.create_method !== curr.create_method}>
            {({ getFieldValue }) => {
              const method = getFieldValue('create_method')
              if (method === 'import' && !editingDataTable) {
                return (
                  <Form.Item label="上传表格文件">
                    {!uploadedFile ? (
                      <Upload.Dragger
                        name="file"
                        accept=".xlsx,.xls,.csv"
                        maxCount={1}
                        customRequest={handleFileUpload}
                        showUploadList={false}
                      >
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">点击或拖拽Excel/CSV文件到此处</p>
                        <p className="ant-upload-hint">
                          支持 .xlsx、.xls、.csv 格式，第一行将作为字段名
                        </p>
                      </Upload.Dragger>
                    ) : (
                      <Alert
                        message={`已上传文件：${uploadedFile.name}`}
                        description={`解析到 ${parsedFields.length} 个字段，请在下方确认或修改字段配置`}
                        type="success"
                        showIcon
                        closable
                        onClose={handleRemoveFile}
                        style={{ marginBottom: 16 }}
                      />
                    )}
                    {parseLoading && <p style={{ textAlign: 'center', color: '#1890ff' }}>正在解析文件...</p>}
                  </Form.Item>
                )
              }
              return null
            }}
          </Form.Item>

          <Form.Item 
            name="fields" 
            label="字段配置"
            rules={[
              { required: true, message: '请至少添加一个字段' },
              {
                validator: (_, value) => {
                  if (!value || value.length === 0) {
                    return Promise.reject('请至少添加一个字段')
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <FieldConfigEditor />
          </Form.Item>

          <Form.Item name="sort_order" label="排序" initialValue={0} hidden>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="is_active" initialValue={1} hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PlatformData
