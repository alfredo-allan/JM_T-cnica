// Variáveis globais para a página de impressão
let relatorioParaImpressao = null;

// Inicialização da página imprimir
document.addEventListener('DOMContentLoaded', function() {
    inicializarPaginaImprimir();
});

function inicializarPaginaImprimir() {
    carregarRelatoriosRecentes();
    
    // Verificar se há parâmetro na URL
    const urlParams = new URLSearchParams(window.location.search);
    const numero = urlParams.get('numero');
    if (numero) {
        document.getElementById('numeroRelatorioImprimir').value = numero;
        buscarRelatorioImprimir();
    }
    
    // Verificar se há relatório no sessionStorage
    const relatorioSession = sessionStorage.getItem('relatorioParaVisualizar');
    if (relatorioSession) {
        const relatorio = JSON.parse(relatorioSession);
        relatorioParaImpressao = relatorio;
        exibirRelatorioParaImpressao(relatorio);
        sessionStorage.removeItem('relatorioParaVisualizar');
    }
}

function carregarRelatoriosRecentes() {
    // Carregar relatórios recentes (últimos 10)
    const relatorios = listarRelatoriosLocais().slice(0, 10);
    const tbody = document.getElementById('tabelaRecentesImprimir');
    
    if (relatorios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-3">
                    <i class="bi bi-inbox me-2"></i>
                    Nenhum relatório encontrado
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = relatorios.map(relatorio => {
        const tiposServico = relatorio.tiposServico ? relatorio.tiposServico.join(', ').toUpperCase() : '';
        return `
            <tr>
                <td><strong>${relatorio.numeroRelatorio}</strong></td>
                <td>${formatarData(relatorio.dataServico)}</td>
                <td>${relatorio.razaoSocial}</td>
                <td>
                    ${tiposServico.split(', ').map(tipo => `<span class="badge bg-info me-1">${tipo}</span>`).join('')}
                </td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="imprimirRelatorioRapido('${relatorio.numeroRelatorio}')" title="Imprimir">
                        <i class="bi bi-printer me-1"></i>Imprimir
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function buscarRelatorioImprimir() {
    const numero = document.getElementById('numeroRelatorioImprimir').value.trim();
    const razaoSocial = document.getElementById('razaoSocialImprimir').value.trim();
    
    if (!numero && !razaoSocial) {
        mostrarAlerta('warning', 'Informe o número do relatório ou a razão social para buscar.');
        return;
    }
    
    // Buscar primeiro localmente
    buscarRelatorioLocalImprimir(numero, razaoSocial)
        .then(relatorio => {
            if (relatorio) {
                relatorioParaImpressao = relatorio;
                exibirRelatorioParaImpressao(relatorio);
            } else {
                // Tentar buscar na API
                return buscarRelatorioNaAPIImprimir(numero, razaoSocial);
            }
        })
        .then(relatorio => {
            if (relatorio) {
                relatorioParaImpressao = relatorio;
                exibirRelatorioParaImpressao(relatorio);
            }
        })
        .catch(error => {
            console.error('Erro ao buscar relatório:', error);
            mostrarAlerta('danger', 'Relatório não encontrado.');
            cancelarVisualizacao();
        });
}

function buscarRelatorioLocalImprimir(numero, razaoSocial) {
    return new Promise((resolve) => {
        const relatorios = listarRelatoriosLocais();
        const relatorio = relatorios.find(r => {
            const matchNumero = numero ? r.numeroRelatorio.includes(numero) : true;
            const matchRazao = razaoSocial ? r.razaoSocial.toLowerCase().includes(razaoSocial.toLowerCase()) : true;
            return matchNumero && matchRazao;
        });
        resolve(relatorio);
    });
}

async function buscarRelatorioNaAPIImprimir(numero, razaoSocial) {
    try {
        const queryParams = new URLSearchParams();
        if (numero) queryParams.append('numero', numero);
        if (razaoSocial) queryParams.append('razaoSocial', razaoSocial);
        
        const response = await apiRequest(`/relatorios/buscar?${queryParams.toString()}`);
        const relatorios = response.data || [];
        return relatorios.length > 0 ? relatorios[0] : null;
    } catch (error) {
        throw error;
    }
}

function exibirRelatorioParaImpressao(relatorio) {
    // Mostrar área de visualização
    document.getElementById('relatorioParaImpressao').style.display = 'block';
    document.getElementById('listaRecentesImprimir').style.display = 'none';
    
    // Preencher número do relatório
    document.getElementById('numeroRelatorioVisualizacao').textContent = relatorio.numeroRelatorio;
    
    // Gerar conteúdo completo do relatório
    document.getElementById('conteudoRelatorioImpressao').innerHTML = gerarConteudoCompleto(relatorio);
}

function gerarConteudoCompleto(relatorio) {
    const tiposServico = relatorio.tiposServico ? relatorio.tiposServico.join(', ').toUpperCase() : '';
    
    return `
        <!-- Cabeçalho do Relatório -->
        <div class="service-header print-header mb-4">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h2 class="mb-0">
                        <i class="bi bi-fuel-pump me-2"></i>
                        JM Técnica - Relatório de Serviço
                    </h2>
                    <p class="mb-0 mt-2">Assessoria e Serviços Técnicos em Equipamentos para Postos de Combustível</p>
                </div>
                <div class="col-md-4 text-end">
                    <h3 class="mb-0">N° ${relatorio.numeroRelatorio}</h3>
                </div>
            </div>
        </div>
        
        <!-- Tipos de Serviço -->
        <div class="row mb-4">
            <div class="col-12">
                <h5 class="text-success mb-3">TIPOS DE SERVIÇOS</h5>
                <div class="d-flex gap-3 flex-wrap">
                    ${['PREVENTIVA', 'CORRETIVA', 'PENDÊNCIA', 'EXTRA'].map(tipo => {
                        const checked = relatorio.tiposServico && relatorio.tiposServico.includes(tipo.toLowerCase()) ? '☑' : '☐';
                        return `<span class="me-3">${checked} ${tipo}</span>`;
                    }).join('')}
                </div>
            </div>
        </div>
        
        <!-- Informações da Empresa -->
        <div class="row mb-4">
            <div class="col-md-8">
                <strong>Razão Social:</strong> ${relatorio.razaoSocial}
            </div>
            <div class="col-md-4">
                <strong>CNPJ:</strong> ${formatarCNPJ(relatorio.cnpj)}
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-6">
                <strong>Endereço:</strong> ${relatorio.endereco || 'Não informado'}
            </div>
            <div class="col-md-3">
                <strong>Cidade/UF:</strong> ${relatorio.cidadeUf || 'Não informado'}
            </div>
            <div class="col-md-3">
                <strong>Inscrição Estadual:</strong> ${relatorio.inscricaoEstadual || 'Não informado'}
            </div>
        </div>
        
        <!-- Equipamentos -->
        ${relatorio.equipamentos && relatorio.equipamentos.length > 0 ? `
        <div class="mb-4">
            <h5 class="text-success mb-3">
                <i class="bi bi-gear me-2"></i>EQUIPAMENTOS
            </h5>
            <div class="table-responsive">
                <table class="table table-bordered table-sm equipamentos-table">
                    <thead>
                        <tr>
                            <th>N° BICO</th>
                            <th>MARCA</th>
                            <th>MODELO</th>
                            <th>SÉRIE</th>
                            <th>PRODUTO</th>
                            <th>INMETRO</th>
                            <th>PORTARIA APROVAÇÃO</th>
                            <th>N° LACRE RETIRADO</th>
                            <th>N° LACRE COLOCADO</th>
                            <th>SELO REPARADO RETIRADO</th>
                            <th>SELO REPARADO COLOCADO</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${relatorio.equipamentos.map(eq => `
                            <tr>
                                <td>${eq.numeroBico || ''}</td>
                                <td>${eq.marca || ''}</td>
                                <td>${eq.modelo || ''}</td>
                                <td>${eq.serie || ''}</td>
                                <td>${eq.produto || ''}</td>
                                <td>${eq.inmetro || ''}</td>
                                <td>${eq.portariaAprovacao || ''}</td>
                                <td>${eq.lacreRetirado || ''}</td>
                                <td>${eq.lacreColocado || ''}</td>
                                <td>${eq.seloReparadoRetirado || ''}</td>
                                <td>${eq.seloReparadoColocado || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}
        
        <!-- Serviços Executados -->
        <div class="mb-4">
            <h5 class="text-success mb-3">N° BICO / DESC. SERVIÇOS EXECUTADOS</h5>
            <div class="border p-3 bg-light">
                ${relatorio.servicosExecutados || 'Não informado'}
            </div>
        </div>
        
        <!-- Peças Utilizadas -->
        ${relatorio.pecas && relatorio.pecas.length > 0 ? `
        <div class="mb-4">
            <h5 class="text-success mb-3">
                <i class="bi bi-tools me-2"></i>PEÇAS UTILIZADAS
            </h5>
            <div class="table-responsive">
                <table class="table table-bordered table-sm">
                    <thead class="table-light">
                        <tr>
                            <th>PEÇAS UTILIZADAS</th>
                            <th>QUANT.</th>
                            <th>R$ UNITÁRIO</th>
                            <th>R$ TOTAL</th>
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
                            <td colspan="3" class="text-end fw-bold">TOTAL R$</td>
                            <td class="fw-bold">${formatarMoeda(relatorio.totalPecas)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
        ` : ''}
        
        <!-- Testes de Atenção -->
        <div class="mb-4">
            <h5 class="text-success mb-3">
                <i class="bi bi-clipboard-check me-2"></i>TESTES DE ATENÇÃO
            </h5>
            <div class="row g-2">
                <div class="col-md-2">
                    <strong>ETC:</strong> ${relatorio.etc || ''}
                </div>
                <div class="col-md-2">
                    <strong>ETA:</strong> ${relatorio.eta || ''}
                </div>
                <div class="col-md-1">
                    <strong>GC:</strong> ${relatorio.gc || ''}
                </div>
                <div class="col-md-1">
                    <strong>GT:</strong> ${relatorio.gt || ''}
                </div>
                <div class="col-md-3">
                    <strong>OBSERVAÇÕES:</strong> ${relatorio.observacoesTeste || ''}
                </div>
                <div class="col-md-3">
                    <strong>TÉCNICO RESPONSÁVEL:</strong> ${relatorio.tecnicoResponsavel || ''}
                </div>
            </div>
        </div>
        
        <!-- Data e Horários -->
        <div class="row mb-4">
            <div class="col-md-3">
                <strong>Data:</strong> ${formatarData(relatorio.dataServico)}
            </div>
            <div class="col-md-3">
                <strong>Hora Início:</strong> ${formatarHora(relatorio.horaInicio)}
            </div>
            <div class="col-md-3">
                <strong>Hora Fim:</strong> ${formatarHora(relatorio.horaFim)}
            </div>
            <div class="col-md-3">
                <strong>Total Horas:</strong> ${relatorio.totalHoras || ''}
            </div>
        </div>
        
        <!-- Assinaturas -->
        <div class="row mt-5">
            <div class="col-md-6 text-center">
                <div class="border-top mt-4 pt-2">
                    <strong>Técnico Responsável</strong><br>
                    ${relatorio.tecnicoResponsavel || '_________________________'}
                </div>
            </div>
            <div class="col-md-6 text-center">
                <div class="border-top mt-4 pt-2">
                    <strong>Cliente / Responsável</strong><br>
                    _________________________
                </div>
            </div>
        </div>
    `;
}

function imprimirRelatorioCompleto() {
    if (!relatorioParaImpressao) {
        mostrarAlerta('danger', 'Nenhum relatório selecionado para impressão.');
        return;
    }
    
    // Preparar conteúdo para impressão
    const conteudoImpressao = document.getElementById('conteudoRelatorioImpressao').innerHTML;
    
    // Criar janela de impressão
    const janelaImpressao = window.open('', '_blank', 'width=800,height=600');
    janelaImpressao.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatório N° ${relatorioParaImpressao.numeroRelatorio} - JM Técnica</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
            <style>
                @media print {
                    body { 
                        margin: 0; 
                        padding: 15px; 
                        font-size: 12px;
                    }
                    .no-print { 
                        display: none !important; 
                    }
                    .service-header {
                        background: linear-gradient(135deg, #198754 0%, #20c997 100%) !important;
                        color: white !important;
                        padding: 1rem !important;
                        border-radius: 0.5rem !important;
                        margin-bottom: 1.5rem !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .equipamentos-table th {
                        background-color: #e9ecef !important;
                        font-size: 0.75rem !important;
                        text-align: center !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .table-success {
                        background-color: #d1e7dd !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .text-success {
                        color: #198754 !important;
                    }
                    .border-top {
                        border-top: 2px solid #000 !important;
                    }
                }
                .equipamentos-table th {
                    background-color: #e9ecef;
                    font-size: 0.875rem;
                    text-align: center;
                }
                .equipamentos-table td {
                    font-size: 0.8rem;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container-fluid">
                ${conteudoImpressao}
            </div>
            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `);
    
    janelaImpressao.document.close();
}

function imprimirRelatorioRapido(numeroRelatorio) {
    // Buscar relatório e imprimir diretamente
    const relatorio = listarRelatoriosLocais().find(r => r.numeroRelatorio === numeroRelatorio);
    if (!relatorio) {
        mostrarAlerta('danger', 'Relatório não encontrado.');
        return;
    }
    
    relatorioParaImpressao = relatorio;
    imprimirRelatorioCompleto();
}

function cancelarVisualizacao() {
    document.getElementById('relatorioParaImpressao').style.display = 'none';
    document.getElementById('listaRecentesImprimir').style.display = 'block';
    relatorioParaImpressao = null;
    limparBuscaImprimir();
}

function limparBuscaImprimir() {
    document.getElementById('numeroRelatorioImprimir').value = '';
    document.getElementById('razaoSocialImprimir').value = '';
}
