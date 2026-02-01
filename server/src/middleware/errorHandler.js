exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: errors.join(', ') });
  }

  // Mongoose 重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ error: `${field} 已存在` });
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: '无效的令牌' });
  }

  // 默认错误
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误'
  });
};
