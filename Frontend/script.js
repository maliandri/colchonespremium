document.addEventListener('DOMContentLoaded', () => {
  // URLs de la API
  const API_URL = 'https://colchonqn.onrender.com/api/colchones';
  const CATEGORIAS_URL = 'https://colchonqn.onrender.com/api/categorias';
  
  // Elementos del DOM
  const productosGrid = document.getElementById('productos-grid');
  const categoriaSelect = document.getElementById('categoria');
  const ordenSelect = document.getElementById('orden');
  const searchInput = document.getElementById('searchInput');
  const cartCount = document.querySelector('.cart-count');
  
  // Variables de estado
  let productosOriginales = [];
  let carrito = [];

  // ===== FUNCIONES PRINCIPALES =====
  
  // Cargar productos desde la API
  const cargarProductos = async () => {
    try {
      mostrarCargando();
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      productosOriginales = await response.json();
      mostrarProductos(productosOriginales);
      cargarCategorias();
    } catch (error) {
      console.error("Error al cargar productos:", error);
      mostrarError();
    }
  };

  // Cargar categorías dinámicamente
  const cargarCategorias = () => {
    categoriaSelect.innerHTML = '<option value="">Todas las categorías</option>';
    
    const categoriasUnicas = [...new Set(productosOriginales.map(p => p.Categoria))];
    
    categoriasUnicas.forEach(categoria => {
      const option = document.createElement('option');
      option.value = categoria;
      option.textContent = categoria;
      categoriaSelect.appendChild(option);
    });
  };

  // Mostrar productos en el grid
  const mostrarProductos = (productos) => {
    if (productos.length === 0) {
      productosGrid.innerHTML = '<p class="no-products">No se encontraron productos con estos filtros.</p>';
      return;
    }

    productosGrid.innerHTML = '';
    
    productos.forEach((producto, index) => {
      const productoElement = document.createElement('div');
      productoElement.className = 'producto';
      productoElement.style.animationDelay = `${index * 0.1}s`;
      
      productoElement.innerHTML = `
        <div class="producto-imagen-container">
          <img src="${producto.Imagen}" alt="${producto.Nombre}" class="producto-imagen" loading="lazy">
        </div>
        <div class="producto-info">
          <h3 class="producto-titulo">${producto.Nombre}</h3>
          <p class="producto-marca">${producto.Marca}</p>
          <p class="producto-precio">$${parseInt(producto.Precio).toLocaleString('es-AR')}</p>
          <span class="producto-categoria">${producto.Categoria}</span>
          <button class="btn-comprar" data-id="${producto._id}">Agregar al carrito</button>
        </div>
      `;
      
      productosGrid.appendChild(productoElement);
    });

    // Agregar eventos a los botones
    document.querySelectorAll('.btn-comprar').forEach(btn => {
      btn.addEventListener('click', agregarAlCarrito);
    });
  };

  // Aplicar todos los filtros combinados
  const aplicarFiltros = () => {
    let productosFiltrados = [...productosOriginales];
    const searchTerm = searchInput.value.toLowerCase();
    const categoriaSeleccionada = categoriaSelect.value;
    const ordenSeleccionado = ordenSelect.value;

    // Filtro por búsqueda
    if (searchTerm) {
      productosFiltrados = productosFiltrados.filter(p => 
        p.Nombre.toLowerCase().includes(searchTerm) || 
        p.Marca.toLowerCase().includes(searchTerm) ||
        p.Categoria.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por categoría
    if (categoriaSeleccionada) {
      productosFiltrados = productosFiltrados.filter(p => p.Categoria === categoriaSeleccionada);
    }

    // Ordenamiento
    if (ordenSeleccionado === 'asc') {
      productosFiltrados.sort((a, b) => a.Precio - b.Precio);
    } else if (ordenSeleccionado === 'desc') {
      productosFiltrados.sort((a, b) => b.Precio - a.Precio);
    }

    mostrarProductos(productosFiltrados);
  };

  // ===== FUNCIONES DEL CARRITO =====
  const agregarAlCarrito = (e) => {
    const productoId = e.target.getAttribute('data-id');
    const producto = productosOriginales.find(p => p._id === productoId);
    
    if (producto) {
      carrito.push(producto);
      actualizarCarrito();
      mostrarNotificacion(`${producto.Nombre} agregado al carrito`);
    }
  };

  const actualizarCarrito = () => {
    cartCount.textContent = carrito.length;
    // Aquí podrías guardar el carrito en localStorage
    // localStorage.setItem('carrito', JSON.stringify(carrito));
  };

  // ===== FUNCIONES DE INTERFAZ =====
  const mostrarCargando = () => {
    productosGrid.innerHTML = `
      <div class="cargando">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Cargando productos...</p>
      </div>
    `;
  };

  const mostrarError = () => {
    productosGrid.innerHTML = `
      <p class="error">
        <i class="fas fa-exclamation-triangle"></i>
        Error al cargar los productos. Intenta recargar la página.
      </p>
    `;
  };

  const mostrarNotificacion = (mensaje) => {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion';
    notificacion.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>${mensaje}</span>
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
      notificacion.classList.add('mostrar');
    }, 10);
    
    setTimeout(() => {
      notificacion.classList.remove('mostrar');
      setTimeout(() => {
        document.body.removeChild(notificacion);
      }, 300);
    }, 3000);
  };

  // ===== EVENT LISTENERS =====
  categoriaSelect.addEventListener('change', aplicarFiltros);
  ordenSelect.addEventListener('change', aplicarFiltros);
  searchInput.addEventListener('input', aplicarFiltros);

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

  // ===== INICIALIZACIÓN =====
  cargarProductos();
});