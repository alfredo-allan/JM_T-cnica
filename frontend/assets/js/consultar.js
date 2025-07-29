// Variáveis globais para a página de consulta
let resultadosConsulta = [];

// Inicialização da página consultar
document.addEventListener('DOMContentLoaded', function() {
    inicializarPaginaConsultar();
});

function inicializarPaginaConsultar() {
    configurarEventosConsulta();
}

function configurarEventosConsulta() {
    // Evento para mostrar/ocultar período personalizado
    const filtroPeriodo = document.getElementById('filtroPeriodo');
    const periodoPersonalizado = document.getElementById('periodoPersonalizado');
    
    filtroPeriodo.addEventListener('change', function() {
        if (this.value === 'personalizado') {
            periodoPersonalizado.style.display = 'block';
        } else {
            periodoPersonalizado.style.display = 'none';
        }
    });
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
            mostrarAlerta('danger', 'Erro ao buscar relatórios.');
        });
    
    // Tentar buscar na API também
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

function buscarRelatoriosLocais(filtros) {
    return new Promise((resolve) => {
        const relatorios = listarRelatoriosLocais();
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

function exibirResultados(resultados) {
    const container = document.getElementById('resultadosBusca');
    
    if (resultados.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-search me-2"></i>
                Nenhum relatório encontrado com os critérios informados.
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="alert alert-success">
            <i class="bi bi-check-circle me-2"></i>
            Encontrados ${resultados.length} relatório(s).
        </div>
        <div class="table-responsive">
            <table class="table table-hover table-sm">
                <thead class="table-success">
                    <tr>
                        <th>N°</th>
                        <th>Data</th>
                        <th>Empresa</th>
                        <th>CNPJ</th>
                        <th>Tipos de Serviço</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    resultados.forEach(relatorio => {
        const tiposServico = relatorio.tiposServico ? relatorio.tiposServico.join(', ').toUpperCase() : '';
        html += `
            <tr>
                <td><strong>${relatorio.numeroRelatorio}</strong></td>
                <td>${formatarData(relatorio.dataServico)}</td>
                <td>${relatorio.razaoSocial}</td>
                <td>${formatarCNPJ(relatorio.cnpj)}</td>
                <td><span class="badge bg-info">${tiposServico}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="visualizarRelatorio('${relatorio.numeroRelatorio}')" title="Visualizar">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success me-1" onclick="editarRelatorio('${relatorio.numeroRelatorio}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="imprimirRelatorio('${relatorio.numeroRelatorio}')" title="Imprimir">
                        <i class="bi bi-printer"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

function limparFiltros() {
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
}

function visualizarRelatorio(numeroRelatorio) {
    const relatorio = resultadosConsulta.find(r => r.numeroRelatorio === numeroRelatorio);
    if (!relatorio) {
        mostrarAlerta('danger', 'Relatório não encontrado.');
        return;
    }
    
    // Redirecionar para página de impressão com o relatório
    sessionStorage.setItem('relatorioParaVisualizar', JSON.stringify(relatorio));
    window.location.href = `imprimir.html?numero=${numeroRelatorio}`;
}

function editarRelatorio(numeroRelatorio) {
    // Redirecionar para página de edição com o relatório
    sessionStorage.setItem('relatorioParaEditar', numeroRelatorio);
    window.location.href = `editar.html?numero=${numeroRelatorio}`;
}

function imprimirRelatorio(numeroRelatorio) {
    // Redirecionar para página de impressão
    window.location.href = `imprimir.html?numero=${numeroRelatorio}`;
}
