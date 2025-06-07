<?php
// Iniciar sessão em todas as páginas que precisam dela
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

define('DB_SERVER', 'localhost'); // Ou o host do seu BD
define('DB_USERNAME', 'root');    // Seu usuário do BD
define('DB_PASSWORD', '');        // Sua senha do BD
define('DB_NAME', 'petshop');

// Tentar conectar ao banco de dados MySQL
try {
    $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_NAME, DB_USERNAME, DB_PASSWORD);
    // Definir o modo de erro PDO para exceção
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e){
    die("ERRO: Não foi possível conectar. " . $e->getMessage());
}
?>