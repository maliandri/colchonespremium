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

  // Mostrar productos (versión mejorada)
  const mostrarProductos = (productos) => {
    productosContainer.innerHTML = '';
    
    if (productos.length === 0) {
      productosContainer.innerHTML = '<p class="no-products">No se encontraron productos.</p>';
      return;
    }

    productos.forEach((producto, index) => {
      const div = document.createElement('div');
      div.className = 'producto';
      div.style.animationDelay = `${index * 0.1}s`;
      div.innerHTML = `
        <img src="${producto.Imagen}" alt="${producto.Nombre}" class="producto-imagen" loading="lazy">
        <div class="producto-info">
          <h3 class="producto-titulo">${producto.Nombre}</h3>
          <p class="producto-marca">${producto.Marca}</p>
          <p class="producto-precio">$${parseInt(producto.Precio).toLocaleString('es-AR')}</p>
          <span class="producto-categoria">${producto.Categoria}</span>
          <button class="btn-comprar">Agregar al carrito</button>
        </div>
      `;
      productosContainer.appendChild(div);
    });

    // Agregar event listeners a los botones (opcional)
    document.querySelectorAll('.btn-comprar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // Lógica para agregar al carrito aquí
        console.log('Producto agregado al carrito');
      });
    });
  };

  // Smooth scroll para navegación
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

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
      })
      .catch(error => console.error("Error al filtrar:", error));
  });
});