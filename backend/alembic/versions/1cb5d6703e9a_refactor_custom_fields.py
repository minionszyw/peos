"""refactor_custom_fields

Revision ID: 1cb5d6703e9a
Revises: bc132bb9fd17
Create Date: 2025-11-07 13:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '1cb5d6703e9a'
down_revision = 'bc132bb9fd17'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. 创建table_data表（通用数据存储）
    op.create_table(
        'table_data',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('data_table_id', sa.Integer(), nullable=False, comment='数据表ID'),
        sa.Column('data', sa.JSON(), nullable=False, comment='数据内容（JSONB）'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), comment='更新时间'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['data_table_id'], ['data_tables.id'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_table_data_id'), 'table_data', ['id'], unique=False)
    op.create_index(op.f('ix_table_data_data_table_id'), 'table_data', ['data_table_id'], unique=False)
    
    # 2. 修改data_tables表结构
    # 删除template_id外键约束
    op.drop_constraint('data_tables_template_id_fkey', 'data_tables', type_='foreignkey')
    
    # 删除template_id列
    op.drop_column('data_tables', 'template_id')
    
    # 删除config列（改用fields）
    op.drop_column('data_tables', 'config')
    
    # 添加fields列
    op.add_column('data_tables', sa.Column('fields', sa.JSON(), nullable=False, server_default='[]', comment='字段配置列表（JSONB）'))


def downgrade() -> None:
    # 1. 恢复data_tables表结构
    op.drop_column('data_tables', 'fields')
    op.add_column('data_tables', sa.Column('config', sa.JSON(), comment='数据表配置（JSONB）'))
    op.add_column('data_tables', sa.Column('template_id', sa.Integer(), nullable=True, comment='模板ID'))
    op.create_foreign_key('data_tables_template_id_fkey', 'data_tables', 'import_templates', ['template_id'], ['id'])
    
    # 2. 删除table_data表
    op.drop_index(op.f('ix_table_data_data_table_id'), table_name='table_data')
    op.drop_index(op.f('ix_table_data_id'), table_name='table_data')
    op.drop_table('table_data')
