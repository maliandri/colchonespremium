    document.addEventListener('DOMContentLoaded', async () => {
  const API_URL = location.hostname.includes('localhost')
    ? 'http://localhost:4000/api'
    : 'https://colchonqn.onrender.com/api';

  try {
    const res = await fetch(`${API_URL}/productos`);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const json = await res.json();
    if (!json.data || !Array.isArray(json.data)) throw new Error('Respuesta inválida');

    // Filtrar productos que mostrar
    const productos = json.data.filter(p => p.Mostrar && p.Mostrar.toLowerCase() === 'si');

    // Extraer categorías únicas
    const categoriasUnicas = [...new Set(productos.map(p => p.Categoria).filter(Boolean))].sort();

    // Renderizar categorías y llenar filtro
    renderCategorias(categoriasUnicas);
    llenarFiltroCategorias(categoriasUnicas);

    // Setup controles
    setupFiltros(productos);
    setupBusqueda(productos);
    setupOrden(productos);

    // Render inicial productos
    renderProductos(productos);
  } catch (error) {
    console.error('Error al cargar productos:', error);
    const contenedor = document.getElementById('contenedor-productos');
    if (contenedor) {
      contenedor.innerHTML = `
        <p style="color: red;">Error al cargar productos. Intenta recargar la página.</p>
      `;
    }
  }
});

// Mapa categoría → imagen
const categoriasConImagen = {
  "Memory Foam": "assets/categoria1.jpg",
  "Resortes": "assets/categoria2.jpg",
  "Híbridos": "assets/categoria3.jpg",
  "Infantiles": "assets/categoria4.jpg",
  // Agregar más categorías y su imagen aquí
};

// Renderiza el bloque de categorías dinámicamente
function renderCategorias(categorias) {
  const contenedor = document.querySelector('.categorias-grid');
  if (!contenedor) return;

  contenedor.innerHTML = categorias.map(cat => `
    <div class="categoria-card" data-categoria="${cat.toLowerCase()}">
      <div class="categoria-img">
        <img src="${categoriasConImagen[cat] || 'assets/default-categoria.jpg'}" alt="${cat}">
      </div>
      <div class="categoria-overlay">${cat}</div>
    </div>
  `).join('');

  // Permitir filtrar haciendo click en la categoría
  contenedor.querySelectorAll('.categoria-card').forEach(card => {
    card.addEventListener('click', () => {
      const filtro = document.getElementById('filtro-categoria');
      filtro.value = card.dataset.categoria;
      filtro.dispatchEvent(new Event('change'));
    });
  });
}

function llenarFiltroCategorias(categorias) {
  const filtro = document.getElementById('filtro-categoria');
  if (!filtro) return;

  // Limpiar opciones previas (dejamos la opción "Todas las categorías")
  filtro.innerHTML = '<option value="">Todas las categorías</option>';

  categorias.forEach(cat => {
    filtro.innerHTML += `<option value="${cat.toLowerCase()}">${cat}</option>`;
  });
}

function setupFiltros(productos) {
  const filtro = document.getElementById('filtro-categoria');
  if (!filtro) return;
  filtro.addEventListener('change', () => filtrarYMostrar(productos));
}

function setupBusqueda(productos) {
  const busqueda = document.getElementById('busqueda');
  if (!busqueda) return;
  busqueda.addEventListener('input', () => filtrarYMostrar(productos));
}

function setupOrden(productos) {
  const orden = document.getElementById('orden');
  if (!orden) return;
  orden.addEventListener('change', () => filtrarYMostrar(productos));
}

function filtrarYMostrar(productos) {
  const filtro = document.getElementById('filtro-categoria').value.toLowerCase();
  const busqueda = document.getElementById('busqueda').value.toLowerCase();
  const orden = document.getElementById('orden').value;

  let resultados = [...productos];

  if (filtro) {
    resultados = resultados.filter(p => p.Categoria && p.Categoria.toLowerCase() === filtro);
  }

  if (busqueda) {
    resultados = resultados.filter(p => p.Nombre.toLowerCase().includes(busqueda));
  }

  switch (orden) {
    case 'nombre-asc':
      resultados.sort((a, b) => a.Nombre.localeCompare(b.Nombre));
      break;
    case 'nombre-desc':
      resultados.sort((a, b) => b.Nombre.localeCompare(a.Nombre));
      break;
    case 'precio-asc':
      resultados.sort((a, b) => (a.Precio || 0) - (b.Precio || 0));
      break;
    case 'precio-desc':
      resultados.sort((a, b) => (b.Precio || 0) - (a.Precio || 0));
      break;
  }

  renderProductos(resultados);
}

// Validar URL simple
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

function renderProductos(productos) {
  const contenedor = document.getElementById('contenedor-productos');
  if (!contenedor) return;

  if (productos.length === 0) {
    contenedor.innerHTML = '<p>No hay productos para mostrar.</p>';
    return;
  }

  contenedor.innerHTML = productos.map(p => {
    const imgSrc = isValidUrl(p.Imagen?.trim()) ? p.Imagen.trim() : 'assets/sin-imagen.jpg';

    return `
      <div class="producto-card">
        <div class="producto-img">
          <img src="${imgSrc}" alt="${p.Nombre}" onerror="this.onerror=null;this.src='assets/sin-imagen.jpg';" />
        </div>
        <div class="producto-info">
          <h3 class="producto-nombre">${p.Nombre}</h3>
          <div class="producto-categoria">${p.Categoria || 'Sin categoría'}</div>
          <div class="producto-precio">${p.Precio != null ? `$${p.Precio.toLocaleString('es-AR')}` : 'Precio no disponible'}</div>
        </div>
      </div>
    `;
  }).join('');
}
