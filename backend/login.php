<?php
require_once 'config.php'; // Garante que a sessão seja iniciada

$response = ['success' => false, 'message' => '', 'user' => null];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST['email']);
    $password = trim($_POST['password']);

    if (empty($email) || empty($password)) {
        $response['message'] = 'Por favor, preencha o e-mail e a senha.';
    } else {
        $sql = "SELECT id, name, email, password FROM users WHERE email = :email";
        if ($stmt = $pdo->prepare($sql)) {
            $stmt->bindParam(":email", $email, PDO::PARAM_STR);
            if ($stmt->execute()) {
                if ($stmt->rowCount() == 1) {
                    if ($row = $stmt->fetch()) {
                        $id = $row["id"];
                        $name = $row["name"];
                        $hashed_password_from_db = $row["password"];

                        if (password_verify($password, $hashed_password_from_db)) {
                            // Senha correta, iniciar sessão
                            $_SESSION["loggedin"] = true;
                            $_SESSION["id"] = $id;
                            $_SESSION["name"] = $name;
                            $_SESSION["email"] = $email;

                            $response['success'] = true;
                            $response['message'] = 'Login bem-sucedido!';
                            $response['user'] = ['id' => $id, 'name' => $name, 'email' => $email];
                        } else {
                            $response['message'] = 'A senha que você digitou não é válida.';
                        }
                    }
                } else {
                    $response['message'] = 'Nenhuma conta encontrada com esse e-mail.';
                }
            } else {
                $response['message'] = 'Ops! Algo deu errado. Por favor, tente novamente mais tarde.';
            }
            unset($stmt);
        }
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}
// header('Location: ../frontend/login.html');
// exit;
?>