ssh -i ~/.ssh/id_aipcore -o StrictHostKeyChecking=no root@86.107.77.240 "cd /root/aipcore && git pull origin main && docker compose build && docker compose up -d 2>&1 | tail -5"
