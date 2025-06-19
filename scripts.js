'use strict';

/**
 * Website Everton Silva
 * www.evertonsilvaoficial.com
 * 
 * Desenvolvido por Jota / José Guilherme Pandolfi - Agência m2a
 * www.agenciam2a.com.br
 */

// ==================== 0. Utilitários Centralizados ====================

const Utils = (() => {
    // Controle de logs: só exibe se modo debug estiver ativo
    const DEBUG = false; // Altere para true para ativar logs em desenvolvimento

    function log(...args) {
        if (DEBUG) console.log(...args);
    }
    function error(...args) {
        if (DEBUG) console.error(...args);
    }

    // Detecção de informações do navegador/dispositivo
    function detectarInfoNavegador() {
        const userAgent = navigator.userAgent;
        let navegador = 'Desconhecido';
        let sistemaOperacional = 'Desconhecido';
        let marcaDispositivo = 'Desconhecido';
        let movel = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent) ? 1 : 0;

        if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) navegador = 'Chrome';
        else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) navegador = 'Safari';
        else if (userAgent.indexOf('Firefox') > -1) navegador = 'Firefox';
        else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) navegador = 'Internet Explorer';
        else if (userAgent.indexOf('Edg') > -1) navegador = 'Edge';
        else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) navegador = 'Opera';

        if (userAgent.indexOf('Windows') > -1) sistemaOperacional = 'Windows';
        else if (userAgent.indexOf('Mac') > -1) sistemaOperacional = 'MacOS';
        else if (userAgent.indexOf('Linux') > -1) sistemaOperacional = 'Linux';
        else if (userAgent.indexOf('Android') > -1) sistemaOperacional = 'Android';
        else if (userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1 || userAgent.indexOf('iPod') > -1) sistemaOperacional = 'iOS';

        if (userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1 || userAgent.indexOf('iPod') > -1) marcaDispositivo = 'Apple';
        else if (userAgent.indexOf('Samsung') > -1) marcaDispositivo = 'Samsung';
        else if (userAgent.indexOf('Huawei') > -1) marcaDispositivo = 'Huawei';
        else if (userAgent.indexOf('Xiaomi') > -1) marcaDispositivo = 'Xiaomi';
        else if (userAgent.indexOf('Motorola') > -1) marcaDispositivo = 'Motorola';
        else if (userAgent.indexOf('LG') > -1) marcaDispositivo = 'LG';
        else if (userAgent.indexOf('Android') > -1) marcaDispositivo = 'Android';
        else if (!movel) marcaDispositivo = 'Desktop';

        return { navegador, sistema_operacional: sistemaOperacional, marca_dispositivo: marcaDispositivo, movel };
    }

    // Coleta dados de UTM e outros automáticos
    function coletarDadosDispositivo() {
        const params = new URLSearchParams(location.search);
        return {
            dimensao_tela: `${screen.width}x${screen.height}`,
            referrer: document.referrer || '',
            utm_source: params.get('utm_source') || '',
            utm_medium: params.get('utm_medium') || '',
            utm_campaign: params.get('utm_campaign') || '',
            utm_content: params.get('utm_content') || '',
            utm_term: params.get('utm_term') || '',
            ...detectarInfoNavegador()
        };
    }

    // Acessibilidade: foco visível
    function focoVisivelAoTeclado() {
        document.body.addEventListener('keydown', e => {
            if (e.key === 'Tab') document.body.classList.add('usando-teclado');
        });
        document.body.addEventListener('mousedown', () => {
            document.body.classList.remove('usando-teclado');
        });
    }

    return { log, error, detectarInfoNavegador, coletarDadosDispositivo, focoVisivelAoTeclado };
})();

// ==================== 1. Inicialização Geral ====================

document.addEventListener('DOMContentLoaded', () => {
    inicializarPreloader();
    GerenciadorTracking.inicializar();
    inicializarConsentimentoLGPD();
    inicializarNavegacao();
    inicializarCursorPersonalizado();
    CarrosselEventos.inicializar();
    inicializarBotaoTopo();
    GerenciadorTooltips.inicializar();
    inicializarFormulario();
    inicializarAnimacoesScroll();
    ContadorCliques.inicializar();
    Utils.focoVisivelAoTeclado();
});

// ==================== 2. Preloader ====================

function inicializarPreloader() {
    const preloader = document.getElementById('preloader');
    const barraCarregamento = document.getElementById('barra-carregamento');
    const barraContainer = document.getElementById('barra-carregamento-container');
    let podeContinuar = false;

    window.continuarCarregamento = () => {
        podeContinuar = true;
        if (document.readyState === 'complete') finalizarPreloader();
    };

    function finalizarPreloader() {
        if (!podeContinuar) return;
        barraContainer.classList.add('visivel');
        barraCarregamento.style.width = '100%';
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
                barraContainer.classList.remove('visivel');
            }, 500);
        }, 800);
    }

    let progresso = 0;
    const intervaloCarregamento = setInterval(() => {
        progresso += Math.random() * 10;
        if (progresso >= 100) {
            progresso = 100;
            clearInterval(intervaloCarregamento);
        }
        if (barraCarregamento) barraCarregamento.style.width = `${progresso}%`;
    }, 200);

    if (localStorage.getItem('everton_silva_lgpd_consentimento') === 'aceito') continuarCarregamento();

    window.addEventListener('load', () => {
        clearInterval(intervaloCarregamento);
        if (barraCarregamento) barraCarregamento.style.width = '100%';
        setTimeout(() => {
            if (podeContinuar) finalizarPreloader();
        }, 500);
    });
}

// ==================== 3. Carrossel de Eventos ====================

const CarrosselEventos = (() => {
    let eventos = [];
    let eventoAtual = 0;
    let eventosPorPagina = 1;
    let totalPaginas = 0;
    
    const elementos = {
        secao: null,
        track: null,
        btnPrev: null,
        btnNext: null,
        dots: null
    };

    function obterEventosPorPagina() {
        const largura = window.innerWidth;
        if (largura >= 1200) return 4;
        if (largura >= 1024) return 3;
        if (largura >= 768) return 2;
        return 1;
    }

    function formatarData(dataStr) {
        const data = new Date(dataStr + 'T00:00:00');
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    function formatarHorario(horarioStr) {
        return horarioStr.replace(':', 'h');
    }

    function criarIconeSVG(tipo) {
        const icones = {
            calendario: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>',
            relogio: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="m12.5 7-1 1v5.25l4.5 2.67.75-1.23L13 12.25z"/></svg>',
            localizacao: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
            cidade: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>'
        };
        return icones[tipo] || '';
    }

    function criarCardEvento(evento) {
        const dataFormatada = formatarData(evento.data);
        const horarioFormatado = formatarHorario(evento.horario);
        
        return `
            <div class="evento-card" data-evento-id="${evento.id}">
                <div class="evento-imagem">
                    ${evento.imagem ? 
                        `<img src="assets/img/eventos/${evento.imagem}" alt="${evento.nome}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=evento-imagem-placeholder>🎵</div>'">` :
                        `<div class="evento-imagem-placeholder">🎵</div>`
                    }
                </div>
                <div class="evento-info">
                    <h3 class="evento-nome">${evento.nome}</h3>
                    <div class="evento-detalhes">
                        <div class="evento-detalhe">
                            <span class="evento-detalhe-icone">${criarIconeSVG('calendario')}</span>
                            <span class="evento-detalhe-texto">${dataFormatada}</span>
                        </div>
                        <div class="evento-detalhe">
                            <span class="evento-detalhe-icone">${criarIconeSVG('relogio')}</span>
                            <span class="evento-detalhe-texto">${horarioFormatado}</span>
                        </div>
                        <div class="evento-detalhe">
                            <span class="evento-detalhe-icone">${criarIconeSVG('localizacao')}</span>
                            <span class="evento-detalhe-texto">${evento.endereco}</span>
                        </div>
                        <div class="evento-detalhe">
                            <span class="evento-detalhe-icone">${criarIconeSVG('cidade')}</span>
                            <span class="evento-detalhe-texto">${evento.cidade}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderizarEventos() {
        if (!elementos.track) return;
        
        elementos.track.innerHTML = eventos.map(evento => criarCardEvento(evento)).join('');
        atualizarControles();
        atualizarPosicao();
    }

    function criarDots() {
        if (!elementos.dots) return;
        
        elementos.dots.innerHTML = '';
        for (let i = 0; i < totalPaginas; i++) {
            const dot = document.createElement('button');
            dot.className = `carousel-dot ${i === eventoAtual ? 'ativo' : ''}`;
            dot.setAttribute('aria-label', `Ir para página ${i + 1}`);
            dot.addEventListener('click', () => irParaPagina(i));
            elementos.dots.appendChild(dot);
        }
    }

    function atualizarControles() {
        eventosPorPagina = obterEventosPorPagina();
        totalPaginas = Math.ceil(eventos.length / eventosPorPagina);
        
        if (elementos.btnPrev) {
            elementos.btnPrev.disabled = eventoAtual === 0;
        }
        if (elementos.btnNext) {
            elementos.btnNext.disabled = eventoAtual >= totalPaginas - 1;
        }
        
        criarDots();
        atualizarDots();
    }

    function atualizarDots() {
        if (!elementos.dots) return;
        
        const dots = elementos.dots.querySelectorAll('.carousel-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('ativo', index === eventoAtual);
        });
    }

    function atualizarPosicao() {
        if (!elementos.track) return;
        
        const deslocamento = -(eventoAtual * 100);
        elementos.track.style.transform = `translateX(${deslocamento}%)`;
    }

    function irParaProximo() {
        if (eventoAtual < totalPaginas - 1) {
            eventoAtual++;
            atualizarPosicao();
            atualizarControles();
        }
    }

    function irParaAnterior() {
        if (eventoAtual > 0) {
            eventoAtual--;
            atualizarPosicao();
            atualizarControles();
        }
    }

    function irParaPagina(pagina) {
        if (pagina >= 0 && pagina < totalPaginas) {
            eventoAtual = pagina;
            atualizarPosicao();
            atualizarControles();
        }
    }

    function ordenarEventosPorData(eventosArray) {
        return eventosArray.sort((a, b) => {
            const dataA = new Date(a.data + 'T00:00:00');
            const dataB = new Date(b.data + 'T00:00:00');
            return dataA - dataB;
        });
    }

    function filtrarEventosFuturos(eventosArray) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        return eventosArray.filter(evento => {
            const dataEvento = new Date(evento.data + 'T00:00:00');
            return dataEvento >= hoje;
        });
    }

    async function carregarEventos() {
        try {
            const response = await fetch('eventos.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Filtrar eventos futuros e ordenar por data
            const eventosFuturos = filtrarEventosFuturos(data.eventos || []);
            eventos = ordenarEventosPorData(eventosFuturos);
            
            const secaoEventos = document.getElementById('secao-eventos');
            
            if (eventos.length > 0) {
                secaoEventos.style.display = 'block';
                renderizarEventos();
                
                // Adicionar classe de animação
                setTimeout(() => {
                    secaoEventos.classList.add('animacao-aparecer');
                }, 100);
                
                Utils.log('Carrossel de eventos carregado:', eventos.length, 'eventos');
            } else {
                secaoEventos.style.display = 'none';
                Utils.log('Nenhum evento futuro encontrado');
            }
        } catch (erro) {
            Utils.error('Erro ao carregar eventos:', erro);
            const secaoEventos = document.getElementById('secao-eventos');
            if (secaoEventos) {
                secaoEventos.style.display = 'none';
            }
        }
    }

    function configurarEventListeners() {
        if (elementos.btnNext) {
            elementos.btnNext.addEventListener('click', irParaProximo);
        }
        if (elementos.btnPrev) {
            elementos.btnPrev.addEventListener('click', irParaAnterior);
        }
        
        // Suporte a gestos de toque
        let startX = 0;
        let endX = 0;
        
        if (elementos.track) {
            elementos.track.addEventListener('touchstart', e => {
                startX = e.touches[0].clientX;
            }, { passive: true });
            
            elementos.track.addEventListener('touchend', e => {
                endX = e.changedTouches[0].clientX;
                const deltaX = startX - endX;
                
                if (Math.abs(deltaX) > 50) { // Mínimo de 50px para ativar
                    if (deltaX > 0) {
                        irParaProximo();
                    } else {
                        irParaAnterior();
                    }
                }
            }, { passive: true });
        }
        
        // Atualizar na mudança de tamanho da tela
        window.addEventListener('resize', () => {
            atualizarControles();
            atualizarPosicao();
        });
    }

    function inicializar() {
        elementos.secao = document.getElementById('secao-eventos');
        elementos.track = document.getElementById('carrosselTrack');
        elementos.btnPrev = document.getElementById('btnPrev');
        elementos.btnNext = document.getElementById('btnNext');
        elementos.dots = document.getElementById('carouselDots');
        
        if (!elementos.secao || !elementos.track) {
            Utils.log('Elementos do carrossel não encontrados');
            return;
        }
        
        configurarEventListeners();
        carregarEventos();
    }

    return {
        inicializar,
        recarregarEventos: carregarEventos
    };
})();

function atualizarSchemaEventos(eventos) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "MusicGroup",
        "name": "Everton Silva",
        "event": eventos.map(evento => ({
            "@type": "Event",
            "name": evento.nome,
            "startDate": evento.data,
            "location": {
                "@type": "Place",
                "name": evento.endereco,
                "address": evento.cidade
            },
            "performer": {
                "@type": "MusicGroup",
                "name": "Everton Silva"
            }
        }))
    };
    
    const schemaScript = document.getElementById('eventos-schema');
    if (schemaScript) {
        schemaScript.textContent = JSON.stringify(schema);
    }
}

// ==================== 4. Rastreador de Visitantes ====================

const RastreadorVisitantes = (() => {
    const INTERVALO_ENVIO = 30000;
    const URL_API = 'https://evertonsilvaoficial.com.br/api/registrar-visitante.php';
    let visitanteUUID, novoVisitante = true, totalCliques = 0, cliquesElementosClicaveis = 0;
    let inicioSessao = Date.now(), duracaoSessao = 0, rastreamentoAtivo = false, intervaloEnvio;

    function gerarUUID() {
        const chaveStorage = 'everton_silva_visitante_uuid';
        let uuid = localStorage.getItem(chaveStorage);
        if (!uuid) {
            uuid = self.crypto?.randomUUID?.() || String(Date.now());
            localStorage.setItem(chaveStorage, uuid);
            novoVisitante = true;
        } else {
            novoVisitante = false;
        }
        return uuid;
    }

    function rastrearInteracoes() {
        document.body.addEventListener('click', (evento) => {
            totalCliques++;
            const elementosClicaveis = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
            const elemento = evento.target;
            if (elementosClicaveis.includes(elemento.tagName) || elemento.closest('[role="button"]')) {
                cliquesElementosClicaveis++;
            }
        });
    }

    async function enviarDados() {
        duracaoSessao = Math.floor((Date.now() - inicioSessao) / 1000);
        const dados = {
            uuid: visitanteUUID,
            novo_visitante: novoVisitante,
            total_cliques: totalCliques,
            cliques_elementos_clicaveis: cliquesElementosClicaveis,
            duracao_sessao: duracaoSessao,
            ...Utils.coletarDadosDispositivo()
        };
        try {
            await fetch(URL_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            novoVisitante = false;
        } catch (erro) {
            Utils.error('Erro no tracking:', erro);
        }
    }

    function configurarEventosSessao() {
        window.addEventListener('beforeunload', () => {
            duracaoSessao = Math.floor((Date.now() - inicioSessao) / 1000);
            const dadosFinal = {
                uuid: visitanteUUID,
                novo_visitante: novoVisitante,
                total_cliques: totalCliques,
                cliques_elementos_clicaveis: cliquesElementosClicaveis,
                duracao_sessao: duracaoSessao,
                ...Utils.coletarDadosDispositivo()
            };
            navigator.sendBeacon(URL_API, JSON.stringify(dadosFinal));
        });
    }

    function iniciar() {
        if (rastreamentoAtivo) return;
        visitanteUUID = gerarUUID();
        rastrearInteracoes();
        configurarEventosSessao();
        enviarDados();
        intervaloEnvio = setInterval(enviarDados, INTERVALO_ENVIO);
        rastreamentoAtivo = true;
    }

    return { iniciar };
})();

// ==================== 5. Tracking Externo (Clarity/PostHog) ====================

const GerenciadorTracking = (() => {
    const CLARITY_PROJECT_ID = 'rbgw4bm105';
    const POSTHOG_API_KEY = 'phc_JH3hsLZzQBwRPK4kqBcPcAHOMi6CbAoamvZrnWy9uIh';
    const POSTHOG_API_HOST = 'https://us.i.posthog.com';
    let clarityCarregado = false, posthogCarregado = false;

    function carregarClarity() {
        if (clarityCarregado) return;
        window.clarity = window.clarity || function(){(window.clarity.q = window.clarity.q || []).push(arguments)};
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
        document.head.appendChild(script);
        clarityCarregado = true;
    }

    function carregarPostHog() {
        if (posthogCarregado) return;
        window.posthog = window.posthog || [];
        !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
        window.posthog.init(POSTHOG_API_KEY, {
            api_host: POSTHOG_API_HOST,
            person_profiles: 'identified_only'
        });
        posthogCarregado = true;
    }

    function ativarConsentimento() {
        setTimeout(() => {
            if (typeof window.clarity === 'function') window.clarity('consent');
            if (typeof window.posthog === 'object' && typeof window.posthog.opt_in_capturing === 'function') window.posthog.opt_in_capturing();
        }, 1000);
    }

    function carregarFerramentas() {
        carregarClarity();
        carregarPostHog();
    }

    function inicializarComConsentimentoExistente() {
        try {
            const consentimentoExistente = localStorage.getItem('everton_silva_lgpd_consentimento') === 'aceito';
            if (consentimentoExistente) {
                carregarFerramentas();
                ativarConsentimento();
                RastreadorVisitantes.iniciar();
            }
        } catch (erro) {
            Utils.error('Erro ao verificar consentimento para tracking:', erro);
        }
    }

    return {
        inicializar: inicializarComConsentimentoExistente,
        carregar: carregarFerramentas,
        consentir: ativarConsentimento
    };
})();

// ==================== 6. Consentimento LGPD ====================

function inicializarConsentimentoLGPD() {
    const modal = document.getElementById('lgpd-modal');
    const botaoAceitar = document.getElementById('lgpd-aceitar');
    const botaoRejeitar = document.getElementById('lgpd-rejeitar');
    const botaoReconsiderar = document.getElementById('lgpd-reconsiderar');
    const mensagemRejeicao = document.getElementById('lgpd-mensagem-rejeicao');
    const CHAVE_CONSENTIMENTO = 'everton_silva_lgpd_consentimento';
    const DATA_CONSENTIMENTO = 'everton_silva_lgpd_data';

    const verificarConsentimento = () => {
        try {
            return localStorage.getItem(CHAVE_CONSENTIMENTO) === 'aceito';
        } catch (erro) {
            Utils.error('Erro ao acessar localStorage:', erro);
            return false;
        }
    };

    if (!verificarConsentimento()) {
        setTimeout(() => modal.classList.add('ativo'), 1500);
    }

    const aceitarTermos = () => {
        try {
            localStorage.setItem(CHAVE_CONSENTIMENTO, 'aceito');
            localStorage.setItem(DATA_CONSENTIMENTO, new Date().toISOString());
        } catch (erro) {
            Utils.error('Erro ao salvar consentimento:', erro);
        }
        modal.classList.remove('ativo');
        GerenciadorTracking.carregar();
        GerenciadorTracking.consentir();
        RastreadorVisitantes.iniciar();
        continuarCarregamento();
    };

    const rejeitarTermos = () => {
        mensagemRejeicao.classList.add('ativo');
        botaoAceitar.style.display = 'none';
        botaoRejeitar.style.display = 'none';
    };

    const reconsiderarRejeicao = () => {
        mensagemRejeicao.classList.remove('ativo');
        botaoAceitar.style.display = '';
        botaoRejeitar.style.display = '';
    };

    botaoAceitar.addEventListener('click', aceitarTermos);
    botaoRejeitar.addEventListener('click', rejeitarTermos);
    botaoReconsiderar.addEventListener('click', reconsiderarRejeicao);

    const linkPolitica = document.querySelector('.lgpd-texto a[href="#politica-privacidade"]');
    if (linkPolitica) {
        linkPolitica.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const resposta = await fetch('assets/TERMOS-DE-USO-E-POLITICA-DE-PRIVACIDADE.txt');
                if (!resposta.ok) throw new Error('Falha ao carregar o arquivo de texto');
                const textoTermos = await resposta.text();
                const textarea = document.createElement('textarea');
                textarea.readOnly = true;
                textarea.classList.add('lgpd-termos');
                textarea.value = textoTermos;
                const cursorPrincipal = document.querySelector('.cursor-principal');
                if (cursorPrincipal) {
                    textarea.addEventListener('mouseover', () => {
                        cursorPrincipal.classList.add('sobre-clicavel', 'texto');
                        document.body.classList.remove('cursor-ativo');
                    });
                    textarea.addEventListener('mouseout', () => {
                        cursorPrincipal.classList.remove('sobre-clicavel', 'texto');
                        document.body.classList.add('cursor-ativo');
                    });
                }
                const divTexto = document.querySelector('.lgpd-texto');
                const divBotoes = document.querySelector('.lgpd-botoes');
                if (divTexto && divBotoes) {
                    const textareaExistente = document.querySelector('.lgpd-termos');
                    if (textareaExistente) textareaExistente.remove();
                    divTexto.insertAdjacentElement('afterend', textarea);
                }
            } catch (erro) {
                Utils.error('Erro ao carregar os termos:', erro);
            }
        });
    }
}

// ==================== 7. Navegação (delegação de eventos) ====================

function inicializarNavegacao() {
    document.body.addEventListener('click', function(e) {
        const anchor = e.target.closest('a[href^="#"]');
        if (anchor) {
            e.preventDefault();
            const alvo = document.querySelector(anchor.getAttribute('href'));
            if (alvo) {
                alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (anchor.classList.contains('botao-whatsapp') && anchor.getAttribute('href') === '#contato') {
                    destacarFormularioContato();
                }
            }
        }
    });

    function destacarFormularioContato() {
        const secaoContato = document.querySelector('.secao-contato');
        if (secaoContato) {
            secaoContato.classList.remove('destacar-formulario');
            void secaoContato.offsetWidth;
            secaoContato.classList.add('destacar-formulario');
            setTimeout(() => secaoContato.classList.remove('destacar-formulario'), 4000);
        }
    }
}

// ==================== 8. Contador de Cliques (delegação de eventos) ====================

const ContadorCliques = (() => {
    const URL_API = 'https://evertonsilvaoficial.com.br/api/registrar-clique.php';
    const mapeamentoLinks = {
        'instagram': '.instagram',
        'tiktok': '.tiktok',
        'youtube': '.youtube',
        'whatsapp': '.whatsapp'
    };

    function registrarClique(nomeLink) {
        fetch(URL_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ link: nomeLink }),
            keepalive: true
        }).catch(() => {});
    }

    function inicializar() {
        document.body.addEventListener('click', function(e) {
            for (const [nomeLink, seletor] of Object.entries(mapeamentoLinks)) {
                if (e.target.closest(seletor)) {
                    registrarClique(nomeLink);
                    break;
                }
            }
        });
    }

    return { inicializar };
})();

// ==================== 9. Cursor Personalizado ====================

const SELETORES_CLICAVEIS = [
  'a',
  'button', 
  '.botao-link',
  '.botao-primario',
  '.icone-link',
  '.texto-link',
  'select',
  '[role="button"]'
].join(', ');

const SELETORES_TEXTO = [
  'input',
  'textarea'
].join(', ');

function inicializarCursorPersonalizado() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) {
        document.body.classList.add('dispositivo-touch');
        return;
    }
    const cursorPrincipal = document.querySelector('.cursor-principal');
    if (!cursorPrincipal) return;
    document.body.classList.add('cursor-ativo');
    document.addEventListener('mousemove', e => {
        cursorPrincipal.style.left = `${e.clientX}px`;
        cursorPrincipal.style.top = `${e.clientY}px`;
    });
    document.body.addEventListener('mouseover', e => {
        const el = e.target;
        if (el.matches(SELETORES_CLICAVEIS)) {
            cursorPrincipal.classList.add('sobre-clicavel', 'hover');
            document.body.classList.remove('cursor-ativo');
        } else if (el.matches(SELETORES_TEXTO)) {
            cursorPrincipal.classList.add('sobre-clicavel', 'texto');
            document.body.classList.remove('cursor-ativo');
        }
    }, true);
    document.body.addEventListener('mouseout', e => {
        cursorPrincipal.classList.remove('sobre-clicavel', 'hover', 'texto');
        document.body.classList.add('cursor-ativo');
    }, true);
}

// ==================== 10. Botão Voltar ao Topo ====================

function inicializarBotaoTopo() {
    const botaoTopo = document.getElementById('botaoTopo');
    if (!botaoTopo) return;
    function alternarVisibilidadeBotao() {
        if (window.scrollY > 300) botaoTopo.classList.add('visivel');
        else botaoTopo.classList.remove('visivel');
    }
    alternarVisibilidadeBotao();
    window.addEventListener('scroll', alternarVisibilidadeBotao);
    botaoTopo.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ==================== 11. Animações com Scroll ====================

function inicializarAnimacoesScroll() {
    const elementosAnimados = document.querySelectorAll(
        '.perfil-cabecalho, .secao-links, .botao-link, .secao-contato, .campo-formulario'
    );
    function verificarVisibilidade() {
        const alturaJanela = window.innerHeight;
        const margemAtivacao = 150;
        elementosAnimados.forEach(elemento => {
            const posicaoElemento = elemento.getBoundingClientRect().top;
            if (posicaoElemento < alturaJanela - margemAtivacao) {
                elemento.classList.add('animacao-aparecer');
            }
        });
    }
    setTimeout(verificarVisibilidade, 300);
    window.addEventListener('scroll', verificarVisibilidade);
}

// ==================== 12. Tooltips Personalizados ====================

const GerenciadorTooltips = (() => {
    let tooltipContainer, tooltipTexto, elementoAtual = null, mobileTimerId = null, tooltipVisivel = false;

    function inicializar() {
        tooltipContainer = document.getElementById('tooltip-personalizado');
        if (!tooltipContainer) return;
        tooltipTexto = tooltipContainer.querySelector('.tooltip-texto');
        document.body.addEventListener('mouseenter', e => {
            const elemento = e.target.closest('[data-tooltip]');
            if (elemento) mostrarTooltip(e, elemento);
        }, true);
        document.body.addEventListener('mouseleave', e => {
            if (e.target.closest('[data-tooltip]')) esconderTooltip();
        }, true);
        document.body.addEventListener('mousemove', e => {
            if (tooltipVisivel && elementoAtual) posicionarTooltip(e);
        });
        document.body.addEventListener('touchstart', e => {
            const elemento = e.target.closest('[data-tooltip]');
            if (elemento) {
                if (elementoAtual && elementoAtual !== elemento) esconderTooltip();
                if (elementoAtual === elemento) esconderTooltip();
                else {
                    mostrarTooltip(e, elemento);
                    clearTimeout(mobileTimerId);
                    mobileTimerId = setTimeout(esconderTooltip, 3000);
                }
            } else if (tooltipVisivel) {
                esconderTooltip();
            }
        });
        document.addEventListener('scroll', () => { if (tooltipVisivel) esconderTooltip(); });
    }

    function mostrarTooltip(evento, elemento) {
        const conteudoTooltip = elemento.getAttribute('data-tooltip');
        if (!conteudoTooltip) return;
        tooltipTexto.innerHTML = conteudoTooltip;
        elementoAtual = elemento;
        tooltipVisivel = true;
        posicionarTooltip(evento);
        tooltipContainer.classList.add('visivel');
        tooltipContainer.setAttribute('aria-hidden', 'false');
    }

    function esconderTooltip() {
        tooltipContainer.classList.remove('visivel');
        tooltipContainer.setAttribute('aria-hidden', 'true');
        elementoAtual = null;
        tooltipVisivel = false;
        clearTimeout(mobileTimerId);
    }

    function posicionarTooltip(evento) {
        if (!elementoAtual) return;
        const isTouchDevice = evento.type === 'touchstart';
        if (isTouchDevice) {
            const rect = elementoAtual.getBoundingClientRect();
            const elementoX = rect.left + (rect.width / 2);
            const elementoY = rect.top;
            tooltipContainer.style.left = `${elementoX}px`;
            tooltipContainer.style.top = `${elementoY - 10}px`;
        } else {
            const mouseX = evento.clientX;
            const mouseY = evento.clientY;
            tooltipContainer.style.left = `${mouseX}px`;
            tooltipContainer.style.top = `${mouseY - 10}px`;
        }
    }

    return { inicializar };
})();

// ==================== 13. Formulário de Contato ====================

function inicializarFormulario() {
    const formulario = document.getElementById('formularioContato');
    if (!formulario) return;

    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    function validarTelefone(telefone) {
        const apenasNumeros = telefone.replace(/\D/g, '');
        return apenasNumeros.length >= 10 && apenasNumeros.length <= 11;
    }

    const campoTelefone = document.getElementById('telefone');
    if (campoTelefone) {
        campoTelefone.addEventListener('input', (e) => {
            let valor = e.target.value.replace(/\D/g, '').substring(0, 11);
            let resultado = '';
            if (valor.length > 0) {
                resultado = '(' + valor.substring(0, 2);
                if (valor.length > 2) {
                    resultado += ') ' + valor.substring(2, valor.length > 7 ? 7 : valor.length);
                    if (valor.length > 7) resultado += '-' + valor.substring(7);
                }
            }
            e.target.value = resultado;
        });
    }

    function exibirMensagem(texto, tipo) {
        const mensagemExistente = formulario.querySelector('.mensagem-formulario');
        if (mensagemExistente) mensagemExistente.remove();
        const mensagem = document.createElement('div');
        mensagem.className = `mensagem-formulario ${tipo}`;
        mensagem.setAttribute('role', 'alert');
        mensagem.setAttribute('aria-live', 'assertive');
        mensagem.textContent = texto;
        formulario.prepend(mensagem);
        if (tipo === 'sucesso') {
            setTimeout(() => {
                mensagem.classList.add('desaparecer');
                setTimeout(() => mensagem.remove(), 500);
            }, 5000);
        }
        mensagem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const telefone = document.getElementById('telefone').value;
        const cidadeInformada = document.getElementById('cidade').value;
        const dataEvento = document.getElementById('data').value;
        const tipoEvento = document.getElementById('tipo-evento').value;
        const mensagem = document.getElementById('mensagem').value;

        if (nome.trim().length < 3) {
            exibirMensagem('Por favor, informe seu nome completo.', 'erro');
            return;
        }
        if (!validarEmail(email)) {
            exibirMensagem('Por favor, informe um e-mail válido.', 'erro');
            return;
        }
        if (!validarTelefone(telefone)) {
            exibirMensagem('Por favor, informe um telefone válido com DDD.', 'erro');
            return;
        }
        if (cidadeInformada.trim().length < 3) {
            exibirMensagem('Por favor, informe sua cidade e estado.', 'erro');
            return;
        }
        if (!tipoEvento || tipoEvento === '') {
            exibirMensagem('Por favor, selecione o tipo de evento.', 'erro');
            return;
        }
        if (mensagem.trim().length < 10) {
            exibirMensagem('Por favor, descreva seu evento com mais detalhes.', 'erro');
            return;
        }

        const dadosAutomaticos = Utils.coletarDadosDispositivo();
        const dadosCompletos = {
            nome,
            email,
            telefone,
            cidade_informada: cidadeInformada,
            data_evento: dataEvento,
            tipo_evento: tipoEvento,
            mensagem,
            ...dadosAutomaticos
        };

        const dataFormatada = dataEvento ? new Date(dataEvento).toLocaleDateString('pt-BR') : 'Não informada';
        const mensagemWhatsapp = `Olá, gostaria de contratar o Everton Silva para um evento!
*Dados do contato:*
Nome: ${nome}
E-mail: ${email}
Telefone: ${telefone}
Cidade/Estado: ${cidadeInformada}

*Dados do evento:*
Tipo: ${tipoEvento}
Data: ${dataFormatada}

*Mensagem:*
${mensagem}`;
        const numeroWhatsapp = '557194079736';
        const urlWhatsapp = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensagemWhatsapp)}`;

        const botaoEnviar = formulario.querySelector('button[type="submit"]');
        botaoEnviar.disabled = true;
        botaoEnviar.textContent = 'Enviando...';

        try {
            await fetch('https://evertonsilvaoficial.com.br/api/processar-formulario.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCompletos)
            });
            exibirMensagem('Mensagem enviada com sucesso! Você será redirecionado para o WhatsApp.', 'sucesso');
            formulario.reset();
            setTimeout(() => window.open(urlWhatsapp, '_blank'), 1500);
        } catch (erro) {
            exibirMensagem('Ocorreu um erro ao enviar a mensagem. Por favor, tente novamente mais tarde.', 'erro');
        } finally {
            botaoEnviar.disabled = false;
            botaoEnviar.textContent = 'Enviar mensagem';
        }
    });
}