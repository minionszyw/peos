"""创建测试普通用户"""
from sqlalchemy.orm import Session
from app.core.database import engine
from app.core.security import get_password_hash
from app.models.users import User

def create_test_user():
    """创建测试普通用户"""
    print("开始创建测试用户...")
    
    with Session(engine) as session:
        # 检查是否已存在
        existing = session.query(User).filter(User.username == "test").first()
        if existing:
            print("测试用户已存在")
            print(f"  用户名: {existing.username}")
            print(f"  姓名: {existing.name}")
            print(f"  角色: {existing.role}")
            return
        
        # 创建测试用户
        test_user = User(
            username="test",
            password_hash=get_password_hash("test123"),
            name="测试用户",
            role="operator"
        )
        session.add(test_user)
        session.commit()
        print("✓ 测试用户创建成功！")
        print(f"  用户名: test")
        print(f"  密码: test123")
        print(f"  角色: operator (普通用户)")

if __name__ == "__main__":
    create_test_user()

