#!/usr/bin/env python3
"""检查数据库用户"""
import sys
sys.path.insert(0, '/home/w/Peos/backend')

from app.core.database import SessionLocal
from app.models.users import User

db = SessionLocal()
try:
    users = db.query(User).all()
    print(f"共 {len(users)} 个用户：")
    print("-" * 60)
    for user in users:
        print(f"ID: {user.id}, 用户名: {user.username}, 姓名: {user.name}, 角色: {user.role}")
finally:
    db.close()

