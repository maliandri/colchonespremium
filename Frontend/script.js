document.addEventListener('DOMContentLoaded', function() {
  // URLs de la API
  const API_URL = 'https://colchonqn.onrender.com/api/colchones';
  const CATEGORIAS_URL = 'https://colchonqn.onrender.com/api/categorias';
  
  // Elementos del DOM
  const productosGrid = document.getElementById('productos-grid');
  const categoriaSelect = document.getElementById('categoria');
  const ordenSelect = document.getElementById('orden');
  const searchInput = document.getElementById('searchInput');
  const cartCount = document.querySelector('.cart-count');
  const btnVendedores = document.querySelector('.vendedores-link');
  const modalVendedores = document.getElementById('modalVendedores');
  const spanCerrar = document.querySelector('.cerrar');

  // Variables de estado
  let productosOriginales = [];
  let carrito = [];
  let carritoVendedor = [];

  // ===== FUNCIONES PRINCIPALES =====
  
  // Función para cargar productos
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

  // Función para cargar categorías
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

  // Función para mostrar productos
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

  // ===== SISTEMA DE VENDEDORES =====
  
  const cargarProductosParaVendedor = () => {
    mostrarProductosParaVendedor(productosOriginales);
  };

  const mostrarProductosParaVendedor = (productos) => {
    const lista = document.getElementById('listaProductosVendedor');
    lista.innerHTML = '';

    productos.forEach(producto => {
      const div = document.createElement('div');
      div.className = 'producto-vendedor';
      div.innerHTML = `
  <h4>${producto.Nombre}</h4>
  <p>Marca: ${producto.Marca}</p>
  <p>Precio: $${producto.Precio}</p>
  <div class="cantidad-control">
    <button class="restar" data-id="${producto._id}">-</button>
    <input 
      type="number" 
      value="0" 
      min="0" 
      class="cantidad" 
      data-id="${producto._id}"
      id="cantidad-${producto._id}"      <!-- Nuevo: id único -->
      name="cantidad-${producto._id}"    <!-- Nuevo: name único -->
    >
    <button class="sumar" data-id="${producto._id}">+</button>
  </div>
  <button class="btn-agregar" data-id="${producto._id}">Agregar al pedido</button>
`;
      lista.appendChild(div);
    });

    // Agregar eventos
    document.querySelectorAll('.btn-agregar').forEach(btn => {
      btn.addEventListener('click', agregarAlPedido);
    });

    document.querySelectorAll('.sumar').forEach(btn => {
      btn.addEventListener('click', function() {
        const input = this.parentElement.querySelector('.cantidad');
        input.value = parseInt(input.value) + 1;
      });
    });

    document.querySelectorAll('.restar').forEach(btn => {
      btn.addEventListener('click', function() {
        const input = this.parentElement.querySelector('.cantidad');
        if (parseInt(input.value) > 0) {
          input.value = parseInt(input.value) - 1;
        }
      });
    });
  };

  const agregarAlPedido = (e) => {
    const productoId = e.target.getAttribute('data-id');
    const cantidadInput = document.querySelector(`.cantidad[data-id="${productoId}"]`);
    const cantidad = parseInt(cantidadInput.value);
    
    if (cantidad <= 0) {
      mostrarNotificacion('Seleccione una cantidad válida', 'error');
      return;
    }

    const producto = productosOriginales.find(p => p._id === productoId);
    if (!producto) return;

    const existe = carritoVendedor.find(item => item.id === productoId);
    
    if (existe) {
      existe.cantidad += cantidad;
    } else {
      carritoVendedor.push({
        id: productoId,
        nombre: producto.Nombre,
        precio: producto.Precio,
        cantidad: cantidad
      });
    }
    
    cantidadInput.value = 0;
    actualizarResumenPedido();
    mostrarNotificacion(`${cantidad} ${producto.Nombre} agregado(s)`);
  };

  const actualizarResumenPedido = () => {
    const detalle = document.getElementById('detallePedido');
    const totalElement = document.getElementById('totalPedido');
    let total = 0;
    
    detalle.innerHTML = carritoVendedor.length === 0 ? 
      '<p>No hay productos en el pedido</p>' : '';
    
    carritoVendedor.forEach(item => {
      const subtotal = item.precio * item.cantidad;
      total += subtotal;
      
      const div = document.createElement('div');
      div.className = 'item-pedido';
      div.innerHTML = `
        <span>${item.nombre} x${item.cantidad}</span>
        <span>$${subtotal.toFixed(2)}</span>
      `;
      detalle.appendChild(div);
    });
    
    totalElement.textContent = total.toFixed(2);
  };

  // ===== FUNCIONES COMPARTIDAS =====
  
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
  };

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

  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.innerHTML = `
      <i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
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
  
  btnVendedores.addEventListener('click', function(e) {
    e.preventDefault();
    cargarProductosParaVendedor();
    modalVendedores.style.display = 'block';
  });

  spanCerrar.addEventListener('click', function() {
    modalVendedores.style.display = 'none';
  });

  document.getElementById('finalizarPedido').addEventListener('click', function() {
    const nombreVendedor = document.getElementById('nombreVendedor').value.trim();
    const nombreCliente = document.getElementById('nombreCliente').value.trim();
    
    if (!nombreVendedor || !nombreCliente) {
      mostrarNotificacion('Ingrese nombre de vendedor y cliente', 'error');
      return;
    }
    
    if (carritoVendedor.length === 0) {
      mostrarNotificacion('Agregue productos al pedido', 'error');
      return;
    }
    
    const total = document.getElementById('totalPedido').textContent;
    mostrarNotificacion(`Pedido de $${total} registrado para ${nombreCliente}`);
    
    // Resetear
    carritoVendedor = [];
    document.getElementById('nombreCliente').value = '';
    document.querySelectorAll('.cantidad').forEach(input => input.value = 0);
    actualizarResumenPedido();
  });

  categoriaSelect.addEventListener('change', aplicarFiltros);
  ordenSelect.addEventListener('change', aplicarFiltros);
  searchInput.addEventListener('input', aplicarFiltros);

  // ===== INICIALIZACIÓN =====
  cargarProductos();
});

// Función de filtros (debe estar fuera del DOMContentLoaded si usa variables internas)
function aplicarFiltros() {
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
}