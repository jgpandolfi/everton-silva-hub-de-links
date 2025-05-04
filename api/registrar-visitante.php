<?php
/**
 * registrar-visitante.php - Endpoint para registro de visitantes
 * Site do Everton Silva
 */

// Ativar exibição de erros para debug (remover em produção)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log de início da requisição
error_log('--- Início de requisição para registrar-visitante.php ---');
error_log('Método: ' . $_SERVER['REQUEST_METHOD']);
error_log('Origem: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'Não definida'));

// Inclui arquivos de configuração e funções
require __DIR__ . '/config.php';
require __DIR__ . '/funcoes.php';

// Configurar CORS
header("Access-Control-Allow-Origin: https://evertonsilvaoficial.com.br");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Vary: Origin");

// Responder às requisições de preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Validar método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['erro' => 'Método não permitido']));
}

// Validar origem da requisição (segurança adicional)
$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!empty($origem) && strpos($origem, 'evertonsilvaoficial.com.br') === false) {
    error_log("Origem bloqueada: $origem");
    http_response_code(403);
    exit(json_encode(['erro' => 'Origem não permitida']));
}

// Log para debug
error_log("Requisição recebida de: " . $_SERVER['REMOTE_ADDR']);

// Processar dados
$dadosJson = file_get_contents('php://input');
$dados = json_decode($dadosJson, true);

// Log para debug
error_log("Dados recebidos: " . $dadosJson);

// Validar dados
if (empty($dados['uuid'])) {
    http_response_code(400);
    exit(json_encode(['erro' => 'UUID é obrigatório']));
}

// Sanitizar dados
$campos = [
    'uuid' => $dados['uuid'],
    'novo_visitante' => $dados['novo_visitante'] ?? 0,
    'dimensao_tela' => sanitizarEntrada($dados['dimensao_tela'] ?? ''),
    'referrer' => sanitizarEntrada($dados['referrer'] ?? ''),
    'total_cliques' => (int)($dados['total_cliques'] ?? 0),
    'cliques_elementos_clicaveis' => (int)($dados['cliques_elementos_clicaveis'] ?? 0),
    'duracao_sessao' => (int)($dados['duracao_sessao'] ?? 0)
];

// Obter dados de navegador (verificar se existem ou definir valores padrão)
$navegador = sanitizarEntrada($dados['navegador'] ?? 'Desconhecido');
$sistema = sanitizarEntrada($dados['sistema_operacional'] ?? 'Desconhecido');
$dispositivo = sanitizarEntrada($dados['marca_dispositivo'] ?? 'Desconhecido');
$movel = isset($dados['movel']) ? (int)$dados['movel'] : 0;

// Dados UTM
$utm_source = sanitizarEntrada($dados['utm_source'] ?? '');
$utm_medium = sanitizarEntrada($dados['utm_medium'] ?? '');
$utm_campaign = sanitizarEntrada($dados['utm_campaign'] ?? '');
$utm_content = sanitizarEntrada($dados['utm_content'] ?? '');
$utm_term = sanitizarEntrada($dados['utm_term'] ?? '');

// Obter dados automáticos
$ip = obterIPCliente();
$infoGeo = obterGeoInfoIP($ip);

try {
    $conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_NOME);
    
    if ($conexao->connect_error) {
        throw new Exception("Erro na conexão: " . $conexao->connect_error);
    }
    
    $conexao->set_charset("utf8mb4");
    error_log("Conexão com banco estabelecida");

    $sql = "INSERT INTO visitantes_website (
        uuid, novo_visitante, ip, provedor, cidade, estado, pais,
        web_browser, sistema_operacional, marca_dispositivo, movel,
        dimensao_tela, referrer, utm_source, utm_medium, utm_campaign,
        utm_content, utm_term, total_cliques, cliques_elementos_clicaveis, duracao_sessao
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
        ip = VALUES(ip),
        provedor = VALUES(provedor),
        cidade = VALUES(cidade),
        estado = VALUES(estado),
        pais = VALUES(pais),
        web_browser = VALUES(web_browser),
        sistema_operacional = VALUES(sistema_operacional),
        marca_dispositivo = VALUES(marca_dispositivo), 
        movel = VALUES(movel),
        dimensao_tela = VALUES(dimensao_tela),
        referrer = VALUES(referrer),
        utm_source = VALUES(utm_source),
        utm_medium = VALUES(utm_medium),
        utm_campaign = VALUES(utm_campaign),
        utm_content = VALUES(utm_content),
        utm_term = VALUES(utm_term),
        total_cliques = total_cliques + VALUES(total_cliques),
        cliques_elementos_clicaveis = cliques_elementos_clicaveis + VALUES(cliques_elementos_clicaveis),
        duracao_sessao = duracao_sessao + VALUES(duracao_sessao)";    

    $stmt = $conexao->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Erro na preparação da query: " . $conexao->error);
    }
    
    $stmt->bind_param(
        'sissssssssississssiii',
        $campos['uuid'],
        $campos['novo_visitante'],
        $ip,
        $infoGeo['provedor'],
        $infoGeo['cidade'],
        $infoGeo['estado'],
        $infoGeo['pais'],
        $navegador,
        $sistema,
        $dispositivo,
        $movel,
        $campos['dimensao_tela'],
        $campos['referrer'],
        $utm_source,
        $utm_medium,
        $utm_campaign,
        $utm_content,
        $utm_term,
        $campos['total_cliques'],
        $campos['cliques_elementos_clicaveis'],
        $campos['duracao_sessao']
    );    

    if ($stmt->execute()) {
        error_log("Query executada com sucesso");
        
        // Enviar notificação para o Discord (apenas para novos visitantes)
        if ($campos['novo_visitante']) {
            $dadosDiscord = array_merge($campos, $infoGeo, [
                'ip' => $ip,
                'web_browser' => $navegador,
                'sistema_operacional' => $sistema,
                'marca_dispositivo' => $dispositivo,
                'movel' => $movel,
                'utm_source' => $utm_source,
                'utm_medium' => $utm_medium,
                'utm_campaign' => $utm_campaign,
                'utm_content' => $utm_content,
                'utm_term' => $utm_term
            ]);
            
            enviarNotificacaoDiscordVisitante($dadosDiscord);
            error_log("Notificação Discord enviada");
        }
        
        http_response_code(200);
        echo json_encode(['sucesso' => true, 'mensagem' => 'Visitante registrado com sucesso']);
    } else {
        throw new Exception("Erro na execução: " . $stmt->error);
    }
} catch (Exception $e) {
    error_log("Erro no registro de visitante: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao registrar visitante', 'detalhes' => $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conexao)) $conexao->close();
}