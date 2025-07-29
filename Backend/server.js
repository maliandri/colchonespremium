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

// Endpoint para productos
app.get('/api/colchones', (req, res) => {
  try {
    const workbook = xlsx.readFile(path.join(__dirname, 'precios_colchones.xlsx'));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    const productos = data.filter(item => 
      item.Mostrar?.toLowerCase() === "si" && 
      item.Imagen?.trim() !== ""
    );
    
    res.json(productos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer el Excel' });
  }
});

// Endpoint para categorías
app.get('/api/categorias', (req, res) => {
  try {
    const workbook = xlsx.readFile(path.join(__dirname, 'precios_colchones.xlsx'));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    const categorias = [...new Set(
      data.filter(item => item.Mostrar?.toLowerCase() === "si")
          .map(item => item.Categoria)
    )];
    
    res.json(categorias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer el Excel' });
  }
});

app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));