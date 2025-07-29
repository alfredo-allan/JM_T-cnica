from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_migrate import Migrate
from flask_cors import CORS

class Base(DeclarativeBase):
    pass

# Inicializar extensões
db = SQLAlchemy(model_class=Base)
migrate = Migrate()
cors = CORS()