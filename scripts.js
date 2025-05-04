'use strict';

/**
 * scripts.js - Funções JavaScript para o site hub de links do Everton Silva
 * Desenvolvido por Jota / José Guilherme Pandolfi - Agência m2a
 * www.agenciam2a.com.br
 */

// Aguarda o carregamento completo do DOM antes de inicializar as funções
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa todos os módulos funcionais do site
    inicializarPreloader();
    GerenciadorTracking.inicializar();
    inicializarConsentimentoLGPD();
    inicializarNavegacao();
    inicializarCursorPersonalizado();
    inicializarBotaoTopo();
    GerenciadorTooltips.inicializar();
    inicializarFormulario();
    inicializarAnimacoesScroll();
});

/**
 * Gerencia o preloader exibido durante o carregamento da página
 */
const inicializarPreloader = () => {
    const preloader = document.getElementById('preloader');
    const barraCarregamento = document.getElementById('barra-carregamento');
    const barraContainer = document.getElementById('barra-carregamento-container');
    let podeContinuar = false;

    // Função para continuar o carregamento e remover o preloader
    window.continuarCarregamento = () => {
        podeContinuar = true;
        
        // Remove o preloader quando a página estiver completamente carregada
        if (document.readyState === 'complete') {
            finalizarPreloader();
        }
    };

    // Função para finalizar o preloader
    const finalizarPreloader = () => {
        if (!podeContinuar) return;
        
        // Completa a barra de carregamento
        barraContainer.classList.add('visivel');
        barraCarregamento.style.width = '100%';
        
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
                barraContainer.classList.remove('visivel');
            }, 500);
        }, 800);
    };

    // Simula o progresso de carregamento
    let progresso = 0;
    const intervaloCarregamento = setInterval(() => {
        progresso += Math.random() * 10;
        if (progresso >= 100) {
            progresso = 100;
            clearInterval(intervaloCarregamento);
        }
        if (barraCarregamento) {
            barraCarregamento.style.width = `${progresso}%`;
        }
    }, 200);

    // Verifica se o usuário já deu consentimento
    if (localStorage.getItem('everton_silva_lgpd_consentimento') === 'aceito') {
        continuarCarregamento();
    }

    // Monitora o evento de carga completa da página
    window.addEventListener('load', () => {
        clearInterval(intervaloCarregamento);
        if (barraCarregamento) {
            barraCarregamento.style.width = '100%';
        }
        
        setTimeout(() => {
            if (podeContinuar) {
                finalizarPreloader();
            }
        }, 500);
    });
};

/**
 * Gerencia a funcionalidade de tracking interno de visitantes
 */
const RastreadorVisitantes = (function() {
    console.log('Módulo RastreadorVisitantes sendo inicializado');
    // Configurações
    const INTERVALO_ENVIO = 30000; // 30 segundos
    const URL_API = 'https://evertonsilvaoficial.com.br/api/registrar-visitante.php';
    console.log('URL da API configurada:', URL_API);
    
    // Estado interno
    let visitanteUUID;
    let novoVisitante = true;
    let totalCliques = 0;
    let cliquesElementosClicaveis = 0;
    let inicioSessao = Date.now();
    let duracaoSessao = 0;
    let rastreamentoAtivo = false;
    let intervaloEnvio;

    /**
     * Gera ou recupera UUID do visitante
     * @private
     */
    function gerarUUID() {
        console.log('Tentando gerar ou recuperar UUID');
        const chaveStorage = 'everton_silva_visitante_uuid';
        let uuid = localStorage.getItem(chaveStorage);
        
        if (!uuid) {
            console.log('Nenhum UUID encontrado, gerando novo');
            uuid = self.crypto.randomUUID() || String(Date.now());
            localStorage.setItem(chaveStorage, uuid);
            novoVisitante = true;
        } else {
            console.log('UUID existente recuperado:', uuid);
            novoVisitante = false;
        }
        
        return uuid;
    }

    /**
     * Detecta informações sobre navegador, SO e dispositivo
     * @private
     */
    function detectarInfoNavegador() {
        console.log('Detectando informações do navegador e dispositivo');
        const userAgent = navigator.userAgent;
        let navegador = 'Desconhecido';
        let sistemaOperacional = 'Desconhecido';
        let marcaDispositivo = 'Desconhecido';
        let movel = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent) ? 1 : 0;
        
        // Detectar navegador
        if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) navegador = 'Chrome';
        else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) navegador = 'Safari';
        else if (userAgent.indexOf('Firefox') > -1) navegador = 'Firefox';
        else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) navegador = 'Internet Explorer';
        else if (userAgent.indexOf('Edg') > -1) navegador = 'Edge';
        else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) navegador = 'Opera';
        
        // Detectar sistema operacional
        if (userAgent.indexOf('Windows') > -1) sistemaOperacional = 'Windows';
        else if (userAgent.indexOf('Mac') > -1) sistemaOperacional = 'MacOS';
        else if (userAgent.indexOf('Linux') > -1) sistemaOperacional = 'Linux';
        else if (userAgent.indexOf('Android') > -1) sistemaOperacional = 'Android';
        else if (userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1 || userAgent.indexOf('iPod') > -1) sistemaOperacional = 'iOS';
        
        // Detectar marca do dispositivo
        if (userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1 || userAgent.indexOf('iPod') > -1) marcaDispositivo = 'Apple';
        else if (userAgent.indexOf('Samsung') > -1) marcaDispositivo = 'Samsung';
        else if (userAgent.indexOf('Huawei') > -1) marcaDispositivo = 'Huawei';
        else if (userAgent.indexOf('Xiaomi') > -1) marcaDispositivo = 'Xiaomi';
        else if (userAgent.indexOf('Motorola') > -1) marcaDispositivo = 'Motorola';
        else if (userAgent.indexOf('LG') > -1) marcaDispositivo = 'LG';
        else if (userAgent.indexOf('Android') > -1) marcaDispositivo = 'Android';
        else if (!movel) marcaDispositivo = 'Desktop';
        
        console.log('Informações detectadas:', { navegador, sistemaOperacional, marcaDispositivo, movel });
        return {
            navegador: navegador,
            sistema_operacional: sistemaOperacional,
            marca_dispositivo: marcaDispositivo,
            movel: movel
        };
    }

    /**
     * Coleta dados do dispositivo/navegador
     * @private
     */
    function coletarDadosDispositivo() {
        console.log('Coletando dados do dispositivo e navegador');
        const dadosDispositivo = {
            dimensao_tela: `${screen.width}x${screen.height}`,
            referrer: document.referrer || '',
            utm_source: new URLSearchParams(location.search).get('utm_source') || '',
            utm_medium: new URLSearchParams(location.search).get('utm_medium') || '',
            utm_campaign: new URLSearchParams(location.search).get('utm_campaign') || '',
            utm_content: new URLSearchParams(location.search).get('utm_content') || '',
            utm_term: new URLSearchParams(location.search).get('utm_term') || '',
            ...detectarInfoNavegador() // Inclui as informações do navegador e dispositivo
        };
        console.log('Dados coletados:', dadosDispositivo);
        return dadosDispositivo;
    }

    /**
     * Rastreia cliques e interações
     * @private
     */
    function rastrearInteracoes() {
        console.log('Configurando rastreamento de interações');
        document.addEventListener('click', (evento) => {
            totalCliques++;
            
            const elementosClicaveis = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
            const elemento = evento.target;
            
            if (elementosClicaveis.includes(elemento.tagName) || 
                elemento.closest('[role="button"]')) {
                cliquesElementosClicaveis++;
                console.log('Clique em elemento clicável detectado. Total:', cliquesElementosClicaveis);
            } else {
                console.log('Clique em elemento não-clicável. Total de cliques:', totalCliques);
            }
        });
    }

    /**
     * Envia dados para a API
     * @private
     */
    async function enviarDados() {
        console.log('Iniciando envio de dados para a API');
        duracaoSessao = Math.floor((Date.now() - inicioSessao) / 1000);
        
        const dados = {
            uuid: visitanteUUID,
            novo_visitante: novoVisitante,
            total_cliques: totalCliques,
            cliques_elementos_clicaveis: cliquesElementosClicaveis,
            duracao_sessao: duracaoSessao,
            ...coletarDadosDispositivo()
        };
        
        console.log('Dados preparados para envio:', dados);
        console.log('JSON a ser enviado:', JSON.stringify(dados));

        try {
            console.log('Enviando requisição fetch para:', URL_API);
            const resposta = await fetch(URL_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            
            console.log('Resposta recebida. Status:', resposta.status);
            
            if (resposta.ok) {
                const textoResposta = await resposta.text();
                console.log('Dados do visitante enviados com sucesso. Resposta:', textoResposta);
                novoVisitante = false;
            } else {
                console.error('Erro ao enviar dados do visitante:', await resposta.text());
            }
        } catch (erro) {
            console.error('Erro no tracking:', erro);
        }
    }

    /**
     * Configura eventos de fim de sessão
     * @private
     */
    function configurarEventosSessao() {
        console.log('Configurando eventos de fim de sessão');
        window.addEventListener('beforeunload', () => {
            console.log('Evento beforeunload detectado, enviando dados finais');
            duracaoSessao = Math.floor((Date.now() - inicioSessao) / 1000);
            
            // Usar navigator.sendBeacon para enviar dados antes da página fechar
            const dadosFinal = {
                uuid: visitanteUUID,
                novo_visitante: novoVisitante,
                total_cliques: totalCliques,
                cliques_elementos_clicaveis: cliquesElementosClicaveis,
                duracao_sessao: duracaoSessao,
                ...coletarDadosDispositivo()
            };
            
            console.log('Enviando dados via sendBeacon antes de fechar');
            navigator.sendBeacon(URL_API, JSON.stringify(dadosFinal));
        });
    }

    /**
     * Inicia o rastreamento
     * @public
     */
    function iniciar() {
        console.log('Método iniciar() chamado');
        if (rastreamentoAtivo) {
            console.log('Rastreamento já está ativo, retornando');
            return;
        }
        
        console.log('Iniciando processo de rastreamento');
        visitanteUUID = gerarUUID();
        console.log('UUID definido:', visitanteUUID);
        
        rastrearInteracoes();
        configurarEventosSessao();
        
        // Envio inicial
        console.log('Realizando envio inicial de dados');
        enviarDados();
        
        // Envio periódico
        console.log('Configurando envio periódico a cada', INTERVALO_ENVIO/1000, 'segundos');
        intervaloEnvio = setInterval(enviarDados, INTERVALO_ENVIO);
        rastreamentoAtivo = true;
        
        console.log('Rastreamento de visitantes iniciado com ID:', visitanteUUID);
    }

    // Interface pública
    return { iniciar };
})();

/**
 * Gerencia o carregamento e configuração de ferramentas de tracking (Clarity e PostHog)
 */
const GerenciadorTracking = (function() {
    // IDs e configurações
    const CLARITY_PROJECT_ID = 'rbgw4bm105';
    const POSTHOG_API_KEY = 'phc_JH3hsLZzQBwRPK4kqBcPcAHOMi6CbAoamvZrnWy9uIh';
    const POSTHOG_API_HOST = 'https://us.i.posthog.com';

    // Status de carregamento
    let clarityCarregado = false;
    let posthogCarregado = false;

    /**
     * Carrega o script do Microsoft Clarity dinamicamente
     */
    function carregarClarity() {
        if (clarityCarregado) return;
        try {
            // Configura a função global clarity
            window.clarity = window.clarity || function(){(window.clarity.q = window.clarity.q || []).push(arguments)};
            // Cria o elemento de script
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
            // Adiciona ao head
            const primeiroScript = document.getElementsByTagName('script')[0];
            primeiroScript.parentNode.insertBefore(script, primeiroScript);
            // Sinaliza que o Clarity foi carregado
            clarityCarregado = true;
            console.log('Microsoft Clarity carregado com sucesso');
        } catch (erro) {
            console.error('Erro ao carregar Microsoft Clarity:', erro);
        }
    }

    /**
     * Carrega o script do PostHog dinamicamente
     */
    function carregarPostHog() {
        if (posthogCarregado) return;
        try {
            // Inicializa o objeto posthog
            window.posthog = window.posthog || [];
            // Função para carregar o PostHog
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
            
            // Inicializa o PostHog
            window.posthog.init(POSTHOG_API_KEY, {
                api_host: POSTHOG_API_HOST,
                person_profiles: 'identified_only'
            });
            
            // Sinaliza que o PostHog foi carregado
            posthogCarregado = true;
            console.log('PostHog carregado com sucesso');
        } catch (erro) {
            console.error('Erro ao carregar PostHog:', erro);
        }
    }

    /**
     * Ativa consentimento nas ferramentas de tracking
     */
    function ativarConsentimento() {
        setTimeout(() => {
            // Ativa consentimento no Clarity
            if (typeof window.clarity === 'function') {
                window.clarity('consent');
                console.log('Consentimento ativado no Microsoft Clarity');
            }

            // Ativa consentimento no PostHog (opt_in_capturing)
            if (typeof window.posthog === 'object' && typeof window.posthog.opt_in_capturing === 'function') {
                window.posthog.opt_in_capturing();
                console.log('Consentimento ativado no PostHog');
            }
        }, 1000);
    }

    /**
     * Carrega todas as ferramentas de tracking
     */
    function carregarFerramentas() {
        carregarClarity();
        carregarPostHog();
    }

    /**
     * Inicializa o tracking caso o consentimento já exista
     */
    function inicializarComConsentimentoExistente() {
        try {
            const consentimentoExistente = localStorage.getItem('everton_silva_lgpd_consentimento') === 'aceito';
            if (consentimentoExistente) {
                carregarFerramentas();
                ativarConsentimento();
                RastreadorVisitantes.iniciar();
            }
        } catch (erro) {
            console.error('Erro ao verificar consentimento para tracking:', erro);
        }
    }

    // Interface pública
    return {
        inicializar: inicializarComConsentimentoExistente,
        carregar: carregarFerramentas,
        consentir: ativarConsentimento
    };
})();

/**
 * Gerencia o modal de consentimento LGPD
 */
const inicializarConsentimentoLGPD = () => {
    const modal = document.getElementById('lgpd-modal');
    const botaoAceitar = document.getElementById('lgpd-aceitar');
    const botaoRejeitar = document.getElementById('lgpd-rejeitar');
    const botaoReconsiderar = document.getElementById('lgpd-reconsiderar');
    const mensagemRejeicao = document.getElementById('lgpd-mensagem-rejeicao');

    // Chave para armazenar o consentimento no localStorage
    const CHAVE_CONSENTIMENTO = 'everton_silva_lgpd_consentimento';
    const DATA_CONSENTIMENTO = 'everton_silva_lgpd_data';

    // Verifica se o usuário já deu consentimento
    const verificarConsentimento = () => {
        try {
            return localStorage.getItem(CHAVE_CONSENTIMENTO) === 'aceito';
        } catch (erro) {
            console.error('Erro ao acessar localStorage:', erro);
            return false;
        }
    };

    // Se não tiver consentimento ainda, mostra o modal após um breve delay
    if (!verificarConsentimento()) {
        setTimeout(() => {
            modal.classList.add('ativo');
        }, 1500);
    }

    // Processa o aceite do usuário
    const aceitarTermos = () => {
        try {
            localStorage.setItem(CHAVE_CONSENTIMENTO, 'aceito');
            localStorage.setItem(DATA_CONSENTIMENTO, new Date().toISOString());
        } catch (erro) {
            console.error('Erro ao salvar consentimento:', erro);
        }
        
        modal.classList.remove('ativo');
        GerenciadorTracking.carregar();    // Carrega as ferramentas de tracking
        GerenciadorTracking.consentir();   // Ativa o consentimento nas ferramentas
        RastreadorVisitantes.iniciar(); // Inicia o tracking interno
        continuarCarregamento();
    };

    // Processa a rejeição do usuário
    const rejeitarTermos = () => {
        mensagemRejeicao.classList.add('ativo');
        botaoAceitar.style.display = 'none';
        botaoRejeitar.style.display = 'none';
    };

    // Permite ao usuário reconsiderar a rejeição
    const reconsiderarRejeicao = () => {
        mensagemRejeicao.classList.remove('ativo');
        botaoAceitar.style.display = '';
        botaoRejeitar.style.display = '';
    };

    // Configura os listeners de eventos
    botaoAceitar.addEventListener('click', aceitarTermos);
    botaoRejeitar.addEventListener('click', rejeitarTermos);
    botaoReconsiderar.addEventListener('click', reconsiderarRejeicao);

    // Captura o clique no link da política de privacidade
    const linkPolitica = document.querySelector('.lgpd-texto a[href="#politica-privacidade"]');
    if (linkPolitica) {
        linkPolitica.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                // Faz a requisição para carregar o arquivo de texto
                const resposta = await fetch('assets/TERMOS-DE-USO-E-POLITICA-DE-PRIVACIDADE.txt');
                if (!resposta.ok) throw new Error('Falha ao carregar o arquivo de texto');
                const textoTermos = await resposta.text();
                
                // Cria o textarea somente leitura
                const textarea = document.createElement('textarea');
                textarea.readOnly = true;
                textarea.classList.add('lgpd-termos');
                textarea.value = textoTermos;
                
                // Adicionar eventos de mouse para controlar o cursor personalizado
                const cursorPrincipal = document.querySelector('.cursor-principal');
                if (cursorPrincipal) {
                    textarea.addEventListener('mouseover', () => {
                        cursorPrincipal.classList.add('sobre-clicavel');
                        cursorPrincipal.classList.add('texto');
                        document.body.classList.remove('cursor-ativo'); // Remove a classe para mostrar cursor padrão
                    });
                    
                    textarea.addEventListener('mouseout', () => {
                        cursorPrincipal.classList.remove('sobre-clicavel');
                        cursorPrincipal.classList.remove('texto');
                        document.body.classList.add('cursor-ativo'); // Restaura o cursor personalizado
                    });
                }
                
                // Insere o textarea no modal, entre a div.lgpd-texto e a div.lgpd-botoes
                const divTexto = document.querySelector('.lgpd-texto');
                const divBotoes = document.querySelector('.lgpd-botoes');
                if (divTexto && divBotoes) {
                    // Remove textarea antigo se existir
                    const textareaExistente = document.querySelector('.lgpd-termos');
                    if (textareaExistente) textareaExistente.remove();
                    divTexto.insertAdjacentElement('afterend', textarea);
                }
            } catch (erro) {
                console.error('Erro ao carregar os termos:', erro);
            }
        });
    }
};

/**
 * Gerencia a navegação e comportamento de links
 */
const inicializarNavegacao = () => {
    // Adiciona smooth scroll para links âncora
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const alvo = document.querySelector(this.getAttribute('href'));
            if (alvo) {
                alvo.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Verifica se é o botão de WhatsApp para shows
                if (this.classList.contains('botao-whatsapp') && this.getAttribute('href') === '#contato') {
                    destacarFormularioContato();
                }
            }
        });
    });
    
    /**
     * Aplica efeito visual para destacar o formulário de contato
     * @private
     */
    const destacarFormularioContato = () => {
        const secaoContato = document.querySelector('.secao-contato');
        if (secaoContato) {
            // Remove classe anterior (caso exista) para reiniciar a animação
            secaoContato.classList.remove('destacar-formulario');
            
            // Força um reflow do DOM antes de adicionar a classe novamente
            void secaoContato.offsetWidth;
            
            // Adiciona a classe para iniciar a animação
            secaoContato.classList.add('destacar-formulario');
            
            // Remove a classe após a animação terminar
            setTimeout(() => {
                secaoContato.classList.remove('destacar-formulario');
            }, 4000); // 5 repetições x 0.8s = ~4s
        }
    };
};


/**
 * Gerencia o cursor personalizado
 */
const inicializarCursorPersonalizado = () => {
    // Verificar se estamos em um dispositivo touch
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) {
        document.body.classList.add('dispositivo-touch');
        return; // Não inicializa o cursor personalizado em dispositivos touch
    }

    const cursorPrincipal = document.querySelector('.cursor-principal');
    
    if (!cursorPrincipal) return;
    
    // Adiciona a classe ao body para ocultar o cursor padrão
    document.body.classList.add('cursor-ativo');

    document.addEventListener('mousemove', e => {
        cursorPrincipal.style.left = `${e.clientX}px`;
        cursorPrincipal.style.top = `${e.clientY}px`;
    });

    // Elementos clicáveis
    const elementosClicaveis = document.querySelectorAll('a, button, .botao-link, .botao-primario, [role="button"]');

    // Oculta o cursor personalizado sobre elementos clicáveis
    elementosClicaveis.forEach(el => {
        el.addEventListener('mouseover', () => {
            cursorPrincipal.classList.add('sobre-clicavel');
            cursorPrincipal.classList.add('hover');
            document.body.classList.remove('cursor-ativo'); // Remove a classe do body
        });
        el.addEventListener('mouseout', () => {
            cursorPrincipal.classList.remove('sobre-clicavel');
            cursorPrincipal.classList.remove('hover');
            document.body.classList.add('cursor-ativo'); // Readiciona a classe ao body
        });
    });

    // Oculta o cursor personalizado sobre campos de texto
    document.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('mouseover', () => {
            cursorPrincipal.classList.add('sobre-clicavel');
            cursorPrincipal.classList.add('texto');
            document.body.classList.remove('cursor-ativo'); // Remove a classe do body
        });
        el.addEventListener('mouseout', () => {
            cursorPrincipal.classList.remove('sobre-clicavel');
            cursorPrincipal.classList.remove('texto');
            document.body.classList.add('cursor-ativo'); // Readiciona a classe ao body
        });
    });
};

/**
 * Controla o botão "Voltar ao Topo"
 */
const inicializarBotaoTopo = () => {
    const botaoTopo = document.getElementById('botaoTopo');
    
    if (!botaoTopo) return;

    // Mostra ou oculta o botão com base na posição da rolagem
    const alternarVisibilidadeBotao = () => {
        if (window.scrollY > 300) {
            botaoTopo.classList.add('visivel');
        } else {
            botaoTopo.classList.remove('visivel');
        }
    };

    // Verifica o estado inicial
    alternarVisibilidadeBotao();

    // Monitora a rolagem para atualizar a visibilidade
    window.addEventListener('scroll', alternarVisibilidadeBotao);

    // Rola suavemente para o topo quando clicado
    botaoTopo.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
};

/**
 * Adiciona animações aos elementos conforme aparecem na viewport
 */
const inicializarAnimacoesScroll = () => {
    // Seleciona elementos para animar
    const elementosAnimados = document.querySelectorAll(
        '.perfil-cabecalho, .secao-links, .botao-link, .secao-contato, .campo-formulario'
    );

    // Verifica se os elementos estão visíveis na viewport
    const verificarVisibilidade = () => {
        const alturaJanela = window.innerHeight;
        const margemAtivacao = 150; // Distância antes do elemento entrar completamente na tela
        
        elementosAnimados.forEach(elemento => {
            const posicaoElemento = elemento.getBoundingClientRect().top;
            
            if (posicaoElemento < alturaJanela - margemAtivacao) {
                elemento.classList.add('animacao-aparecer');
            }
        });
    };

    // Executa verificação inicial após um breve atraso
    setTimeout(verificarVisibilidade, 300);

    // Monitora a rolagem para animar elementos adicionais
    window.addEventListener('scroll', verificarVisibilidade);
};

/**
 * Gerencia tooltips personalizados para o site
 */
const GerenciadorTooltips = (function() {
    // Variáveis privadas
    let tooltipContainer;
    let tooltipTexto;
    let elementoAtual = null;
    let mobileTimerId = null;
    let tooltipVisivel = false;

    /**
     * Inicializa os tooltips e configura eventos
     * @private
     */
    function inicializar() {
        tooltipContainer = document.getElementById('tooltip-personalizado');
        if (!tooltipContainer) return;
        
        tooltipTexto = tooltipContainer.querySelector('.tooltip-texto');
        
        // Detectar todos elementos com tooltips
        const elementosComTooltip = document.querySelectorAll('[data-tooltip]');
        
        // Adicionar eventos para cada elemento
        elementosComTooltip.forEach(elemento => {
            // Em dispositivos desktop
            elemento.addEventListener('mouseenter', e => mostrarTooltip(e, elemento));
            elemento.addEventListener('mouseleave', esconderTooltip);
            elemento.addEventListener('mousemove', e => posicionarTooltip(e));
            
            // Em dispositivos mobile (touch)
            elemento.addEventListener('touchstart', e => {
                // Se já tiver um tooltip aberto em outro elemento, fecha
                if (elementoAtual && elementoAtual !== elemento) {
                    esconderTooltip();
                }
                
                // Toggle do tooltip atual
                if (elementoAtual === elemento) {
                    esconderTooltip();
                } else {
                    mostrarTooltip(e, elemento);
                    // Esconder após um tempo em dispositivos touch
                    clearTimeout(mobileTimerId);
                    mobileTimerId = setTimeout(esconderTooltip, 3000);
                }
            });
        });
        
        // Esconder tooltip ao clicar em qualquer lugar (para dispositivos touch)
        document.addEventListener('touchstart', e => {
            if (tooltipVisivel && (!elementoAtual || !elementoAtual.contains(e.target))) {
                esconderTooltip();
            }
        });
        
        // Esconder tooltip ao rolar a página
        document.addEventListener('scroll', () => {
            if (tooltipVisivel) {
                esconderTooltip();
            }
        });
    }

    /**
     * Mostra o tooltip com o conteúdo adequado
     * @private
     */
    function mostrarTooltip(evento, elemento) {
        const conteudoTooltip = elemento.getAttribute('data-tooltip');
        if (!conteudoTooltip) return;
        
        tooltipTexto.innerHTML = conteudoTooltip;
        elementoAtual = elemento;
        tooltipVisivel = true;
        
        // Posicionar o tooltip
        posicionarTooltip(evento);
        
        // Mostrar o tooltip
        tooltipContainer.classList.add('visivel');
        tooltipContainer.setAttribute('aria-hidden', 'false');
    }

    /**
     * Esconde o tooltip
     * @private
     */
    function esconderTooltip() {
        tooltipContainer.classList.remove('visivel');
        tooltipContainer.setAttribute('aria-hidden', 'true');
        elementoAtual = null;
        tooltipVisivel = false;
        clearTimeout(mobileTimerId);
    }

    /**
     * Posiciona o tooltip junto ao mouse ou elemento
     * @private
     */
    function posicionarTooltip(evento) {
        if (!elementoAtual) return;
        
        const isTouchDevice = evento.type === 'touchstart';
        
        if (isTouchDevice) {
            // Posicionamento para dispositivos touch (centralizado acima do elemento)
            const rect = elementoAtual.getBoundingClientRect();
            const elementoX = rect.left + (rect.width / 2);
            const elementoY = rect.top;
            
            tooltipContainer.style.left = `${elementoX}px`;
            tooltipContainer.style.top = `${elementoY - 10}px`;
        } else {
            // Posicionamento seguindo o cursor
            const mouseX = evento.clientX;
            const mouseY = evento.clientY;
            
            tooltipContainer.style.left = `${mouseX}px`;
            tooltipContainer.style.top = `${mouseY - 10}px`;
        }
    }

    // Interface pública
    return {
        inicializar: inicializar
    };
})();

/**
 * Gerencia a validação e envio do formulário de contato
 */
const inicializarFormulario = () => {
    const formulario = document.getElementById('formularioContato');
    
    if (!formulario) return;

    // Validação de e-mail
    const validarEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    // Validação de telefone
    const validarTelefone = (telefone) => {
        const apenasNumeros = telefone.replace(/\D/g, '');
        return apenasNumeros.length >= 10 && apenasNumeros.length <= 11;
    };

    // Aplica máscara ao telefone
    const campoTelefone = document.getElementById('telefone');
    
    if (campoTelefone) {
        campoTelefone.addEventListener('input', (e) => {
            // Remove todos os caracteres não numéricos
            let valor = e.target.value.replace(/\D/g, '');
            
            // Limita a 11 dígitos (DDD + número)
            valor = valor.substring(0, 11);
            
            // Aplica a máscara de telefone
            let resultado = '';
            if (valor.length > 0) {
                resultado = '(' + valor.substring(0, 2);
                
                if (valor.length > 2) {
                    resultado += ') ' + valor.substring(2, valor.length > 7 ? 7 : valor.length);
                    
                    if (valor.length > 7) {
                        resultado += '-' + valor.substring(7);
                    }
                }
            }
            
            e.target.value = resultado;
        });
    }

    // Exibe mensagem de erro ou sucesso
    const exibirMensagem = (texto, tipo) => {
        // Remove mensagem anterior se existir
        const mensagemExistente = formulario.querySelector('.mensagem-formulario');
        if (mensagemExistente) {
            mensagemExistente.remove();
        }
        
        // Cria o elemento de mensagem
        const mensagem = document.createElement('div');
        mensagem.className = `mensagem-formulario ${tipo}`;
        mensagem.textContent = texto;
        
        // Adiciona ao início do formulário
        formulario.prepend(mensagem);
        
        // Remove a mensagem após alguns segundos
        if (tipo === 'sucesso') {
            setTimeout(() => {
                mensagem.classList.add('desaparecer');
                setTimeout(() => mensagem.remove(), 500);
            }, 5000);
        }
        
        // Rola até a mensagem
        mensagem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    /**
     * Coleta dados automáticos para o formulário
     * Reutiliza funções do rastreador de visitantes
     */
    const coletarDadosAutomaticos = () => {
        console.log('Coletando dados automáticos para o formulário');
        
        // Dados do dispositivo e UTMs
        const dadosDispositivo = {
            dimensao_tela: `${screen.width}x${screen.height}`,
            referrer: document.referrer || '',
            utm_source: new URLSearchParams(location.search).get('utm_source') || '',
            utm_medium: new URLSearchParams(location.search).get('utm_medium') || '',
            utm_campaign: new URLSearchParams(location.search).get('utm_campaign') || '',
            utm_content: new URLSearchParams(location.search).get('utm_content') || '',
            utm_term: new URLSearchParams(location.search).get('utm_term') || ''
        };
        
        // Detectar informações do navegador (reutilização de código)
        const userAgent = navigator.userAgent;
        let navegador = 'Desconhecido';
        let sistemaOperacional = 'Desconhecido';
        let marcaDispositivo = 'Desconhecido';
        let movel = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent) ? 1 : 0;
        
        // Detectar navegador
        if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) navegador = 'Chrome';
        else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) navegador = 'Safari';
        else if (userAgent.indexOf('Firefox') > -1) navegador = 'Firefox';
        else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) navegador = 'Internet Explorer';
        else if (userAgent.indexOf('Edg') > -1) navegador = 'Edge';
        else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) navegador = 'Opera';
        
        // Detectar sistema operacional
        if (userAgent.indexOf('Windows') > -1) sistemaOperacional = 'Windows';
        else if (userAgent.indexOf('Mac') > -1) sistemaOperacional = 'MacOS';
        else if (userAgent.indexOf('Linux') > -1) sistemaOperacional = 'Linux';
        else if (userAgent.indexOf('Android') > -1) sistemaOperacional = 'Android';
        else if (userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1 || userAgent.indexOf('iPod') > -1) sistemaOperacional = 'iOS';
        
        // Detectar marca do dispositivo
        if (userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1 || userAgent.indexOf('iPod') > -1) marcaDispositivo = 'Apple';
        else if (userAgent.indexOf('Samsung') > -1) marcaDispositivo = 'Samsung';
        else if (userAgent.indexOf('Huawei') > -1) marcaDispositivo = 'Huawei';
        else if (userAgent.indexOf('Xiaomi') > -1) marcaDispositivo = 'Xiaomi';
        else if (userAgent.indexOf('Motorola') > -1) marcaDispositivo = 'Motorola';
        else if (userAgent.indexOf('LG') > -1) marcaDispositivo = 'LG';
        else if (userAgent.indexOf('Android') > -1) marcaDispositivo = 'Android';
        else if (!movel) marcaDispositivo = 'Desktop';
        
        return {
            ...dadosDispositivo,
            navegador,
            sistema_operacional: sistemaOperacional,
            marca_dispositivo: marcaDispositivo,
            movel
        };
    };

    /**
     * Envia dados para a API
     */
    const enviarDadosParaAPI = async (dados) => {
        try {
            console.log('Enviando dados do formulário para API');
            const resposta = await fetch('https://evertonsilvaoficial.com.br/api/processar-formulario.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            
            if (resposta.ok) {
                console.log('Dados do formulário enviados com sucesso para API');
                return true;
            } else {
                console.error('Erro ao enviar dados do formulário para API:', await resposta.text());
                return false;
            }
        } catch (erro) {
            console.error('Erro ao enviar para API:', erro);
            return false;
        }
    };

    // Processa o envio do formulário
    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Coletando dados do formulário
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const telefone = document.getElementById('telefone').value;
        const cidadeInformada = document.getElementById('cidade').value;
        const dataEvento = document.getElementById('data').value;
        const tipoEvento = document.getElementById('tipo-evento').value;
        const mensagem = document.getElementById('mensagem').value;
        
        // Validação básica
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
        
        // Capturar dados automáticos
        const dadosAutomaticos = coletarDadosAutomaticos();
        
        // Preparar dados completos para API
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
        
        // Formata data para exibição
        const dataFormatada = dataEvento ? new Date(dataEvento).toLocaleDateString('pt-BR') : 'Não informada';
        
        // Formata a mensagem para WhatsApp
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
        
        // Número de WhatsApp
        const numeroWhatsapp = '557194079736';
        
        // URL do WhatsApp
        const urlWhatsapp = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensagemWhatsapp)}`;
        
        // Desabilita o botão durante o processamento
        const botaoEnviar = formulario.querySelector('button[type="submit"]');
        botaoEnviar.disabled = true;
        botaoEnviar.textContent = 'Enviando...';
        
        try {
            // Enviar para a API
            await enviarDadosParaAPI(dadosCompletos);
            
            // Exibe mensagem de sucesso
            exibirMensagem('Mensagem enviada com sucesso! Você será redirecionado para o WhatsApp.', 'sucesso');
            
            // Reseta o formulário
            formulario.reset();
            
            // Abre WhatsApp em nova aba após pequeno delay
            setTimeout(() => {
                window.open(urlWhatsapp, '_blank');
            }, 1500);
            
        } catch (erro) {
            console.error('Erro ao processar formulário:', erro);
            exibirMensagem('Ocorreu um erro ao enviar a mensagem. Por favor, tente novamente mais tarde.', 'erro');
        } finally {
            // Restaura o botão
            botaoEnviar.disabled = false;
            botaoEnviar.textContent = 'Enviar mensagem';
        }
    });
};