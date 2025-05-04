<?php
/**
 * API para processamento do formulário de contato do Everton Silva
 * 
 * Este script processa dados do formulário e informações de rastreamento,
 * valida, sanitiza e armazena no banco de dados MySQL.
 * 
 * @author Jota / José Guilherme Pandolfi - Agência m2a
 * @version 1.0
 */

// Definir token de acesso seguro
define('ACESSO_SEGURO', true);

// Incluir arquivos necessários
require_once 'config.php';
require_once 'funcoes.php';

// Ativar exibição de erros para debug (remover em produção)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log de início da requisição
error_log('--- Início de requisição para processar-formulario.php ---');
error_log('Método: ' . $_SERVER['REQUEST_METHOD']);
error_log('Origem: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'Não definida'));

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

// Obter e decodificar dados JSON do corpo da requisição
$dadosJson = file_get_contents('php://input');
$dadosFormulario = json_decode($dadosJson, true);

// Log para debug
error_log("Dados recebidos: " . $dadosJson);

// Verificar se os dados foram recebidos corretamente
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    exit(json_encode(['erro' => 'Formato de dados inválido']));
}

// Validar campos obrigatórios
$camposObrigatorios = ['nome', 'email', 'telefone', 'cidade_informada', 'tipo_evento', 'mensagem'];
foreach ($camposObrigatorios as $campo) {
    if (empty($dadosFormulario[$campo])) {
        http_response_code(400);
        exit(json_encode(['erro' => "Campo obrigatório: $campo"]));
    }
}

// Sanitizar dados do formulário
$nome = sanitizarEntrada($dadosFormulario['nome']);
$email = sanitizarEntrada($dadosFormulario['email']);
$telefone = sanitizarEntrada($dadosFormulario['telefone']);
$cidadeInformada = sanitizarEntrada($dadosFormulario['cidade_informada']);
$dataEvento = !empty($dadosFormulario['data_evento']) ? $dadosFormulario['data_evento'] : null;
$tipoEvento = sanitizarEntrada($dadosFormulario['tipo_evento']);
$mensagem = sanitizarEntrada($dadosFormulario['mensagem']);

// Validar e-mail
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    exit(json_encode(['erro' => 'E-mail inválido']));
}

// Validar telefone
$telefoneLimpo = preg_replace('/\D/', '', $telefone);
if (strlen($telefoneLimpo) < 10 || strlen($telefoneLimpo) > 11) {
    http_response_code(400);
    exit(json_encode(['erro' => 'Telefone inválido']));
}

// Extrair e sanitizar parâmetros UTM
$utmSource = !empty($dadosFormulario['utm_source']) ? sanitizarEntrada($dadosFormulario['utm_source']) : '';
$utmMedium = !empty($dadosFormulario['utm_medium']) ? sanitizarEntrada($dadosFormulario['utm_medium']) : '';
$utmCampaign = !empty($dadosFormulario['utm_campaign']) ? sanitizarEntrada($dadosFormulario['utm_campaign']) : '';
$utmContent = !empty($dadosFormulario['utm_content']) ? sanitizarEntrada($dadosFormulario['utm_content']) : '';
$utmTerm = !empty($dadosFormulario['utm_term']) ? sanitizarEntrada($dadosFormulario['utm_term']) : '';

// Obter dados de rastreamento automáticos
$ipCliente = obterIPCliente();
$infoGeo = obterGeoInfoIP($ipCliente);
$ehMovel = isset($dadosFormulario['movel']) ? (int)$dadosFormulario['movel'] : 0;
$navegador = sanitizarEntrada($dadosFormulario['navegador'] ?? 'Desconhecido');
$sistema = sanitizarEntrada($dadosFormulario['sistema_operacional'] ?? 'Desconhecido');
$dispositivo = sanitizarEntrada($dadosFormulario['marca_dispositivo'] ?? 'Desconhecido');

try {
    $conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_NOME);
    
    if ($conexao->connect_error) {
        throw new Exception("Erro na conexão: " . $conexao->connect_error);
    }
    
    $conexao->set_charset("utf8mb4");
    error_log("Conexão com banco estabelecida");

    // Preparar a query SQL
    $sql = "INSERT INTO leads_formulario_contato (
        nome, email, telefone, cidade_informada, data_evento, tipo_evento, mensagem,
        ip, cidade, estado, pais, provedor,
        web_browser, sistema_operacional, marca_dispositivo, movel,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conexao->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Erro na preparação da query: " . $conexao->error);
    }
    
    $stmt->bind_param(
        'sssssssssssssssisssss',
        $nome,
        $email,
        $telefone,
        $cidadeInformada,
        $dataEvento,
        $tipoEvento,
        $mensagem,
        $ipCliente,
        $infoGeo['cidade'],
        $infoGeo['estado'],
        $infoGeo['pais'],
        $infoGeo['provedor'],
        $navegador,
        $sistema,
        $dispositivo,
        $ehMovel,
        $utmSource,
        $utmMedium,
        $utmCampaign,
        $utmContent,
        $utmTerm
    );

    if ($stmt->execute()) {
        error_log("Query executada com sucesso");
        
        // Dados para enviar ao Discord
        $dadosDiscord = [
            'nome' => $nome,
            'email' => $email,
            'telefone' => $telefone,
            'cidade_informada' => $cidadeInformada,
            'data_evento' => $dataEvento,
            'tipo_evento' => $tipoEvento,
            'mensagem' => $mensagem,
            'ip' => $ipCliente,
            'cidade' => $infoGeo['cidade'],
            'estado' => $infoGeo['estado'],
            'pais' => $infoGeo['pais'],
            'provedor' => $infoGeo['provedor'],
            'web_browser' => $navegador,
            'sistema_operacional' => $sistema,
            'marca_dispositivo' => $dispositivo,
            'movel' => $ehMovel,
            'utm_source' => $utmSource,
            'utm_medium' => $utmMedium,
            'utm_campaign' => $utmCampaign,
            'utm_content' => $utmContent,
            'utm_term' => $utmTerm
        ];
        
        // Enviar notificação ao Discord
        enviarNotificacaoDiscordFormulario($dadosDiscord);
        error_log("Notificação Discord enviada");
        
        http_response_code(200);
        echo json_encode(['sucesso' => true, 'mensagem' => 'Formulário enviado com sucesso!']);
    } else {
        throw new Exception("Erro na execução: " . $stmt->error);
    }
} catch (Exception $e) {
    error_log("Erro no processamento do formulário: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao processar formulário', 'detalhes' => $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conexao)) $conexao->close();
}

/**
 * Envia notificação ao Discord para novos contatos do formulário
 */
function enviarNotificacaoDiscordFormulario($dados) {
    $corMagenta = 14032980; // #D62454 em decimal
    
    $embed = [
        'title' => '📝 Novo Contato para Show - Site Everton Silva',
        'color' => $corMagenta,
        'fields' => [
            [
                'name' => '👤 Nome',
                'value' => $dados['nome'],
                'inline' => true
            ],
            [
                'name' => '📧 E-mail',
                'value' => $dados['email'],
                'inline' => true
            ],
            [
                'name' => '📱 Telefone',
                'value' => $dados['telefone'],
                'inline' => true
            ],
            [
                'name' => '📍 Cidade do Evento',
                'value' => $dados['cidade_informada'],
                'inline' => true
            ],
            [
                'name' => '📅 Data do Evento',
                'value' => $dados['data_evento'] ? date('d/m/Y', strtotime($dados['data_evento'])) : 'Não informada',
                'inline' => true
            ],
            [
                'name' => '🎵 Tipo de Evento',
                'value' => $dados['tipo_evento'],
                'inline' => true
            ],
            [
                'name' => '💬 Mensagem',
                'value' => $dados['mensagem'],
                'inline' => false
            ]
        ],
        'footer' => [
            'text' => "Registrado em: " . date('d/m/Y H:i:s')
        ]
    ];

    // Adicionar dados de localização
    $localizacao = "IP: `{$dados['ip']}`\n";
    $localizacao .= "Localização: {$dados['cidade']}, {$dados['estado']}, {$dados['pais']}\n";
    $localizacao .= "Dispositivo: {$dados['marca_dispositivo']} ({$dados['sistema_operacional']})";
    
    $embed['fields'][] = [
        'name' => '📱 Informações do Visitante',
        'value' => $localizacao,
        'inline' => false
    ];

    // Adicionar UTMs se existirem
    $utmFields = [];
    foreach (['source', 'medium', 'campaign', 'content', 'term'] as $utm) {
        if (!empty($dados["utm_$utm"])) {
            $utmFields[] = [
                'name' => "UTM $utm",
                'value' => $dados["utm_$utm"],
                'inline' => true
            ];
        }
    }
    
    if (!empty($utmFields)) {
        $embed['fields'] = array_merge($embed['fields'], $utmFields);
    }

    $mensagem = [
        'username' => 'Site Everton Silva',
        'avatar_url' => 'https://evertonsilvaoficial.com.br/assets/img/everton-silva-foto-perfil.webp',
        'embeds' => [$embed]
    ];

    try {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => DISCORD_WEBHOOK_LEADS,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POSTFIELDS => json_encode($mensagem)
        ]);
        
        $resposta = curl_exec($ch);
        error_log('Resposta do Discord: ' . $resposta);
        
        if (curl_errno($ch)) {
            error_log('Erro ao enviar notificação para o Discord: ' . curl_error($ch));
        }
        
        curl_close($ch);
    } catch (Exception $e) {
        error_log('Exceção ao enviar notificação para o Discord: ' . $e->getMessage());
    }
}