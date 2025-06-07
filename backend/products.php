<?php
require_once 'config.php';

$category_filter = isset($_GET['category']) ? trim($_GET['category']) : '';

try {
    $sql = "SELECT p.id, p.name, p.description, p.price, p.image_url, c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id";

    $params = [];
    if (!empty($category_filter) && $category_filter !== 'todos') { // 'todos' para mostrar tudo
        $sql .= " WHERE c.name = :category_name";
        $params[':category_name'] = $category_filter;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'products' => $products]);

} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Erro ao buscar produtos: ' . $e->getMessage()]);
}

unset($pdo);
?>