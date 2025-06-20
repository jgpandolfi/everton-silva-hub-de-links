<?php
// leads.php - API para dados de leads do formulário

require_once '../auth/config-auth.php';
require_once '../config.php';
require_once '../funcoes.php';

if (!verificarAutenticacao()) {
    http_response_code(401);
    exit(json_encode(['erro' => 'Não autenticado']));
}

if (!verificarPermissao('visualizar')) {
    http_response_code(403);
    exit(json_encode(['erro' => 'Sem permissão']));
}

header("Access-Control-Allow-Origin: https://evertonsilvaoficial.com.br");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit(json_encode(['erro' => 'Método não permitido']));
}

// Parâmetros
$pagina = max(1, (int)($_GET['pagina'] ?? 1));
$limite = min(100, max(10, (int)($_GET['limite'] ?? 20)));
$offset = ($pagina - 1) * $limite;

$data_inicio = $_GET['data_inicio'] ?? date('Y-m-01');
$data_fim = $_GET['data_fim'] ?? date('Y-m-d');
$filtro_tipo = $_GET['tipo_evento'] ?? '';

try {
    $conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_NOME);
    
    if ($conexao->connect_error) {
        throw new Exception("Erro na conexão: " . $conexao->connect_error);
    }
    
    $conexao->set_charset("utf8mb4");
    
    // Construir WHERE clause
    $where_conditions = ["DATE(data_criacao) BETWEEN ? AND ?"];
    $params = [$data_inicio, $data_fim];
    $param_types = 'ss';
    
    if (!empty($filtro_tipo)) {
        $where_conditions[] = "tipo_evento = ?";
        $params[] = $filtro_tipo;
        $param_types .= 's';
    }
    
    $where_clause = implode(' AND ', $where_conditions);
    
    // Contar total
    $sql_count = "SELECT COUNT(*) as total FROM leads_formulario_contato WHERE $where_clause";
    $stmt = $conexao->prepare($sql_count);
    $stmt->bind_param($param_types, ...$params);
    $stmt->execute();
    $total_registros = $stmt->get_result()->fetch_assoc()['total'];
    
    // Buscar leads
    $sql_leads = "
        SELECT 
            id,
            nome,
            email,
            telefone,
            cidade_informada,
            data_evento,
            tipo_evento,
            mensagem,
            cidade,
            estado,
            pais,
            utm_source,
            utm_medium,
            utm_campaign,
            data_criacao
        FROM leads_formulario_contato 
        WHERE $where_clause
        ORDER BY data_criacao DESC
        LIMIT ? OFFSET ?";
    
    $params[] = $limite;
    $params[] = $offset;
    $param_types .= 'ii';
    
    $stmt = $conexao->prepare($sql_leads);
    $stmt->bind_param($param_types, ...$params);
    $stmt->execute();
    $resultado = $stmt->get_result();
    
    $leads = [];
    while ($row = $resultado->fetch_assoc()) {
        $leads[] = $row;
    }
    
    echo json_encode([
        'sucesso' => true,
        'leads' => $leads,
        'paginacao' => [
            'pagina_atual' => $pagina,
            'limite' => $limite,
            'total_registros' => $total_registros,
            'total_paginas' => ceil($total_registros / $limite)
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Erro na API de leads: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno do servidor']);
} finally {
    if (isset($conexao)) {
        $conexao->close();
    }
}