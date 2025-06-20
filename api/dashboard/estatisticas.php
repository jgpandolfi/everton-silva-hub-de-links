<?php
// estatisticas.php - API para estatísticas gerais do dashboard

require_once '../auth/config-auth.php';
require_once '../config.php';
require_once '../funcoes.php';

// Verificar autenticação
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

// Obter parâmetros de filtro
$data_inicio = $_GET['data_inicio'] ?? date('Y-m-01'); // Primeiro dia do mês atual
$data_fim = $_GET['data_fim'] ?? date('Y-m-d'); // Hoje

try {
    $conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_NOME);
    
    if ($conexao->connect_error) {
        throw new Exception("Erro na conexão: " . $conexao->connect_error);
    }
    
    $conexao->set_charset("utf8mb4");
    
    // Estatísticas de visitantes
    $sql_visitantes = "
        SELECT 
            COUNT(*) as total_visitantes,
            COUNT(DISTINCT ip) as visitantes_unicos,
            SUM(novo_visitante) as novos_visitantes,
            SUM(total_cliques) as total_cliques,
            SUM(duracao_sessao) as duracao_total,
            AVG(duracao_sessao) as duracao_media
        FROM visitantes_website 
        WHERE DATE(data_criacao) BETWEEN ? AND ?";
    
    $stmt = $conexao->prepare($sql_visitantes);
    $stmt->bind_param('ss', $data_inicio, $data_fim);
    $stmt->execute();
    $estatisticas_visitantes = $stmt->get_result()->fetch_assoc();
    
    // Estatísticas de leads
    $sql_leads = "
        SELECT 
            COUNT(*) as total_leads,
            COUNT(DISTINCT email) as emails_unicos,
            tipo_evento,
            COUNT(*) as quantidade
        FROM leads_formulario_contato 
        WHERE DATE(data_criacao) BETWEEN ? AND ?
        GROUP BY tipo_evento";
    
    $stmt = $conexao->prepare($sql_leads);
    $stmt->bind_param('ss', $data_inicio, $data_fim);
    $stmt->execute();
    $resultado_leads = $stmt->get_result();
    
    $estatisticas_leads = ['total_leads' => 0, 'emails_unicos' => 0, 'por_tipo' => []];
    while ($row = $resultado_leads->fetch_assoc()) {
        $estatisticas_leads['total_leads'] += $row['quantidade'];
        $estatisticas_leads['por_tipo'][] = [
            'tipo' => $row['tipo_evento'],
            'quantidade' => $row['quantidade']
        ];
    }
    
    // Total de emails únicos
    $sql_emails_unicos = "
        SELECT COUNT(DISTINCT email) as emails_unicos
        FROM leads_formulario_contato 
        WHERE DATE(data_criacao) BETWEEN ? AND ?";
    
    $stmt = $conexao->prepare($sql_emails_unicos);
    $stmt->bind_param('ss', $data_inicio, $data_fim);
    $stmt->execute();
    $estatisticas_leads['emails_unicos'] = $stmt->get_result()->fetch_assoc()['emails_unicos'];
    
    // Estatísticas de cliques
    $sql_cliques = "SELECT nome_link, total_cliques FROM contagem_cliques_links ORDER BY total_cliques DESC";
    $resultado_cliques = $conexao->query($sql_cliques);
    
    $estatisticas_cliques = [];
    while ($row = $resultado_cliques->fetch_assoc()) {
        $estatisticas_cliques[] = $row;
    }
    
    // Visitantes por dia (últimos 30 dias)
    $sql_visitantes_dia = "
        SELECT 
            DATE(data_criacao) as data,
            COUNT(*) as total,
            SUM(novo_visitante) as novos
        FROM visitantes_website 
        WHERE DATE(data_criacao) BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND CURDATE()
        GROUP BY DATE(data_criacao)
        ORDER BY data ASC";
    
    $resultado_visitantes_dia = $conexao->query($sql_visitantes_dia);
    $visitantes_por_dia = [];
    while ($row = $resultado_visitantes_dia->fetch_assoc()) {
        $visitantes_por_dia[] = $row;
    }
    
    // Top países
    $sql_paises = "
        SELECT 
            pais,
            COUNT(*) as quantidade
        FROM visitantes_website 
        WHERE DATE(data_criacao) BETWEEN ? AND ?
        AND pais != 'Desconhecido'
        GROUP BY pais
        ORDER BY quantidade DESC
        LIMIT 10";
    
    $stmt = $conexao->prepare($sql_paises);
    $stmt->bind_param('ss', $data_inicio, $data_fim);
    $stmt->execute();
    $resultado_paises = $stmt->get_result();
    
    $top_paises = [];
    while ($row = $resultado_paises->fetch_assoc()) {
        $top_paises[] = $row;
    }
    
    $resposta = [
        'sucesso' => true,
        'periodo' => [
            'inicio' => $data_inicio,
            'fim' => $data_fim
        ],
        'visitantes' => $estatisticas_visitantes,
        'leads' => $estatisticas_leads,
        'cliques' => $estatisticas_cliques,
        'visitantes_por_dia' => $visitantes_por_dia,
        'top_paises' => $top_paises
    ];
    
    echo json_encode($resposta);
    
} catch (Exception $e) {
    error_log("Erro na API de estatísticas: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno do servidor']);
} finally {
    if (isset($conexao)) {
        $conexao->close();
    }
}