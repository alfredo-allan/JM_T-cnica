// Variáveis globais para a página de impressão
let relatorioParaImpressao = null;

// Inicialização da página imprimir
document.addEventListener('DOMContentLoaded', function () {
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

// Função auxiliar para marcar checkboxes na impressão
function marcarCheckboxesServico(relatorio) {
    const tipos = relatorio.tiposServico || [];
    return {
        preventiva: tipos.includes('preventiva') ? '☑' : '☐',
        corretiva: tipos.includes('corretiva') ? '☑' : '☐',
        pendencia: tipos.includes('pendencia') ? '☑' : '☐',
        extra: tipos.includes('extra') ? '☑' : '☐'
    };
}

// Função refatorada para gerar conteúdo idêntico à foto do relatório
function gerarConteudoCompleto(relatorio) {
    const checkboxes = marcarCheckboxesServico(relatorio);

    return `
        <!-- Cabeçalho com Logo e Informações da Empresa -->
        <div class="cabecalho-relatorio">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000;">
                <tr>
                    <td style="width: 200px; padding: 10px; border-right: 2px solid #000; text-align: center; vertical-align: middle;">
                        <!-- Logo da empresa - insira o src correto aqui -->
                        <img src="assets/img/logo-jm-tecnica.png" alt="JM Técnica" style="max-width: 180px; max-height: 120px;">
                    </td>
                    <td style="padding: 8px; border-right: 2px solid #000; vertical-align: top;">
                        <div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 5px;">
                            JM TÉCNICA COMERCIAL E SERVIÇOS
                        </div>
                        <div style="font-size: 10px; line-height: 1.3;">
                            Assessoria e Serviços Técnicos em Equipamentos para Postos de Combustíveis e Módulos de Abastecimento<br>
                            <strong>Cel:</strong> (11) 97438-0216 / <strong>www.jmtecnica.com.br</strong><br>
                            <strong>CNPJ:</strong> 13.695.086/0001-66 / <strong>e-mail:</strong> jmtecnica@jmtecnica.com.br<br>
                            <strong>Rua</strong> Alfredo Francisco dos Santos, 151 / 157 - B. Assunção - S.B.C.
                        </div>
                    </td>
                    <td style="width: 120px; padding: 10px; text-align: center; vertical-align: middle;">
                        <div style="font-weight: bold; font-size: 12px; margin-bottom: 5px;">RELATÓRIO</div>
                        <div style="font-weight: bold; font-size: 12px; margin-bottom: 5px;">DE</div>
                        <div style="font-weight: bold; font-size: 12px; margin-bottom: 10px;">SERVIÇOS</div>
                        <div style="font-weight: bold; font-size: 14px;">N°</div>
                        <div style="border: 1px solid #000; padding: 5px; margin-top: 5px; font-weight: bold;">
                            ${relatorio.numeroRelatorio}
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Tipos de Serviços -->
        <div style="margin-top: 10px;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000;">
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #000; font-weight: bold; text-align: center; background-color: #f0f0f0;">
                        TIPOS DE SERVIÇOS
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px;">
                        <div style="display: flex; justify-content: space-around; font-weight: bold;">
                            <span>${checkboxes.preventiva} PREVENTIVA</span>
                            <span>${checkboxes.corretiva} CORRETIVA</span>
                            <span>${checkboxes.pendencia} PENDÊNCIA</span>
                            <span>${checkboxes.extra} EXTRA</span>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Informações da Empresa Cliente -->
        <div style="margin-top: 2px;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000;">
                <tr>
                    <td style="padding: 5px; border-right: 1px solid #000; border-bottom: 1px solid #000; width: 60%;">
                        <strong>Razão Social:</strong> ${relatorio.razaoSocial || ''}
                    </td>
                    <td style="padding: 5px; border-bottom: 1px solid #000;">
                        <strong>CNPJ:</strong> ${formatarCNPJ(relatorio.cnpj) || ''}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 5px; border-right: 1px solid #000; border-bottom: 1px solid #000;">
                        <strong>Endereço:</strong> ${relatorio.endereco || ''}
                    </td>
                    <td style="padding: 5px; border-bottom: 1px solid #000;">
                        <strong>Cidade/UF:</strong> ${relatorio.cidadeUf || ''}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 5px; border-right: 1px solid #000;">
                        <strong>Inscrição Estadual:</strong> ${relatorio.inscricaoEstadual || ''}
                    </td>
                    <td style="padding: 5px;"></td>
                </tr>
            </table>
        </div>

        <!-- Tabela de Equipamentos -->
        <div style="margin-top: 2px;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; font-size: 10px;">
                <tr>
                    <td colspan="11" style="padding: 5px; font-weight: bold; text-align: center; background-color: #f0f0f0; border-bottom: 1px solid #000;">
                        EQUIPAMENTOS
                    </td>
                </tr>
                <tr style="font-weight: bold; text-align: center; background-color: #f8f8f8;">
                    <td style="border: 1px solid #000; padding: 3px; width: 8%;">N° BICO</td>
                    <td style="border: 1px solid #000; padding: 3px; width: 10%;">MARCA</td>
                    <td style="border: 1px solid #000; padding: 3px; width: 10%;">MODELO</td>
                    <td style="border: 1px solid #000; padding: 3px; width: 10%;">SÉRIE</td>
                    <td style="border: 1px solid #000; padding: 3px; width: 8%;">PRODUTO</td>
                    <td style="border: 1px solid #000; padding: 3px; width: 8%;">INMETRO</td>
                    <td style="border: 1px solid #000; padding: 3px; width: 12%;">PORTARIA APROVAÇÃO</td>
                    <td style="border: 1px solid #000; padding: 3px; width: 8%;">N° LACRE RETIRADO</td>
                    <td style="border: 1px solid #000; padding: 3px; width: 8%;">N° LACRE COLOCADO</td>
                    <td style="border: 1px solid #000; padding: 3px; width: 9%;">SELO REPARADO RETIRADO</td>
                    <td style="border: 1px solid #000; padding: 3px; width: 9%;">SELO REPARADO COLOCADO</td>
                </tr>
                ${Array.from({ length: 6 }, (_, index) => {
        const eq = relatorio.equipamentos && relatorio.equipamentos[index] ? relatorio.equipamentos[index] : {};
        return `
                        <tr>
                            <td style="border: 1px solid #000; padding: 3px; text-align: center; height: 25px;">${eq.numeroBico || ''}</td>
                            <td style="border: 1px solid #000; padding: 3px; text-align: center;">${eq.marca || ''}</td>
                            <td style="border: 1px solid #000; padding: 3px; text-align: center;">${eq.modelo || ''}</td>
                            <td style="border: 1px solid #000; padding: 3px; text-align: center;">${eq.serie || ''}</td>
                            <td style="border: 1px solid #000; padding: 3px; text-align: center;">${eq.produto || ''}</td>
                            <td style="border: 1px solid #000; padding: 3px; text-align: center;">${eq.inmetro || ''}</td>
                            <td style="border: 1px solid #000; padding: 3px; text-align: center;">${eq.portariaAprovacao || ''}</td>
                            <td style="border: 1px solid #000; padding: 3px; text-align: center;">${eq.lacreRetirado || ''}</td>
                            <td style="border: 1px solid #000; padding: 3px; text-align: center;">${eq.lacreColocado || ''}</td>
                            <td style="border: 1px solid #000; padding: 3px; text-align: center;">${eq.seloReparadoRetirado || ''}</td>
                            <td style="border: 1px solid #000; padding: 3px; text-align: center;">${eq.seloReparadoColocado || ''}</td>
                        </tr>
                    `;
    }).join('')}
            </table>
        </div>

        <!-- Seção de Serviços Executados e Peças -->
        <div style="margin-top: 2px;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000;">
                <tr>
                    <td style="width: 60%; border-right: 1px solid #000; vertical-align: top; padding: 0;">
                        <!-- Serviços Executados -->
                        <div style="font-weight: bold; background-color: #f0f0f0; padding: 5px; border-bottom: 1px solid #000; text-align: center;">
                            N° BICO DESC. SERVIÇOS EXECUTADOS:
                        </div>
                        <div style="padding: 10px; min-height: 200px; font-size: 11px;">
                            ${relatorio.servicosExecutados || ''}
                        </div>
                    </td>
                    <td style="width: 40%; vertical-align: top; padding: 0;">
                        <!-- Peças Utilizadas -->
                        <table style="width: 100%; border-collapse: collapse; height: 100%;">
                            <tr>
                                <td colspan="4" style="font-weight: bold; background-color: #f0f0f0; padding: 5px; border-bottom: 1px solid #000; text-align: center;">
                                    PEÇAS UTILIZADAS
                                </td>
                            </tr>
                            <tr style="font-weight: bold; text-align: center; font-size: 10px; background-color: #f8f8f8;">
                                <td style="border-bottom: 1px solid #000; padding: 3px;">PEÇAS UTILIZADAS</td>
                                <td style="border-bottom: 1px solid #000; border-left: 1px solid #000; padding: 3px; width: 15%;">QUANT.</td>
                                <td style="border-bottom: 1px solid #000; border-left: 1px solid #000; padding: 3px; width: 20%;">R$ UNITÁRIO</td>
                                <td style="border-bottom: 1px solid #000; border-left: 1px solid #000; padding: 3px; width: 20%;">R$ TOTAL</td>
                            </tr>
                            ${Array.from({ length: 8 }, (_, index) => {
        const peca = relatorio.pecas && relatorio.pecas[index] ? relatorio.pecas[index] : {};
        return `
                                    <tr style="font-size: 9px;">
                                        <td style="border-bottom: 1px solid #000; padding: 2px; height: 20px;">${peca.descricao || ''}</td>
                                        <td style="border-bottom: 1px solid #000; border-left: 1px solid #000; padding: 2px; text-align: center;">${peca.quantidade || ''}</td>
                                        <td style="border-bottom: 1px solid #000; border-left: 1px solid #000; padding: 2px; text-align: center;">${peca.valorUnitario ? formatarMoeda(peca.valorUnitario) : ''}</td>
                                        <td style="border-bottom: 1px solid #000; border-left: 1px solid #000; padding: 2px; text-align: center;">${peca.valorTotal ? formatarMoeda(peca.valorTotal) : ''}</td>
                                    </tr>
                                `;
    }).join('')}
                            <tr style="font-weight: bold; background-color: #f0f0f0;">
                                <td colspan="3" style="padding: 3px; text-align: right; font-size: 10px;">TOTAL R$</td>
                                <td style="border-left: 1px solid #000; padding: 3px; text-align: center; font-size: 10px;">
                                    ${relatorio.totalPecas ? formatarMoeda(relatorio.totalPecas) : ''}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Observações e Testes -->
        <div style="margin-top: 2px;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; font-size: 11px;">
                <tr>
                    <td style="padding: 5px; border-bottom: 1px solid #000;">
                        <strong>Observações:</strong> ${relatorio.observacoesTeste || ''}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px;">
                        <div style="display: flex; gap: 20px; align-items: center;">
                            <div><strong>Teste de Aferição:</strong></div>
                            <div><strong>ETC:</strong> ${relatorio.etc || ''}</div>
                            <div><strong>ETA:</strong> ${relatorio.eta || ''}</div>
                            <div><strong>GC:</strong> ${relatorio.gc || ''}</div>
                            <div><strong>GA:</strong> ${relatorio.ga || ''}</div>
                            <div><strong>ARLA:</strong> ${relatorio.arla || ''}</div>
                            <div><strong>DC:</strong> ${relatorio.dc || ''}</div>
                            <div><strong>DA:</strong> ${relatorio.da || ''}</div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Declaração -->
        <div style="margin-top: 2px;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000;">
                <tr>
                    <td style="padding: 5px; font-size: 9px; text-align: justify;">
                        Declaramos que os serviços acima citados foram executados a contento e estão de acordo com as leis especificadas pelo INMETRO / IPEM - OFT N° 200009278-0
                        <span style="float: right; font-weight: bold;">ESTE RELATÓRIO DEVERÁ SER ARQUIVADO POR 2 ANOS</span>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Informações Finais e Assinaturas -->
        <div style="margin-top: 2px;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000;">
                <tr>
                    <td style="width: 30%; padding: 5px; border-right: 1px solid #000; border-bottom: 1px solid #000;">
                        <strong>NOME:</strong>
                    </td>
                    <td style="width: 30%; padding: 5px; border-right: 1px solid #000; border-bottom: 1px solid #000;">
                        <strong>CPF/RG:</strong>
                    </td>
                    <td style="width: 20%; padding: 5px; border-right: 1px solid #000; border-bottom: 1px solid #000;">
                        <strong>Horário Chegada:</strong><br>
                        <div style="margin-top: 5px; font-size: 12px;">${relatorio.horaInicio || ''}</div>
                    </td>
                    <td style="width: 20%; padding: 5px; border-bottom: 1px solid #000;">
                        <strong>TÉCNICO RESPONSÁVEL:</strong><br>
                        <div style="margin-top: 5px; font-size: 10px;">${relatorio.tecnicoResponsavel || ''}</div>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 5px; border-right: 1px solid #000; border-bottom: 1px solid #000;">
                        <strong>Assinatura e Carimbo:</strong>
                    </td>
                    <td style="padding: 5px; border-right: 1px solid #000; border-bottom: 1px solid #000;">
                        <strong>Data:</strong> ${formatarData(relatorio.dataServico)}
                    </td>
                    <td style="padding: 5px; border-right: 1px solid #000; border-bottom: 1px solid #000;">
                        <strong>Horário Saída:</strong><br>
                        <div style="margin-top: 5px; font-size: 12px;">${relatorio.horaFim || ''}</div>
                    </td>
                    <td style="padding: 5px; border-bottom: 1px solid #000;">
                        <strong>RG:</strong>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 30px; border-right: 1px solid #000; text-align: center; vertical-align: bottom;">
                        <!-- Espaço para assinatura e carimbo -->
                    </td>
                    <td style="padding: 5px; border-right: 1px solid #000;">
                        <!-- Data já preenchida acima -->
                    </td>
                    <td style="padding: 5px; border-right: 1px solid #000;">
                        <!-- Espaço para horário de saída -->
                    </td>
                    <td style="padding: 5px; text-align: center;">
                        <strong>Assinatura:</strong>
                        <div style="margin-top: 20px; border-top: 1px solid #000; padding-top: 5px; width: 80%; margin-left: auto; margin-right: auto;">
                            <!-- Linha para assinatura do técnico -->
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    `;
}

// Função ÚNICA para impressão - layout da foto
function imprimirRelatorioCompleto() {
    if (!relatorioParaImpressao) {
        mostrarAlerta('danger', 'Nenhum relatório selecionado para impressão.');
        return;
    }

    // Gerar conteúdo com o novo layout
    const conteudoImpressao = gerarConteudoCompleto(relatorioParaImpressao);

    // Criar janela de impressão
    const janelaImpressao = window.open('', '_blank', 'width=800,height=600');
    janelaImpressao.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatório N° ${relatorioParaImpressao.numeroRelatorio} - JM Técnica</title>
            <style>
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                
                @page {
                    size: A4;
                    margin: 15mm;
                }
                
                body {
                    font-family: Arial, sans-serif;
                    font-size: 11px;
                    line-height: 1.2;
                    color: #000;
                    background: white;
                }
                
                @media print {
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                    
                    table {
                        break-inside: avoid;
                    }
                }
                
                table {
                    border-collapse: collapse;
                    width: 100%;
                }
                
                .cabecalho-relatorio {
                    margin-bottom: 2px;
                }
            </style>
        </head>
        <body>
            ${conteudoImpressao}
            <script>
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                    }, 500);
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