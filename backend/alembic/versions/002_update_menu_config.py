"""update menu config

Revision ID: 002
Revises: 001
Create Date: 2025-11-06

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    """更新菜单配置"""
    # 清空现有菜单
    op.execute("DELETE FROM menu_items")
    
    # 插入新的菜单配置
    op.execute("""
        INSERT INTO menu_items (name, icon, path, parent_id, sort_order, is_visible, required_role) VALUES
        ('数据看板', 'DashboardOutlined', '/', NULL, 1, 1, 'all'),
        ('平台数据', 'ShopOutlined', '/platform-data', NULL, 2, 1, 'all'),
        ('工作表', 'FileTextOutlined', '/worksheet', NULL, 3, 1, 'all'),
        ('操作日志', 'HistoryOutlined', '/logs', NULL, 4, 1, 'all'),
        ('系统设置', 'SettingOutlined', '/settings', NULL, 100, 1, 'admin')
    """)


def downgrade():
    """回滚菜单配置"""
    # 恢复原来的菜单配置
    op.execute("DELETE FROM menu_items")
    
    op.execute("""
        INSERT INTO menu_items (name, icon, path, parent_id, sort_order, is_visible, required_role) VALUES
        ('数据看板', 'DashboardOutlined', '/', NULL, 1, 1, 'all'),
        ('平台数据', 'ShopOutlined', '/platform-data', NULL, 2, 1, 'all'),
        ('工作表', 'FileTextOutlined', '/worksheet', NULL, 3, 1, 'all'),
        ('操作日志', 'HistoryOutlined', '/logs', NULL, 4, 1, 'all'),
        ('系统设置', 'SettingOutlined', '/settings', NULL, 100, 1, 'admin')
    """)

