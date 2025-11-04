#!/bin/bash

# 电商运营系统 - 开发环境一键停止脚本
# 用法: ./stop-dev.sh

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

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_step "开始停止电商运营系统开发环境..."

# ========================================
# 1. 停止前端服务
# ========================================
print_step "步骤 1/3: 停止前端服务"

if [ -f "$PROJECT_ROOT/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PROJECT_ROOT/.frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        print_info "正在停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 2
        
        # 如果进程还在运行，强制终止
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null || true
        fi
        
        rm "$PROJECT_ROOT/.frontend.pid"
        print_success "前端服务已停止"
    else
        print_warning "前端服务未运行 (PID: $FRONTEND_PID 不存在)"
        rm "$PROJECT_ROOT/.frontend.pid"
    fi
else
    print_warning "未找到前端服务 PID 文件"
fi

# 额外检查并终止占用 3000 端口的进程
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_info "发现端口 3000 仍被占用，尝试终止..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    print_success "端口 3000 已释放"
fi

# ========================================
# 2. 停止后端服务
# ========================================
print_step "步骤 2/3: 停止后端服务"

if [ -f "$PROJECT_ROOT/.backend.pid" ]; then
    BACKEND_PID=$(cat "$PROJECT_ROOT/.backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        print_info "正在停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
        sleep 2
        
        # 如果进程还在运行，强制终止
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
        
        rm "$PROJECT_ROOT/.backend.pid"
        print_success "后端服务已停止"
    else
        print_warning "后端服务未运行 (PID: $BACKEND_PID 不存在)"
        rm "$PROJECT_ROOT/.backend.pid"
    fi
else
    print_warning "未找到后端服务 PID 文件"
fi

# 额外检查并终止占用 8000 端口的进程
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_info "发现端口 8000 仍被占用，尝试终止..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    print_success "端口 8000 已释放"
fi

# ========================================
# 3. 停止数据库和Redis容器
# ========================================
print_step "步骤 3/3: 停止 PostgreSQL 和 Redis 容器"

cd "$PROJECT_ROOT"

if docker-compose ps | grep -q "ecommerce_postgres.*Up"; then
    print_info "停止 PostgreSQL 容器..."
    docker-compose stop postgres
    print_success "PostgreSQL 容器已停止"
else
    print_warning "PostgreSQL 容器未运行"
fi

if docker-compose ps | grep -q "ecommerce_redis.*Up"; then
    print_info "停止 Redis 容器..."
    docker-compose stop redis
    print_success "Redis 容器已停止"
else
    print_warning "Redis 容器未运行"
fi

# ========================================
# 停止完成
# ========================================
echo ""
print_success "=========================================="
print_success "    所有开发服务已停止"
print_success "=========================================="
echo ""
print_info "已停止的服务:"
echo "  ✓ 前端服务 (端口 3000)"
echo "  ✓ 后端服务 (端口 8000)"
echo "  ✓ PostgreSQL (端口 5432)"
echo "  ✓ Redis (端口 6379)"
echo ""
print_info "如需完全清理容器和数据卷，请运行:"
echo "  docker-compose down -v"
echo ""
print_info "如需重新启动服务，请运行:"
echo "  ./start-dev.sh"
echo ""

