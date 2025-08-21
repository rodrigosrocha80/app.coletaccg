SELECT data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'status';