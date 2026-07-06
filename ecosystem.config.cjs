// =========================================================
// LUIOFFICE — pm2 설정
// 실행:  pm2 start ecosystem.config.cjs
//        pm2 save        (재부팅 후 자동 복원)
// 로그:  pm2 logs luioffice
// =========================================================
module.exports = {
  apps: [
    {
      name: 'luioffice',
      script: 'server.js',
      cwd: __dirname,
      env: {
        PORT: 9002,
        HOST: '127.0.0.1'   // Caddy 가 앞단에서 reverse_proxy 로 받음
      },
      autorestart: true,
      max_memory_restart: '150M'
    }
  ]
};
