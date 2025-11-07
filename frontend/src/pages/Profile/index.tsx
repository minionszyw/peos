/**
 * 个人信息页面
 */
import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, message, Avatar, Upload, Descriptions, Space, Modal } from 'antd'
import { UserOutlined, EditOutlined, LockOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { useUserStore } from '@/stores/userStore'
import { updateUser, changePassword, uploadAvatar } from '@/services/users'
import styles from './index.module.scss'

const Profile = () => {
  const { user, setUser } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
      })
    }
  }, [user, form])

  // 更新个人信息
  const handleUpdateProfile = async (values: any) => {
    if (!user) return

    try {
      setLoading(true)
      const updatedUser = await updateUser(user.id, {
        name: values.name,
        email: values.email,
        phone: values.phone,
      })
      setUser(updatedUser)
      message.success('个人信息更新成功')
      setEditing(false)
    } catch (error: any) {
      message.error(error.response?.data?.detail || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  // 修改密码
  const handleChangePassword = async (values: any) => {
    if (!user) return

    try {
      setLoading(true)
      await changePassword(user.id, values.oldPassword, values.newPassword)
      message.success('密码修改成功，请重新登录')
      passwordForm.resetFields()
      setPasswordModalVisible(false)
      // 可以选择自动登出
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    } catch (error: any) {
      message.error(error.response?.data?.detail || '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  // 上传头像
  const handleAvatarUpload: UploadProps['customRequest'] = async (options) => {
    if (!user) return

    const { file, onSuccess, onError } = options
    try {
      const result = await uploadAvatar(user.id, file as File)
      message.success('头像上传成功')
      setUser({ ...user, avatar: result.url })
      onSuccess?.(result)
    } catch (error: any) {
      message.error(error.response?.data?.detail || '头像上传失败')
      onError?.(error)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="个人信息"
        extra={
          <Space>
            <Button
              icon={<LockOutlined />}
              onClick={() => setPasswordModalVisible(true)}
            >
              修改密码
            </Button>
            {!editing && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setEditing(true)}
              >
                编辑资料
              </Button>
            )}
          </Space>
        }
      >
        <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>
          <div style={{ textAlign: 'center' }}>
            <Upload
              showUploadList={false}
              customRequest={handleAvatarUpload}
              accept="image/*"
            >
              <Avatar
                size={120}
                src={user.avatar}
                icon={<UserOutlined />}
                style={{ cursor: 'pointer' }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                点击更换头像
              </div>
            </Upload>
          </div>

          <div style={{ flex: 1 }}>
            {!editing ? (
              <Descriptions column={2} bordered>
                <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
                <Descriptions.Item label="姓名">{user.name}</Descriptions.Item>
                <Descriptions.Item label="角色">
                  {user.role === 'admin' ? '管理员' : '普通用户'}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">{user.email || '-'}</Descriptions.Item>
                <Descriptions.Item label="手机号" span={2}>
                  {user.phone || '-'}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdateProfile}
              >
                <Form.Item label="用户名" name="username">
                  <Input disabled />
                </Form.Item>
                <Form.Item
                  label="姓名"
                  name="name"
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="邮箱"
                  name="email"
                  rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item label="手机号" name="phone">
                  <Input />
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      保存
                    </Button>
                    <Button onClick={() => setEditing(false)}>
                      取消
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </div>
        </div>
      </Card>

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false)
          passwordForm.resetFields()
        }}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            label="旧密码"
            name="oldPassword"
            rules={[{ required: true, message: '请输入旧密码' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button
                onClick={() => {
                  setPasswordModalVisible(false)
                  passwordForm.resetFields()
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Profile
