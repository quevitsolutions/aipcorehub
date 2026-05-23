DELETE FROM users WHERE wallet_address ~ '^0x0{25,}' RETURNING id, wallet_address, node_id;
