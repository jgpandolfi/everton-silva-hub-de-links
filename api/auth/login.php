<?php
// login.php - Endpoint para autenticação

require_once 'config-auth.php';

// Configurar CORS para o dashboard
header("Access-Control-Allow-Origin: https://evertonsilvaoficial.com.br");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Responder às requisições OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Validar método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['erro' => 'Método não permitido']));
}

// Obter dados da requisição
$dados = json_decode(file_get_contents('php://input'), true);

if (empty($dados['login']) || empty($dados['senha'])) {
    http_response_code(400);
    exit(json_encode(['erro' => 'Login e senha são obrigatórios']));
}

$login = trim($dados['login']);
$senha = $dados['senha'];

// Rate limiting simples
$tentativas_key = 'login_tentativas_' . $_SERVER['REMOTE_ADDR'];
if (!isset($_SESSION[$tentativas_key])) {
    $_SESSION[$tentativas_key] = ['count' => 0, 'ultimo' => 0];
}

if ($_SESSION[$tentativas_key]['count'] >= 5 && 
    (time() - $_SESSION[$tentativas_key]['ultimo']) < 900) { // 15 minutos
    http_response_code(429);
    exit(json_encode(['erro' => 'Muitas tentativas. Tente novamente em 15 minutos.']));
}

// Verificar credenciais
$usuarios = USUARIOS_DASHBOARD;

if (!isset($usuarios[$login])) {
    // Registrar tentativa
    $_SESSION[$tentativas_key]['count']++;
    $_SESSION[$tentativas_key]['ultimo'] = time();
    
    http_response_code(401);
    exit(json_encode(['erro' => 'Credenciais inválidas']));
}

$usuario = $usuarios[$login];

if (!password_verify($senha, $usuario['senha_hash'])) {
    // Registrar tentativa
    $_SESSION[$tentativas_key]['count']++;
    $_SESSION[$tentativas_key]['ultimo'] = time();
    
    http_response_code(401);
    exit(json_encode(['erro' => 'Credenciais inválidas']));
}

// Login bem-sucedido
// Regenerar ID da sessão
session_regenerate_id(true);

// Resetar tentativas
unset($_SESSION[$tentativas_key]);

// Definir dados da sessão
$_SESSION['usuario_dashboard'] = [
    'login' => $login,
    'nome' => $usuario['nome'],
    'email' => $usuario['email'],
    'permissoes' => $usuario['permissoes']
];
$_SESSION['ultimo_acesso'] = time();
$_SESSION['token_csrf'] = bin2hex(random_bytes(32));

// Log de acesso
error_log("Dashboard - Login realizado: $login (" . $_SERVER['REMOTE_ADDR'] . ")");

echo json_encode([
    'sucesso' => true,
    'usuario' => [
        'nome' => $usuario['nome'],
        'email' => $usuario['email'],
        'permissoes' => $usuario['permissoes']
    ],
    'token_csrf' => $_SESSION['token_csrf']
]);