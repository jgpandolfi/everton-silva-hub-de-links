<?php
// logout.php - Endpoint para logout

require_once 'config-auth.php';

header("Access-Control-Allow-Origin: https://evertonsilvaoficial.com.br");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['erro' => 'Método não permitido']));
}

// Log de logout
if (isset($_SESSION['usuario_dashboard'])) {
    $usuario = $_SESSION['usuario_dashboard']['login'];
    error_log("Dashboard - Logout realizado: $usuario (" . $_SERVER['REMOTE_ADDR'] . ")");
}

// Destruir sessão
session_unset();
session_destroy();

echo json_encode(['sucesso' => true]);