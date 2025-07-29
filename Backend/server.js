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

// Configuración CORS para Netlify
app.use(cors({
  origin: ['https://colchonqn.netlify.app']
}));

// Función para generar IDs únicos (ej: "ALM-001")
const generarIdUnico = (categoria, contador) => {
  const prefijo = categoria ? categoria.slice(0, 3).toUpperCase() : 'GEN';
  return `${prefijo}-${contador.toString().padStart(3, '0')}`;
};

// Endpoint para productos
app.get('/api/colchones', (req, res) => {
  try {
    const workbook = xlsx.readFile(path.join(__dirname, 'precios_colchones.xlsx'));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    // Contadores por categoría
    const contadores = {};
    
    const productos = data
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
    
    res.json(productos);
  } catch (err) {
    console.error('Error en /api/colchones:', err);
    res.status(500).json({ error: 'Error al procesar los productos' });
  }
});

// Endpoint para categorías
app.get('/api/categorias', (req, res) => {
  try {
    const workbook = xlsx.readFile(path.join(__dirname, 'precios_colchones.xlsx'));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    // Extraer categorías válidas (filtra productos mostrados y elimina valores falsy)
    const categorias = data
      .filter(item => item.Mostrar?.toLowerCase() === "si" && item.Categoria)
      .map(item => item.Categoria.trim()) // Limpia espacios en blanco
      .filter((categoria, index, self) => self.indexOf(categoria) === index); // Elimina duplicados

    res.json(categorias);
  } catch (err) {
    console.error('Error en /api/categorias:', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));