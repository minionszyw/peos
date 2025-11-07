/**
 * 系统基本设置
 */
import { Form, Input, Button, Upload, message, Card } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getSettings, batchUpdateSettings, uploadLogo } from '@/services/settings'
import type { SystemSetting } from '@/services/settings'

const SystemSettings = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const settings = await getSettings('basic')
      const formData: any = {}
      settings.forEach((setting: SystemSetting) => {
        formData[setting.key] = setting.value
        if (setting.key === 'logo_url') {
          setLogoUrl(setting.value)
        }
      })
      form.setFieldsValue(formData)
    } catch (error) {
      message.error('加载设置失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      await batchUpdateSettings(values)
      message.success('保存成功')
      // 重新加载页面以应用新设置
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file: File) => {
    try {
      setUploading(true)
      const result = await uploadLogo(file)
      setLogoUrl(result.url)
      message.success('Logo上传成功')
      // 更新表单中的logo_url
      form.setFieldValue('logo_url', result.url)
    } catch (error) {
      message.error('Logo上传失败')
    } finally {
      setUploading(false)
    }
    return false // 阻止默认上传行为
  }

  return (
    <Card title="基本设置">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 600 }}
      >
        <Form.Item
          label="系统名称"
          name="system_name"
          rules={[{ required: true, message: '请输入系统名称' }]}
        >
          <Input placeholder="请输入系统名称" />
        </Form.Item>

        <Form.Item
          label="版权信息"
          name="copyright"
        >
          <Input placeholder="请输入版权信息" />
        </Form.Item>

        <Form.Item label="系统Logo">
          {logoUrl && (
            <div style={{ marginBottom: 16 }}>
              <img src={logoUrl} alt="Logo" style={{ maxWidth: 200, maxHeight: 100 }} />
            </div>
          )}
          <Upload
            beforeUpload={handleUpload}
            showUploadList={false}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />} loading={uploading}>
              {logoUrl ? '更换Logo' : '上传Logo'}
            </Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            保存设置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default SystemSettings

