// Variáveis globais para a página de edição
let relatorioAtual = null;

// Inicialização da página editar
document.addEventListener('DOMContentLoaded', function () {
    inicializarPaginaEditar();
});

function inicializarPaginaEditar() {
    configurarEventosEdicao();

    // Verificar se há parâmetro na URL
    const urlParams = new URLSearchParams(window.location.search);
    const numero = urlParams.get('numero');
    if (numero) {
        document.getElementById('numeroRelatorioEditar').value = numero;
        buscarRelatorioEditar();
    }

    // Verificar se há relatório no sessionStorage
    const numeroSession = sessionStorage.getItem('relatorioParaEditar');
    if (numeroSession) {
        document.getElementById('numeroRelatorioEditar').value = numeroSession;
        buscarRelatorioEditar();
        sessionStorage.removeItem('relatorioParaEditar');
    }
}

function configurarEventosEdicao() {
    // Evento para submissão do formulário de edição
    const formEditar = document.getElementById('formEditarRelatorio');
    if (formEditar) {
        formEditar.addEventListener('submit', function (e) {
            e.preventDefault();
            salvarAlteracoes();
        });
    }

    // Evento para cálculo de horas
    configurarCalculoHoras();

    // Evento para o checkbox de confirmação de exclusão
    const confirmarExclusao = document.getElementById('confirmarExclusao');
    if (confirmarExclusao) {
        confirmarExclusao.addEventListener('change', function () {
            const btnConfirmar = document.getElementById('btnConfirmarExclusao');
            btnConfirmar.disabled = !this.checked;
        });
    }
}

function configurarCalculoHoras() {
    const horaInicio = document.getElementById('horaInicioEdit');
    const horaFim = document.getElementById('horaFimEdit');
    const totalHoras = document.getElementById('totalHorasEdit');

    if (horaInicio && horaFim && totalHoras) {
        [horaInicio, horaFim].forEach(input => {
            input.addEventListener('change', function () {
                if (horaInicio.value && horaFim.value) {
                    totalHoras.value = calcularTotalHoras(horaInicio.value, horaFim.value);
                }
            });
        });
    }
}

function buscarRelatorioEditar() {
    const numero = document.getElementById('numeroRelatorioEditar').value.trim();
    const razaoSocial = document.getElementById('razaoSocialEditar').value.trim();

    if (!numero && !razaoSocial) {
        mostrarAviso('Informe o número do relatório ou a razão social para buscar.');
        return;
    }

    // Buscar primeiro localmente
    buscarRelatorioLocal(numero, razaoSocial)
        .then(relatorio => {
            if (relatorio) {
                relatorioAtual = relatorio;
                exibirFormularioEdicao(relatorio);
            } else {
                // Tentar buscar na API se não encontrar localmente
                return buscarRelatorioNaAPI(numero, razaoSocial);
            }
        })
        .then(relatorio => {
            if (relatorio) {
                relatorioAtual = relatorio;
                exibirFormularioEdicao(relatorio);
            }
        })
        .catch(error => {
            console.error('Erro ao buscar relatório:', error);
            exibirNenhumRelatorioEncontrado();
        });
}

function buscarRelatorioLocal(numero, razaoSocial) {
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

async function buscarRelatorioNaAPI(numero, razaoSocial) {
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

function exibirFormularioEdicao(relatorio) {
    // Mostrar formulário de edição
    document.getElementById('formularioEdicao').style.display = 'block';
    document.getElementById('nenhumRelatorioEncontrado').style.display = 'none';

    // Preencher número do relatório sendo editado
    document.getElementById('numeroRelatorioEditando').textContent = relatorio.numeroRelatorio;

    // Preencher tipos de serviço
    const tiposServico = relatorio.tiposServico || [];
    document.getElementById('preventivaEdit').checked = tiposServico.includes('preventiva');
    document.getElementById('corretivaEdit').checked = tiposServico.includes('corretiva');
    document.getElementById('pendenciaEdit').checked = tiposServico.includes('pendencia');
    document.getElementById('extraEdit').checked = tiposServico.includes('extra');

    // Preencher informações da empresa
    document.getElementById('razaoSocialEdit').value = relatorio.razaoSocial || '';
    document.getElementById('cnpjEdit').value = relatorio.cnpj || '';
    document.getElementById('enderecoEdit').value = relatorio.endereco || '';
    document.getElementById('cidadeUfEdit').value = relatorio.cidadeUf || '';
    document.getElementById('inscricaoEstadualEdit').value = relatorio.inscricaoEstadual || '';

    // Preencher serviços executados
    document.getElementById('servicosExecutadosEdit').value = relatorio.servicosExecutados || '';

    // Preencher data e horários
    document.getElementById('dataServicoEdit').value = relatorio.dataServico || '';
    document.getElementById('horaInicioEdit').value = relatorio.horaInicio || '';
    document.getElementById('horaFimEdit').value = relatorio.horaFim || '';
    document.getElementById('totalHorasEdit').value = relatorio.totalHoras || '';
}

function exibirNenhumRelatorioEncontrado() {
    document.getElementById('formularioEdicao').style.display = 'none';
    document.getElementById('nenhumRelatorioEncontrado').style.display = 'block';
}

function cancelarEdicao() {
    document.getElementById('formularioEdicao').style.display = 'none';
    document.getElementById('nenhumRelatorioEncontrado').style.display = 'none';
    limparBuscaEditar();
    relatorioAtual = null;
}

function limparBuscaEditar() {
    document.getElementById('numeroRelatorioEditar').value = '';
    document.getElementById('razaoSocialEditar').value = '';
}

function salvarAlteracoes() {
    const form = document.getElementById('formEditarRelatorio');

    // Validar formulário
    if (!validarFormulario(form)) {
        mostrarErro('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    // Coletar dados do formulário
    const dadosAtualizados = coletarDadosEdicao(form);

    // Atualizar dados locais
    salvarLocal(`relatorio_${relatorioAtual.numeroRelatorio}`, dadosAtualizados);

    // Tentar salvar na API
    salvarAlteracoesNaAPI(dadosAtualizados)
        .then(() => {
            mostrarSucesso('Alterações salvas com sucesso!');
            setTimeout(() => {
                mostrarConfirmacao('Deseja continuar editando outros relatórios?', function () {
                    cancelarEdicao();
                });
            }, 2000);
        })
        .catch(error => {
            console.error('Erro ao salvar na API:', error);
            mostrarAviso('Alterações salvas localmente. Serão sincronizadas quando a conexão for restabelecida.');
        });
}

function coletarDadosEdicao(form) {
    const formData = new FormData(form);

    // Começar com os dados originais e atualizar apenas os campos modificados
    const dadosAtualizados = { ...relatorioAtual };

    // Atualizar campos básicos
    dadosAtualizados.dataServico = formData.get('dataServico');
    dadosAtualizados.horaInicio = formData.get('horaInicio');
    dadosAtualizados.horaFim = formData.get('horaFim');
    dadosAtualizados.totalHoras = formData.get('totalHoras');
    dadosAtualizados.razaoSocial = formData.get('razaoSocial');
    dadosAtualizados.cnpj = formData.get('cnpj');
    dadosAtualizados.endereco = formData.get('endereco');
    dadosAtualizados.cidadeUf = formData.get('cidadeUf');
    dadosAtualizados.inscricaoEstadual = formData.get('inscricaoEstadual');
    dadosAtualizados.servicosExecutados = formData.get('servicosExecutados');

    // Atualizar tipos de serviço
    dadosAtualizados.tiposServico = formData.getAll('tipoServico');

    // Marcar como modificado
    dadosAtualizados.dataModificacao = new Date().toISOString();

    return dadosAtualizados;
}

async function salvarAlteracoesNaAPI(dados) {
    try {
        const response = await apiRequest(`/relatorios/${dados.numeroRelatorio}`, 'PUT', dados);
        return response;
    } catch (error) {
        throw error;
    }
}
