CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  supplier_code VARCHAR(10) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  coordinates GEOMETRY(POINT, 4326)
);

CREATE TABLE couriers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  cnh_number VARCHAR(20) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id) NOT NULL,
  total_value NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed')),
  authorization_date TIMESTAMP DEFAULT NOW(),
  email_body TEXT NOT NULL
);

CREATE TABLE routes (
  id SERIAL PRIMARY KEY,
  courier_id INTEGER REFERENCES couriers(id) NOT NULL,
  orders INTEGER[] NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);