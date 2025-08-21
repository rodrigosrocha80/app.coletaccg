DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer VARCHAR(255),
    value DECIMAL(10,2),
    address TEXT,
    phone VARCHAR(50),
    email_content TEXT,
    email_subject VARCHAR(500),
    email_from VARCHAR(255),
    email_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pendente',
    fornecedor VARCHAR(255),
    obra VARCHAR(255),
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);