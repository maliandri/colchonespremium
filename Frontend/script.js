require('dotenv').config();
const express = require('express');
const cors = require('cors');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();

// Configuración CORS
const corsOptions = {
  origin: [
    'https://colchonqn.netlify.app',
    'http://localhost:3000',
    'http://localhost:4000'
  ],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Servir imágenes estáticas
const imgPath = path.join(__dirname, 'Assets', 'IMG');
app.use('/images', express.static(imgPath));

// Middleware de log
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Cargar datos del Excel con filtro por Mostrar = "si"
let productosData = [];
try {
  const filePath = path.join(__dirname, 'precios_colchones.xlsx');
  console.log("Cargando datos desde:", filePath);

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];

  productosData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName])
    .filter(p => (p.Mostrar || '').toString().trim().toLowerCase() === 'si')
    .map(p => {
      // Nombre del archivo de imagen
      const imgFile = `${p.Nombre}.jpg`; // Cambiar si usas .png
      const fullImgPath = path.join(imgPath, imgFile);

      // Si existe el archivo, usarlo. Si no, usar default.jpg
      return {
        ...p,
        imagen_url: fs.existsSync(fullImgPath)
          ? `/images/${encodeURIComponent(imgFile)}`
          : `/images/default.jpg`
      };
    });

  console.log(`✅ Datos cargados: ${productosData.length} productos visibles`);
} catch (error) {
  console.error("❌ Error al cargar el archivo Excel:", error);
  process.exit(1);
}

// Test
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

// Endpoint principal
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

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: 'Ruta no encontrada'
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n=== SERVIDOR ACTIVO ===`);
  console.log(`🔗 http://localhost:${PORT}/api/productos`);
  console.log(`🔗 Prueba: http://localhost:${PORT}/test`);
  console.log(`🚀 Entorno: ${process.env.NODE_ENV || 'development'}\n`);
});
