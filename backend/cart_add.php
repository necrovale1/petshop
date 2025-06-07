<?php
require_once 'config.php'; // Garante session_start()

$response = ['success' => false, 'message' => ''];

if (!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true) {
    $response['message'] = 'Você precisa estar logado para adicionar itens ao carrinho.';
    $response['redirect'] = 'login.html'; // Sugerir redirecionamento
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
    $quantity = isset($_POST['quantity']) ? intval($_POST['quantity']) : 1; // Default 1
    $user_id = $_SESSION['id'];

    if ($product_id > 0 && $quantity > 0) {
        try {
            // Verificar se o produto já está no carrinho para este usuário
            $sql_check = "SELECT id, quantity FROM cart WHERE user_id = :user_id AND product_id = :product_id";
            $stmt_check = $pdo->prepare($sql_check);
            $stmt_check->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt_check->bindParam(':product_id', $product_id, PDO::PARAM_INT);
            $stmt_check->execute();

            if ($stmt_check->rowCount() > 0) {
                // Produto já existe, atualizar quantidade
                $cart_item = $stmt_check->fetch(PDO::FETCH_ASSOC);
                $new_quantity = $cart_item['quantity'] + $quantity;
                $sql_update = "UPDATE cart SET quantity = :quantity WHERE id = :cart_id";
                $stmt_update = $pdo->prepare($sql_update);
                $stmt_update->bindParam(':quantity', $new_quantity, PDO::PARAM_INT);
                $stmt_update->bindParam(':cart_id', $cart_item['id'], PDO::PARAM_INT);
                if ($stmt_update->execute()) {
                    $response['success'] = true;
                    $response['message'] = 'Quantidade atualizada no carrinho!';
                } else {
                    $response['message'] = 'Erro ao atualizar quantidade no carrinho.';
                }
            } else {
                // Produto não existe, inserir novo
                $sql_insert = "INSERT INTO cart (user_id, product_id, quantity) VALUES (:user_id, :product_id, :quantity)";
                $stmt_insert = $pdo->prepare($sql_insert);
                $stmt_insert->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                $stmt_insert->bindParam(':product_id', $product_id, PDO::PARAM_INT);
                $stmt_insert->bindParam(':quantity', $quantity, PDO::PARAM_INT);

                if ($stmt_insert->execute()) {
                    $response['success'] = true;
                    $response['message'] = 'Produto adicionado ao carrinho!';
                } else {
                    $response['message'] = 'Erro ao adicionar produto ao carrinho.';
                }
            }
        } catch (PDOException $e) {
            $response['message'] = 'Erro no banco de dados: ' . $e->getMessage();
        }
    } else {
        $response['message'] = 'Dados do produto inválidos.';
    }
} else {
    $response['message'] = 'Método de requisição inválido.';
}

header('Content-Type: application/json');
echo json_encode($response);
unset($pdo);
?>