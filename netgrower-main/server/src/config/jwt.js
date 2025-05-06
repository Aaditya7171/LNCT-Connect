// Central configuration for JWT
module.exports = {
  secret: process.env.JWT_SECRET || '992f26e6d5a978bc559892942aeb66d573c4c38877823f64f104c925784f73a6',
  expiresIn: '7d'
};