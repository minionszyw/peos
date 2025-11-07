"""add system config tables

Revision ID: 001
Revises: 
Create Date: 2025-11-06

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # 创建平台表
    op.create_table('platforms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False, comment='平台名称'),
        sa.Column('code', sa.String(length=50), nullable=False, comment='平台代码'),
        sa.Column('icon', sa.String(length=255), nullable=True, comment='平台图标'),
        sa.Column('description', sa.Text(), nullable=True, comment='平台描述'),
        sa.Column('is_active', sa.Integer(), nullable=True, server_default='1', comment='是否启用（0=禁用，1=启用）'),
        sa.Column('sort_order', sa.Integer(), nullable=True, server_default='0', comment='排序'),
        sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='平台配置（JSONB）'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='更新时间'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_platforms_id'), 'platforms', ['id'], unique=False)
    op.create_index(op.f('ix_platforms_name'), 'platforms', ['name'], unique=True)
    op.create_index(op.f('ix_platforms_code'), 'platforms', ['code'], unique=True)

    # 创建系统配置表
    op.create_table('system_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=100), nullable=False, comment='配置键'),
        sa.Column('value', sa.Text(), nullable=True, comment='配置值'),
        sa.Column('value_type', sa.String(length=20), nullable=True, server_default='string', comment='值类型：string/json/number/boolean'),
        sa.Column('description', sa.String(length=255), nullable=True, comment='配置描述'),
        sa.Column('group_name', sa.String(length=50), nullable=True, comment='配置分组'),
        sa.Column('is_public', sa.Integer(), nullable=True, server_default='0', comment='是否公开（0=仅管理员，1=所有用户）'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='更新时间'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_settings_id'), 'system_settings', ['id'], unique=False)
    op.create_index(op.f('ix_system_settings_key'), 'system_settings', ['key'], unique=True)

    # 创建菜单配置表
    op.create_table('menu_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False, comment='菜单名称'),
        sa.Column('icon', sa.String(length=50), nullable=True, comment='图标名称'),
        sa.Column('path', sa.String(length=255), nullable=True, comment='路由路径'),
        sa.Column('parent_id', sa.Integer(), nullable=True, comment='父菜单ID'),
        sa.Column('sort_order', sa.Integer(), nullable=True, server_default='0', comment='排序'),
        sa.Column('is_visible', sa.Integer(), nullable=True, server_default='1', comment='是否可见（0=隐藏，1=显示）'),
        sa.Column('required_role', sa.String(length=50), nullable=True, comment='所需角色：admin/operator/all'),
        sa.Column('component', sa.String(length=255), nullable=True, comment='前端组件路径'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='更新时间'),
        sa.ForeignKeyConstraint(['parent_id'], ['menu_items.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_menu_items_id'), 'menu_items', ['id'], unique=False)

    # 创建导入模板表
    op.create_table('import_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('table_type', sa.String(length=50), nullable=False, comment='表类型'),
        sa.Column('name', sa.String(length=100), nullable=False, comment='模板名称'),
        sa.Column('description', sa.Text(), nullable=True, comment='模板描述'),
        sa.Column('field_mappings', postgresql.JSONB(astext_type=sa.Text()), nullable=False, comment='字段映射配置（JSONB）'),
        sa.Column('validation_rules', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='验证规则配置（JSONB）'),
        sa.Column('custom_fields', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='自定义字段配置（JSONB）'),
        sa.Column('example_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='示例数据'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='更新时间'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_import_templates_id'), 'import_templates', ['id'], unique=False)
    op.create_index(op.f('ix_import_templates_table_type'), 'import_templates', ['table_type'], unique=True)

    # 扩展用户表
    op.add_column('users', sa.Column('avatar', sa.String(length=255), nullable=True, comment='头像URL'))
    op.add_column('users', sa.Column('email', sa.String(length=100), nullable=True, comment='邮箱'))
    op.add_column('users', sa.Column('phone', sa.String(length=20), nullable=True, comment='手机号'))
    op.add_column('users', sa.Column('permissions', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='权限配置'))

    # 扩展店铺表 - 添加platform_id外键
    op.add_column('shops', sa.Column('platform_id', sa.Integer(), nullable=True, comment='平台ID'))
    op.create_foreign_key('fk_shops_platforms', 'shops', 'platforms', ['platform_id'], ['id'])

    # 插入默认平台数据
    op.execute("""
        INSERT INTO platforms (name, code, icon, description, is_active, sort_order, config) VALUES
        ('淘宝', 'taobao', 'taobao', '淘宝电商平台', 1, 1, '{}'),
        ('天猫', 'tmall', 'tmall', '天猫电商平台', 1, 2, '{}'),
        ('京东', 'jd', 'jd', '京东电商平台', 1, 3, '{}'),
        ('拼多多', 'pdd', 'pdd', '拼多多电商平台', 1, 4, '{}'),
        ('抖音', 'douyin', 'douyin', '抖音电商平台', 1, 5, '{}'),
        ('快手', 'kuaishou', 'kuaishou', '快手电商平台', 1, 6, '{}')
    """)

    # 插入默认菜单数据
    op.execute("""
        INSERT INTO menu_items (name, icon, path, parent_id, sort_order, is_visible, required_role) VALUES
        ('数据看板', 'DashboardOutlined', '/', NULL, 1, 1, 'all'),
        ('平台数据', 'ShopOutlined', '/platform-data', NULL, 2, 1, 'all'),
        ('工作表', 'FileTextOutlined', '/worksheet', NULL, 3, 1, 'all'),
        ('操作日志', 'HistoryOutlined', '/logs', NULL, 4, 1, 'all'),
        ('系统设置', 'SettingOutlined', '/settings', NULL, 100, 1, 'admin')
    """)

    # 插入默认系统配置
    op.execute("""
        INSERT INTO system_settings (key, value, value_type, description, group_name, is_public) VALUES
        ('system_name', '电商运营系统', 'string', '系统名称', 'basic', 1),
        ('copyright', '© 2025 电商运营系统', 'string', '版权信息', 'basic', 1),
        ('logo_url', '', 'string', 'Logo URL', 'basic', 1)
    """)

    # 插入默认导入模板配置
    op.execute("""
        INSERT INTO import_templates (table_type, name, description, field_mappings, validation_rules, custom_fields) VALUES
        ('warehouse_product', '仓库商品模板', '仓库商品数据导入模板', '{"sku": "必填", "name": "必填", "category": "可选", "cost_price": "可选", "spec": "可选"}', '{"sku": {"required": true, "unique": true}, "name": {"required": true}}', '{}'),
        ('shop_product', '店铺商品模板', '店铺商品数据导入模板', '{"shop_id": "必填", "sku": "必填", "title": "必填", "price": "必填", "product_url": "可选", "status": "可选", "stock": "可选"}', '{"shop_id": {"required": true}, "sku": {"required": true}, "title": {"required": true}, "price": {"required": true}}', '{}'),
        ('inventory', '库存数据模板', '库存数据导入模板', '{"sku": "必填", "quantity": "必填", "warehouse_location": "可选"}', '{"sku": {"required": true}, "quantity": {"required": true}}', '{}'),
        ('sale', '销售数据模板', '销售数据导入模板', '{"shop_id": "必填", "shop_product_id": "必填", "quantity": "必填", "amount": "必填", "sale_date": "必填", "order_id": "可选", "profit": "可选"}', '{"shop_id": {"required": true}, "shop_product_id": {"required": true}, "quantity": {"required": true}, "amount": {"required": true}, "sale_date": {"required": true}}', '{}')
    """)


def downgrade():
    # 删除外键和列
    op.drop_constraint('fk_shops_platforms', 'shops', type_='foreignkey')
    op.drop_column('shops', 'platform_id')
    
    op.drop_column('users', 'permissions')
    op.drop_column('users', 'phone')
    op.drop_column('users', 'email')
    op.drop_column('users', 'avatar')

    # 删除表
    op.drop_index(op.f('ix_import_templates_table_type'), table_name='import_templates')
    op.drop_index(op.f('ix_import_templates_id'), table_name='import_templates')
    op.drop_table('import_templates')

    op.drop_index(op.f('ix_menu_items_id'), table_name='menu_items')
    op.drop_table('menu_items')

    op.drop_index(op.f('ix_system_settings_key'), table_name='system_settings')
    op.drop_index(op.f('ix_system_settings_id'), table_name='system_settings')
    op.drop_table('system_settings')

    op.drop_index(op.f('ix_platforms_code'), table_name='platforms')
    op.drop_index(op.f('ix_platforms_name'), table_name='platforms')
    op.drop_index(op.f('ix_platforms_id'), table_name='platforms')
    op.drop_table('platforms')

