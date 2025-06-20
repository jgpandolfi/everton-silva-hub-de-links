'use strict';

/**
 * Dashboard Everton Silva
 * Scripts para funcionalidades do painel administrativo
 * 
 * Desenvolvido por Jota / José Guilherme Pandolfi - Agência m2a
 * www.agenciam2a.com.br
 */

class DashboardManager {
    constructor() {
        this.usuario = null;
        this.tokenCSRF = null;
        this.graficos = {};
        this.dados = {};
        
        this.init();
    }

    async init() {
        try {
            // Verificar autenticação
            await this.verificarAutenticacao();
            
            // Inicializar interface
            this.inicializarEventListeners();
            this.definirDatasPadrao();
            
            // Carregar dados iniciais
            await this.carregarDados();
            
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.redirecionarParaLogin();
        }
    }

    async verificarAutenticacao() {
        try {
            const response = await fetch('../api/auth/verificar-sessao.php', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Não autenticado');
            }
            
            const resultado = await response.json();
            
            if (!resultado.sucesso) {
                throw new Error('Sessão inválida');
            }
            
            this.usuario = resultado.usuario;
            this.tokenCSRF = resultado.token_csrf;
            
            // Atualizar interface com dados do usuário
            document.getElementById('usuarioNome').textContent = this.usuario.nome;
            
        } catch (error) {
            throw new Error('Falha na autenticação');
        }
    }

    inicializarEventListeners() {
        // Logout
        document.getElementById('btnLogout').addEventListener('click', () => {
            this.logout();
        });
        
        // Filtros
        document.getElementById('btnFiltrar').addEventListener('click', () => {
            this.carregarDados();
        });
        
        // Atualizar tabelas
        document.getElementById('btnAtualizarLeads').addEventListener('click', () => {
            this.carregarLeads();
        });
        
        document.getElementById('btnAtualizarPaises').addEventListener('click', () => {
            this.carregarEstatisticas();
        });
    }

    definirDatasPadrao() {
        const hoje = new Date();
        const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        
        document.getElementById('dataInicio').value = this.formatarData(primeiroDiaDoMes);
        document.getElementById('dataFim').value = this.formatarData(hoje);
    }

    formatarData(data) {
        return data.toISOString().split('T')[0];
    }

    obterFiltrosDatas() {
        return {
            data_inicio: document.getElementById('dataInicio').value,
            data_fim: document.getElementById('dataFim').value
        };
    }

    async carregarDados() {
        this.mostrarLoading(true);
        
        try {
            await Promise.all([
                this.carregarEstatisticas(),
                this.carregarLeads()
            ]);
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.mostrarErro('Erro ao carregar dados do dashboard');
        } finally {
            this.mostrarLoading(false);
        }
    }

    async carregarEstatisticas() {
        try {
            const filtros = this.obterFiltrosDatas();
            const params = new URLSearchParams(filtros);
            
            const response = await fetch(`../api/dashboard/estatisticas.php?${params}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Erro ao buscar estatísticas');
            }
            
            const dados = await response.json();
            
            if (!dados.sucesso) {
                throw new Error(dados.erro || 'Erro desconhecido');
            }
            
            this.dados.estatisticas = dados;
            this.atualizarCards(dados);
            this.atualizarGraficos(dados);
            this.atualizarTabelaPaises(dados.top_paises);
            
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            throw error;
        }
    }

    async carregarLeads() {
        try {
            const filtros = this.obterFiltrosDatas();
            const params = new URLSearchParams({...filtros, limite: 10});
            
            const response = await fetch(`../api/dashboard/leads.php?${params}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Erro ao buscar leads');
            }
            
            const dados = await response.json();
            
            if (!dados.sucesso) {
                throw new Error(dados.erro || 'Erro desconhecido');
            }
            
            this.atualizarTabelaLeads(dados.leads);
            
        } catch (error) {
            console.error('Erro ao carregar leads:', error);
            throw error;
        }
    }

    atualizarCards(dados) {
        const visitantes = dados.visitantes;
        const leads = dados.leads;
        
        // Card Visitantes
        document.getElementById('totalVisitantes').textContent = 
            this.formatarNumero(visitantes.total_visitantes || 0);
        document.getElementById('visitantesUnicos').textContent = 
            `${this.formatarNumero(visitantes.visitantes_unicos || 0)} únicos`;
        
        // Card Leads
        document.getElementById('totalLeads').textContent = 
            this.formatarNumero(leads.total_leads || 0);
        document.getElementById('emailsUnicos').textContent = 
            `${this.formatarNumero(leads.emails_unicos || 0)} e-mails únicos`;
        
        // Card Cliques
        const totalCliques = dados.cliques.reduce((total, item) => total + parseInt(item.total_cliques), 0);
        document.getElementById('totalCliques').textContent = this.formatarNumero(totalCliques);
        
        const cliquesPorVisitante = visitantes.total_visitantes > 0 ? 
            (totalCliques / visitantes.total_visitantes).toFixed(1) : '0';
        document.getElementById('cliquesMedio').textContent = `${cliquesPorVisitante} por visitante`;
        
        // Card Tempo
        const tempoMedio = visitantes.duracao_media || 0;
        document.getElementById('tempoMedio').textContent = this.formatarTempo(tempoMedio);
    }

    atualizarGraficos(dados) {
        this.criarGraficoVisitantes(dados.visitantes_por_dia);
        this.criarGraficoCliques(dados.cliques);
    }

    criarGraficoVisitantes(dadosVisitantes) {
        const ctx = document.getElementById('graficoVisitantes').getContext('2d');
        
        // Destruir gráfico anterior se existir
        if (this.graficos.visitantes) {
            this.graficos.visitantes.destroy();
        }
        
        const labels = dadosVisitantes.map(item => {
            const data = new Date(item.data);
            return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        });
        
        const totalData = dadosVisitantes.map(item => parseInt(item.total));
        const novosData = dadosVisitantes.map(item => parseInt(item.novos));
        
        this.graficos.visitantes = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total de Visitantes',
                        data: totalData,
                        borderColor: '#8B3A8B',
                        backgroundColor: 'rgba(139, 58, 139, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Novos Visitantes',
                        data: novosData,
                        borderColor: '#6B2C70',
                        backgroundColor: 'rgba(107, 44, 112, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    criarGraficoCliques(dadosCliques) {
        const ctx = document.getElementById('graficoCliques').getContext('2d');
        
        // Destruir gráfico anterior se existir
        if (this.graficos.cliques) {
            this.graficos.cliques.destroy();
        }
        
        const labels = dadosCliques.map(item => this.formatarNomeLink(item.nome_link));
        const data = dadosCliques.map(item => parseInt(item.total_cliques));
        
        const cores = [
            '#E1306C', // Instagram
            '#FF0050', // TikTok  
            '#FF0000', // YouTube
            '#25D366'  // WhatsApp
        ];
        
        this.graficos.cliques = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: cores,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    atualizarTabelaLeads(leads) {
        const tbody = document.getElementById('tabelaLeadsBody');
        
        if (leads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="carregando">Nenhum lead encontrado</td></tr>';
            return;
        }
        
        tbody.innerHTML = leads.map(lead => `
            <tr>
                <td>${this.escapeHtml(lead.nome)}</td>
                <td>${this.escapeHtml(lead.email)}</td>
                <td>${this.escapeHtml(lead.telefone)}</td>
                <td>${this.escapeHtml(lead.tipo_evento)}</td>
                <td>${this.escapeHtml(lead.cidade_informada)}</td>
                <td>${this.formatarDataHora(lead.data_criacao)}</td>
            </tr>
        `).join('');
    }

    atualizarTabelaPaises(paises) {
        const tbody = document.getElementById('tabelaPaisesBody');
        
        if (paises.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="carregando">Nenhum dado encontrado</td></tr>';
            return;
        }
        
        const total = paises.reduce((sum, pais) => sum + parseInt(pais.quantidade), 0);
        
        tbody.innerHTML = paises.map(pais => {
            const percentual = total > 0 ? ((parseInt(pais.quantidade) / total) * 100).toFixed(1) : '0';
            return `
                <tr>
                    <td>${this.escapeHtml(pais.pais)}</td>
                    <td>${this.formatarNumero(pais.quantidade)}</td>
                    <td>${percentual}%</td>
                </tr>
            `;
        }).join('');
    }

    async logout() {
        try {
            await fetch('../api/auth/logout.php', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Erro no logout:', error);
        } finally {
            this.redirecionarParaLogin();
        }
    }

    redirecionarParaLogin() {
        window.location.href = 'login.html';
    }

    mostrarLoading(mostrar) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = mostrar ? 'flex' : 'none';
    }

    mostrarErro(mensagem) {
        alert(mensagem); // Substituir por modal personalizado futuramente
    }

    // Funções de utilidade
    formatarNumero(numero) {
        return new Intl.NumberFormat('pt-BR').format(numero);
    }

    formatarTempo(segundos) {
        // Verificar se o valor está em milissegundos e converter para segundos
        if (segundos > 86400) { // Se for maior que 24h em segundos, provavelmente está em milissegundos
            segundos = segundos / 1000;
        }
        
        // Garantir que é um número válido
        segundos = Math.max(0, Math.floor(segundos));
        
        if (segundos < 60) {
            return `${segundos}s`;
        } else if (segundos < 3600) {
            const minutos = Math.floor(segundos / 60);
            return `${minutos}min`;
        } else {
            const horas = Math.floor(segundos / 3600);
            const minutos = Math.floor((segundos % 3600) / 60);
            if (minutos > 0) {
                return `${horas}h ${minutos}min`;
            }
            return `${horas}h`;
        }
    }

    formatarDataHora(dataString) {
        const data = new Date(dataString);
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatarNomeLink(nome) {
        const nomes = {
            'instagram': 'Instagram',
            'tiktok': 'TikTok',
            'youtube': 'YouTube',
            'whatsapp': 'WhatsApp'
        };
        return nomes[nome] || nome;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Inicializar dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});