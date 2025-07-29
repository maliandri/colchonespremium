document.addEventListener('DOMContentLoaded', function() {
  // URLs de la API
  const API_URL = 'https://colchonqn.onrender.com/api/colchones';
  const CATEGORIAS_URL = 'https://colchonqn.onrender.com/api/categorias';
  
  // Elementos del DOM - Actualizados con nuevos selectores
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

  // ===== FUNCIONES PRINCIPALES =====
  
  // Función para cargar productos (sin cambios)
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
      cargarCategoriasVendedor(); // Nueva función para el panel de vendedores
    } catch (error) {
      console.error("Error al cargar productos:", error);
      mostrarError();
    }
  };

  // Función para cargar categorías (sin cambios)
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

  // Nueva función: Cargar categorías para el panel de vendedores
  const cargarCategoriasVendedor = () => {
    filtroCategoriaVendedor.innerHTML = '<option value="">Todas las categorías</option>';
    
    const categoriasUnicas = [...new Set(productosOriginales.map(p => p.Categoria))];
    
    categoriasUnicas.forEach(categoria => {
      const option = document.createElement('option');
      option.value = categoria;
      option.textContent = categoria;
      filtroCategoriaVendedor.appendChild(option);
    });
  };

  // Función para mostrar productos (sin cambios)
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

    document.querySelectorAll('.btn-comprar').forEach(btn => {
      btn.addEventListener('click', agregarAlCarrito);
    });
  };

  // ===== SISTEMA DE VENDEDORES - ACTUALIZADO =====
  
  const cargarProductosParaVendedor = () => {
    const categoriaSeleccionada = filtroCategoriaVendedor.value;
    const productosFiltrados = categoriaSeleccionada 
      ? productosOriginales.filter(p => p.Categoria === categoriaSeleccionada)
      : productosOriginales;
    
    mostrarProductosParaVendedor(productosFiltrados);
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
            id="cantidad-${producto._id}"
            name="cantidad-${producto._id}"
          >
          <button class="sumar" data-id="${producto._id}">+</button>
        </div>
        <button class="btn-agregar" data-id="${producto._id}">Agregar al pedido</button>
      `;
      lista.appendChild(div);
    });

    // Eventos para controles de cantidad
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
    
    detalle.innerHTML = carritoVendedor.length === 0 
      ? '<p>No hay productos en el pedido</p>' 
      : '';
    
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

  // ===== NUEVAS FUNCIONALIDADES PARA VENDEDORES =====
  
  const enviarPresupuestoPorEmail = () => {
    const nombreVendedor = document.getElementById('nombreVendedor').value.trim();
    const nombreCliente = document.getElementById('nombreCliente').value.trim();
    const emailCliente = document.getElementById('emailCliente').value.trim();
    const total = document.getElementById('totalPedido').textContent;
    
    if (!nombreVendedor || !nombreCliente || carritoVendedor.length === 0) {
      mostrarNotificacion('Complete todos los campos y agregue productos', 'error');
      return;
    }

    const itemsPedido = carritoVendedor.map(item => 
      `${item.nombre} x${item.cantidad}: $${(item.precio * item.cantidad).toFixed(2)}`
    ).join('%0D%0A');

    const asunto = `Presupuesto para ${nombreCliente}`;
    const cuerpo = `Vendedor: ${nombreVendedor}%0D%0A%0D%0A` +
                  `Detalle:%0D%0A${itemsPedido}%0D%0A%0D%0A` +
                  `Total: $${total}%0D%0A%0D%0A` +
                  `Fecha: ${new Date().toLocaleDateString()}`;

    window.location.href = `mailto:marianoaliandri@gmail.com?cc=${emailCliente}&subject=${asunto}&body=${cuerpo}`;
  };

  const generarPDF = () => {
    if (carritoVendedor.length === 0) {
      mostrarNotificacion('No hay productos en el presupuesto', 'error');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuración del documento
    doc.setFont('helvetica');
    doc.setFontSize(12);
    
    // Encabezado
    doc.setFontSize(16);
    doc.text('Presupuesto Colchones Premium', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 25);
    doc.text(`Vendedor: ${document.getElementById('nombreVendedor').value}`, 14, 30);
    doc.text(`Cliente: ${document.getElementById('nombreCliente').value}`, 14, 35);
    
    // Detalle de productos
    let y = 50;
    doc.setFontSize(14);
    doc.text('Detalle del Pedido', 14, y);
    y += 10;
    
    doc.setFontSize(12);
    carritoVendedor.forEach(item => {
      const subtotal = item.precio * item.cantidad;
      doc.text(`${item.nombre} x${item.cantidad}`, 20, y);
      doc.text(`$${subtotal.toFixed(2)}`, 180, y, { align: 'right' });
      y += 7;
    });
    
    // Total
    doc.setFontSize(14);
    doc.text('Total:', 160, y + 5);
    doc.text(`$${document.getElementById('totalPedido').textContent}`, 180, y + 5, { align: 'right' });
    
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

  // ===== FUNCIONES COMPARTIDAS (sin cambios) =====
  // ... (agregarAlCarrito, actualizarCarrito, mostrarCargando, mostrarError, mostrarNotificacion)

  // ===== EVENT LISTENERS - ACTUALIZADOS =====
  
  btnVendedores.addEventListener('click', function(e) {
    e.preventDefault();
    cargarProductosParaVendedor();
    modalVendedores.style.display = 'block';
  });

  spanCerrar.addEventListener('click', function() {
    modalVendedores.style.display = 'none';
  });

  // Nuevos event listeners para botones
  document.getElementById('enviarPresupuesto').addEventListener('click', enviarPresupuestoPorEmail);
  document.getElementById('descargarPresupuesto').addEventListener('click', generarPDF);
  document.getElementById('resetearPresupuesto').addEventListener('click', resetearPresupuesto);

  // Filtro de categoría para vendedores
  filtroCategoriaVendedor.addEventListener('change', cargarProductosParaVendedor);

  // Listeners existentes (sin cambios)
  categoriaSelect.addEventListener('change', aplicarFiltros);
  ordenSelect.addEventListener('change', aplicarFiltros);
  searchInput.addEventListener('input', aplicarFiltros);

  // ===== INICIALIZACIÓN =====
  cargarProductos();
});

// Función de filtros (sin cambios)
function aplicarFiltros() {
  const searchTerm = searchInput.value.toLowerCase();
  const categoriaSeleccionada = categoriaSelect.value;
  const ordenSeleccionado = ordenSelect.value;

  let productosFiltrados = [...productosOriginales];

  if (searchTerm) {
    productosFiltrados = productosFiltrados.filter(p => 
      p.Nombre.toLowerCase().includes(searchTerm) || 
      p.Marca.toLowerCase().includes(searchTerm) ||
      p.Categoria.toLowerCase().includes(searchTerm)
    );
  }

  if (categoriaSeleccionada) {
    productosFiltrados = productosFiltrados.filter(p => p.Categoria === categoriaSeleccionada);
  }

  if (ordenSeleccionado === 'asc') {
    productosFiltrados.sort((a, b) => a.Precio - b.Precio);
  } else if (ordenSeleccionado === 'desc') {
    productosFiltrados.sort((a, b) => b.Precio - a.Precio);
  }

  mostrarProductos(productosFiltrados);
}