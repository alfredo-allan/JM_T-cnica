from extensions import db
from datetime import datetime
import pytz
from sqlalchemy import Text, JSON
from sqlalchemy.orm import relationship

# Timezone do Brasil
BRASILIA_TZ = pytz.timezone('America/Sao_Paulo')

def now_brasilia():
    return datetime.now(BRASILIA_TZ)

class Relatorio(db.Model):
    __tablename__ = 'relatorios'
    
    id = db.Column(db.Integer, primary_key=True)
    numero_relatorio = db.Column(db.String(10), unique=True, nullable=False, index=True)
    
    # Datas e horários
    data_servico = db.Column(db.Date, nullable=False, index=True)
    hora_inicio = db.Column(db.Time)
    hora_fim = db.Column(db.Time)
    total_horas = db.Column(db.String(10))
    
    # Informações da empresa
    razao_social = db.Column(db.String(200), nullable=False, index=True)
    cnpj = db.Column(db.String(18), index=True)
    endereco = db.Column(db.String(300))
    cidade_uf = db.Column(db.String(100))
    inscricao_estadual = db.Column(db.String(50))
    
    # Tipos de serviço (armazenado como JSON)
    tipos_servico = db.Column(JSON)
    
    # Serviços executados
    servicos_executados = db.Column(Text)
    
    # Testes de atenção
    etc = db.Column(db.String(50))
    eta = db.Column(db.String(50))
    gc = db.Column(db.String(50))
    gt = db.Column(db.String(50))
    observacoes_teste = db.Column(db.String(500))
    tecnico_responsavel = db.Column(db.String(100))
    
    # Total de peças
    total_pecas = db.Column(db.Numeric(10, 2), default=0)
    
    # Timestamps
    data_criacao = db.Column(db.DateTime, default=now_brasilia, nullable=False)
    data_modificacao = db.Column(db.DateTime, default=now_brasilia, onupdate=now_brasilia)
    
    # Relacionamentos
    equipamentos = relationship("Equipamento", back_populates="relatorio", cascade="all, delete-orphan")
    pecas = relationship("Peca", back_populates="relatorio", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f'<Relatorio {self.numero_relatorio}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'numeroRelatorio': self.numero_relatorio,
            'dataServico': self.data_servico.isoformat() if self.data_servico else None,
            'horaInicio': self.hora_inicio.strftime('%H:%M') if self.hora_inicio else None,
            'horaFim': self.hora_fim.strftime('%H:%M') if self.hora_fim else None,
            'totalHoras': self.total_horas,
            'razaoSocial': self.razao_social,
            'cnpj': self.cnpj,
            'endereco': self.endereco,
            'cidadeUf': self.cidade_uf,
            'inscricaoEstadual': self.inscricao_estadual,
            'tiposServico': self.tipos_servico or [],
            'servicosExecutados': self.servicos_executados,
            'etc': self.etc,
            'eta': self.eta,
            'gc': self.gc,
            'gt': self.gt,
            'observacoesTeste': self.observacoes_teste,
            'tecnicoResponsavel': self.tecnico_responsavel,
            'totalPecas': float(self.total_pecas) if self.total_pecas else 0,
            'dataCriacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'dataModificacao': self.data_modificacao.isoformat() if self.data_modificacao else None,
            'equipamentos': [eq.to_dict() for eq in self.equipamentos],
            'pecas': [peca.to_dict() for peca in self.pecas]
        }

class Equipamento(db.Model):
    __tablename__ = 'equipamentos'
    
    id = db.Column(db.Integer, primary_key=True)
    relatorio_id = db.Column(db.Integer, db.ForeignKey('relatorios.id'), nullable=False)
    
    numero_bico = db.Column(db.String(20))
    marca = db.Column(db.String(50))
    modelo = db.Column(db.String(50))
    serie = db.Column(db.String(50))
    produto = db.Column(db.String(50))
    inmetro = db.Column(db.String(50))
    portaria_aprovacao = db.Column(db.String(100))
    lacre_retirado = db.Column(db.String(50))
    lacre_colocado = db.Column(db.String(50))
    selo_reparado_retirado = db.Column(db.String(50))
    selo_reparado_colocado = db.Column(db.String(50))
    
    # Relacionamento
    relatorio = relationship("Relatorio", back_populates="equipamentos")
    
    def __repr__(self):
        return f'<Equipamento {self.numero_bico}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'numeroBico': self.numero_bico,
            'marca': self.marca,
            'modelo': self.modelo,
            'serie': self.serie,
            'produto': self.produto,
            'inmetro': self.inmetro,
            'portariaAprovacao': self.portaria_aprovacao,
            'lacreRetirado': self.lacre_retirado,
            'lacreColocado': self.lacre_colocado,
            'seloReparadoRetirado': self.selo_reparado_retirado,
            'seloReparadoColocado': self.selo_reparado_colocado
        }

class Peca(db.Model):
    __tablename__ = 'pecas'
    
    id = db.Column(db.Integer, primary_key=True)
    relatorio_id = db.Column(db.Integer, db.ForeignKey('relatorios.id'), nullable=False)
    
    descricao = db.Column(db.String(200), nullable=False)
    quantidade = db.Column(db.Integer, default=0)
    valor_unitario = db.Column(db.Numeric(10, 2), default=0)
    valor_total = db.Column(db.Numeric(10, 2), default=0)
    
    # Relacionamento
    relatorio = relationship("Relatorio", back_populates="pecas")
    
    def __repr__(self):
        return f'<Peca {self.descricao}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'descricao': self.descricao,
            'quantidade': self.quantidade,
            'valorUnitario': float(self.valor_unitario) if self.valor_unitario else 0,
            'valorTotal': float(self.valor_total) if self.valor_total else 0
        }

# Índices adicionais para performance
db.Index('idx_relatorio_data', Relatorio.data_servico)
db.Index('idx_relatorio_razao_social', Relatorio.razao_social)
db.Index('idx_relatorio_cnpj', Relatorio.cnpj)
db.Index('idx_relatorio_criacao', Relatorio.data_criacao)
