import os
import pytz
from datetime import timedelta

class Config:
    """Configurações base para a aplicação"""
    
    # Chave secreta da aplicação
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY') or 'dev-secret-key-jm-tecnica-2024'
    
    # Configurações do banco de dados
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///jm_tecnica.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_recycle': 300,
        'pool_pre_ping': True,
        'connect_args': {'check_same_thread': False} if 'sqlite' in os.environ.get('DATABASE_URL', 'sqlite') else {}
    }
    
    # Configurações de timezone
    TIMEZONE = pytz.timezone('America/Sao_Paulo')
    
    # Configurações de CORS
    CORS_ORIGINS = [
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ]
    
    # Configurações de paginação
    ITEMS_PER_PAGE_DEFAULT = 50
    ITEMS_PER_PAGE_MAX = 100
    
    # Configurações de API
    API_VERSION = '1.0.0'
    API_TITLE = 'JM Técnica API'
    API_DESCRIPTION = 'API para sistema de relatórios de serviço da JM Técnica'

class DevelopmentConfig(Config):
    """Configurações para ambiente de desenvolvimento"""
    DEBUG = True
    TESTING = False
    
    # Configurações específicas para desenvolvimento
    SQLALCHEMY_ECHO = False  # Mudar para True para ver SQL queries
    
class ProductionConfig(Config):
    """Configurações para ambiente de produção"""
    DEBUG = False
    TESTING = False
    
    # Configurações de segurança para produção
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    
    # Configurações específicas para produção
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_recycle': 3600,
        'pool_pre_ping': True,
        'pool_size': 10,
        'max_overflow': 20
    }

class TestingConfig(Config):
    """Configurações para ambiente de teste"""
    DEBUG = True
    TESTING = True
    
    # Banco de dados em memória para testes
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Desabilitar CSRF para testes
    WTF_CSRF_ENABLED = False

# Dicionário para fácil acesso às configurações
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Retorna a configuração baseada na variável de ambiente FLASK_ENV"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])
