// Variáveis globais para a página de exclusão
let relatorioParaExcluir = null;
let relatoriosDisponiveis = [];

// Inicialização da página excluir
document.addEventListener('DOMContentLoaded', function() {
    inicializarPaginaExcluir();
});

function inicializarPaginaExcluir() {
    carregarRelatoriosDisponiveis();
    configurarEventosExclusao();
    
    // Verificar se há parâmetro na URL
    const urlParams = new URLSearchParams(window.location.search);
    const numero = urlParams.get('numero');
    if (numero) {
        document.getElementById('numeroRelatorioExcluir').value = numero;
        buscarRelatorioExcluir();
    }
}

function configurarEventosExclusao() {
    // Evento para o checkbox de confirmação
    const confirmarExclusao = document.getElementById('confirmarExclusao');
    if (confirmarExclusao) {
        confirmarExclusao.addEventListener('change', function() {
            const btnConfirmar = document.getElementById('btnConfirmarExclusao');
            if (btnConfirmar) {
                btnConfirmar.disabled = !this.checked;
            }
        });
    }
}

function carregarRelatoriosDisponiveis() {
    // Carregar relatórios para exibir na lista
    relatoriosDisponiveis = listarRelatoriosLocais();
    const tbody = document.getElementById('tabelaRelatoriosExcluir');
    
    if (relatoriosDisponiveis.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="bi bi-inbox me-2"></i>
                    Nenhum relatório disponível para exclusão
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = relatoriosDisponiveis.map(relatorio => {
        const tiposServico = relatorio.tiposServico ? relatorio.tiposServico.join(', ').toUpperCase() : '';
        return `
            <tr>
                <td><strong>${relatorio.numeroRelatorio}</strong></td>
                <td>${formatarData(relatorio.dataServico)}</td>
                <td>${relatorio.razaoSocial}</td>
                <td>${formatarCNPJ(relatorio.cnpj)}</td>
                <td>
                    ${tiposServico.split(', ').map(tipo => `<span class="badge bg-info me-1">${tipo}</span>`).join('')}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="selecionarParaExclusao('${relatorio.numeroRelatorio}')" title="Selecionar para exclusão">
                        <i class="bi bi-trash me-1"></i>Excluir
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function buscarRelatorioExcluir() {
    const numero = document.getElementById('numeroRelatorioExcluir').value.trim();
    const razaoSocial = document.getElementById('razaoSocialExcluir').value.trim();
    
    if (!numero && !razaoSocial) {
        mostrarAlerta('warning', 'Informe o número do relatório ou a razão social para buscar.');
        return;
    }
    
    // Buscar primeiro localmente
    buscarRelatorioLocalExcluir(numero, razaoSocial)
        .then(relatorio => {
            if (relatorio) {
                selecionarParaExclusao(relatorio.numeroRelatorio);
            } else {
                // Tentar buscar na API
                return buscarRelatorioNaAPIExcluir(numero, razaoSocial);
            }
        })
        .then(relatorio => {
            if (relatorio) {
                selecionarParaExclusao(relatorio.numeroRelatorio);
            }
        })
        .catch(error => {
            console.error('Erro ao buscar relatório:', error);
            mostrarAlerta('danger', 'Relatório não encontrado.');
        });
}

function buscarRelatorioLocalExcluir(numero, razaoSocial) {
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

async function buscarRelatorioNaAPIExcluir(numero, razaoSocial) {
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

function selecionarParaExclusao(numeroRelatorio) {
    const relatorio = relatoriosDisponiveis.find(r => r.numeroRelatorio === numeroRelatorio);
    if (!relatorio) {
        mostrarAlerta('danger', 'Relatório não encontrado.');
        return;
    }
    
    relatorioParaExcluir = relatorio;
    exibirConfirmacaoExclusao(relatorio);
}

function exibirConfirmacaoExclusao(relatorio) {
    // Mostrar área de confirmação
    document.getElementById('confirmacaoExclusao').style.display = 'block';
    document.getElementById('listaRelatoriosExcluir').style.display = 'none';
    
    // Preencher dados do relatório
    const dadosRelatorio = document.getElementById('dadosRelatorioExcluir');
    const tiposServico = relatorio.tiposServico ? relatorio.tiposServico.join(', ').toUpperCase() : '';
    
    dadosRelatorio.innerHTML = `
        <div class="row mb-3">
            <div class="col-md-3">
                <strong>Número:</strong><br>
                <span class="badge bg-primary fs-6">${relatorio.numeroRelatorio}</span>
            </div>
            <div class="col-md-3">
                <strong>Data:</strong><br>
                ${formatarData(relatorio.dataServico)}
            </div>
            <div class="col-md-6">
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
            <div class="col-md-6">
                <strong>Cidade/UF:</strong><br>
                ${relatorio.cidadeUf || 'Não informado'}
            </div>
        </div>
        
        ${relatorio.servicosExecutados ? `
        <div class="row mb-3">
            <div class="col-12">
                <strong>Serviços Executados:</strong><br>
                <div class="border p-2 bg-light text-truncate" style="max-height: 100px; overflow-y: auto;">
                    ${relatorio.servicosExecutados}
                </div>
            </div>
        </div>
        ` : ''}
        
        ${relatorio.equipamentos && relatorio.equipamentos.length > 0 ? `
        <div class="row mb-3">
            <div class="col-12">
                <strong>Equipamentos (${relatorio.equipamentos.length}):</strong><br>
                <small class="text-muted">
                    ${relatorio.equipamentos.map(eq => `Bico ${eq.numeroBico} - ${eq.marca} ${eq.modelo}`).join(', ')}
                </small>
            </div>
        </div>
        ` : ''}
        
        ${relatorio.pecas && relatorio.pecas.length > 0 ? `
        <div class="row mb-3">
            <div class="col-12">
                <strong>Peças Utilizadas (${relatorio.pecas.length}) - Total: ${formatarMoeda(relatorio.totalPecas)}</strong><br>
                <small class="text-muted">
                    ${relatorio.pecas.map(peca => `${peca.descricao} (${peca.quantidade}x)`).join(', ')}
                </small>
            </div>
        </div>
        ` : ''}
        
        <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            <strong>Data de Criação:</strong> ${formatarData(relatorio.dataCriacao || relatorio.dataServico)}
            ${relatorio.dataModificacao ? `<br><strong>Última Modificação:</strong> ${formatarData(relatorio.dataModificacao)}` : ''}
        </div>
    `;
    
    // Limpar checkbox de confirmação
    const checkbox = document.getElementById('confirmarExclusao');
    if (checkbox) {
        checkbox.checked = false;
        document.getElementById('btnConfirmarExclusao').disabled = true;
    }
}

function cancelarExclusao() {
    document.getElementById('confirmacaoExclusao').style.display = 'none';
    document.getElementById('listaRelatoriosExcluir').style.display = 'block';
    relatorioParaExcluir = null;
    limparBuscaExcluir();
    
    // Limpar checkbox
    const checkbox = document.getElementById('confirmarExclusao');
    if (checkbox) {
        checkbox.checked = false;
    }
}

function confirmarExclusaoRelatorio() {
    if (!relatorioParaExcluir) {
        mostrarAlerta('danger', 'Nenhum relatório selecionado para exclusão.');
        return;
    }
    
    const checkbox = document.getElementById('confirmarExclusao');
    if (!checkbox || !checkbox.checked) {
        mostrarAlerta('warning', 'Você deve confirmar a exclusão marcando a caixa de seleção.');
        return;
    }
    
    // Exibir modal de confirmação final
    const modal = new bootstrap.Modal(document.getElementById('modalConfirmacaoExclusao'));
    modal.show();
}

function executarExclusao() {
    if (!relatorioParaExcluir) {
        mostrarAlerta('danger', 'Erro interno: relatório não encontrado.');
        return;
    }
    
    const numeroRelatorio = relatorioParaExcluir.numeroRelatorio;
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmacaoExclusao'));
    modal.hide();
    
    // Excluir localmente
    excluirRelatorioLocal(numeroRelatorio);
    
    // Tentar excluir na API
    excluirRelatorioNaAPI(numeroRelatorio)
        .then(() => {
            mostrarAlerta('success', `Relatório N° ${numeroRelatorio} excluído com sucesso!`);
            finalizarExclusao();
        })
        .catch(error => {
            console.error('Erro ao excluir na API:', error);
            mostrarAlerta('warning', `Relatório N° ${numeroRelatorio} excluído localmente. A exclusão será sincronizada quando a conexão for restabelecida.`);
            finalizarExclusao();
        });
}

function excluirRelatorioLocal(numeroRelatorio) {
    try {
        localStorage.removeItem(`relatorio_${numeroRelatorio}`);
        
        // Remover da lista local
        relatoriosDisponiveis = relatoriosDisponiveis.filter(r => r.numeroRelatorio !== numeroRelatorio);
        
        return true;
    } catch (error) {
        console.error('Erro ao excluir relatório local:', error);
        return false;
    }
}

async function excluirRelatorioNaAPI(numeroRelatorio) {
    try {
        const response = await apiRequest(`/relatorios/${numeroRelatorio}`, 'DELETE');
        return response;
    } catch (error) {
        throw error;
    }
}

function finalizarExclusao() {
    // Recarregar lista de relatórios
    carregarRelatoriosDisponiveis();
    
    // Voltar para a view principal
    cancelarExclusao();
    
    // Perguntar se deseja excluir mais relatórios
    setTimeout(() => {
        if (relatoriosDisponiveis.length > 0) {
            if (confirm('Deseja excluir mais relatórios?')) {
                // Permanecer na página
            } else {
                window.location.href = 'index.html';
            }
        } else {
            mostrarAlerta('info', 'Não há mais relatórios disponíveis para exclusão.');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }, 1000);
}

function limparBuscaExcluir() {
    document.getElementById('numeroRelatorioExcluir').value = '';
    document.getElementById('razaoSocialExcluir').value = '';
}
