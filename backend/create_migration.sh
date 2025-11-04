#!/bin/bash

# 创建数据库迁移脚本

echo "创建数据库迁移..."
alembic revision --autogenerate -m "Initial migration: create all tables"

echo "迁移文件创建完成！"
echo "运行 'alembic upgrade head' 来应用迁移"

