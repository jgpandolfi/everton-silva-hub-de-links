<?php
// config.php - Configurações do sistema de tracking

// Função para carregar variáveis do arquivo .env
if (file_exists(__DIR__ . '/.env')) {
    $linhas = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($linhas as $linha) {
        // Ignorar comentários
        if (strpos(trim($linha), '#') === 0) {
            continue;
        }
        
        // Verificar se a linha tem o formato correto
        if (strpos($linha, '=') !== false) {
            list($nome, $valor) = explode('=', $linha, 2);
            $nome = trim($nome);
            $valor = trim($valor);
            
            // Remove aspas se existirem
            if ((strpos($valor, '"') === 0 && substr($valor, -1) === '"') || 
                (strpos($valor, "'") === 0 && substr($valor, -1) === "'")) {
                $valor = substr($valor, 1, -1);
            }
            
            // Define a variável de ambiente
            putenv("$nome=$valor");
            $_ENV[$nome] = $valor;
            $_SERVER[$nome] = $valor;
        }
    }
}

define('ACESSO_SEGURO', true);

// Configurações do banco de dados MySQL (obtidas do .env ou valores padrão)
define('DB_SERVIDOR', getenv('DB_SERVIDOR') ?: 'localhost');
define('DB_NOME', getenv('DB_NOME') ?: '');
define('DB_USUARIO', getenv('DB_USUARIO') ?: '');
define('DB_SENHA', getenv('DB_SENHA') ?: '');

// Webhook do Discord para notificações de visitantes
define('DISCORD_WEBHOOK_VISITANTES', getenv('DISCORD_WEBHOOK_VISITANTES') ?: '');

// Webhook do Discord para notificações de leads do formulário
define('DISCORD_WEBHOOK_LEADS', getenv('DISCORD_WEBHOOK_LEADS') ?: 'WEBHOOK_URL_FALLBACK');

// Configurações de segurança
define('SEGREDO_TOKEN_CSRF', getenv('SEGREDO_TOKEN_CSRF') ?: 'chave_segura_temporaria');

// Timezone e configurações de data
date_default_timezone_set('America/Sao_Paulo');