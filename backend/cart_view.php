<?php
require_once 'config.php';

$response = ['success' => false, 'cart_items' => [], 'total' => 0, 'message' => ''];

if (!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true) {
    $response['message'] = 'Você precisa estar logado para ver o carrinho.';
    $response['redirect'] = 'login.html';
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

$user_id = $_SESSION['id'];
$cart_items = [];
$total_price = 0;

try {
    $sql = "SELECT p.id as product_id, p.name, p.price, p.image_url, c.quantity, (p.price * c.quantity) as subtotal
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = :user_id";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $cart_items[] = $row;
            $total_price += $row['subtotal'];
        }
        $response['success'] = true;
        $response['cart_items'] = $cart_items;
        $response['total'] = number_format($total_price, 2, '.', '');
    } else {
        $response['success'] = true; // Sucesso, mas carrinho vazio
        $response['message'] = 'Seu carrinho está vazio.';
    }

} catch (PDOException $e) {
    $response['message'] = 'Erro ao buscar itens do carrinho: ' . $e->getMessage();
}

header('Content-Type: application/json');
echo json_encode($response);
unset($pdo);
?>