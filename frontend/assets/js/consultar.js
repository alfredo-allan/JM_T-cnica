// Variáveis globais para a página de consulta
let resultadosConsulta = [];
let relatorioSelecionado = null;

// Configurações do modal por tipo
const modalConfigs = {
    success: {
        headerClass: 'modal-success',
        icon: 'bi-check-circle-fill',
        btnClass: 'btn-success'
    },
    error: {
        headerClass: 'modal-error',
        icon: 'bi-x-circle-fill',
        btnClass: 'btn-danger'
    },
    warning: {
        headerClass: 'modal-warning',
        icon: 'bi-exclamation-triangle-fill',
        btnClass: 'btn-warning'
    },
    info: {
        headerClass: 'modal-info',
        icon: 'bi-info-circle-fill',
        btnClass: 'btn-info'
    },
    confirm: {
        headerClass: 'modal-warning',
        icon: 'bi-question-circle-fill',
        btnClass: 'btn-primary'
    }
};

// Inicialização da página consultar
document.addEventListener('DOMContentLoaded', function () {
    inicializarPaginaConsultar();
});

function inicializarPaginaConsultar() {
    configurarEventosConsulta();
}

function configurarEventosConsulta() {
    // Evento para mostrar/ocultar período personalizado
    const filtroPeriodo = document.getElementById('filtroPeriodo');
    const periodoPersonalizado = document.getElementById('periodoPersonalizado');

    filtroPeriodo.addEventListener('change', function () {
        if (this.value === 'personalizado') {
            periodoPersonalizado.style.display = 'block';
        } else {
            periodoPersonalizado.style.display = 'none';
        }
    });

    // Buscar ao pressionar Enter nos campos de texto
    const camposTexto = ['filtroNumero', 'filtroRazaoSocial', 'filtroCnpj'];
    camposTexto.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    buscarRelatorios();
                }
            });
        }
    });
}

// Função principal para mostrar modal - CORRIGIDA
function showModal(type, title, message, callback = null, showCancel = false, autoClose = false) {
    const modal = document.getElementById('modalUniversal');
    if (!modal) return;

    const modalHeader = document.getElementById('modalHeader');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const btnPrimary = document.getElementById('modalBtnPrimary');
    const btnSecondary = document.getElementById('modalBtnSecondary');

    const config = modalConfigs[type] || modalConfigs.info;

    // Reset classes
    modalHeader.className = 'modal-header ' + config.headerClass;
    modalIcon.className = 'modal-icon bi ' + config.icon;
    btnPrimary.className = 'btn ' + config.btnClass;

    // Set content
    modalTitle.textContent = title;
    modalMessage.textContent = message;

    // Configure buttons
    if (type === 'confirm' || showCancel) {
        btnPrimary.textContent = 'Confirmar';
        btnSecondary.style.display = 'inline-block';
        btnSecondary.textContent = 'Cancelar';
    } else {
        btnPrimary.textContent = 'OK';
        btnSecondary.style.display = 'none';
    }

    // Remove previous event listeners
    btnPrimary.onclick = null;
    btnSecondary.onclick = null;

    // Create modal instance
    const modalInstance = new bootstrap.Modal(modal, {
        backdrop: 'static',
        keyboard: true
    });

    // Add callback if provided
    if (callback) {
        btnPrimary.onclick = () => {
            callback(true);
            modalInstance.hide();
        };
        btnSecondary.onclick = () => {
            callback(false);
            modalInstance.hide();
        };
    } else {
        // Garantir que o modal feche corretamente
        btnPrimary.onclick = () => {
            modalInstance.hide();
        };
    }

    // Auto close para modais informativos
    if (autoClose && type === 'success') {
        setTimeout(() => {
            if (modalInstance._isShown) {
                modalInstance.hide();
            }
        }, 1500);
    }

    // Garantir que o backdrop seja removido quando o modal for fechado
    modal.addEventListener('hidden.bs.modal', function () {
        // Remover qualquer backdrop remanescente
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());

        // Restaurar scroll do body
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
    }, { once: true });

    // Show modal
    modalInstance.show();
}

// Funções de conveniência para modais - ATUALIZADAS
function showSuccess(title, message, callback = null, autoClose = true) {
    showModal('success', title, message, callback, false, autoClose);
}

function showError(title, message, callback = null) {
    showModal('error', title, message, callback);
}

function showWarning(title, message, callback = null) {
    showModal('warning', title, message, callback);
}

function showInfo(title, message, callback = null) {
    showModal('info', title, message, callback);
}

function showConfirm(title, message, callback) {
    showModal('confirm', title, message, callback, true);
}

// Funções de formatação
function formatarData(data) {
    if (!data) return 'N/A';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
}

function formatarHora(hora) {
    if (!hora) return 'N/A';
    return hora;
}

function formatarCNPJ(cnpj) {
    if (!cnpj) return 'N/A';
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatarMoeda(valor) {
    if (valor === undefined || valor === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function buscarRelatorios() {
    // Coletar filtros
    const filtros = {
        numero: document.getElementById('filtroNumero').value.trim(),
        razaoSocial: document.getElementById('filtroRazaoSocial').value.trim(),
        cnpj: document.getElementById('filtroCnpj').value.trim(),
        periodo: document.getElementById('filtroPeriodo').value,
        dataInicio: document.getElementById('dataInicio').value,
        dataFim: document.getElementById('dataFim').value,
        tiposServico: []
    };

    // Coletar tipos de serviço selecionados
    const checkboxesTipo = document.querySelectorAll('[id^="filtro"][id$="tiva"], [id^="filtro"][id$="ncia"], [id^="filtro"][id$="tra"]');
    checkboxesTipo.forEach(checkbox => {
        if (checkbox.checked) {
            filtros.tiposServico.push(checkbox.value);
        }
    });

    // Buscar primeiro localmente
    buscarRelatoriosLocais(filtros)
        .then(resultados => {
            resultadosConsulta = resultados;
            exibirResultados(resultados);
        })
        .catch(error => {
            console.error('Erro na busca:', error);
            showError('Erro', 'Erro ao buscar relatórios.');
        });

    // Tentar buscar na API também (se existir a função)
    if (typeof buscarNaAPI === 'function') {
        buscarNaAPI(filtros)
            .then(resultados => {
                // Mesclar resultados da API com os locais (evitando duplicatas)
                const resultadosMesclados = mesclarResultados(resultadosConsulta, resultados);
                resultadosConsulta = resultadosMesclados;
                exibirResultados(resultadosMesclados);
            })
            .catch(error => {
                console.warn('API não disponível, usando apenas dados locais:', error);
            });
    }
}

function buscarRelatoriosLocais(filtros) {
    return new Promise((resolve) => {
        // Se a função listarRelatoriosLocais existir, use-a, senão use dados fictícios
        let relatorios = [];
        if (typeof listarRelatoriosLocais === 'function') {
            relatorios = listarRelatoriosLocais();
        } else {
            // Dados fictícios para teste
            relatorios = [
                {
                    numeroRelatorio: '001',
                    razaoSocial: 'Posto Central Ltda',
                    cnpj: '12.345.678/0001-90',
                    dataServico: '2024-08-09',
                    horaInicio: '08:00',
                    horaFim: '12:30',
                    totalHoras: '4:30',
                    tiposServico: ['preventiva', 'corretiva'],
                    tecnico: 'João Silva',
                    endereco: 'Av. Paulista, 1000',
                    cidadeUf: 'São Paulo/SP',
                    inscricaoEstadual: '123.456.789.123',
                    servicosExecutados: 'Manutenção preventiva dos bicos de combustível e verificação do sistema de filtragem.',
                    equipamentos: [
                        { numeroBico: '01', marca: 'Wayne', modelo: 'Ovation', produto: 'Gasolina' },
                        { numeroBico: '02', marca: 'Wayne', modelo: 'Ovation', produto: 'Etanol' }
                    ],
                    pecas: [
                        { descricao: 'Filtro de combustível', quantidade: 2, valorUnitario: 45.50, valorTotal: 91.00 },
                        { descricao: 'Vedação do bico', quantidade: 4, valorUnitario: 12.30, valorTotal: 49.20 }
                    ],
                    totalPecas: 140.20
                },
                {
                    numeroRelatorio: '002',
                    razaoSocial: 'Combustíveis São Paulo S/A',
                    cnpj: '98.765.432/0001-10',
                    dataServico: '2024-08-08',
                    horaInicio: '14:00',
                    horaFim: '16:15',
                    totalHoras: '2:15',
                    tiposServico: ['extra'],
                    tecnico: 'Maria Santos',
                    endereco: 'Rua das Flores, 500',
                    cidadeUf: 'São Paulo/SP',
                    inscricaoEstadual: '987.654.321.098',
                    servicosExecutados: 'Reparo emergencial no sistema de bombeamento do tanque 3.',
                    equipamentos: [
                        { numeroBico: '05', marca: 'Gilbarco', modelo: 'Advantage', produto: 'Diesel' }
                    ],
                    pecas: [
                        { descricao: 'Bomba submersível', quantidade: 1, valorUnitario: 850.00, valorTotal: 850.00 }
                    ],
                    totalPecas: 850.00
                },
                {
                    numeroRelatorio: '003',
                    razaoSocial: 'Auto Posto Rodoviária',
                    cnpj: '11.222.333/0001-44',
                    dataServico: '2024-08-07',
                    horaInicio: '09:30',
                    horaFim: '12:30',
                    totalHoras: '3:00',
                    tiposServico: ['pendencia'],
                    tecnico: 'Carlos Oliveira',
                    endereco: 'Rodovia BR-116, Km 45',
                    cidadeUf: 'Campinas/SP',
                    inscricaoEstadual: '111.222.333.444',
                    servicosExecutados: 'Finalização da instalação de novo sistema de monitoramento iniciado na semana anterior.',
                    equipamentos: [
                        { numeroBico: '01', marca: 'Bennett', modelo: 'Vanguard', produto: 'Gasolina' },
                        { numeroBico: '02', marca: 'Bennett', modelo: 'Vanguard', produto: 'Etanol' },
                        { numeroBico: '03', marca: 'Bennett', modelo: 'Vanguard', produto: 'Diesel' }
                    ],
                    pecas: [
                        { descricao: 'Sensor de nível', quantidade: 3, valorUnitario: 125.00, valorTotal: 375.00 },
                        { descricao: 'Cabo de conexão', quantidade: 50, valorUnitario: 2.50, valorTotal: 125.00 }
                    ],
                    totalPecas: 500.00
                }
            ];
        }

        const resultados = relatorios.filter(relatorio => {
            return aplicarFiltros(relatorio, filtros);
        });
        resolve(resultados);
    });
}

async function buscarNaAPI(filtros) {
    try {
        const queryParams = new URLSearchParams();

        if (filtros.numero) queryParams.append('numero', filtros.numero);
        if (filtros.razaoSocial) queryParams.append('razaoSocial', filtros.razaoSocial);
        if (filtros.cnpj) queryParams.append('cnpj', filtros.cnpj);
        if (filtros.periodo && filtros.periodo !== 'personalizado') {
            queryParams.append('periodo', filtros.periodo);
        }
        if (filtros.dataInicio) queryParams.append('dataInicio', filtros.dataInicio);
        if (filtros.dataFim) queryParams.append('dataFim', filtros.dataFim);
        if (filtros.tiposServico.length > 0) {
            queryParams.append('tiposServico', filtros.tiposServico.join(','));
        }

        const response = await apiRequest(`/relatorios/buscar?${queryParams.toString()}`);
        return response.data || [];
    } catch (error) {
        throw error;
    }
}

function aplicarFiltros(relatorio, filtros) {
    // Filtro por número
    if (filtros.numero && !relatorio.numeroRelatorio.includes(filtros.numero)) {
        return false;
    }

    // Filtro por razão social
    if (filtros.razaoSocial && !relatorio.razaoSocial.toLowerCase().includes(filtros.razaoSocial.toLowerCase())) {
        return false;
    }

    // Filtro por CNPJ
    if (filtros.cnpj && !relatorio.cnpj.includes(filtros.cnpj.replace(/\D/g, ''))) {
        return false;
    }

    // Filtro por período
    if (filtros.periodo && filtros.periodo !== 'personalizado') {
        const dataRelatorio = new Date(relatorio.dataServico);
        const hoje = new Date();

        switch (filtros.periodo) {
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

    // Filtro por período personalizado
    if (filtros.dataInicio || filtros.dataFim) {
        const dataRelatorio = new Date(relatorio.dataServico);
        if (filtros.dataInicio && dataRelatorio < new Date(filtros.dataInicio)) return false;
        if (filtros.dataFim && dataRelatorio > new Date(filtros.dataFim)) return false;
    }

    // Filtro por tipos de serviço
    if (filtros.tiposServico.length > 0) {
        const temTipoServico = filtros.tiposServico.some(tipo =>
            relatorio.tiposServico && relatorio.tiposServico.includes(tipo)
        );
        if (!temTipoServico) return false;
    }

    return true;
}

function mesclarResultados(locais, api) {
    const mapa = new Map();

    // Primeiro, adicionar resultados locais
    locais.forEach(relatorio => {
        mapa.set(relatorio.numeroRelatorio, relatorio);
    });

    // Depois, adicionar resultados da API (sobrescrevendo se houver conflito)
    api.forEach(relatorio => {
        relatorio.fonte = 'api';
        mapa.set(relatorio.numeroRelatorio, relatorio);
    });

    return Array.from(mapa.values());
}

// Função CORRIGIDA - não mostrar modal desnecessário, apenas exibir resultados
function exibirResultados(resultados) {
    const container = document.getElementById('resultadosBusca');

    if (resultados.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Nenhum relatório encontrado com os filtros aplicados.
            </div>
        `;
        return;
    }

    // REMOVIDO o modal de sucesso que estava causando o problema
    // Apenas exibir os resultados diretamente

    let html = `
        <div class="alert alert-success mb-3">
            <i class="bi bi-check-circle me-2"></i>
            ${resultados.length} relatório(s) encontrado(s)
        </div>
    `;

    resultados.forEach(relatorio => {
        const tiposServico = relatorio.tiposServico || [];
        const badgesHtml = tiposServico.map(tipo => {
            const badgeClass = {
                'preventiva': 'bg-primary',
                'corretiva': 'bg-danger',
                'pendencia': 'bg-warning',
                'extra': 'bg-info'
            }[tipo] || 'bg-secondary';

            return `<span class="badge ${badgeClass} badge-status me-1">${tipo.toUpperCase()}</span>`;
        }).join('');

        html += `
            <div class="card mb-3 relatorio-card">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-2">
                            <h5 class="mb-0 text-success">Nº ${relatorio.numeroRelatorio}</h5>
                            <small class="text-muted">${formatarData(relatorio.dataServico)}</small>
                        </div>
                        <div class="col-md-4">
                            <h6 class="mb-1">${relatorio.razaoSocial}</h6>
                            <small class="text-muted">${formatarCNPJ(relatorio.cnpj)}</small>
                        </div>
                        <div class="col-md-3">
                            ${badgesHtml}
                        </div>
                        <div class="col-md-2">
                            <small class="text-muted">Técnico: ${relatorio.tecnico || 'N/A'}</small><br>
                            <small class="text-muted">Horas: ${relatorio.totalHoras || 'N/A'}</small>
                        </div>
                        <div class="col-md-1">
                            <button class="btn btn-outline-primary btn-sm" onclick="visualizarRelatorioRapido('${relatorio.numeroRelatorio}')" title="Visualizar">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Função de visualização rápida (nova funcionalidade)
function visualizarRelatorioRapido(numeroRelatorio) {
    const relatorio = resultadosConsulta.find(r => r.numeroRelatorio === numeroRelatorio);
    if (!relatorio) {
        showError('Erro', 'Relatório não encontrado.');
        return;
    }

    relatorioSelecionado = relatorio;

    // Preencher modal de visualização
    const numeroModal = document.getElementById('numeroModalVisualizar');
    const conteudoModal = document.getElementById('conteudoModalVisualizar');

    if (numeroModal && conteudoModal) {
        numeroModal.textContent = relatorio.numeroRelatorio;
        conteudoModal.innerHTML = gerarPreviewRelatorio(relatorio);

        // Exibir modal de visualização
        const modalVisualizacao = new bootstrap.Modal(document.getElementById('modalVisualizacao'), {
            backdrop: 'static',
            keyboard: true
        });
        modalVisualizacao.show();

        // Garantir limpeza do backdrop ao fechar
        const modalElement = document.getElementById('modalVisualizacao');
        modalElement.addEventListener('hidden.bs.modal', function () {
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            document.body.classList.remove('modal-open');
            document.body.style.paddingRight = '';
        }, { once: true });

    } else {
        // Fallback se o modal não existir
        showInfo('Relatório ' + relatorio.numeroRelatorio,
            `Empresa: ${relatorio.razaoSocial}\nData: ${formatarData(relatorio.dataServico)}`);
    }
}

// Função para gerar preview do relatório - CORRIGIDA PARA FICAR IGUAL AO LISTAR
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

// Funções dos botões do modal de visualização
function editarRelatorio() {
    if (!relatorioSelecionado) return;

    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalVisualizacao'));
    if (modal) modal.hide();

    // Redirecionar para edição
    window.location.href = `editar.html?numero=${relatorioSelecionado.numeroRelatorio}`;
}

function imprimirRelatorio() {
    if (!relatorioSelecionado) return;

    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalVisualizacao'));
    if (modal) modal.hide();

    // Redirecionar para impressão
    window.location.href = `imprimir.html?numero=${relatorioSelecionado.numeroRelatorio}`;
}

function limparFiltros() {
    showConfirm(
        'Limpar Filtros',
        'Deseja limpar todos os filtros de busca?',
        function (confirmed) {
            if (confirmed) {
                // Limpar todos os campos de filtro
                document.getElementById('filtroNumero').value = '';
                document.getElementById('filtroRazaoSocial').value = '';
                document.getElementById('filtroCnpj').value = '';
                document.getElementById('filtroPeriodo').value = '';
                document.getElementById('dataInicio').value = '';
                document.getElementById('dataFim').value = '';

                // Desmarcar checkboxes
                const checkboxes = document.querySelectorAll('[id^="filtro"][type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });

                // Ocultar período personalizado
                document.getElementById('periodoPersonalizado').style.display = 'none';

                // Limpar resultados
                document.getElementById('resultadosBusca').innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        Use os filtros acima para buscar relatórios específicos.
                    </div>
                `;

                resultadosConsulta = [];
                showSuccess('Filtros Limpos', 'Todos os filtros foram removidos com sucesso!');
            }
        }
    );
}

// Manter as funções originais para compatibilidade
function visualizarRelatorio(numeroRelatorio) {
    visualizarRelatorioRapido(numeroRelatorio);
}