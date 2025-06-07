<?php
require_once 'config.php';

$response = ['success' => false, 'message' => ''];

if (!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true) {
    $response['message'] = 'Você precisa estar logado para finalizar a compra.';
    $response['redirect'] = 'login.html';
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $user_id = $_SESSION['id'];
    // Aqui você receberia dados do formulário de checkout (endereço, pagamento, etc.)
    // $address = $_POST['address'];
    // $payment_method = $_POST['payment_method'];

    try {
        $pdo->beginTransaction(); // Iniciar transação

        // 1. Buscar itens do carrinho e calcular total
        $sql_cart = "SELECT p.id as product_id, p.price, c.quantity
                     FROM cart c
                     JOIN products p ON c.product_id = p.id
                     WHERE c.user_id = :user_id";
        $stmt_cart = $pdo->prepare($sql_cart);
        $stmt_cart->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt_cart->execute();
        $cart_items = $stmt_cart->fetchAll(PDO::FETCH_ASSOC);

        if (count($cart_items) == 0) {
            $response['message'] = 'Seu carrinho está vazio. Não é possível finalizar a compra.';
            $pdo->rollBack();
            header('Content-Type: application/json');
            echo json_encode($response);
            exit;
        }

        $total_amount = 0;
        foreach ($cart_items as $item) {
            $total_amount += $item['price'] * $item['quantity'];
        }

        // 2. Criar o pedido na tabela `orders`
        $sql_order = "INSERT INTO orders (user_id, total_amount, status) VALUES (:user_id, :total_amount, 'Pendente')";
        $stmt_order = $pdo->prepare($sql_order);
        $stmt_order->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt_order->bindParam(':total_amount', $total_amount, PDO::PARAM_STR);
        $stmt_order->execute();
        $order_id = $pdo->lastInsertId(); // Pegar o ID do pedido recém-criado

        // 3. Inserir itens do pedido na tabela `order_items`
        $sql_order_item = "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
                           VALUES (:order_id, :product_id, :quantity, :price_at_purchase)";
        $stmt_order_item = $pdo->prepare($sql_order_item);

        foreach ($cart_items as $item) {
            $stmt_order_item->bindParam(':order_id', $order_id, PDO::PARAM_INT);
            $stmt_order_item->bindParam(':product_id', $item['product_id'], PDO::PARAM_INT);
            $stmt_order_item->bindParam(':quantity', $item['quantity'], PDO::PARAM_INT);
            $stmt_order_item->bindParam(':price_at_purchase', $item['price'], PDO::PARAM_STR);
            $stmt_order_item->execute();
        }

        // 4. Limpar o carrinho do usuário
        $sql_clear_cart = "DELETE FROM cart WHERE user_id = :user_id";
        $stmt_clear_cart = $pdo->prepare($sql_clear_cart);
        $stmt_clear_cart->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt_clear_cart->execute();

        $pdo->commit(); // Confirmar transação

        $response['success'] = true;
        $response['message'] = 'Pedido realizado com sucesso! ID do Pedido: ' . $order_id;
        // $_SESSION['last_order_id'] = $order_id; // Opcional: para mostrar na página de confirmação

    } catch (PDOException $e) {
        $pdo->rollBack(); // Desfazer transação em caso de erro
        $response['message'] = 'Erro ao processar o pedido: ' . $e->getMessage();
    }
} else {
    $response['message'] = 'Método de requisição inválido.';
}

header('Content-Type: application/json');
echo json_encode($response);
unset($pdo);
?>