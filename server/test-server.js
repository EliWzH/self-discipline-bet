console.log('测试服务器启动中...');

const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'test works' });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`测试服务器运行在端口 ${PORT}`);
});

console.log('已调用 app.listen()');
