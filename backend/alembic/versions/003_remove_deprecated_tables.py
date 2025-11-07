"""remove deprecated tables

Revision ID: 003_remove_deprecated_tables
Revises: 1cb5d6703e9a
Create Date: 2025-11-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_remove_deprecated_tables'
down_revision = '1cb5d6703e9a'
branch_labels = None
depends_on = None


def upgrade():
    """删除已废弃的import_templates表（功能已由data_tables.fields替代）"""
    # 删除import_templates表
    op.drop_table('import_templates')


def downgrade():
    """恢复import_templates表（如需回滚）"""
    op.create_table(
        'import_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('table_type', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('field_mappings', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('validation_rules', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('custom_fields', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('example_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Integer(), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_import_templates_table_type', 'import_templates', ['table_type'], unique=False)

