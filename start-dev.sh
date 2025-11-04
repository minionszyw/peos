#!/bin/bash

# 电商运营系统 - 开发环境一键启动脚本
# 用法: ./start-dev.sh

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "\n${GREEN}==>${NC} ${BLUE}$1${NC}"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装，请先安装 $1"
        return 1
    else
        print_success "$1 已安装 ($(command -v $1))"
        return 0
    fi
}

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

print_step "开始启动电商运营系统开发环境..."
print_info "项目路径: $PROJECT_ROOT"

# ========================================
# 1. 检查依赖
# ========================================
print_step "步骤 1/8: 检查系统依赖"

DEPENDENCIES_OK=true

if ! check_command docker; then
    DEPENDENCIES_OK=false
fi

if ! check_command docker-compose; then
    DEPENDENCIES_OK=false
fi

if ! check_command python3; then
    DEPENDENCIES_OK=false
fi

if ! check_command node; then
    DEPENDENCIES_OK=false
fi

if ! check_command npm; then
    DEPENDENCIES_OK=false
fi

if [ "$DEPENDENCIES_OK" = false ]; then
    print_error "依赖检查失败，请安装缺失的依赖后重试"
    exit 1
fi

print_success "所有依赖检查通过"

# ========================================
# 2. 启动数据库和Redis容器
# ========================================
print_step "步骤 2/8: 启动 PostgreSQL 和 Redis 容器"

cd "$PROJECT_ROOT"

# 检查容器是否已运行
if docker-compose ps | grep -q "ecommerce_postgres.*Up"; then
    print_warning "PostgreSQL 容器已在运行"
else
    docker-compose up -d postgres
    print_success "PostgreSQL 容器已启动"
fi

if docker-compose ps | grep -q "ecommerce_redis.*Up"; then
    print_warning "Redis 容器已在运行"
else
    docker-compose up -d redis
    print_success "Redis 容器已启动"
fi

# 等待数据库启动
print_info "等待 PostgreSQL 启动..."
sleep 5

# 检查容器健康状态
if docker-compose ps | grep -q "ecommerce_postgres.*healthy"; then
    print_success "PostgreSQL 容器健康检查通过"
else
    print_warning "PostgreSQL 容器可能还在启动中，继续执行..."
fi

# ========================================
# 3. 后端环境配置
# ========================================
print_step "步骤 3/8: 配置后端环境"

cd "$BACKEND_DIR"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    print_info "创建 Python 虚拟环境..."
    python3 -m venv venv
    print_success "虚拟环境创建成功"
else
    print_warning "虚拟环境已存在，跳过创建"
fi

# 激活虚拟环境
print_info "激活虚拟环境..."
source venv/bin/activate

# ========================================
# 4. 安装后端依赖
# ========================================
print_step "步骤 4/8: 安装后端依赖"

if [ -f "requirements.txt" ]; then
    print_info "检查并安装 Python 依赖包..."
    pip install -q -r requirements.txt
    
    # 修复 bcrypt 版本问题
    print_info "确保 bcrypt 版本兼容..."
    pip install -q --upgrade bcrypt==4.0.1
    
    print_success "后端依赖安装完成"
else
    print_error "requirements.txt 文件不存在"
    exit 1
fi

# ========================================
# 5. 配置环境变量
# ========================================
print_step "步骤 5/8: 配置环境变量"

if [ ! -f ".env" ]; then
    print_info "创建 .env 文件..."
    cp .env.example .env
    
    # 修改为本地开发配置
    sed -i 's/POSTGRES_SERVER=postgres/POSTGRES_SERVER=localhost/g' .env
    sed -i 's/REDIS_HOST=redis/REDIS_HOST=localhost/g' .env
    
    print_success ".env 文件已创建并配置为开发环境"
else
    print_warning ".env 文件已存在，跳过创建"
fi

# ========================================
# 6. 初始化数据库
# ========================================
print_step "步骤 6/8: 初始化数据库"

if python init_db.py; then
    print_success "数据库初始化完成"
else
    print_warning "数据库可能已初始化，继续执行..."
fi

# ========================================
# 7. 启动后端服务
# ========================================
print_step "步骤 7/8: 启动后端开发服务器"

# 检查端口是否被占用
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "端口 8000 已被占用，后端服务可能已在运行"
else
    print_info "启动 FastAPI 开发服务器..."
    nohup uvicorn app.main:app --reload --port 8000 > "$PROJECT_ROOT/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PROJECT_ROOT/.backend.pid"
    sleep 3
    
    if ps -p $BACKEND_PID > /dev/null; then
        print_success "后端服务已启动 (PID: $BACKEND_PID, 端口: 8000)"
        print_info "后端日志: $PROJECT_ROOT/backend.log"
    else
        print_error "后端服务启动失败，请查看日志: $PROJECT_ROOT/backend.log"
        exit 1
    fi
fi

# ========================================
# 8. 前端环境配置和启动
# ========================================
print_step "步骤 8/8: 配置并启动前端"

cd "$FRONTEND_DIR"

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    print_info "安装前端依赖..."
    npm install
    print_success "前端依赖安装完成"
else
    print_warning "node_modules 已存在，跳过安装"
fi

# 检查端口是否被占用
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "端口 3000 已被占用，前端服务可能已在运行"
else
    print_info "启动 Vite 开发服务器..."
    nohup npm run dev > "$PROJECT_ROOT/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$PROJECT_ROOT/.frontend.pid"
    sleep 3
    
    if ps -p $FRONTEND_PID > /dev/null; then
        print_success "前端服务已启动 (PID: $FRONTEND_PID, 端口: 3000)"
        print_info "前端日志: $PROJECT_ROOT/frontend.log"
    else
        print_error "前端服务启动失败，请查看日志: $PROJECT_ROOT/frontend.log"
        exit 1
    fi
fi

# ========================================
# 启动完成
# ========================================
echo ""
print_success "=========================================="
print_success "    电商运营系统开发环境启动成功！"
print_success "=========================================="
echo ""
print_info "服务状态:"
echo "  ✓ PostgreSQL: 运行中 (端口 5432)"
echo "  ✓ Redis:      运行中 (端口 6379)"
echo "  ✓ 后端API:    运行中 (端口 8000)"
echo "  ✓ 前端Web:    运行中 (端口 3000)"
echo ""
print_info "访问地址:"
echo "  • 前端应用:   http://localhost:3000"
echo "  • 后端API:    http://localhost:8000"
echo "  • API文档:    http://localhost:8000/docs"
echo ""
print_info "默认账号:"
echo "  • 用户名:     admin"
echo "  • 密码:       admin123"
echo ""
print_info "日志文件:"
echo "  • 后端日志:   $PROJECT_ROOT/backend.log"
echo "  • 前端日志:   $PROJECT_ROOT/frontend.log"
echo ""
print_info "停止服务:"
echo "  • 运行命令:   ./stop-dev.sh"
echo ""
print_warning "提示: 服务正在后台运行，关闭终端不会停止服务"
echo ""

