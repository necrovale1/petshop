CREATE DATABASE IF NOT EXISTS petshop;

USE petshop;

CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO `categories` (`name`) VALUES
('gato'),
('cachorro'),
('geral');

CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10, 2) NOT NULL,
  `image_url` VARCHAR(255),
  `category_id` INT,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
);

-- Categoria Gato (ID 1)
INSERT INTO `products` (`name`, `description`, `price`, `image_url`, `category_id`) VALUES
('Arranhador para Gatos Luxo', 'Arranhador alto com várias plataformas e brinquedos.', 129.90, 'images/arranhador_gato.jpg', 1),
('Ração Premium Gatos Castrados Sabor Salmão 1kg', 'Ração balanceada para gatos castrados, sabor salmão.', 59.90, 'images/racao_gato_salmao.jpg', 1),
('Brinquedo Varinha com Penas para Gatos', 'Estimula o instinto de caça do seu gato.', 19.99, 'images/varinha_gato.jpg', 1);

-- Categoria Cachorro (ID 2)
INSERT INTO `products` (`name`, `description`, `price`, `image_url`, `category_id`) VALUES
('Cama Ortopédica para Cachorros Grandes', 'Conforto máximo para o seu cão de porte grande.', 199.50, 'images/cama_cachorro_grande.jpg', 2),
('Ração Power Raças Pequenas Sabor Frango e Arroz 3kg', 'Nutrição completa para cães adultos de raças pequenas.', 75.00, 'images/racao_cachorro_pequeno.jpg', 2),
('Coleira Peitoral Anti-Puxão Ajustável', 'Mais controle e conforto nos passeios.', 89.90, 'images/coleira_cachorro.jpg', 2);

-- Categoria Geral (ID 3)
INSERT INTO `products` (`name`, `description`, `price`, `image_url`, `category_id`) VALUES
('Bebedouro Automático Fonte para Pets', 'Água fresca e corrente para cães e gatos.', 110.00, 'images/bebedouro_fonte.jpg', 3),
('Comedouro Duplo Inox Anti-Formiga', 'Prático e higiênico para água e ração.', 65.50, 'images/comedouro_duplo.jpg', 3),
('Tapete Higiênico Super Absorvente Pacote com 30', 'Mantém o ambiente limpo e sem odores.', 45.00, 'images/tapete_higienico.jpg', 3),
('Shampoo Neutro Hipoalergênico para Cães e Gatos 500ml', 'Limpeza suave sem agredir a pele.', 38.75, 'images/shampoo_neutro.jpg', 3);


CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL -- Store hashed passwords!
);

-- Senha para ambos: 'senha123' (deve ser hash na prática)
-- Hash para 'senha123' (exemplo, use password_hash() no PHP): '$2y$10$N9WOF0wo6kF/XJ0iXqXqMOu23qY50.Y2.kX5qK8r9p1Gk8i.lYq.G'
INSERT INTO `users` (`name`, `email`, `password`) VALUES
('Usuário Teste Um', 'teste1@example.com', '$2y$10$N9WOF0wo6kF/XJ0iXqXqMOu23qY50.Y2.kX5qK8r9p1Gk8i.lYq.G'),
('Usuário Teste Dois', 'teste2@example.com', '$2y$10$N9WOF0wo6kF/XJ0iXqXqMOu23qY50.Y2.kX5qK8r9p1Gk8i.lYq.G');

CREATE TABLE `cart` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `product_id` INT,
  `quantity` INT NOT NULL DEFAULT 1,
  `added_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
  UNIQUE KEY `user_product` (`user_id`, `product_id`) -- Prevents duplicate product entries for the same user
);

CREATE TABLE `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `order_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(50) DEFAULT 'Pendente', -- Ex: Pendente, Processando, Enviado, Concluído
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

CREATE TABLE `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT,
  `product_id` INT,
  `quantity` INT NOT NULL,
  `price_at_purchase` DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
);