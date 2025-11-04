"""初始化数据库脚本"""
import asyncio
from app.core.database import Base, engine
from app.core.security import get_password_hash
from app.models import User
from sqlalchemy.orm import Session


def init_db():
    """初始化数据库表和默认数据"""
    print("开始创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成！")
    
    # 创建默认管理员账户
    print("创建默认管理员账户...")
    with Session(engine) as session:
        # 检查是否已存在管理员
        admin = session.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                password_hash=get_password_hash("admin123"),
                name="系统管理员",
                role="admin"
            )
            session.add(admin)
            session.commit()
            print("管理员账户创建成功！用户名：admin，密码：admin123")
        else:
            print("管理员账户已存在")


if __name__ == "__main__":
    init_db()

