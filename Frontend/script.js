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
  const filtroCategoriaVendedor = document.getElementById('filtroCategoriaVendedor');

  // Variables de estado
  let productosOriginales = [];
  let carrito = [];
  let carritoVendedor = [];

  // ===== FUNCIONES DE INTERFAZ =====
  const mostrarCargando = () => {
    productosGrid.innerHTML = `
      <div class="cargando">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Cargando productos...</p>
      </div>
    `;
  };

  const mostrarError = (mensaje = 'Error al cargar los productos. Intenta recargar la página.') => {
    productosGrid.innerHTML = `
      <p class="error">
        <i class="fas fa-exclamation-triangle"></i>
        ${mensaje}
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
    setTimeout(() => notificacion.classList.add('mostrar'), 10);
    setTimeout(() => {
      notificacion.classList.remove('mostrar');
      setTimeout(() => document.body.removeChild(notificacion), 300);
    }, 3000);
  };

  // ===== FUNCIONES PRINCIPALES =====  
  const cargarProductos = async () => {
    try {
      mostrarCargando();
      
      // Limpiar caché del navegador para forzar nueva carga
      const response = await fetch(API_URL + '?t=' + new Date().getTime());
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new TypeError("La respuesta no es JSON");
      }

      productosOriginales = await response.json();
      
      // Verificar estructura de datos
      if (!Array.isArray(productosOriginales)) {
        throw new Error("Formato de datos inválido");
      }
      
      // Filtrar productos válidos
      const productosValidos = productosOriginales.filter(p => 
        p.Mostrar?.toLowerCase() === 'si' && 
        p.Imagen?.trim() && 
        p.Nombre?.trim()
      );
      
      if (productosValidos.length === 0) {
        mostrarError("No hay productos disponibles para mostrar");
        return;
      }
      
      mostrarProductos(productosValidos);
      cargarCategorias();
      cargarCategoriasVendedor();
      
    } catch (error) {
      console.error("Error al cargar productos:", error);
      mostrarError(error.message);
    }
  };

  const cargarCategorias = () => {
    categoriaSelect.innerHTML = '<option value="">Todas las categorías</option>';
    const categoriasUnicas = [...new Set(productosOriginales
      .map(p => p.Categoria)
      .filter(Boolean))];
    
    categoriasUnicas.forEach(categoria => {
      const option = document.createElement('option');
      option.value = categoria;
      option.textContent = categoria;
      categoriaSelect.appendChild(option);
    });
  };

  const cargarCategoriasVendedor = () => {
    filtroCategoriaVendedor.innerHTML = '<option value="">Todas las categorías</option>';
    const categoriasUnicas = [...new Set(productosOriginales
      .map(p => p.Categoria)
      .filter(Boolean))];
    
    categoriasUnicas.forEach(categoria => {
      const option = document.createElement('option');
      option.value = categoria;
      option.textContent = categoria;
      filtroCategoriaVendedor.appendChild(option);
    });
  };

  const mostrarProductos = (productos) => {
    productosGrid.innerHTML = productos.length === 0 ? 
      '<p class="no-products">No se encontraron productos con estos filtros.</p>' : '';
    
    productos.forEach((producto, index) => {
      const productoElement = document.createElement('div');
      productoElement.className = 'producto';
      productoElement.style.animationDelay = `${index * 0.1}s`;
      
      // Manejo seguro de la imagen
      const imagenUrl = producto.Imagen.trim();
      const imagenAlt = producto.Nombre.trim() || 'Producto sin nombre';
      
      productoElement.innerHTML = `
        <div class="producto-imagen-container">
          <img src="${imagenUrl}" 
               alt="${imagenAlt}" 
               loading="lazy"
               onerror="this.onerror=null;this.src='https://via.placeholder.com/300?text=Imagen+no+disponible'">
        </div>
        <div class="producto-info">
          <h3>${producto.Nombre || 'Sin nombre'}</h3>
          <p>${producto.Marca || 'Sin marca'}</p>
          <p>$${parseInt(producto.Precio || 0).toLocaleString('es-AR')}</p>
          <span>${producto.Categoria || 'Sin categoría'}</span>
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

  // ===== FUNCIONES DEL CARRITO =====
  const agregarAlCarrito = (e) => {
    const productoId = e.target.getAttribute('data-id');
    const producto = productosOriginales.find(p => p._id === productoId);
    
    if (!producto) {
      mostrarNotificacion('Producto no encontrado', 'error');
      return;
    }
    
    const itemExistente = carrito.find(item => item.id === productoId);
    
    if (itemExistente) {
      itemExistente.cantidad += 1;
    } else {
      carrito.push({
        id: productoId,
        nombre: producto.Nombre,
        precio: producto.Precio,
        cantidad: 1,
        imagen: producto.Imagen
      });
    }
    
    actualizarCarrito();
    mostrarNotificacion(`${producto.Nombre} agregado al carrito`);
  };

  const actualizarCarrito = () => {
    cartCount.textContent = carrito.reduce((total, item) => total + item.cantidad, 0);
    // Aquí puedes agregar más lógica para actualizar el carrito si es necesario
  };

  // ===== SISTEMA DE VENDEDORES =====
  const cargarProductosParaVendedor = () => {
    const categoria = filtroCategoriaVendedor.value;
    const productosFiltrados = categoria ? 
      productosOriginales.filter(p => p.Categoria === categoria) : 
      productosOriginales;
    mostrarProductosParaVendedor(productosFiltrados);
  };

  const mostrarProductosParaVendedor = (productos) => {
    const lista = document.getElementById('listaProductosVendedor');
    lista.innerHTML = '';

    productos.forEach(producto => {
      lista.innerHTML += `
        <div class="producto-vendedor">
          <h4>${producto.Nombre || 'Sin nombre'}</h4>
          <p>Marca: ${producto.Marca || 'Sin marca'}</p>
          <p>Precio: $${parseInt(producto.Precio || 0).toLocaleString('es-AR')}</p>
          <div class="cantidad-control">
            <button class="restar" data-id="${producto._id}">-</button>
            <input type="number" value="0" min="0" class="cantidad" data-id="${producto._id}">
            <button class="sumar" data-id="${producto._id}">+</button>
          </div>
          <button class="btn-agregar" data-id="${producto._id}">Agregar al pedido</button>
        </div>
      `;
    });

    // Eventos
    document.querySelectorAll('.btn-agregar').forEach(btn => {
      btn.addEventListener('click', agregarAlPedido);
    });

    document.querySelectorAll('.sumar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const input = e.target.parentElement.querySelector('.cantidad');
        input.value = parseInt(input.value) + 1;
      });
    });

    document.querySelectorAll('.restar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const input = e.target.parentElement.querySelector('.cantidad');
        if (parseInt(input.value) > 0) input.value = parseInt(input.value) - 1;
      });
    });
  };

  const agregarAlPedido = (e) => {
    const productoId = e.target.getAttribute('data-id');
    const input = document.querySelector(`.cantidad[data-id="${productoId}"]`);
    const cantidad = parseInt(input.value);
    const producto = productosOriginales.find(p => p._id === productoId);

    if (cantidad <= 0 || !producto) {
      mostrarNotificacion('Seleccione una cantidad válida', 'error');
      return;
    }

    const itemExistente = carritoVendedor.find(item => item.id === productoId);
    if (itemExistente) {
      itemExistente.cantidad += cantidad;
    } else {
      carritoVendedor.push({
        id: productoId,
        nombre: producto.Nombre,
        precio: producto.Precio,
        cantidad: cantidad,
        imagen: producto.Imagen
      });
    }

    input.value = 0;
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
      detalle.innerHTML += `
        <div class="item-pedido">
          <span>${item.nombre} x${item.cantidad}</span>
          <span>$${subtotal.toFixed(2)}</span>
        </div>
      `;
    });
    
    totalElement.textContent = total.toFixed(2);
  };

  // ===== FUNCIONES PARA VENDEDORES =====
  const enviarPresupuesto = () => {
    const nombreVendedor = document.getElementById('nombreVendedor').value.trim();
    const nombreCliente = document.getElementById('nombreCliente').value.trim();
    const emailCliente = document.getElementById('emailCliente').value.trim();
    const total = document.getElementById('totalPedido').textContent;

    if (!nombreVendedor || !nombreCliente || carritoVendedor.length === 0) {
      mostrarNotificacion('Complete todos los campos y agregue productos', 'error');
      return;
    }

    const items = carritoVendedor.map(item => 
      `${item.nombre} x${item.cantidad}: $${(item.precio * item.cantidad).toFixed(2)}`
    ).join('\n');

    window.location.href = `mailto:marianoaliandri@gmail.com?subject=Presupuesto para ${nombreCliente}&body=
      Vendedor: ${nombreVendedor}%0D%0A
      Cliente: ${nombreCliente}%0D%0A
      Email: ${emailCliente}%0D%0A%0D%0A
      ${items}%0D%0A%0D%0A
      Total: $${total}%0D%0A
      Fecha: ${new Date().toLocaleDateString()}
    `.replace(/\s+/g, ' ');
  };

  const generarPDF = () => {
    if (carritoVendedor.length === 0) {
      mostrarNotificacion('No hay productos en el presupuesto', 'error');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFont('helvetica');
    doc.text('Presupuesto Colchones Premium', 105, 15, { align: 'center' });
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 25);
    doc.text(`Vendedor: ${document.getElementById('nombreVendedor').value}`, 14, 30);
    doc.text(`Cliente: ${document.getElementById('nombreCliente').value}`, 14, 35);
    
    let y = 50;
    carritoVendedor.forEach(item => {
      doc.text(`${item.nombre} x${item.cantidad}`, 20, y);
      doc.text(`$${(item.precio * item.cantidad).toFixed(2)}`, 180, y, { align: 'right' });
      y += 7;
    });
    
    doc.text(`Total: $${document.getElementById('totalPedido').textContent}`, 180, y + 5, { align: 'right' });
    doc.save(`Presupuesto_${document.getElementById('nombreCliente').value.replace(/\s+/g, '_')}.pdf`);
  };

  const resetearPresupuesto = () => {
    carritoVendedor = [];
    document.getElementById('nombreCliente').value = '';
    document.getElementById('emailCliente').value = '';
    document.querySelectorAll('.cantidad').forEach(input => input.value = 0);
    actualizarResumenPedido();
    mostrarNotificacion('Presupuesto reseteado');
  };

  // ===== EVENT LISTENERS =====
  btnVendedores.addEventListener('click', (e) => {
    e.preventDefault();
    cargarProductosParaVendedor();
    modalVendedores.style.display = 'block';
  });

  spanCerrar.addEventListener('click', () => {
    modalVendedores.style.display = 'none';
  });

  document.getElementById('enviarPresupuesto').addEventListener('click', enviarPresupuesto);
  document.getElementById('descargarPresupuesto').addEventListener('click', generarPDF);
  document.getElementById('resetearPresupuesto').addEventListener('click', resetearPresupuesto);
  filtroCategoriaVendedor.addEventListener('change', cargarProductosParaVendedor);
  categoriaSelect.addEventListener('change', aplicarFiltros);
  ordenSelect.addEventListener('change', aplicarFiltros);
  searchInput.addEventListener('input', aplicarFiltros);

  // ===== INICIALIZACIÓN =====
  cargarProductos();
});

function aplicarFiltros() {
  const searchTerm = searchInput.value.toLowerCase();
  const categoria = categoriaSelect.value;
  const orden = ordenSelect.value;

  let productosFiltrados = [...productosOriginales]
    .filter(p => 
      (!searchTerm || 
       p.Nombre?.toLowerCase().includes(searchTerm) || 
       p.Marca?.toLowerCase().includes(searchTerm) ||
       p.Categoria?.toLowerCase().includes(searchTerm)) &&
      (!categoria || p.Categoria === categoria)
    );

  if (orden === 'asc') productosFiltrados.sort((a, b) => (a.Precio || 0) - (b.Precio || 0));
  if (orden === 'desc') productosFiltrados.sort((a, b) => (b.Precio || 0) - (a.Precio || 0));

  mostrarProductos(productosFiltrados);
}