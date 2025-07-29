// Variáveis globais para a página de criação
let contadorEquipamentos = 0;
let contadorPecas = 0;

// Inicialização da página criar
document.addEventListener('DOMContentLoaded', function() {
    inicializarPaginaCriar();
});

function inicializarPaginaCriar() {
    // Gerar número do relatório
    document.getElementById('numeroRelatorio').textContent = gerarProximoNumero();
    
    // Adicionar linhas iniciais às tabelas
    adicionarLinhasIniciaisEquipamentos();
    adicionarLinhasIniciaisPecas();
    
    // Configurar eventos do formulário
    configurarEventosFormulario();
}

function adicionarLinhasIniciaisEquipamentos() {
    const tbody = document.getElementById('equipamentosTableBody');
    for (let i = 0; i < 5; i++) {
        adicionarLinhaEquipamento();
    }
}

function adicionarLinhasIniciaisPecas() {
    const tbody = document.getElementById('pecasTableBody');
    for (let i = 0; i < 4; i++) {
        adicionarLinhaPeca();
    }
}

function adicionarLinhaEquipamento() {
    const tbody = document.getElementById('equipamentosTableBody');
    const linha = document.createElement('tr');
    linha.innerHTML = `
        <td><input type="text" class="form-control form-control-sm" name="numeroBico[]"></td>
        <td><input type="text" class="form-control form-control-sm" name="marca[]"></td>
        <td><input type="text" class="form-control form-control-sm" name="modelo[]"></td>
        <td><input type="text" class="form-control form-control-sm" name="serie[]"></td>
        <td><input type="text" class="form-control form-control-sm" name="produto[]"></td>
        <td><input type="text" class="form-control form-control-sm" name="inmetro[]"></td>
        <td><input type="text" class="form-control form-control-sm" name="portariaAprovacao[]"></td>
        <td><input type="text" class="form-control form-control-sm" name="lacreRetirado[]"></td>
        <td><input type="text" class="form-control form-control-sm" name="lacreColocado[]"></td>
        <td><input type="text" class="form-control form-control-sm" name="seloReparadoRetirado[]"></td>
        <td><input type="text" class="form-control form-control-sm" name="seloReparadoColocado[]"></td>
    `;
    tbody.appendChild(linha);
    contadorEquipamentos++;
}

function adicionarLinhaPeca() {
    const tbody = document.getElementById('pecasTableBody');
    const linha = document.createElement('tr');
    linha.innerHTML = `
        <td><input type="text" class="form-control form-control-sm" name="pecaDescricao[]"></td>
        <td><input type="number" class="form-control form-control-sm" name="pecaQuantidade[]" min="0" onchange="calcularTotalPeca(this)"></td>
        <td><input type="number" class="form-control form-control-sm" name="pecaValorUnitario[]" min="0" step="0.01" onchange="calcularTotalPeca(this)"></td>
        <td><input type="number" class="form-control form-control-sm" name="pecaValorTotal[]" step="0.01" readonly></td>
    `;
    tbody.appendChild(linha);
    contadorPecas++;
}

function calcularTotalPeca(input) {
    const linha = input.closest('tr');
    const quantidade = parseFloat(linha.querySelector('input[name="pecaQuantidade[]"]').value) || 0;
    const valorUnitario = parseFloat(linha.querySelector('input[name="pecaValorUnitario[]"]').value) || 0;
    const total = quantidade * valorUnitario;
    
    linha.querySelector('input[name="pecaValorTotal[]"]').value = total.toFixed(2);
    
    // Calcular total geral
    calcularTotalGeralPecas();
}

function calcularTotalGeralPecas() {
    const totaisLinhas = document.querySelectorAll('input[name="pecaValorTotal[]"]');
    let totalGeral = 0;
    
    totaisLinhas.forEach(input => {
        totalGeral += parseFloat(input.value) || 0;
    });
    
    document.querySelector('input[name="totalPecas"]').value = totalGeral.toFixed(2);
}

function configurarEventosFormulario() {
    const form = document.getElementById('formCriarRelatorio');
    
    // Evento de submissão do formulário
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        salvarRelatorio();
    });
    
    // Eventos para cálculo de horas
    const horaInicio = form.querySelector('input[name="horaInicio"]');
    const horaFim = form.querySelector('input[name="horaFim"]');
    const totalHoras = form.querySelector('input[name="totalHoras"]');
    
    [horaInicio, horaFim].forEach(input => {
        input.addEventListener('change', function() {
            if (horaInicio.value && horaFim.value) {
                totalHoras.value = calcularTotalHoras(horaInicio.value, horaFim.value);
            }
        });
    });
}

function salvarRelatorio() {
    const form = document.getElementById('formCriarRelatorio');
    
    // Validar formulário
    if (!validarFormulario(form)) {
        mostrarAlerta('danger', 'Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Coletar dados do formulário
    const dadosRelatorio = coletarDadosFormulario(form);
    
    // Salvar localmente (backup)
    const numeroRelatorio = document.getElementById('numeroRelatorio').textContent;
    salvarLocal(`relatorio_${numeroRelatorio}`, dadosRelatorio);
    
    // Tentar salvar na API
    salvarNaAPI(dadosRelatorio)
        .then(() => {
            mostrarAlerta('success', 'Relatório salvo com sucesso!');
            setTimeout(() => {
                if (confirm('Deseja criar um novo relatório?')) {
                    limparFormulario();
                    document.getElementById('numeroRelatorio').textContent = gerarProximoNumero();
                } else {
                    window.location.href = 'index.html';
                }
            }, 2000);
        })
        .catch(error => {
            console.error('Erro ao salvar na API:', error);
            mostrarAlerta('warning', 'Relatório salvo localmente. Será sincronizado quando a conexão for restabelecida.');
        });
}

function coletarDadosFormulario(form) {
    const formData = new FormData(form);
    const dados = {
        numeroRelatorio: document.getElementById('numeroRelatorio').textContent,
        dataServico: formData.get('dataServico'),
        horaInicio: formData.get('horaInicio'),
        horaFim: formData.get('horaFim'),
        totalHoras: formData.get('totalHoras'),
        tiposServico: formData.getAll('tipoServico'),
        razaoSocial: formData.get('razaoSocial'),
        cnpj: formData.get('cnpj'),
        endereco: formData.get('endereco'),
        cidadeUf: formData.get('cidadeUf'),
        inscricaoEstadual: formData.get('inscricaoEstadual'),
        servicosExecutados: formData.get('servicosExecutados'),
        etc: formData.get('etc'),
        eta: formData.get('eta'),
        gc: formData.get('gc'),
        gt: formData.get('gt'),
        observacoesTeste: formData.get('observacoesTeste'),
        tecnicoResponsavel: formData.get('tecnicoResponsavel'),
        totalPecas: parseFloat(formData.get('totalPecas')) || 0,
        equipamentos: [],
        pecas: [],
        dataCriacao: new Date().toISOString()
    };
    
    // Coletar equipamentos
    const numerosBico = formData.getAll('numeroBico[]');
    for (let i = 0; i < numerosBico.length; i++) {
        if (numerosBico[i].trim()) {
            dados.equipamentos.push({
                numeroBico: numerosBico[i],
                marca: formData.getAll('marca[]')[i] || '',
                modelo: formData.getAll('modelo[]')[i] || '',
                serie: formData.getAll('serie[]')[i] || '',
                produto: formData.getAll('produto[]')[i] || '',
                inmetro: formData.getAll('inmetro[]')[i] || '',
                portariaAprovacao: formData.getAll('portariaAprovacao[]')[i] || '',
                lacreRetirado: formData.getAll('lacreRetirado[]')[i] || '',
                lacreColocado: formData.getAll('lacreColocado[]')[i] || '',
                seloReparadoRetirado: formData.getAll('seloReparadoRetirado[]')[i] || '',
                seloReparadoColocado: formData.getAll('seloReparadoColocado[]')[i] || ''
            });
        }
    }
    
    // Coletar peças
    const pecasDescricao = formData.getAll('pecaDescricao[]');
    for (let i = 0; i < pecasDescricao.length; i++) {
        if (pecasDescricao[i].trim()) {
            dados.pecas.push({
                descricao: pecasDescricao[i],
                quantidade: parseInt(formData.getAll('pecaQuantidade[]')[i]) || 0,
                valorUnitario: parseFloat(formData.getAll('pecaValorUnitario[]')[i]) || 0,
                valorTotal: parseFloat(formData.getAll('pecaValorTotal[]')[i]) || 0
            });
        }
    }
    
    return dados;
}

async function salvarNaAPI(dados) {
    try {
        const response = await apiRequest('/relatorios', 'POST', dados);
        return response;
    } catch (error) {
        throw error;
    }
}

function limparFormulario() {
    const form = document.getElementById('formCriarRelatorio');
    form.reset();
    
    // Limpar validações
    limparValidacao(form);
    
    // Recriar tabelas
    document.getElementById('equipamentosTableBody').innerHTML = '';
    document.getElementById('pecasTableBody').innerHTML = '';
    contadorEquipamentos = 0;
    contadorPecas = 0;
    
    adicionarLinhasIniciaisEquipamentos();
    adicionarLinhasIniciaisPecas();
    
    // Definir data atual
    const hoje = new Date().toISOString().split('T')[0];
    form.querySelector('input[name="dataServico"]').value = hoje;
}
