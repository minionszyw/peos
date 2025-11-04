/**
 * 文件上传组件
 */
import { Upload, Button, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
}

const FileUpload = ({ onFileSelect, accept = '.xlsx,.xls,.csv' }: FileUploadProps) => {
  const uploadProps: UploadProps = {
    accept,
    beforeUpload: (file) => {
      // 检查文件大小（限制100MB）
      const isLt100M = file.size / 1024 / 1024 < 100
      if (!isLt100M) {
        message.error('文件大小不能超过100MB')
        return false
      }
      
      onFileSelect(file)
      return false // 阻止自动上传
    },
    maxCount: 1,
  }

  return (
    <Upload {...uploadProps}>
      <Button icon={<UploadOutlined />}>选择文件</Button>
    </Upload>
  )
}

export default FileUpload

