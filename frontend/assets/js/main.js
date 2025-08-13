// Configuração global da aplicação
const API_BASE_URL = 'http://127.0.0.1:5000/api';

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

// Função para exibir alertas usando modais Bootstrap
function mostrarAlerta(tipo, mensagem, elemento = null) {
    // Mapeamento de tipos de alerta para tipos de modal
    const tipoModal = {
        'success': 'success',
        'danger': 'error',
        'warning': 'warning',
        'info': 'info',
        'primary': 'info',
        'secondary': 'info'
    };

    // Títulos padrão por tipo
    const titulos = {
        'success': 'Sucesso!',
        'danger': 'Erro!',
        'warning': 'Atenção!',
        'info': 'Informação',
        'primary': 'Informação',
        'secondary': 'Informação'
    };

    const tipoFinal = tipoModal[tipo] || 'info';
    const titulo = titulos[tipo] || 'Notificação';

    // Verificar se a função showModal existe (ela está no HTML)
    if (typeof showModal === 'function') {
        showModal(tipoFinal, titulo, mensagem);
    } else {
        // Fallback para console em caso de função não existir
        console.log(`${titulo}: ${mensagem}`);
        alert(`${titulo}: ${mensagem}`);
    }
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

// Função refatorada - usa a rota específica para próximo número
async function gerarProximoNumero() {
    try {
        const response = await fetch(`${API_BASE_URL}/proximo-numero-relatorio`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            return data.numero; // Retorna diretamente o número formatado (REL-YYYY-XXX)
        } else {
            throw new Error(data.error || 'Erro desconhecido na API');
        }

    } catch (error) {
        console.error('Erro ao gerar próximo número:', error);
        // Fallback para formato atual do ano
        const anoAtual = new Date().getFullYear();
        return `REL-${anoAtual}-001`; // Fallback formatado
    }
}

// Função auxiliar para consultar o número atual sem incrementar
async function consultarNumeroAtual() {
    try {
        const response = await fetch(`${API_BASE_URL}/numero-atual-relatorio`);
        const data = await response.json();

        if (data.success) {
            return data.numero_atual;
        }
    } catch (error) {
        console.error('Erro ao consultar número atual:', error);
    }
    return null;
}

// Função para validar CNPJ com dígito verificador
function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, ''); // Remove formatação

    // Verifica se tem 14 dígitos
    if (cnpj.length !== 14) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cnpj)) return false;

    // Validação do primeiro dígito verificador
    let soma = 0;
    let peso = 5;
    for (let i = 0; i < 12; i++) {
        soma += parseInt(cnpj[i]) * peso;
        peso = peso === 2 ? 9 : peso - 1;
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;

    if (parseInt(cnpj[12]) !== digito1) return false;

    // Validação do segundo dígito verificador
    soma = 0;
    peso = 6;
    for (let i = 0; i < 13; i++) {
        soma += parseInt(cnpj[i]) * peso;
        peso = peso === 2 ? 9 : peso - 1;
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;

    return parseInt(cnpj[13]) === digito2;
}

// Função para validar se Inscrição Estadual é válida (validação básica)
function validarInscricaoEstadual(ie) {
    if (!ie) return true; // Campo opcional

    ie = ie.replace(/\D/g, '').toUpperCase();

    // Aceitar "ISENTO" ou variações
    if (ie === 'ISENTO' || ie === 'ISENTA') return true;

    // Verificar se tem entre 8 e 14 dígitos
    const apenasNumeros = ie.replace(/\D/g, '');
    return apenasNumeros.length >= 8 && apenasNumeros.length <= 14;
}
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
document.addEventListener('DOMContentLoaded', function () {
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
    // Máscara para CNPJ - Formato: XX.XXX.XXX/XXXX-XX
    const cnpjInputs = document.querySelectorAll('input[name="cnpj"]');
    cnpjInputs.forEach(input => {
        input.maxLength = 18; // Tamanho máximo com formatação
        input.placeholder = "00.000.000/0000-00";

        input.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número

            // Limita a 14 dígitos
            if (value.length > 14) {
                value = value.slice(0, 14);
            }

            // Aplica a formatação progressivamente
            if (value.length >= 2) {
                value = value.replace(/^(\d{2})(\d)/, '$1.$2');
            }
            if (value.length >= 6) {
                value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            }
            if (value.length >= 9) {
                value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
            }
            if (value.length >= 13) {
                value = value.replace(/(\d{4})(\d)/, '$1-$2');
            }

            e.target.value = value;

            // Validação visual básica
            if (value.replace(/\D/g, '').length === 14) {
                e.target.classList.remove('is-invalid');
                e.target.classList.add('is-valid');
            } else if (value.length > 0) {
                e.target.classList.remove('is-valid');
                e.target.classList.add('is-invalid');
            } else {
                e.target.classList.remove('is-valid', 'is-invalid');
            }
        });

        // Validação ao sair do campo
        input.addEventListener('blur', function (e) {
            const value = e.target.value.replace(/\D/g, '');
            if (value.length > 0 && value.length !== 14) {
                e.target.classList.add('is-invalid');
                e.target.setCustomValidity('CNPJ deve ter 14 dígitos');
            } else {
                e.target.classList.remove('is-invalid');
                e.target.setCustomValidity('');
            }
        });
    });

    // Máscara para Inscrição Estadual - Formato genérico com pontos e hífen
    const ieInputs = document.querySelectorAll('input[name="inscricaoEstadual"]');
    ieInputs.forEach(input => {
        input.maxLength = 18; // Tamanho máximo considerando formatação
        input.placeholder = "000.000.000.000";

        input.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número

            // Limita a 14 dígitos (máximo para IE no Brasil)
            if (value.length > 14) {
                value = value.slice(0, 14);
            }

            // Aplica formatação com pontos a cada 3 dígitos
            let formatted = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 3 === 0 && i < value.length - 1) {
                    formatted += '.';
                }
                formatted += value[i];
            }

            e.target.value = formatted;

            // Validação visual básica (mínimo 8 dígitos, máximo 14)
            const digitCount = value.length;
            if (digitCount >= 8 && digitCount <= 14) {
                e.target.classList.remove('is-invalid');
                e.target.classList.add('is-valid');
            } else if (digitCount > 0) {
                e.target.classList.remove('is-valid');
                e.target.classList.add('is-invalid');
            } else {
                e.target.classList.remove('is-valid', 'is-invalid');
            }
        });

        // Validação ao sair do campo
        input.addEventListener('blur', function (e) {
            const value = e.target.value.replace(/\D/g, '');
            if (value.length > 0 && (value.length < 8 || value.length > 14)) {
                e.target.classList.add('is-invalid');
                e.target.setCustomValidity('Inscrição Estadual deve ter entre 8 e 14 dígitos');
            } else {
                e.target.classList.remove('is-invalid');
                e.target.setCustomValidity('');
            }
        });

        // Permitir campo "ISENTO"
        input.addEventListener('keydown', function (e) {
            // Permitir teclas especiais (backspace, delete, tab, etc.)
            if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
                // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                (e.keyCode === 65 && e.ctrlKey === true) ||
                (e.keyCode === 67 && e.ctrlKey === true) ||
                (e.keyCode === 86 && e.ctrlKey === true) ||
                (e.keyCode === 88 && e.ctrlKey === true)) {
                return;
            }

            // Permitir digitar "ISENTO" completo
            const currentValue = e.target.value.toUpperCase();
            const isentoText = "ISENTO";
            if (isentoText.startsWith(currentValue + e.key.toUpperCase()) && currentValue.length < 6) {
                e.target.value = isentoText.substring(0, currentValue.length + 1);
                e.preventDefault();
                e.target.classList.remove('is-invalid');
                e.target.classList.add('is-valid');
                return;
            }

            // Se não é número e não forma "ISENTO", bloquear
            if ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
                if (!isentoText.startsWith(currentValue + e.key.toUpperCase())) {
                    e.preventDefault();
                }
            }
        });
    });

    // Máscara para telefone (opcional) - Formato: (XX) XXXXX-XXXX
    const telefoneInputs = document.querySelectorAll('input[name="telefone"], input[type="tel"]');
    telefoneInputs.forEach(input => {
        input.maxLength = 15;
        input.placeholder = "(00) 00000-0000";

        input.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');

            if (value.length > 11) {
                value = value.slice(0, 11);
            }

            if (value.length >= 2) {
                value = value.replace(/^(\d{2})(\d)/, '($1) $2');
            }
            if (value.length >= 10) {
                if (value.length === 14) { // (XX) XXXXX-XXXX
                    value = value.replace(/(\d{5})(\d)/, '$1-$2');
                } else { // (XX) XXXX-XXXX
                    value = value.replace(/(\d{4})(\d)/, '$1-$2');
                }
            }

            e.target.value = value;
        });
    });

    // Máscara para CEP - Formato: XXXXX-XXX
    const cepInputs = document.querySelectorAll('input[name="cep"]');
    cepInputs.forEach(input => {
        input.maxLength = 9;
        input.placeholder = "00000-000";

        input.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');

            if (value.length > 8) {
                value = value.slice(0, 8);
            }

            if (value.length >= 5) {
                value = value.replace(/^(\d{5})(\d)/, '$1-$2');
            }

            e.target.value = value;

            // Validação visual
            if (value.replace(/\D/g, '').length === 8) {
                e.target.classList.remove('is-invalid');
                e.target.classList.add('is-valid');
            } else if (value.length > 0) {
                e.target.classList.remove('is-valid');
                e.target.classList.add('is-invalid');
            } else {
                e.target.classList.remove('is-valid', 'is-invalid');
            }
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