import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_migrate import Migrate
from flask_cors import CORS
import pytz
from datetime import datetime

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    
    # Configurações
    app.config['SECRET_KEY'] = os.environ.get("FLASK_SECRET_KEY", "dev-secret-key-jm-tecnica")
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL", "sqlite:///jm_tecnica.db")
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Configurar timezone para Brasil
    app.config['TIMEZONE'] = pytz.timezone('America/Sao_Paulo')
    
    # Inicializar extensões
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, origins=["http://localhost:5000", "http://127.0.0.1:5000"])
    
    # Registrar blueprints
    from routes.relatorios import relatorios_bp
    app.register_blueprint(relatorios_bp, url_prefix='/api')
    
    # Criar tabelas
    with app.app_context():
        # Importar modelos para que sejam criados
        import models
        db.create_all()
    
    # Função helper para timezone
    @app.template_global()
    def now_brasilia():
        return datetime.now(app.config['TIMEZONE'])
    
    # Context processor para timezone
    @app.context_processor
    def inject_timezone():
        return {
            'now_brasilia': now_brasilia(),
            'timezone_brasilia': app.config['TIMEZONE']
        }
    
    # Rota de health check
    @app.route('/health')
    def health():
        return {
            'status': 'healthy',
            'timestamp': now_brasilia().isoformat(),
            'timezone': 'America/Sao_Paulo'
        }
    
    # Rota raiz da API  
    @app.route('/api')
    def api_root():
        return {
            'message': 'JM Técnica API',
            'version': '1.0.0',
            'timestamp': now_brasilia().isoformat(),
            'endpoints': {
                'relatorios': '/api/relatorios',
                'health': '/health'
            }
        }
    
    return app

# Criar aplicação
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
