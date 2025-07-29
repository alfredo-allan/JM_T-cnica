// Variáveis globais para a página de listagem
let relatoriosLista = [];
let paginaAtual = 1;
let itensPorPagina = 10;
let relatoriosFiltrados = [];
let relatorioSelecionado = null;

// Inicialização da página listar
document.addEventListener('DOMContentLoaded', function() {
    inicializarPaginaListar();
});

function inicializarPaginaListar() {
    carregarRelatorios();
    configurarEventosListagem();
}

function configurarEventosListagem() {
    // Configurar eventos de filtro
    document.getElementById('filtroTipoServico').addEventListener('change', filtrarTabela);
    document.getElementById('filtroPeriodoLista').addEventListener('change', filtrarTabela);
    document.getElementById('buscaRapida').addEventListener('keyup', filtrarTabela);
    document.getElementById('itensPorPagina').addEventListener('change', alterarItensPorPagina);
}

function carregarRelatorios() {
    // Carregar primeiro dos dados locais
    carregarRelatoriosLocais()
        .then(relatorios => {
            relatoriosLista = relatorios;
            relatoriosFiltrados = [...relatorios];
            atualizarTabela();
        });
    
    // Tentar carregar da API também
    carregarRelatoriosDaAPI()
        .then(relatorios => {
            // Mesclar com dados locais
            const relatoriosMesclados = mesclarRelatoriosLista(relatoriosLista, relatorios);
            relatoriosLista = relatoriosMesclados;
            relatoriosFiltrados = [...relatoriosMesclados];
            atualizarTabela();
        })
        .catch(error => {
            console.warn('API não disponível, usando apenas dados locais:', error);
        });
}

function carregarRelatoriosLocais() {
    return new Promise((resolve) => {
        const relatorios = listarRelatoriosLocais();
        resolve(relatorios);
    });
}

async function carregarRelatoriosDaAPI() {
    try {
        const response = await apiRequest('/relatorios');
        return response.data || [];
    } catch (error) {
        throw error;
    }
}

function mesclarRelatoriosLista(locais, api) {
    const mapa = new Map();
    
    // Adicionar relatórios locais
    locais.forEach(relatorio => {
        relatorio.fonte = 'local';
        mapa.set(relatorio.numeroRelatorio, relatorio);
    });
    
    // Adicionar relatórios da API (sobrescrevendo conflitos)
    api.forEach(relatorio => {
        relatorio.fonte = 'api';
        mapa.set(relatorio.numeroRelatorio, relatorio);
    });
    
    return Array.from(mapa.values());
}

function filtrarTabela() {
    const filtroTipo = document.getElementById('filtroTipoServico').value;
    const filtroPeriodo = document.getElementById('filtroPeriodoLista').value;
    const buscaRapida = document.getElementById('buscaRapida').value.toLowerCase();
    
    relatoriosFiltrados = relatoriosLista.filter(relatorio => {
        // Filtro por tipo de serviço
        if (filtroTipo && (!relatorio.tiposServico || !relatorio.tiposServico.includes(filtroTipo))) {
            return false;
        }
        
        // Filtro por período
        if (filtroPeriodo) {
            const dataRelatorio = new Date(relatorio.dataServico);
            const hoje = new Date();
            
            switch (filtroPeriodo) {
                case 'hoje':
                    if (dataRelatorio.toDateString() !== hoje.toDateString()) return false;
                    break;
                case 'semana':
                    const inicioSemana = new Date(hoje);
                    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
                    if (dataRelatorio < inicioSemana) return false;
                    break;
                case 'mes':
                    if (dataRelatorio.getMonth() !== hoje.getMonth() || 
                        dataRelatorio.getFullYear() !== hoje.getFullYear()) return false;
                    break;
            }
        }
        
        // Busca rápida
        if (buscaRapida) {
            const textosBusca = [
                relatorio.razaoSocial,
                relatorio.numeroRelatorio,
                relatorio.cnpj
            ].join(' ').toLowerCase();
            
            if (!textosBusca.includes(buscaRapida)) return false;
        }
        
        return true;
    });
    
    paginaAtual = 1;
    atualizarTabela();
}

function atualizarTabela() {
    const tbody = document.getElementById('tabelaRelatorios');
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const relatoriosPagina = relatoriosFiltrados.slice(inicio, fim);
    
    if (relatoriosPagina.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="bi bi-inbox me-2"></i>
                    Nenhum relatório encontrado
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = relatoriosPagina.map(relatorio => {
            const tiposServico = relatorio.tiposServico ? relatorio.tiposServico.join(', ').toUpperCase() : '';
            const status = determinarStatusRelatorio(relatorio);
            const badgeStatus = obterBadgeStatus(status);
            
            return `
                <tr>
                    <td><strong>${relatorio.numeroRelatorio}</strong></td>
                    <td>${formatarData(relatorio.dataServico)}</td>
                    <td>${relatorio.razaoSocial}</td>
                    <td>${formatarCNPJ(relatorio.cnpj)}</td>
                    <td>
                        ${tiposServico.split(', ').map(tipo => `<span class="badge bg-info me-1">${tipo}</span>`).join('')}
                    </td>
                    <td>${badgeStatus}</td>
                    <td class="no-print">
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary" onclick="visualizarRelatorioRapido('${relatorio.numeroRelatorio}')" title="Visualizar">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="editarRelatorioLista('${relatorio.numeroRelatorio}')" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="imprimirRelatorioLista('${relatorio.numeroRelatorio}')" title="Imprimir">
                                <i class="bi bi-printer"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="excluirRelatorioLista('${relatorio.numeroRelatorio}')" title="Excluir">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    atualizarPaginacao();
    atualizarInfoPaginacao();
}

function determinarStatusRelatorio(relatorio) {
    // Lógica para determinar o status do relatório
    const hoje = new Date();
    const dataRelatorio = new Date(relatorio.dataServico);
    const diasDiferenca = Math.floor((hoje - dataRelatorio) / (1000 * 60 * 60 * 24));
    
    if (diasDiferenca === 0) return 'hoje';
    if (diasDiferenca <= 7) return 'recente';
    if (diasDiferenca <= 30) return 'normal';
    return 'antigo';
}

function obterBadgeStatus(status) {
    const badges = {
        'hoje': '<span class="badge bg-success">Hoje</span>',
        'recente': '<span class="badge bg-primary">Recente</span>',
        'normal': '<span class="badge bg-secondary">Normal</span>',
        'antigo': '<span class="badge bg-warning">Antigo</span>'
    };
    return badges[status] || badges.normal;
}

function atualizarPaginacao() {
    const totalPaginas = Math.ceil(relatoriosFiltrados.length / itensPorPagina);
    const paginacao = document.getElementById('paginacao');
    
    if (totalPaginas <= 1) {
        paginacao.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Botão Anterior
    html += `
        <li class="page-item ${paginaAtual === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="irParaPagina(${paginaAtual - 1})">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Números das páginas
    const inicioRange = Math.max(1, paginaAtual - 2);
    const fimRange = Math.min(totalPaginas, paginaAtual + 2);
    
    if (inicioRange > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" onclick="irParaPagina(1)">1</a></li>`;
        if (inicioRange > 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    for (let i = inicioRange; i <= fimRange; i++) {
        html += `
            <li class="page-item ${i === paginaAtual ? 'active' : ''}">
                <a class="page-link" href="#" onclick="irParaPagina(${i})">${i}</a>
            </li>
        `;
    }
    
    if (fimRange < totalPaginas) {
        if (fimRange < totalPaginas - 1) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        html += `<li class="page-item"><a class="page-link" href="#" onclick="irParaPagina(${totalPaginas})">${totalPaginas}</a></li>`;
    }
    
    // Botão Próximo
    html += `
        <li class="page-item ${paginaAtual === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="irParaPagina(${paginaAtual + 1})">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginacao.innerHTML = html;
}

function atualizarInfoPaginacao() {
    const inicio = (paginaAtual - 1) * itensPorPagina + 1;
    const fim = Math.min(paginaAtual * itensPorPagina, relatoriosFiltrados.length);
    const total = relatoriosFiltrados.length;
    
    document.getElementById('infoInicio').textContent = total > 0 ? inicio : 0;
    document.getElementById('infoFim').textContent = fim;
    document.getElementById('infoTotal').textContent = total;
}

function irParaPagina(pagina) {
    const totalPaginas = Math.ceil(relatoriosFiltrados.length / itensPorPagina);
    if (pagina >= 1 && pagina <= totalPaginas) {
        paginaAtual = pagina;
        atualizarTabela();
    }
}

function alterarItensPorPagina() {
    itensPorPagina = parseInt(document.getElementById('itensPorPagina').value);
    paginaAtual = 1;
    atualizarTabela();
}

function atualizarLista() {
    carregarRelatorios();
    mostrarAlerta('info', 'Lista atualizada com sucesso!');
}

function visualizarRelatorioRapido(numeroRelatorio) {
    const relatorio = relatoriosLista.find(r => r.numeroRelatorio === numeroRelatorio);
    if (!relatorio) {
        mostrarAlerta('danger', 'Relatório não encontrado.');
        return;
    }
    
    relatorioSelecionado = relatorio;
    
    // Preencher modal de visualização
    document.getElementById('numeroModalVisualizar').textContent = relatorio.numeroRelatorio;
    document.getElementById('conteudoModalVisualizar').innerHTML = gerarPreviewRelatorio(relatorio);
    
    // Exibir modal
    const modal = new bootstrap.Modal(document.getElementById('modalVisualizacao'));
    modal.show();
}

function gerarPreviewRelatorio(relatorio) {
    const tiposServico = relatorio.tiposServico ? relatorio.tiposServico.join(', ').toUpperCase() : '';
    
    return `
        <div class="row mb-3">
            <div class="col-md-6">
                <strong>Data do Serviço:</strong><br>
                ${formatarData(relatorio.dataServico)}
            </div>
            <div class="col-md-6">
                <strong>Horário:</strong><br>
                ${formatarHora(relatorio.horaInicio)} às ${formatarHora(relatorio.horaFim)}
                ${relatorio.totalHoras ? `(${relatorio.totalHoras})` : ''}
            </div>
        </div>
        
        <div class="row mb-3">
            <div class="col-12">
                <strong>Tipos de Serviço:</strong><br>
                ${tiposServico.split(', ').map(tipo => `<span class="badge bg-info me-1">${tipo}</span>`).join('')}
            </div>
        </div>
        
        <div class="row mb-3">
            <div class="col-md-8">
                <strong>Razão Social:</strong><br>
                ${relatorio.razaoSocial}
            </div>
            <div class="col-md-4">
                <strong>CNPJ:</strong><br>
                ${formatarCNPJ(relatorio.cnpj)}
            </div>
        </div>
        
        <div class="row mb-3">
            <div class="col-md-6">
                <strong>Endereço:</strong><br>
                ${relatorio.endereco || 'Não informado'}
            </div>
            <div class="col-md-3">
                <strong>Cidade/UF:</strong><br>
                ${relatorio.cidadeUf || 'Não informado'}
            </div>
            <div class="col-md-3">
                <strong>Inscrição Estadual:</strong><br>
                ${relatorio.inscricaoEstadual || 'Não informado'}
            </div>
        </div>
        
        <div class="row mb-3">
            <div class="col-12">
                <strong>Serviços Executados:</strong><br>
                <div class="border p-2 bg-light">
                    ${relatorio.servicosExecutados || 'Não informado'}
                </div>
            </div>
        </div>
        
        ${relatorio.equipamentos && relatorio.equipamentos.length > 0 ? `
        <div class="row mb-3">
            <div class="col-12">
                <strong>Equipamentos:</strong><br>
                <div class="table-responsive">
                    <table class="table table-sm table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Bico</th>
                                <th>Marca</th>
                                <th>Modelo</th>
                                <th>Produto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${relatorio.equipamentos.map(eq => `
                                <tr>
                                    <td>${eq.numeroBico}</td>
                                    <td>${eq.marca}</td>
                                    <td>${eq.modelo}</td>
                                    <td>${eq.produto}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        ` : ''}
        
        ${relatorio.pecas && relatorio.pecas.length > 0 ? `
        <div class="row mb-3">
            <div class="col-12">
                <strong>Peças Utilizadas:</strong><br>
                <div class="table-responsive">
                    <table class="table table-sm table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Descrição</th>
                                <th>Qtd</th>
                                <th>Valor Unit.</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${relatorio.pecas.map(peca => `
                                <tr>
                                    <td>${peca.descricao}</td>
                                    <td>${peca.quantidade}</td>
                                    <td>${formatarMoeda(peca.valorUnitario)}</td>
                                    <td>${formatarMoeda(peca.valorTotal)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="table-success">
                                <td colspan="3" class="text-end"><strong>Total:</strong></td>
                                <td><strong>${formatarMoeda(relatorio.totalPecas)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
        ` : ''}
    `;
}

function editarRelatorio() {
    if (!relatorioSelecionado) return;
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalVisualizacao'));
    modal.hide();
    
    // Redirecionar para edição
    window.location.href = `editar.html?numero=${relatorioSelecionado.numeroRelatorio}`;
}

function imprimirRelatorio() {
    if (!relatorioSelecionado) return;
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalVisualizacao'));
    modal.hide();
    
    // Redirecionar para impressão
    window.location.href = `imprimir.html?numero=${relatorioSelecionado.numeroRelatorio}`;
}

function editarRelatorioLista(numeroRelatorio) {
    window.location.href = `editar.html?numero=${numeroRelatorio}`;
}

function imprimirRelatorioLista(numeroRelatorio) {
    window.location.href = `imprimir.html?numero=${numeroRelatorio}`;
}

function excluirRelatorioLista(numeroRelatorio) {
    window.location.href = `excluir.html?numero=${numeroRelatorio}`;
}
