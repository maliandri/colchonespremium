document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'https://colchonqn.onrender.com/api/colchones';
  const CATEGORIAS_URL = 'https://colchonqn.onrender.com/api/categorias';
  const productosContainer = document.getElementById('productos');
  const categoriaSelect = document.getElementById('categoria');

  // Cargar productos
  const cargarProductos = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      mostrarProductos(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      productosContainer.innerHTML = `<p class="error">⚠️ Error al cargar los productos. Intenta recargar la página.</p>`;
    }
  };

  // Cargar categorías
  const cargarCategorias = async () => {
    try {
      const response = await fetch(CATEGORIAS_URL);
      const categorias = await response.json();
      categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoriaSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  // Mostrar productos
  const mostrarProductos = (productos) => {
    productosContainer.innerHTML = '';
    if (productos.length === 0) {
      productosContainer.innerHTML = '<p class="no-resultados">No se encontraron productos.</p>';
      return;
    }

    productos.forEach(producto => {
      const div = document.createElement('div');
      div.className = 'producto';
      div.innerHTML = `
        <img src="${producto.Imagen}" alt="${producto.Nombre}" loading="lazy">
        <div class="producto-info">
          <h3>${producto.Nombre}</h3>
          <p class="marca">${producto.Marca}</p>
          <p class="precio">$${parseInt(producto.Precio).toLocaleString('es-AR')}</p>
          <span class="categoria">${producto.Categoria}</span>
        </div>
      `;
      productosContainer.appendChild(div);
    });
  };

  // Inicializar
  cargarCategorias();
  cargarProductos();

  // Filtro por categoría
  categoriaSelect.addEventListener('change', () => {
    const categoria = categoriaSelect.value;
    if (!categoria) return cargarProductos();
    
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        const filtrados = data.filter(item => item.Categoria === categoria);
        mostrarProductos(filtrados);
      });
  });
});