<?php
require_once 'config.php';

$response = ['success' => false, 'message' => ''];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = trim($_POST['name']);
    $email = trim($_POST['email']);
    $password = trim($_POST['password']);
    $confirm_password = trim($_POST['confirm_password']);

    if (empty($name) || empty($email) || empty($password) || empty($confirm_password)) {
        $response['message'] = 'Por favor, preencha todos os campos.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response['message'] = 'Formato de e-mail inválido.';
    } elseif ($password !== $confirm_password) {
        $response['message'] = 'As senhas não coincidem.';
    } elseif (strlen($password) < 6) {
        $response['message'] = 'A senha deve ter pelo menos 6 caracteres.';
    } else {
        // Verificar se o e-mail já existe
        $sql_check_email = "SELECT id FROM users WHERE email = :email";
        if ($stmt_check = $pdo->prepare($sql_check_email)) {
            $stmt_check->bindParam(":email", $email, PDO::PARAM_STR);
            if ($stmt_check->execute()) {
                if ($stmt_check->rowCount() == 1) {
                    $response['message'] = 'Este e-mail já está cadastrado.';
                } else {
                    // Hash da senha
                    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
                    $sql_insert_user = "INSERT INTO users (name, email, password) VALUES (:name, :email, :password)";
                    if ($stmt_insert = $pdo->prepare($sql_insert_user)) {
                        $stmt_insert->bindParam(":name", $name, PDO::PARAM_STR);
                        $stmt_insert->bindParam(":email", $email, PDO::PARAM_STR);
                        $stmt_insert->bindParam(":password", $hashed_password, PDO::PARAM_STR);

                        if ($stmt_insert->execute()) {
                            $response['success'] = true;
                            $response['message'] = 'Cadastro realizado com sucesso! Você pode fazer login agora.';
                        } else {
                            $response['message'] = 'Ops! Algo deu errado. Por favor, tente novamente mais tarde.';
                        }
                        unset($stmt_insert);
                    }
                }
            } else {
                $response['message'] = 'Ops! Algo deu errado na verificação do e-mail.';
            }
            unset($stmt_check);
        }
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}
// Se não for POST, redireciona ou mostra um erro
// Para este exemplo, vamos apenas sair se não for uma requisição POST válida para o script.
// header('Location: ../frontend/register.html');
// exit;
?>