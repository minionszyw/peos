"""自定义异常"""


class BusinessException(Exception):
    """业务异常基类"""
    def __init__(self, message: str, code: int = 400):
        self.message = message
        self.code = code
        super().__init__(self.message)


class ResourceNotFoundException(BusinessException):
    """资源不存在异常"""
    def __init__(self, message: str = "资源不存在"):
        super().__init__(message, code=404)


class DuplicateResourceException(BusinessException):
    """资源重复异常"""
    def __init__(self, message: str = "资源已存在"):
        super().__init__(message, code=400)


class ValidationException(BusinessException):
    """数据验证异常"""
    def __init__(self, message: str = "数据验证失败"):
        super().__init__(message, code=422)


class AuthenticationException(BusinessException):
    """认证异常"""
    def __init__(self, message: str = "认证失败"):
        super().__init__(message, code=401)


class PermissionException(BusinessException):
    """权限异常"""
    def __init__(self, message: str = "权限不足"):
        super().__init__(message, code=403)

