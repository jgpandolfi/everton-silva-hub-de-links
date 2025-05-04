<h1 align="center"> Website do Everton Silva </h1>

<p align="center">
Website profissional desenvolvido com HTML, CSS e JavaScript puro para o músico Everton Silva, vencedor do programa Ídolos 2012. O site funciona como um hub de links centralizado com design elegante, totalmente responsivo e otimizado para todas as plataformas, proporcionando uma experiência única que representa a identidade do artista.
</p>

<p align="center">
  🔗 <a href="https://evertonsilvaoficial.com.br/?utm_source=Repositorio-GitHub" target="_blank">Acessar o site em produção</a>
</p>

## 💡 Sobre o Projeto

Este é um projeto real desenvolvido para o cantor Everton Silva, vencedor da última temporada do programa Ídolos em 2012. O site foi concebido como um hub centralizado que concentra todos os links e formas de contato do artista, seguindo conceitos modernos de desenvolvimento web:

- **Design minimalista e elegante** que reflete a identidade do artista
- **Performance excepcional** com carregamento otimizado
- **Conformidade total com LGPD** para proteção de dados dos visitantes
- **Sistema de rastreamento completo** para análise de dados de visitas
- **Experiência imersiva** com animações sutis e cursor personalizado

O site utiliza uma paleta de cores sofisticada que reflete a identidade visual do artista: verde escuro (#22543D), amarelo ouro (#FFD700), vermelho (#C0392B), bege (#F5E9DA) e preto (#222222), implementadas através de variáveis CSS para manter consistência visual em todo o projeto.

## 🚀 Tecnologias

Este projeto foi desenvolvido utilizando exclusivamente:

- **HTML5** semântico para estruturação do conteúdo
- **CSS3** moderno com variáveis, flexbox e media queries
- **JavaScript** puro (Vanilla JS) com ES6+ e padrões modernos
- **PHP** para backend (API de tracking e formulário)
- **MySQL** para armazenamento de dados
- **Git e GitHub** para versionamento

Nenhum framework ou biblioteca externa foi utilizado no frontend, demonstrando domínio nas tecnologias fundamentais da web.

## 💻 Técnicas e Boas Práticas

### **Arquitetura e Organização**

- **Padrão de Módulo Revelador (Revealing Module Pattern)** para encapsulamento
- **Código modular** com separação clara de responsabilidades
- **CSS estruturado em seções numeradas** para melhor organização
- **Variáveis CSS** para padronização de cores, espaçamentos e transições
- **Nomenclatura consistente** para funções e variáveis em português

### **Performance**

- **Preloader interativo** com progresso visual
- **Imagens otimizadas em formato WebP** para carregamento rápido
- **Carregamento condicional** de scripts de tracking após consentimento
- **Envio assíncrono** de dados de rastreamento
- **Implementação de `navigator.sendBeacon`** para garantir envio de dados ao fechar a página

### **Segurança**

- **Sanitização completa** de dados de entrada
- **Sistema LGPD** para gerenciamento de consentimento
- **Proteção contra CSRF** no backend
- **Variáveis sensíveis em arquivos .env** fora do versionamento
- **Headers de segurança** configurados no servidor
- **Validação de origem das requisições** na API

### **Acessibilidade**

- **HTML semântico** para leitores de tela
- **Contraste adequado** para melhor legibilidade
- **Feedback visual claro** para interações do usuário
- **Navegação intuitiva** com âncoras suaves
- **Atributos ARIA** para elementos interativos

## 🤖 Funcionalidades

### **⌨️ Recursos de Interface**

- **Preloader personalizado** com barra de progresso
- **Cursor personalizado** com estados diferentes para cada contexto
- **Sistema de tooltips** para informações adicionais nos links
- **Botão de volta ao topo** com aparecimento suave
- **Animações sutis** de elementos conforme aparecem na tela

### **🔒 Sistema LGPD**

- **Modal de consentimento** na primeira visita
- **Política de privacidade interativa** carregada dinamicamente
- **Armazenamento seguro** de consentimento via localStorage
- **Carregamento condicional** de ferramentas de tracking
- **Integração com Microsoft Clarity e PostHog** para análise avançada

### **📊 Rastreamento de Visitantes**

- **Sistema próprio de tracking** para análise de comportamento
- **Coleta de métricas** como cliques, duração da sessão e origem
- **Detecção automática** de dispositivo, navegador e sistema operacional
- **Identificação de campanhas** via parâmetros UTM
- **Notificações em tempo real** via webhook do Discord

### **📱 Layout e Responsividade**

- **Design totalmente responsivo** adaptado a qualquer dispositivo
- **Abordagem mobile-first** para melhor experiência em smartphones
- **Media queries estratégicas** em diferentes breakpoints
- **Adaptação de elementos visuais** conforme tamanho da tela
- **Otimização de espaçamentos** para cada contexto de visualização

### **📋 Formulário de Contato**

- **Validação em tempo real** dos campos
- **Máscara para telefone** com formatação automática
- **Integração com WhatsApp** para continuidade do contato
- **Feedback visual** durante todo o processo de envio
- **Armazenamento seguro** dos leads no banco de dados

## 🔧 Estrutura do Projeto

O projeto segue uma estrutura organizada e de fácil manutenção: