<?php
/**
 * registrar-clique.php - Endpoint para contagem de cliques em links principais do Hub de Links
 * Site do Everton Silva
 * 
 * Este script processa dados sobre os cliques realiados nos links principais do Hub de Links,
 * valida, sanitiza e armazena no banco de dados MySQL.
 * 
 * @author Jota / José Guilherme Pandolfi - Agência m2a
 * @version 1.0
 */

// Ativar exibição de erros para debug
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log de início da requisição
error_log('--- Início de requisição para registrar-clique.php ---');
error_log('Método: ' . $_SERVER['REQUEST_METHOD']);
error_log('Origem: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'Não definida'));

// Incluir arquivos de configuração e funções
require __DIR__ . '/config.php';
require __DIR__ . '/funcoes.php';

// Configurar CORS
header("Access-Control-Allow-Origin: https://evertonsilvaoficial.com.br");
header("Access-Control-Allow-Methods: POST, OPTIONS, GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Vary: Origin");

// Verificar se é uma requisição de debug
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['debug'])) {
    error_log("Requisição de debug recebida");
    // Verificar conexão com o banco
    try {
        $conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_NOME);
        if ($conexao->connect_error) {
            exit("Erro de conexão: " . $conexao->connect_error);
        }
        
        // Verificar tabela
        $resultado = $conexao->query("SELECT * FROM contagem_cliques_links LIMIT 1");
        if (!$resultado) {
            exit("Tabela não encontrada: " . $conexao->error);
        }
        
        echo "Conexão OK, tabela existe";
        $conexao->close();
    } catch (Exception $e) {
        echo "Erro: " . $e->getMessage();
    }
    exit;
}

// Responder às requisições de preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Validar método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['erro' => 'Método não permitido']));
}

// Log de conteúdo da requisição
$rawInput = file_get_contents('php://input');
error_log("Dados recebidos: " . $rawInput);

// Detectar formato de entrada e processar adequadamente
$dados = null;
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (strpos($contentType, 'application/json') !== false) {
    // Processar JSON
    $dados = json_decode($rawInput, true);
} else {
    // Tentar processar como string JSON puro (caso do sendBeacon)
    $dados = json_decode($rawInput, true);
    
    // Se falhar, tentar processar como form data
    if (json_last_error() !== JSON_ERROR_NONE) {
        parse_str($rawInput, $dados);
    }
}

error_log("Dados processados: " . print_r($dados, true));

// Validar dados
if (empty($dados) || !is_array($dados)) {
    http_response_code(400);
    error_log("Dados inválidos recebidos");
    exit(json_encode(['erro' => 'Dados inválidos']));
}

// Validar nome do link
if (empty($dados['link']) || !in_array($dados['link'], ['instagram', 'tiktok', 'youtube', 'whatsapp'])) {
    http_response_code(400);
    error_log("Link inválido: " . ($dados['link'] ?? 'não especificado'));
    exit(json_encode(['erro' => 'Link inválido']));
}

$nomeLink = sanitizarEntrada($dados['link']);
error_log("Link validado: $nomeLink");

try {
    // Conectar ao banco de dados
    $conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_NOME);
    
    if ($conexao->connect_error) {
        throw new Exception("Erro na conexão: " . $conexao->connect_error);
    }
    
    $conexao->set_charset("utf8mb4");
    error_log("Conexão com banco estabelecida");
    
    // Verificar se o registro existe primeiro
    $sqlVerificar = "SELECT COUNT(*) as total FROM contagem_cliques_links WHERE nome_link = ?";
    $stmtVerificar = $conexao->prepare($sqlVerificar);
    $stmtVerificar->bind_param('s', $nomeLink);
    $stmtVerificar->execute();
    $resultadoVerificar = $stmtVerificar->get_result();
    $dadosVerificar = $resultadoVerificar->fetch_assoc();
    
    // Se o registro não existe, crie-o
    if ($dadosVerificar['total'] == 0) {
        error_log("Registro não encontrado para $nomeLink, criando...");
        $sqlInsert = "INSERT INTO contagem_cliques_links (nome_link, total_cliques) VALUES (?, 1)";
        $stmtInsert = $conexao->prepare($sqlInsert);
        $stmtInsert->bind_param('s', $nomeLink);
        
        if (!$stmtInsert->execute()) {
            throw new Exception("Erro ao inserir registro: " . $stmtInsert->error);
        }
        
        error_log("Registro criado com sucesso");
        $stmtInsert->close();
    } else {
        // Atualizar contador
        error_log("Atualizando contador para $nomeLink");
        $sql = "UPDATE contagem_cliques_links SET total_cliques = total_cliques + 1 WHERE nome_link = ?";
        $stmt = $conexao->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Erro na preparação da query: " . $conexao->error);
        }
        
        $stmt->bind_param('s', $nomeLink);
        
        if (!$stmt->execute()) {
            throw new Exception("Erro ao atualizar contador: " . $stmt->error);
        }
        
        error_log("Contador atualizado com sucesso");
        $stmt->close();
    }
    
    // Responder com sucesso
    http_response_code(200);
    echo json_encode(['sucesso' => true, 'link' => $nomeLink]);
    error_log("Processamento concluído com sucesso para $nomeLink");
    
} catch (Exception $e) {
    error_log("ERRO: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao registrar clique', 'detalhes' => $e->getMessage()]);
} finally {
    if (isset($conexao)) {
        $conexao->close();
    }
}