<?php
// funcoes.php - Funções utilitárias para o sistema de tracking

// Previne acesso direto
if (!defined('ACESSO_SEGURO')) {
    header('HTTP/1.1 403 Forbidden');
    exit('Acesso direto negado');
}

/**
 * Sanitiza dados de entrada
 */
function sanitizarEntrada($dado) {
    return htmlspecialchars(strip_tags(trim($dado)), ENT_QUOTES, 'UTF-8');
}

/**
 * Obtém o IP real do visitante
 */
function obterIPCliente() {
    $ip = $_SERVER['HTTP_CLIENT_IP'] ?? 
          $_SERVER['HTTP_X_FORWARDED_FOR'] ?? 
          $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '0.0.0.0';
}

/**
 * Obtém informações geográficas baseadas no IP
 * @param string $ip Endereço IP do visitante
 * @return array Informações geográficas (provedor, cidade, estado, país)
 */
function obterGeoInfoIP($ip) {
    // Valores padrão caso a consulta falhe
    $infoGeo = [
        'provedor' => 'Desconhecido',
        'cidade' => 'Desconhecida',
        'estado' => 'Desconhecido',
        'pais' => 'Desconhecido'
    ];
    
    try {
        // Opção 1: Usar IP-API.com (gratuito, limite de 45 requisições/minuto)
        $response = @file_get_contents("http://ip-api.com/json/{$ip}?fields=status,isp,city,regionName,country&lang=pt-BR");
        
        if ($response) {
            $data = json_decode($response, true);
            
            if ($data && $data['status'] === 'success') {
                $infoGeo = [
                    'provedor' => $data['isp'] ?? 'Desconhecido',
                    'cidade' => $data['city'] ?? 'Desconhecida',
                    'estado' => $data['regionName'] ?? 'Desconhecido',
                    'pais' => $data['country'] ?? 'Desconhecido'
                ];
            }
        }
        
        // Se estamos em desenvolvimento ou testando com localhost
        if ($ip === '127.0.0.1' || $ip === '::1' || $ip === 'localhost') {
            $infoGeo = [
                'provedor' => 'Desenvolvimento Local',
                'cidade' => 'Local',
                'estado' => 'Local',
                'pais' => 'Brasil'
            ];
        }
        
        // Log para debug (remover em produção)
        // error_log("Informações geográficas obtidas para IP {$ip}: " . json_encode($infoGeo));
        
    } catch (Exception $e) {
        // Log do erro, mas continua com os valores padrão
        error_log("Erro ao obter informações geográficas: " . $e->getMessage());
    }
    
    return $infoGeo;
}

/**
 * Envia notificação ao Discord para novos visitantes
 */
function enviarNotificacaoDiscordVisitante($dados) {
    $corMagenta = 14032980; // #D62454 em decimal
    
    $embed = [
        'title' => '🎵 Novo Visitante no Site do Everton Silva',
        'color' => $corMagenta,
        'fields' => [
            [
                'name' => '🆔 UUID',
                'value' => "`{$dados['uuid']}`",
                'inline' => false
            ],
            [
                'name' => '📍 Localização',
                'value' => "{$dados['cidade']}, {$dados['estado']}, {$dados['pais']}",
                'inline' => true
            ],
            [
                'name' => '📡 IP e Provedor',
                'value' => "`{$dados['ip']}`\n{$dados['provedor']}",
                'inline' => true
            ],
            [
                'name' => '💻 Dispositivo',
                'value' => "{$dados['marca_dispositivo']} ({$dados['sistema_operacional']})",
                'inline' => true
            ]
        ],
        'footer' => [
            'text' => "Registrado em: " . date('d/m/Y H:i:s')
        ]
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
            CURLOPT_URL => DISCORD_WEBHOOK_VISITANTES,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POSTFIELDS => json_encode($mensagem)
        ]);
        
        $resposta = curl_exec($ch);
        
        if (curl_errno($ch)) {
            error_log('Erro ao enviar notificação para o Discord: ' . curl_error($ch));
        }
        
        curl_close($ch);
    } catch (Exception $e) {
        error_log('Exceção ao enviar notificação para o Discord: ' . $e->getMessage());
    }
}

/**
 * Registrar acesso em log para debug
 * Útil durante implementação e testes
 */
function registrarLog($mensagem, $dados = []) {
    $timestamp = date('Y-m-d H:i:s');
    $dadosSerializados = !empty($dados) ? ' - ' . json_encode($dados) : '';
    $logMsg = "[{$timestamp}] {$mensagem}{$dadosSerializados}\n";
    
    // Defina um caminho seguro para o arquivo de log
    $arquivoLog = __DIR__ . '/../logs/tracking.log';
    
    // Crie o diretório se não existir
    $diretorioLog = dirname($arquivoLog);
    if (!is_dir($diretorioLog)) {
        mkdir($diretorioLog, 0755, true);
    }
    
    // Limite o tamanho do arquivo de log
    if (file_exists($arquivoLog) && filesize($arquivoLog) > 10485760) { // 10MB
        rename($arquivoLog, $arquivoLog . '.' . date('Y-m-d-H-i-s') . '.bak');
    }
    
    file_put_contents($arquivoLog, $logMsg, FILE_APPEND);
}