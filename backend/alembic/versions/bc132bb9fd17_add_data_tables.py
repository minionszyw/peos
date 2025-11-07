"""add_data_tables

Revision ID: bc132bb9fd17
Revises: 002
Create Date: 2025-11-07 12:48:57.531689

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bc132bb9fd17'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. 添加import_templates表的新字段（如果不存在）
    from sqlalchemy import inspect
    from alembic import context
    
    conn = context.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('import_templates')]
    
    if 'is_active' not in columns:
        op.add_column('import_templates', sa.Column('is_active', sa.Integer(), server_default='1', comment='是否启用（0=禁用，1=启用）'))
    if 'sort_order' not in columns:
        op.add_column('import_templates', sa.Column('sort_order', sa.Integer(), server_default='0', comment='排序'))
    
    # 2. 移除import_templates的unique约束（如果存在）
    constraints = [c['name'] for c in inspector.get_unique_constraints('import_templates')]
    if 'import_templates_table_type_key' in constraints:
        op.drop_constraint('import_templates_table_type_key', 'import_templates', type_='unique')
    
    # 3. 创建data_tables表（如果不存在）
    tables = inspector.get_table_names()
    if 'data_tables' in tables:
        return
    op.create_table(
        'data_tables',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('shop_id', sa.Integer(), nullable=False, comment='店铺ID'),
        sa.Column('template_id', sa.Integer(), nullable=False, comment='模板ID'),
        sa.Column('name', sa.String(length=100), nullable=False, comment='数据表名称'),
        sa.Column('table_type', sa.String(length=50), nullable=False, comment='表类型（如shop_products, sales等）'),
        sa.Column('description', sa.Text(), comment='数据表描述'),
        sa.Column('config', sa.JSON(), comment='数据表配置（JSONB）'),
        sa.Column('sort_order', sa.Integer(), server_default='0', comment='排序'),
        sa.Column('is_active', sa.Integer(), server_default='1', comment='是否启用（0=禁用，1=启用）'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), comment='更新时间'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['shop_id'], ['shops.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['template_id'], ['import_templates.id'])
    )
    
    # 4. 创建索引
    op.create_index(op.f('ix_data_tables_id'), 'data_tables', ['id'], unique=False)
    op.create_index(op.f('ix_data_tables_shop_id'), 'data_tables', ['shop_id'], unique=False)
    op.create_index(op.f('ix_data_tables_template_id'), 'data_tables', ['template_id'], unique=False)
    op.create_index(op.f('ix_data_tables_table_type'), 'data_tables', ['table_type'], unique=False)


def downgrade() -> None:
    # 1. 删除索引
    op.drop_index(op.f('ix_data_tables_table_type'), table_name='data_tables')
    op.drop_index(op.f('ix_data_tables_template_id'), table_name='data_tables')
    op.drop_index(op.f('ix_data_tables_shop_id'), table_name='data_tables')
    op.drop_index(op.f('ix_data_tables_id'), table_name='data_tables')
    
    # 2. 删除data_tables表
    op.drop_table('data_tables')
    
    # 3. 恢复import_templates的unique约束
    op.create_unique_constraint('import_templates_table_type_key', 'import_templates', ['table_type'])
    
    # 4. 删除import_templates的新字段
    op.drop_column('import_templates', 'sort_order')
    op.drop_column('import_templates', 'is_active')

