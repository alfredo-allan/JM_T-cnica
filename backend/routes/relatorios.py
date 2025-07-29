from flask import Blueprint, request, jsonify
from extensions import db
from models import Relatorio, Equipamento, Peca
from datetime import datetime, date, time
from sqlalchemy import and_, or_, desc
import pytz

relatorios_bp = Blueprint('relatorios', __name__)

# Timezone do Brasil
BRASILIA_TZ = pytz.timezone('America/Sao_Paulo')

def now_brasilia():
    return datetime.now(BRASILIA_TZ)

def parse_date(date_str):
    """Parse string de data para objeto date"""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return None

def parse_time(time_str):
    """Parse string de hora para objeto time"""
    if not time_str:
        return None
    try:
        return datetime.strptime(time_str, '%H:%M').time()
    except ValueError:
        return None

def gerar_proximo_numero():
    """Gera próximo número sequencial de relatório"""
    ultimo_relatorio = Relatorio.query.order_by(desc(Relatorio.numero_relatorio)).first()
    if ultimo_relatorio:
        try:
            ultimo_numero = int(ultimo_relatorio.numero_relatorio)
            proximo_numero = ultimo_numero + 1
        except ValueError:
            proximo_numero = 1
    else:
        proximo_numero = 1
    
    return str(proximo_numero).zfill(3)

@relatorios_bp.route('/relatorios', methods=['GET'])
def listar_relatorios():
    """Lista todos os relatórios com paginação opcional"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        # Limitar per_page para evitar sobrecarga
        per_page = min(per_page, 100)
        
        relatorios = Relatorio.query.order_by(desc(Relatorio.data_criacao)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': [relatorio.to_dict() for relatorio in relatorios.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': relatorios.total,
                'pages': relatorios.pages,
                'has_next': relatorios.has_next,
                'has_prev': relatorios.has_prev
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@relatorios_bp.route('/relatorios/buscar', methods=['GET'])
def buscar_relatorios():
    """Busca relatórios com base em filtros"""
    try:
        query = Relatorio.query
        
        # Filtros
        numero = request.args.get('numero')
        razao_social = request.args.get('razaoSocial')
        cnpj = request.args.get('cnpj')
        periodo = request.args.get('periodo')
        data_inicio = request.args.get('dataInicio')
        data_fim = request.args.get('dataFim')
        tipos_servico = request.args.get('tiposServico')
        
        # Aplicar filtros
        if numero:
            query = query.filter(Relatorio.numero_relatorio.contains(numero))
        
        if razao_social:
            query = query.filter(Relatorio.razao_social.ilike(f'%{razao_social}%'))
        
        if cnpj:
            cnpj_clean = ''.join(filter(str.isdigit, cnpj))
            query = query.filter(Relatorio.cnpj.contains(cnpj_clean))
        
        # Filtros de período
        hoje = date.today()
        if periodo == 'hoje':
            query = query.filter(Relatorio.data_servico == hoje)
        elif periodo == 'semana':
            # Início da semana (domingo)
            dias_desde_domingo = hoje.weekday() + 1 if hoje.weekday() != 6 else 0
            inicio_semana = hoje - datetime.timedelta(days=dias_desde_domingo)
            query = query.filter(Relatorio.data_servico >= inicio_semana)
        elif periodo == 'mes':
            inicio_mes = hoje.replace(day=1)
            query = query.filter(Relatorio.data_servico >= inicio_mes)
        
        # Período personalizado
        if data_inicio:
            data_inicio_obj = parse_date(data_inicio)
            if data_inicio_obj:
                query = query.filter(Relatorio.data_servico >= data_inicio_obj)
        
        if data_fim:
            data_fim_obj = parse_date(data_fim)
            if data_fim_obj:
                query = query.filter(Relatorio.data_servico <= data_fim_obj)
        
        # Filtro por tipos de serviço
        if tipos_servico:
            tipos_list = [tipo.strip() for tipo in tipos_servico.split(',')]
            # Usar JSON contains para buscar nos tipos de serviço
            for tipo in tipos_list:
                query = query.filter(Relatorio.tipos_servico.contains(tipo))
        
        # Executar query
        relatorios = query.order_by(desc(Relatorio.data_criacao)).all()
        
        return jsonify({
            'success': True,
            'data': [relatorio.to_dict() for relatorio in relatorios],
            'count': len(relatorios)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@relatorios_bp.route('/relatorios/<numero_relatorio>', methods=['GET'])
def obter_relatorio(numero_relatorio):
    """Obtém um relatório específico pelo número"""
    try:
        relatorio = Relatorio.query.filter_by(numero_relatorio=numero_relatorio).first()
        
        if not relatorio:
            return jsonify({
                'success': False,
                'error': 'Relatório não encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': relatorio.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@relatorios_bp.route('/relatorios', methods=['POST'])
def criar_relatorio():
    """Cria um novo relatório"""
    try:
        dados = request.get_json()
        
        if not dados:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
        # Validações básicas
        if not dados.get('razaoSocial'):
            return jsonify({
                'success': False,
                'error': 'Razão social é obrigatória'
            }), 400
        
        if not dados.get('dataServico'):
            return jsonify({
                'success': False,
                'error': 'Data do serviço é obrigatória'
            }), 400
        
        # Gerar número do relatório se não fornecido
        numero_relatorio = dados.get('numeroRelatorio')
        if not numero_relatorio:
            numero_relatorio = gerar_proximo_numero()
        
        # Verificar se já existe relatório com este número
        if Relatorio.query.filter_by(numero_relatorio=numero_relatorio).first():
            return jsonify({
                'success': False,
                'error': f'Já existe um relatório com o número {numero_relatorio}'
            }), 400
        
        # Criar relatório
        relatorio = Relatorio(
            numero_relatorio=numero_relatorio,
            data_servico=parse_date(dados.get('dataServico')),
            hora_inicio=parse_time(dados.get('horaInicio')),
            hora_fim=parse_time(dados.get('horaFim')),
            total_horas=dados.get('totalHoras'),
            razao_social=dados.get('razaoSocial'),
            cnpj=dados.get('cnpj'),
            endereco=dados.get('endereco'),
            cidade_uf=dados.get('cidadeUf'),
            inscricao_estadual=dados.get('inscricaoEstadual'),
            tipos_servico=dados.get('tiposServico', []),
            servicos_executados=dados.get('servicosExecutados'),
            etc=dados.get('etc'),
            eta=dados.get('eta'),
            gc=dados.get('gc'),
            gt=dados.get('gt'),
            observacoes_teste=dados.get('observacoesTeste'),
            tecnico_responsavel=dados.get('tecnicoResponsavel'),
            total_pecas=dados.get('totalPecas', 0)
        )
        
        db.session.add(relatorio)
        db.session.flush()  # Para obter o ID
        
        # Adicionar equipamentos
        equipamentos_data = dados.get('equipamentos', [])
        for eq_data in equipamentos_data:
            if eq_data.get('numeroBico'):  # Só adicionar se tiver número do bico
                equipamento = Equipamento(
                    relatorio_id=relatorio.id,
                    numero_bico=eq_data.get('numeroBico'),
                    marca=eq_data.get('marca'),
                    modelo=eq_data.get('modelo'),
                    serie=eq_data.get('serie'),
                    produto=eq_data.get('produto'),
                    inmetro=eq_data.get('inmetro'),
                    portaria_aprovacao=eq_data.get('portariaAprovacao'),
                    lacre_retirado=eq_data.get('lacreRetirado'),
                    lacre_colocado=eq_data.get('lacreColocado'),
                    selo_reparado_retirado=eq_data.get('seloReparadoRetirado'),
                    selo_reparado_colocado=eq_data.get('seloReparadoColocado')
                )
                db.session.add(equipamento)
        
        # Adicionar peças
        pecas_data = dados.get('pecas', [])
        for peca_data in pecas_data:
            if peca_data.get('descricao'):  # Só adicionar se tiver descrição
                peca = Peca(
                    relatorio_id=relatorio.id,
                    descricao=peca_data.get('descricao'),
                    quantidade=peca_data.get('quantidade', 0),
                    valor_unitario=peca_data.get('valorUnitario', 0),
                    valor_total=peca_data.get('valorTotal', 0)
                )
                db.session.add(peca)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': relatorio.to_dict(),
            'message': f'Relatório {numero_relatorio} criado com sucesso'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@relatorios_bp.route('/relatorios/<numero_relatorio>', methods=['PUT'])
def atualizar_relatorio(numero_relatorio):
    """Atualiza um relatório existente"""
    try:
        relatorio = Relatorio.query.filter_by(numero_relatorio=numero_relatorio).first()
        
        if not relatorio:
            return jsonify({
                'success': False,
                'error': 'Relatório não encontrado'
            }), 404
        
        dados = request.get_json()
        if not dados:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
        # Atualizar campos básicos
        if dados.get('dataServico'):
            relatorio.data_servico = parse_date(dados.get('dataServico'))
        if dados.get('horaInicio') is not None:
            relatorio.hora_inicio = parse_time(dados.get('horaInicio'))
        if dados.get('horaFim') is not None:
            relatorio.hora_fim = parse_time(dados.get('horaFim'))
        if dados.get('totalHoras') is not None:
            relatorio.total_horas = dados.get('totalHoras')
        if dados.get('razaoSocial'):
            relatorio.razao_social = dados.get('razaoSocial')
        if dados.get('cnpj') is not None:
            relatorio.cnpj = dados.get('cnpj')
        if dados.get('endereco') is not None:
            relatorio.endereco = dados.get('endereco')
        if dados.get('cidadeUf') is not None:
            relatorio.cidade_uf = dados.get('cidadeUf')
        if dados.get('inscricaoEstadual') is not None:
            relatorio.inscricao_estadual = dados.get('inscricaoEstadual')
        if dados.get('tiposServico') is not None:
            relatorio.tipos_servico = dados.get('tiposServico')
        if dados.get('servicosExecutados') is not None:
            relatorio.servicos_executados = dados.get('servicosExecutados')
        if dados.get('etc') is not None:
            relatorio.etc = dados.get('etc')
        if dados.get('eta') is not None:
            relatorio.eta = dados.get('eta')
        if dados.get('gc') is not None:
            relatorio.gc = dados.get('gc')
        if dados.get('gt') is not None:
            relatorio.gt = dados.get('gt')
        if dados.get('observacoesTeste') is not None:
            relatorio.observacoes_teste = dados.get('observacoesTeste')
        if dados.get('tecnicoResponsavel') is not None:
            relatorio.tecnico_responsavel = dados.get('tecnicoResponsavel')
        if dados.get('totalPecas') is not None:
            relatorio.total_pecas = dados.get('totalPecas')
        
        # Atualizar timestamp de modificação
        relatorio.data_modificacao = now_brasilia()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': relatorio.to_dict(),
            'message': f'Relatório {numero_relatorio} atualizado com sucesso'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@relatorios_bp.route('/relatorios/<numero_relatorio>', methods=['DELETE'])
def excluir_relatorio(numero_relatorio):
    """Exclui um relatório"""
    try:
        relatorio = Relatorio.query.filter_by(numero_relatorio=numero_relatorio).first()
        
        if not relatorio:
            return jsonify({
                'success': False,
                'error': 'Relatório não encontrado'
            }), 404
        
        # Os equipamentos e peças serão excluídos automaticamente devido ao cascade
        db.session.delete(relatorio)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Relatório {numero_relatorio} excluído com sucesso'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@relatorios_bp.route('/relatorios/proximo-numero', methods=['GET'])
def obter_proximo_numero():
    """Obtém o próximo número sequencial disponível"""
    try:
        proximo_numero = gerar_proximo_numero()
        return jsonify({
            'success': True,
            'proximo_numero': proximo_numero
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@relatorios_bp.route('/relatorios/estatisticas', methods=['GET'])
def obter_estatisticas():
    """Obtém estatísticas dos relatórios"""
    try:
        hoje = date.today()
        inicio_mes = hoje.replace(day=1)
        
        # Contar relatórios
        total_relatorios = Relatorio.query.count()
        relatorios_hoje = Relatorio.query.filter(Relatorio.data_servico == hoje).count()
        relatorios_mes = Relatorio.query.filter(Relatorio.data_servico >= inicio_mes).count()
        
        # Contar por tipo de serviço
        tipos_servico = {}
        relatorios = Relatorio.query.filter(Relatorio.data_servico >= inicio_mes).all()
        for relatorio in relatorios:
            if relatorio.tipos_servico:
                for tipo in relatorio.tipos_servico:
                    tipos_servico[tipo] = tipos_servico.get(tipo, 0) + 1
        
        return jsonify({
            'success': True,
            'data': {
                'total_relatorios': total_relatorios,
                'relatorios_hoje': relatorios_hoje,
                'relatorios_mes': relatorios_mes,
                'tipos_servico_mes': tipos_servico,
                'periodo_base': {
                    'inicio_mes': inicio_mes.isoformat(),
                    'hoje': hoje.isoformat()
                }
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
