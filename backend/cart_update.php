<?php
require_once 'config.php';

header('Content-Type: application/json');
$response = ['success' => false, 'message' => ''];

if (!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true) {
    $response['message'] = 'Sessão expirada. Faça login novamente.';
    echo json_encode($response);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
    $quantity = isset($_POST['quantity']) ? intval($_POST['quantity']) : 0;
    $user_id = $_SESSION['id'];

    if ($product_id <= 0) {
        $response['message'] = 'ID do produto inválido.';
        echo json_encode($response);
        exit;
    }

    try {
        // Se a quantidade for 0 ou menor, remove o item do carrinho
        if ($quantity <= 0) {
            $sql = "DELETE FROM cart WHERE user_id = :user_id AND product_id = :product_id";
            $stmt = $pdo->prepare($sql);
        } else {
            // Caso contrário, atualiza a quantidade
            $sql = "UPDATE cart SET quantity = :quantity WHERE user_id = :user_id AND product_id = :product_id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':quantity', $quantity, PDO::PARAM_INT);
        }

        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);

        if ($stmt->execute()) {
            $response['success'] = true;
        } else {
            $response['message'] = 'Não foi possível atualizar o carrinho.';
        }
    } catch (PDOException $e) {
        $response['message'] = 'Erro no banco de dados: ' . $e->getMessage();
    }
} else {
    $response['message'] = 'Método de requisição inválido.';
}

echo json_encode($response);
unset($pdo);
?>