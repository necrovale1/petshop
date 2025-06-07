<?php
require_once 'config.php';

$response = ['success' => false, 'message' => ''];

if (!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true) {
    $response['message'] = 'Você precisa estar logado para modificar o carrinho.';
    $response['redirect'] = 'login.html';
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") { // Ou GET se preferir para remoção simples
    $product_id_to_remove = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0; // ou $_GET
    $user_id = $_SESSION['id'];

    if ($product_id_to_remove > 0) {
        try {
            $sql = "DELETE FROM cart WHERE user_id = :user_id AND product_id = :product_id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->bindParam(':product_id', $product_id_to_remove, PDO::PARAM_INT);

            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {
                    $response['success'] = true;
                    $response['message'] = 'Produto removido do carrinho!';
                } else {
                    $response['message'] = 'Produto não encontrado no carrinho ou já removido.';
                }
            } else {
                $response['message'] = 'Erro ao remover produto do carrinho.';
            }
        } catch (PDOException $e) {
            $response['message'] = 'Erro no banco de dados: ' . $e->getMessage();
        }
    } else {
        $response['message'] = 'ID do produto inválido.';
    }
} else {
    $response['message'] = 'Método de requisição inválido.';
}

header('Content-Type: application/json');
echo json_encode($response);
unset($pdo);
?>