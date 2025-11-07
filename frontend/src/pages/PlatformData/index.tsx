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
  
  // 导入配置弹窗
  const [importConfigVisible, setImportConfigVisible] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importMode, setImportMode] = useState<'append' | 'overwrite'>('append')
  const [errorStrategy, setErrorStrategy] = useState<'skip' | 'abort'>('skip')

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
      create_method: 'import', // 默认为表格导入
      table_type: 'custom', // 固定为自定义
      fields: [],
      sort_order: 0,
      is_active: 1
    })
    // 重置表格导入状态
    setUploadedFile(null)
    setParsedFields([])
    setCreateMethod('import') // 默认为表格导入
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

  // 打开导入配置弹窗
  const handleImportData = () => {
    if (!selectedNode || selectedNode.type !== 'data_table') {
      message.error('请选择数据表')
      return
    }

    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.xlsx,.xls,.csv'
    fileInput.onchange = (e: any) => {
      const file = e.target.files?.[0]
      if (file) {
        setImportFile(file)
        setImportMode('append')
        setErrorStrategy('skip')
        setImportConfigVisible(true)
      }
    }
    fileInput.click()
  }

  // 执行导入
  const executeImport = async () => {
    if (!importFile || !selectedNode) return
    
    try {
      setImportLoading(true)
      setImportConfigVisible(false) // 关闭配置弹窗
      message.loading({ content: '正在导入数据...', key: 'import', duration: 0 })
      
      // 调用新的数据表导入接口
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('data_table_id', selectedNode.nodeData.id.toString())
      formData.append('import_mode', importMode)
      formData.append('error_strategy', errorStrategy)
      
      const response = await fetch('/api/data-tables/import-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: '导入失败' }))
        throw new Error(errorData.detail || '导入失败')
      }
      
      const result = await response.json()
      
      // 关闭 loading message
      message.destroy('import')
      
      if (result.success) {
        if (result.error_count > 0) {
          // 有部分错误
          Modal.warning({
            title: '部分数据导入成功',
            width: 600,
            content: (
              <div>
                <p>共 {result.total_rows} 条数据，成功导入 {result.imported_rows} 条，失败 {result.error_count} 条</p>
                {result.errors && result.errors.length > 0 && (
                  <div style={{ maxHeight: 300, overflow: 'auto', marginTop: 16, background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                    <p style={{ fontWeight: 'bold', marginBottom: 8 }}>错误信息：</p>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {result.errors.map((error: string, index: number) => (
                        <li key={index} style={{ marginBottom: 4 }}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ),
          })
        } else {
          // 全部成功
          message.success(`导入成功！共 ${result.total_rows} 条数据全部导入`)
        }
        handleRefreshTableData()
        loadTreeData(true)
      } else {
        message.error('导入失败')
      }
    } catch (error: any) {
      console.error('导入失败:', error)
      message.destroy('import')
      message.error(error.message || '导入失败')
    } finally {
      setImportLoading(false)
      setImportFile(null)
    }
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
        width="90%"
        style={{ maxWidth: 1400 }}
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
            initialValue="import"
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

          {/* 隐藏的table_type字段，固定为custom */}
          <Form.Item name="table_type" hidden initialValue="custom">
            <Input />
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

      {/* 导入配置弹窗 */}
      <Modal
        title="导入数据配置"
        open={importConfigVisible}
        onOk={executeImport}
        onCancel={() => {
          setImportConfigVisible(false)
          setImportFile(null)
        }}
        okText="开始导入"
        cancelText="取消"
        confirmLoading={importLoading}
        width={500}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="文件信息"
            description={importFile ? `文件名：${importFile.name}` : '未选择文件'}
            type="info"
            showIcon
          />
          
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>导入模式</div>
            <Select
              value={importMode}
              onChange={setImportMode}
              style={{ width: '100%' }}
              options={[
                {
                  value: 'append',
                  label: '追加模式',
                  description: '在现有数据后追加新数据'
                },
                {
                  value: 'overwrite',
                  label: '覆盖模式',
                  description: '清空数据表后再导入（谨慎使用）'
                }
              ]}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              {importMode === 'append' ? (
                <span>📌 追加模式：新数据将添加到现有数据之后，不会影响现有数据</span>
              ) : (
                <span style={{ color: '#ff4d4f' }}>⚠️ 覆盖模式：将删除所有现有数据后再导入，此操作不可恢复！</span>
              )}
            </div>
          </div>
          
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>错误处理策略</div>
            <Select
              value={errorStrategy}
              onChange={setErrorStrategy}
              style={{ width: '100%' }}
              options={[
                {
                  value: 'skip',
                  label: '跳过错误',
                  description: '遇到错误行跳过，继续导入'
                },
                {
                  value: 'abort',
                  label: '遇错中止',
                  description: '遇到第一个错误立即停止'
                }
              ]}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              {errorStrategy === 'skip' ? (
                <span>📌 跳过错误：错误行将被跳过，成功的行会正常导入</span>
              ) : (
                <span>⚠️ 遇错中止：遇到第一个错误立即停止导入，已导入数据会保留</span>
              )}
            </div>
          </div>
        </Space>
      </Modal>
    </div>
  )
}

export default PlatformData
