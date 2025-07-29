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
  const btnVendedores = document.querySelector('.vendedores-link'); // Cambiado a clase
  
  // Variables de estado
  let productosOriginales = [];
  let carrito = [];
  let carritoVendedor = []; // Movido dentro del DOMContentLoaded

  // ===== FUNCIONES PRINCIPALES =====
  
  // ... (mantén todas tus funciones existentes hasta el final del DOMContentLoaded)

  // ===== SISTEMA DE VENDEDORES =====
  
  // Modal de vendedores
  const modalVendedores = document.getElementById('modalVendedores');
  const spanCerrar = document.querySelector('.cerrar');

  // Mostrar modal
  btnVendedores.addEventListener('click', function(e) {
    e.preventDefault();
    cargarProductosParaVendedor();
    modalVendedores.style.display = 'block';
  });

  // Cerrar modal
  spanCerrar.addEventListener('click', function() {
    modalVendedores.style.display = 'none';
  });

  // Cerrar al hacer click fuera
  window.addEventListener('click', function(event) {
    if (event.target == modalVendedores) {
      modalVendedores.style.display = 'none';
    }
  });

  // Cargar productos para vendedor
  function cargarProductosParaVendedor() {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        mostrarProductosParaVendedor(data);
      })
      .catch(error => {
        console.error("Error:", error);
        document.getElementById('listaProductosVendedor').innerHTML = 
          '<p class="error">Error al cargar productos</p>';
      });
  }

  // Mostrar productos en modal
  function mostrarProductosParaVendedor(productos) {
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
          <input type="number" value="0" min="0" class="cantidad" data-id="${producto._id}">
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
  }

  function agregarAlPedido(e) {
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
  }

  function actualizarResumenPedido() {
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
  }

  // Finalizar pedido
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
    const resumen = `Pedido registrado:
      Vendedor: ${nombreVendedor}
      Cliente: ${nombreCliente}
      Total: $${total}`;
    
    console.log(resumen);
    mostrarNotificacion(`Pedido de $${total} registrado`);
    
    // Resetear
    carritoVendedor = [];
    document.getElementById('nombreCliente').value = '';
    document.querySelectorAll('.cantidad').forEach(input => input.value = 0);
    actualizarResumenPedido();
  });

  // ===== INICIALIZACIÓN =====
  cargarProductos();
});