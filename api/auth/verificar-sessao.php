<?php
// verificar-sessao.php - Middleware para verificar autenticação

require_once 'config-auth.php';

header("Access-Control-Allow-Origin: https://evertonsilvaoficial.com.br");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if (!verificarAutenticacao()) {
    http_response_code(401);
    exit(json_encode(['erro' => 'Não autenticado']));
}

echo json_encode([
    'sucesso' => true,
    'usuario' => $_SESSION['usuario_dashboard'],
    'token_csrf' => $_SESSION['token_csrf'] ?? ''
]);