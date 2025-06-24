<?php
require_once 'config.php';

header('Content-Type: application/json');
$response = ['success' => false, 'orders' => [], 'message' => ''];

if (!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true) {
    $response['message'] = 'Você precisa estar logado para ver seu histórico.';
    $response['redirect'] = 'login.html';
    echo json_encode($response);
    exit;
}

$user_id = $_SESSION['id'];

try {
    // 1. Buscar todos os pedidos do usuário
    $sql_orders = "SELECT id, total_amount, order_date, status FROM orders WHERE user_id = :user_id ORDER BY order_date DESC";
    $stmt_orders = $pdo->prepare($sql_orders);
    $stmt_orders->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt_orders->execute();
    $orders = $stmt_orders->fetchAll(PDO::FETCH_ASSOC);

    $response_orders = [];

    // 2. Para cada pedido, buscar os itens correspondentes
    $sql_items = "SELECT oi.quantity, oi.price_at_purchase, p.name as product_name, p.image_url 
                  FROM order_items oi 
                  JOIN products p ON oi.product_id = p.id 
                  WHERE oi.order_id = :order_id";
    $stmt_items = $pdo->prepare($sql_items);

    foreach ($orders as $order) {
        $stmt_items->bindParam(':order_id', $order['id'], PDO::PARAM_INT);
        $stmt_items->execute();
        $items = $stmt_items->fetchAll(PDO::FETCH_ASSOC);
        $order['items'] = $items;
        $response_orders[] = $order;
    }

    $response['success'] = true;
    $response['orders'] = $response_orders;

} catch (PDOException $e) {
    $response['message'] = 'Erro ao buscar o histórico de pedidos: ' . $e->getMessage();
}

echo json_encode($response);
unset($pdo);
?>