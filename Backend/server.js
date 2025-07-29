import express from 'express';
import cors from 'cors';
import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configuración __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: ['https://colchonqn.netlify.app', 'http://localhost:5500']
}));
app.use(express.json());

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: "API de Colchones Premium",
    endpoints: {
      productos: "/api/colchones",
      categorias: "/api/categorias",
      presupuesto: "/api/enviar-presupuesto (POST)"
    }
  });
});


// Cache de productos (mejora rendimiento)
let cacheProductos = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Función para generar IDs únicos
const generarIdUnico = (categoria, contador) => {
  const prefijo = categoria ? categoria.slice(0, 3).toUpperCase() : 'GEN';
  return `${prefijo}-${contador.toString().padStart(3, '0')}`;
};

// Leer Excel con cache
const leerExcel = () => {
  const now = Date.now();
  if (cacheProductos && (now - cacheTimestamp) < CACHE_DURATION) {
    return cacheProductos;
  }

  try {
    const workbook = xlsx.readFile(path.join(__dirname, 'precios_colchones.xlsx'));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    // Procesar datos y actualizar cache
    const contadores = {};
    cacheProductos = data
      .filter(item => 
        item.Mostrar?.toLowerCase() === "si" && 
        item.Imagen?.trim() !== ""
      )
      .map(item => {
        const categoria = item.Categoria || 'General';
        contadores[categoria] = (contadores[categoria] || 0) + 1;
        
        return {
          ...item,
          _id: generarIdUnico(categoria, contadores[categoria])
        };
      });

    cacheTimestamp = now;
    return cacheProductos;

  } catch (err) {
    console.error('Error al leer Excel:', err);
    return null;
  }
};

// Endpoint para productos (con cache)
app.get('/api/colchones', (req, res) => {
  const productos = leerExcel();
  if (!productos) {
    return res.status(500).json({ error: 'Error al cargar productos' });
  }
  res.json(productos);
});

// Endpoint para categorías (optimizado)
app.get('/api/categorias', (req, res) => {
  const productos = leerExcel();
  if (!productos) {
    return res.status(500).json({ error: 'Error al cargar categorías' });
  }

  const categorias = [...new Set(
    productos.map(p => p.Categoria).filter(Boolean) // <-- Se cerró el paréntesis aquí
  )]; // <-- Y aquí se cierra el Set
  
  res.json(categorias);
});
// Nuevo endpoint para enviar presupuestos (ejemplo futuro)
app.post('/api/enviar-presupuesto', (req, res) => {
  // Aquí podrías integrar un servicio de email como SendGrid
  res.json({ success: true, message: 'Función en desarrollo' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
  console.log('Endpoints disponibles:');
  console.log(`- GET /api/colchones`);
  console.log(`- GET /api/categorias`);
  console.log(`- POST /api/enviar-presupuesto`);
});