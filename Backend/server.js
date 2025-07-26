require('dotenv').config(); // Para variables de entorno
const express = require('express');
const cors = require('cors');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();

// Configuración CORS para producción y desarrollo
const corsOptions = {
  origin: [
    'https://colchonqn.netlify.app', // URL de frontend en producción
    'http://localhost:3000',           // Frontend local
    'http://localhost:4000'            // Backend local
  ],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware para logging de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Convertir el Excel a JSON en memoria al iniciar (mejor performance)
let productosData = [];
try {
  const filePath = path.join(__dirname, 'precios_colchones.xlsx');
  console.log("Cargando datos desde:", filePath);
  
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  productosData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  console.log(`✅ Datos precargados: ${productosData.length} productos`);
} catch (error) {
  console.error("❌ Error al cargar el archivo Excel:", error);
  process.exit(1);
}

// Ruta de prueba
app.get('/test', (req, res) => {
  res.json({ 
    status: 'success',
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
    data: {
      total_productos: productosData.length,
      categorias: [...new Set(productosData.map(p => p.Categoria))].length
    }
  });
});

// Ruta principal de productos
app.get('/api/productos', (req, res) => {
  try {
    const { categoria, limite } = req.query;
    let data = [...productosData];
    
    if (categoria) {
      data = data.filter(p => p.Categoria === categoria);
    }
    
    if (limite && !isNaN(limite)) {
      data = data.slice(0, Number(limite));
    }
    
    res.json({
      status: 'success',
      results: data.length,
      data
    });
    
  } catch (error) {
    console.error("Error en /api/productos:", error);
    res.status(500).json({ 
      status: 'error',
      message: "Error interno del servidor"
    });
  }
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: 'Ruta no encontrada'
  });
});

// Puerto desde variable de entorno o 4000 por defecto
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n=== SERVIDOR ACTIVO ===`);
  console.log(`🔗 http://localhost:${PORT}/api/productos`);
  console.log(`🔗 Prueba: http://localhost:${PORT}/test`);
  console.log(`🚀 Entorno: ${process.env.NODE_ENV || 'development'}\n`);
});
