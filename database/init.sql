CREATE DATABASE coleta_db;

\c coleta_db;

-- Tabela de usuários
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de pedidos
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  supplier VARCHAR(255) NOT NULL,
  construction_site VARCHAR(255) NOT NULL,
  buyer VARCHAR(100) NOT NULL,
  order_date DATE NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  cost_center VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de motoboys
CREATE TABLE delivery_men (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  license_plate VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de rotas
CREATE TABLE routes (
  id SERIAL PRIMARY KEY,
  delivery_man_id INTEGER REFERENCES delivery_men(id),
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'planned',
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de relação entre rotas e pedidos
CREATE TABLE route_orders (
  id SERIAL PRIMARY KEY,
  route_id INTEGER REFERENCES routes(id),
  order_id INTEGER REFERENCES orders(id),
  sequence INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  collected_at TIMESTAMP
);

-- Tabela de localizações
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  delivery_man_id INTEGER REFERENCES delivery_men(id),
  route_id INTEGER REFERENCES routes(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir usuário admin padrão (senha: password)
INSERT INTO users (name, email, password, role) 
VALUES ('Administrador', 'admin@coleta.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Inserir alguns motoboys de exemplo
INSERT INTO delivery_men (name, phone, email, vehicle_type, license_plate) VALUES
('João Silva', '(11) 99999-9999', 'joao@empresa.com', 'Moto', 'ABC1D23'),
('Maria Santos', '(11) 98888-8888', 'maria@empresa.com', 'Moto', 'EFG4H56');