Развёртывание:   node deploy/deploy.js   (запускать из этой папки)
Откат:           node deploy/rollback.js
Экземпляры:      node scale/cluster.js 3
Балансировщик:   node scale/balancer.js 3001 3002 3003
Нагрузка:        node scale/load.js http://localhost:8080/api/heavy 20 8

Папка server-sim появится после первого развёртывания — это ваш «сервер».
