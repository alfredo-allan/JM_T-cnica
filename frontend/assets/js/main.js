// Configuração global da aplicação
const API_BASE_URL = 'http://localhost:8000/api';

// Utilitários globais
function formatarCNPJ(cnpj) {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

function formatarHora(hora) {
    return hora ? hora.substr(0, 5) : '';
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor || 0);
}

// Função para calcular total de horas
function calcularTotalHoras(horaInicio, horaFim) {
    if (!horaInicio || !horaFim) return '';
    
    const inicio = new Date(`2000-01-01T${horaInicio}:00`);
    const fim = new Date(`2000-01-01T${horaFim}:00`);
    
    if (fim < inicio) {
        fim.setDate(fim.getDate() + 1);
    }
    
    const diff = fim - inicio;
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
}

// Função para exibir alertas
function mostrarAlerta(tipo, mensagem, elemento = null) {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    if (elemento) {
        elemento.parentNode.insertBefore(alerta, elemento);
    } else {
        document.querySelector('.container').prepend(alerta);
    }
    
    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.remove();
        }
    }, 5000);
}

// Função para fazer requisições à API
async function apiRequest(endpoint, method = 'GET', data = null) {
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Função para gerar próximo número de relatório
function gerarProximoNumero() {
    // Esta função será implementada quando a API estiver integrada
    // Por enquanto, retorna um número sequencial baseado em localStorage
    const ultimoNumero = localStorage.getItem('ultimoNumeroRelatorio') || '000';
    const proximoNumero = (parseInt(ultimoNumero) + 1).toString().padStart(3, '0');
    localStorage.setItem('ultimoNumeroRelatorio', proximoNumero);
    return proximoNumero;
}

// Função para validar formulários
function validarFormulario(form) {
    const camposObrigatorios = form.querySelectorAll('[required]');
    let valido = true;
    
    camposObrigatorios.forEach(campo => {
        if (!campo.value.trim()) {
            campo.classList.add('is-invalid');
            valido = false;
        } else {
            campo.classList.remove('is-invalid');
        }
    });
    
    return valido;
}

// Função para limpar validação de formulários
function limparValidacao(form) {
    const campos = form.querySelectorAll('.is-invalid');
    campos.forEach(campo => {
        campo.classList.remove('is-invalid');
    });
}

// Função para salvar dados no localStorage (backup local)
function salvarLocal(chave, dados) {
    try {
        localStorage.setItem(chave, JSON.stringify(dados));
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
    }
}

// Função para carregar dados do localStorage
function carregarLocal(chave) {
    try {
        const dados = localStorage.getItem(chave);
        return dados ? JSON.parse(dados) : null;
    } catch (error) {
        console.error('Erro ao carregar do localStorage:', error);
        return null;
    }
}

// Função para listar todos os relatórios salvos localmente
function listarRelatoriosLocais() {
    const relatorios = [];
    for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        if (chave && chave.startsWith('relatorio_')) {
            const dados = carregarLocal(chave);
            if (dados) {
                relatorios.push(dados);
            }
        }
    }
    return relatorios.sort((a, b) => new Date(b.dataServico) - new Date(a.dataServico));
}

// Inicialização global
document.addEventListener('DOMContentLoaded', function() {
    // Configurar data atual nos campos de data
    const camposData = document.querySelectorAll('input[type="date"]');
    const hoje = new Date().toISOString().split('T')[0];
    camposData.forEach(campo => {
        if (!campo.value) {
            campo.value = hoje;
        }
    });
    
    // Configurar máscaras de entrada
    configurarMascaras();
});

// Função para configurar máscaras de entrada
function configurarMascaras() {
    // Máscara para CNPJ
    const cnpjInputs = document.querySelectorAll('input[name="cnpj"]');
    cnpjInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/^(\d{2})(\d)/, '$1.$2');
            value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
            e.target.value = value;
        });
    });
}

// Função para imprimir elementos específicos
function imprimirElemento(elementoId) {
    const elemento = document.getElementById(elementoId);
    if (!elemento) {
        mostrarAlerta('danger', 'Elemento não encontrado para impressão.');
        return;
    }
    
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Impressão - JM Técnica</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <link href="assets/css/styles.css" rel="stylesheet">
            <style>
                @media print {
                    body { margin: 0; padding: 20px; }
                    .no-print { display: none !important; }
                }
            </style>
        </head>
        <body>
            ${elemento.outerHTML}
        </body>
        </html>
    `);
    janelaImpressao.document.close();
    janelaImpressao.print();
}
