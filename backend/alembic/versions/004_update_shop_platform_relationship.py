"""update shop platform relationship and cleanup dashboards table

Revision ID: 004_update_shop_platform_relationship
Revises: 003_remove_deprecated_tables
Create Date: 2025-11-09
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "004_update_shop_platform_relationship"
down_revision = "003_remove_deprecated_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if "dashboards" in inspector.get_table_names():
        op.drop_table("dashboards")

    # 删除未使用的旧业务表
    tables = inspector.get_table_names()
    if "inventory" in tables:
        op.drop_table("inventory")
    if "sales" in tables:
        op.drop_table("sales")
    if "shop_products" in tables:
        op.drop_table("shop_products")
    if "warehouse_products" in tables:
        op.drop_table("warehouse_products")
    if "import_history" in tables:
        op.drop_table("import_history")

    # 回填 platform_id
    op.execute(
        """
        UPDATE shops
        SET platform_id = p.id
        FROM platforms p
        WHERE shops.platform_id IS NULL
          AND shops.platform = p.name;
        """
    )

    # 对齐平台名称
    op.execute(
        """
        UPDATE shops
        SET platform = p.name
        FROM platforms p
        WHERE shops.platform_id = p.id;
        """
    )

    # 清理菜单，保留核心入口
    op.execute("UPDATE menu_items SET name = '首页', icon = 'HomeOutlined' WHERE path = '/'")
    op.execute("DELETE FROM menu_items WHERE path IN ('/worksheet')")
    op.execute("DELETE FROM menu_items WHERE name IN ('数据导入')")


def downgrade() -> None:
    # 还原菜单
    op.execute("UPDATE menu_items SET name = '数据看板', icon = 'DashboardOutlined' WHERE path = '/'")
    op.execute(
        """
        INSERT INTO menu_items (name, icon, path, parent_id, sort_order, is_visible, required_role)
        SELECT '工作表', 'FileTextOutlined', '/worksheet', NULL, 3, 1, 'all'
        WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE path = '/worksheet')
        """
    )

    # 还原 platform_id
    op.execute(
        """
        UPDATE shops
        SET platform = p.name
        FROM platforms p
        WHERE shops.platform_id = p.id;
        """
    )

    op.execute(
        """
        UPDATE shops
        SET platform_id = NULL;
        """
    )

    op.create_table(
        "dashboards",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("config_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_dashboards_id"), "dashboards", ["id"], unique=False)

    # 恢复旧业务表结构
    op.create_table(
        "warehouse_products",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sku", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("cost_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("spec", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sku")
    )

    op.create_table(
        "shop_products",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("shop_id", sa.Integer(), nullable=False),
        sa.Column("warehouse_product_id", sa.Integer(), nullable=False),
        sa.Column("product_url", sa.String(length=500), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="on_shelf", nullable=True),
        sa.Column("stock", sa.Integer(), server_default="0", nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["shop_id"], ["shops.id"], ),
        sa.ForeignKeyConstraint(["warehouse_product_id"], ["warehouse_products.id"], ),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_shop_products_shop_id"), "shop_products", ["shop_id"], unique=False)
    op.create_index(op.f("ix_shop_products_warehouse_product_id"), "shop_products", ["warehouse_product_id"], unique=False)

    op.create_table(
        "inventory",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("warehouse_product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), server_default="0", nullable=True),
        sa.Column("warehouse_location", sa.String(length=100), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["warehouse_product_id"], ["warehouse_products.id"], ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("warehouse_product_id")
    )

    op.create_table(
        "sales",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("shop_id", sa.Integer(), nullable=False),
        sa.Column("shop_product_id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.String(length=100), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("profit", sa.Numeric(10, 2), nullable=True),
        sa.Column("sale_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["shop_id"], ["shops.id"], ),
        sa.ForeignKeyConstraint(["shop_product_id"], ["shop_products.id"], ),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_sales_sale_date"), "sales", ["sale_date"], unique=False)
    op.create_index(op.f("ix_sales_order_id"), "sales", ["order_id"], unique=False)

    op.create_table(
        "import_history",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("table_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=True),
        sa.Column("total_rows", sa.Integer(), server_default="0", nullable=True),
        sa.Column("success_rows", sa.Integer(), server_default="0", nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_import_history_created_at"), "import_history", ["created_at"], unique=False)

