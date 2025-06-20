<?php
// config-auth.php - Configurações do sistema de autenticação

define('ACESSO_SEGURO_AUTH', true);

// Função para carregar variáveis do arquivo .env (mesmo sistema do config.php principal)
function carregarVariaveisEnv() {
    $arquivoEnv = __DIR__ . '/../.env';
    
    if (!file_exists($arquivoEnv)) {
        throw new Exception('Arquivo .env não encontrado');
    }
    
    $linhas = file($arquivoEnv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
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

// Carregar variáveis de ambiente
carregarVariaveisEnv();

// Configurações de sessão
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Strict');

// Iniciar sessão
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Configurações de usuários - AGORA LENDO DO .ENV
define('USUARIOS_DASHBOARD', [
    'admin' => [
        'senha_hash' => getenv('AUTH_ADMIN_HASH') ?: '',
        'nome' => 'Administrador',
        'email' => 'admin@evertonsilvaoficial.com.br',
        'permissoes' => ['visualizar', 'exportar']
    ],
    'marketing' => [
        'senha_hash' => getenv('AUTH_MARKETING_HASH') ?: '',
        'nome' => 'Equipe Marketing',
        'email' => 'marketing@evertonsilvaoficial.com.br',
        'permissoes' => ['visualizar']
    ]
]);

// Validar se os hashes foram carregados
if (empty(getenv('AUTH_ADMIN_HASH')) || empty(getenv('AUTH_MARKETING_HASH'))) {
    error_log('ERRO: Hashes de autenticação não encontrados no arquivo .env');
    throw new Exception('Configuração de autenticação incompleta');
}

// Função para gerar hash de senha (usar apenas para criar novos usuários)
function gerarHashSenha($senha) {
    return password_hash($senha, PASSWORD_ARGON2ID, [
        'memory_cost' => 65536,
        'time_cost' => 4,
        'threads' => 3
    ]);
}

// Função para verificar autenticação
function verificarAutenticacao() {
    if (!isset($_SESSION['usuario_dashboard']) || !isset($_SESSION['ultimo_acesso'])) {
        return false;
    }
    
    // Verificar timeout (2 horas)
    if (time() - $_SESSION['ultimo_acesso'] > 7200) {
        session_destroy();
        return false;
    }
    
    // Atualizar último acesso
    $_SESSION['ultimo_acesso'] = time();
    return true;
}

// Função para verificar permissão
function verificarPermissao($permissao_requerida) {
    if (!verificarAutenticacao()) {
        return false;
    }
    
    $usuario = $_SESSION['usuario_dashboard'];
    $usuarios = USUARIOS_DASHBOARD;
    
    if (!isset($usuarios[$usuario['login']])) {
        return false;
    }
    
    return in_array($permissao_requerida, $usuarios[$usuario['login']]['permissoes']);
}

// Headers de segurança
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');