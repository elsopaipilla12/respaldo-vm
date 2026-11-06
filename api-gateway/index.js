const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// Habilitar CORS para que tu frontend en React pueda comunicarse sin bloqueos
app.use(cors());

// 1. Proxy hacia tu servicio de Reacciones
app.use('/api/reacciones', createProxyMiddleware({ 
    target: 'http://reaction-service.grupo-reacciones:8000', 
    changeOrigin: true, 
    // Al usar una función o reemplazar '^/', evitamos el problema del recorte de Express
    pathRewrite: () => '/api/v1/reactions'
}));
// 2. Proxy hacia el servicio de Búsqueda
app.use('/api/busqueda', createProxyMiddleware({ 
    target: 'http://search.grupo-busqueda-avanzada:8000', 
    changeOrigin: true,
    // Reescribe la ruta para que coincida con lo que espera su Nginx localmente
    pathRewrite: { '^/api/busqueda': '/api/v1/search' } 
}));

// 3. Proxy hacia el servicio de Gamificación
app.use('/api/gamificacion', createProxyMiddleware({ 
    target: 'http://gamification-api.grupo-gamificacion:8000', 
    changeOrigin: true,
    pathRewrite: { '^/api/gamificacion': '' }
}));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`API Gateway escuchando en el puerto ${PORT}`);
});