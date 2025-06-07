<?php
require_once 'config.php'; // Garante session_start()

header('Content-Type: application/json');

if (!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true) {
    echo json_encode(['success' => false, 'message' => 'Acesso negado. Faça login para continuar.', 'redirect' => 'login.html']);
    exit;
}

// Se logado, pode retornar informações do usuário ou do carrinho para preencher o checkout
// Por agora, apenas confirmamos o acesso.
echo json_encode(['success' => true, 'message' => 'Acesso permitido.']);
?>