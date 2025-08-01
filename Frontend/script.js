// ============== SCRIPT COMPLETO ==============

document.addEventListener('DOMContentLoaded', function () {
  // ===== URLs de la API =====
  const API_URL = 'https://colchonqn.onrender.com/api/colchones';
  const CATEGORIAS_URL = 'https://colchonqn.onrender.com/api/categorias';

  // ===== Elementos del DOM =====
  const productosGrid = document.getElementById('productos-grid');
  const categoriaSelect = document.getElementById('categoria');
  const ordenSelect = document.getElementById('orden');
  const searchInput = document.getElementById('searchInput');
  const cartCount = document.querySelector('.cart-count');
  const btnVendedores = document.querySelector('.vendedores-link');
  const modalVendedores = document.getElementById('modalVendedores');
  const modalCarrito = document.getElementById('modalCarrito');
  const spanCerrar = document.querySelectorAll('.cerrar');
  const filtroCategoriaVendedor = document.getElementById('filtroCategoriaVendedor');

  // ===== Datos de localidades por provincia =====
  const LOCALIDADES_POR_PROVINCIA = {
    "Río Negro": [
      "San Carlos de Bariloche", "General Roca", "Cipolletti", "Viedma",
      "Villa Regina", "Allen", "Cinco Saltos", "San Antonio Oeste", "El Bolsón",
      "Catriel", "Choele Choel", "Cervantes", "Chichinales", "Chimpay",
      "Campo Grande", "General Fernández Oro", "Ingeniero Luis A. Huergo",
      "Mainqué", "Maquinchao", "General Conesa", "Dina Huapi", "Río Colorado",
      "Sierra Grande", "Lamarque", "Luis Beltrán", "Los Menucos", "Valcheta",
      "Pilcaniyeu", "Pomona", "Darwin"
    ],
    "Neuquén": [
      "Neuquén", "Plottier", "Centenario", "Zapala", "Cutral‑Co",
      "San Martín de los Andes", "Rincón de los Sauces", "Junín de los Andes",
      "Plaza Huincul", "Chos Malal", "San Patricio del Chañar",
      "Senillosa", "Villa La Angostura",
      "Aluminé", "Andacollo", "Añelo", "Buta Ranquil", "Las Lajas",
      "Las Ovejas", "Loncopué", "Mariano Moreno", "Picún Leufú",
      "Piedra del Águila", "Villa El Chocón", "Villa Pehuenia", "Vista Alegre",
      "Bajada del Agrio", "Barrancas", "Caviahue‑Copahue", "El Cholar",
      "El Huecú", "Huinganco", "Las Coloradas", "Los Miches", "Taquimilán",
      "Tricao Malal"
    ]
  };

  // ===== Variables de estado =====
  let productosOriginales = [];
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  let carritoVendedor = [];

  // ================= FUNCIONES DE INTERFAZ =================
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

  // ================= FUNCIONES PRINCIPALES =================
  const cargarProductos = async () => {
    mostrarCargando();
    try {
      const resp = await fetch(API_URL + '?t=' + new Date().getTime());
      if (!resp.ok) throw new Error('Error HTTP ' + resp.status);
      const cT = resp.headers.get('content-type');
      if (!cT || !cT.includes('application/json')) throw new TypeError('Respuesta no JSON');
      productosOriginales = await resp.json();
      if (!Array.isArray(productosOriginales)) throw new Error('Formato inválido');
      const validos = productosOriginales.filter(p =>
        p.Mostrar?.toLowerCase() === 'si' && p.Imagen?.trim() && p.Nombre?.trim()
      );
      if (!validos.length) return mostrarError('No hay productos disponibles');
      mostrarProductos(validos);
      cargarCategorias();
      cargarCategoriasVendedor();
      setupImageZoom();
      if (carrito.length) actualizarCarrito();
    } catch (e) {
      console.error(e);
      mostrarError(e.message);
    }
  };

  const cargarCategorias = () => {
    categoriaSelect.innerHTML = '<option value="">Todas</option>';
    const cats = [...new Set(productosOriginales.map(p => p.Categoria).filter(Boolean))];
    cats.forEach(c => {
      const o = document.createElement('option');
      o.value = c; o.textContent = c;
      categoriaSelect.appendChild(o);
    });
  };

  const cargarCategoriasVendedor = () => {
    filtroCategoriaVendedor.innerHTML = '<option value="">Todas</option>';
    const cats = [...new Set(productosOriginales.map(p => p.Categoria).filter(Boolean))];
    cats.forEach(c => {
      const o = document.createElement('option');
      o.value = c; o.textContent = c;
      filtroCategoriaVendedor.appendChild(o);
    });
  };

  const mostrarProductos = productos => {
    productosGrid.innerHTML = productos.length === 0
      ? '<p class="no-products">No se encontraron productos.</p>' : '';
    productos.forEach((p, idx) => {
      const div = document.createElement('div');
      div.className = 'producto'; div.style.animationDelay = `${idx*0.1}s`;
      div.innerHTML = `
        <div class="producto-imagen-container">
          <img src="${p.Imagen.trim()}" alt="${p.Nombre.trim()||'Sin nombre'}" loading="lazy"
            onerror="this.onerror=null;this.src='https://via.placeholder.com/300?text=Imagen+no+disponible'">
        </div>
        <div class="producto-info">
          <h3>${p.Nombre||''}</h3>
          <p>${p.Marca||''}</p>
          <p>$${parseInt(p.Precio||0).toLocaleString('es-AR')}</p>
          <span>${p.Categoria||''}</span>
          <button class="btn-comprar" data-id="${p._id}">Agregar al carrito</button>
        </div>
      `;
      productosGrid.appendChild(div);
    });
    document.querySelectorAll('.btn-comprar').forEach(btn => btn.addEventListener('click', agregarAlCarrito));
  };

  const aplicarFiltros = () => {
    const term = searchInput.value.toLowerCase();
    const cat = categoriaSelect.value, ord = ordenSelect.value;
    let arr = productosOriginales.filter(p =>
      (!term || [p.Nombre, p.Marca, p.Categoria].some(s => s?.toLowerCase().includes(term))) &&
      (!cat || p.Categoria === cat)
    );
    if (ord === 'asc') arr.sort((a,b)=>a.Precio - b.Precio);
    if (ord === 'desc') arr.sort((a,b)=>b.Precio - a.Precio);
    mostrarProductos(arr);
  };

  // ================= CARRITO =================
  const agregarAlCarrito = e => {
    const id = e.target.dataset.id;
    const p = productosOriginales.find(x=>x._id===id);
    if (!p) return mostrarNotificacion('Producto no encontrado','error');
    let item = carrito.find(x=>x.id===id);
    item ? item.cantidad++ : carrito.push({id, nombre:p.Nombre, precio:p.Precio, cantidad:1, imagen:p.Imagen});
    actualizarCarrito(); mostrarNotificacion(`${p.Nombre} agregado`);
  };

  const actualizarCarrito = () => {
    const total = carrito.reduce((ac,x)=>ac+x.cantidad,0);
    cartCount.textContent = total;
    cartCount.style.display = total? 'flex':'none';
    localStorage.setItem('carrito', JSON.stringify(carrito));
  };

  const mostrarCarrito = () => {
    const lista = document.getElementById('listaCarrito');
    const detalle = document.getElementById('detalleCarrito');
    const totalEl = document.getElementById('totalCarrito');
    lista.innerHTML = ''; let tot=0;
    if (!carrito.length) {
      lista.innerHTML = '<p>Tu carrito está vacío</p>';
      detalle.innerHTML = '<p>No hay productos en el carrito</p>';
      totalEl.textContent = '0.00'; modalCarrito.style.display = 'block'; return;
    }
    carrito.forEach(it => {
      const p = productosOriginales.find(x=>x._id===it.id);
      const sub = p.Precio * it.cantidad; tot += sub;
      const div = document.createElement('div'); div.className='item-carrito';
      div.innerHTML = `
        <img src="${p.Imagen}" alt="${p.Nombre}">
        <div class="item-carrito-info">
          <h4>${p.Nombre}</h4><p>$${p.Precio.toLocaleString('es-AR')} c/u</p>
        </div>
        <div class="item-carrito-control">
          <button class="restar" data-id="${p._id}">-</button>
          <input type="number" value="${it.cantidad}" min="1" class="cantidad" data-id="${p._id}">
          <button class="sumar" data-id="${p._id}">+</button>
          <button class="btn-eliminar" data-id="${p._id}"><i class="fas fa-trash"></i></button>
        </div>
      `;
      lista.appendChild(div);
    });
    detalle.innerHTML = `<div class="item-pedido"><span>${carrito.length} productos</span><span>$${tot.toFixed(2)}</span></div>`;
    totalEl.textContent = tot.toFixed(2); modalCarrito.style.display='block';
    // handlers sumar/restar/eliminar...
    document.querySelectorAll('.sumar').forEach(b => b.addEventListener('click', e => {
      const id=e.target.dataset.id, it=carrito.find(x=>x.id===id); it.cantidad++; actualizarCarrito(); mostrarCarrito();
    }));
    document.querySelectorAll('.restar').forEach(b => b.addEventListener('click', e => {
      const id=e.target.dataset.id, it=carrito.find(x=>x.id===id);
      if (it.cantidad>1) it.cantidad--, actualizarCarrito(), mostrarCarrito();
    }));
    document.querySelectorAll('.btn-eliminar').forEach(b=>b.addEventListener('click', e=>{
      carrito = carrito.filter(x=>x.id!==e.target.closest('button').dataset.id);
      actualizarCarrito(); mostrarCarrito(); mostrarNotificacion('Producto eliminado');
    }));
  };

  const vaciarCarrito = () => { carrito=[]; actualizarCarrito(); mostrarCarrito(); mostrarNotificacion('Carrito vaciado'); };
  const realizarCompra = () => {
    if (!carrito.length) return mostrarNotificacion('Carrito vacío','error');
    mostrarNotificacion('Compra realizada con éxito!'); setTimeout(()=>{ carrito=[]; actualizarCarrito(); modalCarrito.style.display='none';},2000);
  };

  // ================= ZOOM DE IMAGENES =================
  const setupImageZoom = () => {
    document.addEventListener('click', e => {
      if (e.target.closest('.producto-imagen-container img')) {
        const img = e.target.closest('img'), modal = document.getElementById('modalImagen'), imgAmp = document.getElementById('imagenAmpliada');
        imgAmp.src = img.src; imgAmp.alt = img.alt; modal.classList.add('mostrar');
      }
      if (e.target.classList.contains('cerrar-modal') || (e.target.id==='modalImagen' && e.target.classList.contains('mostrar'))) {
        document.getElementById('modalImagen').classList.remove('mostrar');
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key==='Escape' && document.getElementById('modalImagen').classList.contains('mostrar')) {
        document.getElementById('modalImagen').classList.remove('mostrar');
      }
    });
  };

  // =============== VENDEDOR ===============
  const cargarProductosParaVendedor = () => {
    const cat = filtroCategoriaVendedor.value;
    const arr = cat ? productosOriginales.filter(p=>p.Categoria===cat) : productosOriginales;
    mostrarProductosParaVendedor(arr);
  };
  const mostrarProductosParaVendedor = arr => {
    const lista = document.getElementById('listaProductosVendedor'); lista.innerHTML='';
    arr.forEach(p=>{
      lista.innerHTML += `
        <div class="producto-vendedor">
          <h4>${p.Nombre||''}</h4><p>Marca: ${p.Marca||''}</p>
          <p>Precio: $${parseInt(p.Precio||0).toLocaleString('es-AR')}</p>
          <div class="cantidad-control">
            <button class="restar" data-id="${p._id}">-</button>
            <input type="number" value="0" min="0" class="cantidad" data-id="${p._id}">
            <button class="sumar" data-id="${p._id}">+</button>
          </div>
          <button class="btn-agregar" data-id="${p._id}">Agregar</button>
        </div>
      `;
    });
    document.querySelectorAll('.btn-agregar').forEach(b=>b.addEventListener('click', agregarAlPedido));
    document.querySelectorAll('.sumar').forEach(b=>b.addEventListener('click', e=>{
      const inp = e.target.parentNode.querySelector('.cantidad'); inp.value = parseInt(inp.value)+1;
    }));
    document.querySelectorAll('.restar').forEach(b=>b.addEventListener('click', e=>{
      const inp = e.target.parentNode.querySelector('.cantidad'); if (parseInt(inp.value)>0) inp.value = parseInt(inp.value)-1;
    }));
  };
  const agregarAlPedido = e => {
    const id = e.target.dataset.id;
    const inp = document.querySelector(`.cantidad[data-id="${id}"]`);
    const cant = parseInt(inp.value);
    const p = productosOriginales.find(x=>x._id===id);
    if (!p || cant<=0) return mostrarNotificacion('Cantidad inválida','error');
    const it = carritoVendedor.find(x=>x.id===id);
    if (it) it.cantidad+=cant; else carritoVendedor.push({ id, nombre:p.Nombre, precio:p.Precio, cantidad:cant, imagen:p.Imagen });
    inp.value='0';
    actualizarResumenPedido(); mostrarNotificacion(`${cant} ${p.Nombre} agregado(s)`);
  };
  const actualizarResumenPedido = () => {
    const det = document.getElementById('detallePedido'), totEl = document.getElementById('totalPedido');
    let tot=0;
    det.innerHTML = '';
    carritoVendedor.forEach(it=>{
      const sub = it.precio * it.cantidad; tot += sub;
      det.innerHTML += `<div class="item-pedido"><span>${it.nombre} x${it.cantidad}</span><span>$${sub.toFixed(2)}</span></div>`;
    });
    totEl.textContent = tot.toFixed(2);
  };

  // ===== Funciones nuevas =====
  const cargarLocalidades = () => {
    const provincia = document.getElementById('provinciaCliente');
    const localidad = document.getElementById('localidadCliente');
    provincia.addEventListener('change', function(){
      localidad.innerHTML = '<option value="">Seleccione una localidad</option>';
      localidad.disabled = !this.value;
      if (this.value) {
        LOCALIDADES_POR_PROVINCIA[this.value].forEach(loc => {
          const o = document.createElement('option'); o.value = loc; o.textContent = loc;
          localidad.appendChild(o);
        });
      }
    });
  };

  const enviarPresupuesto = () => {
    const nv = document.getElementById('nombreVendedor').value.trim();
    const nc = document.getElementById('nombreCliente').value.trim();
    const tel = document.getElementById('telefonoCliente').value.trim();
    const prov = document.getElementById('provinciaCliente').value;
    const loc = document.getElementById('localidadCliente').value;
    const dir = document.getElementById('direccionCliente').value.trim();
    const email = document.getElementById('emailCliente').value.trim();
    const tot = document.getElementById('totalPedido').textContent;
    if (!nv||!nc||!tel||!prov||!loc||!carritoVendedor.length) {
      return mostrarNotificacion('Complete todos los campos obligatorios', 'error');
    }
    const items = carritoVendedor.map(it=>`${it.nombre} x${it.cantidad}: $${(it.precio*it.cantidad).toFixed(2)}`).join('\n');
    let body = `Vendedor: ${nv}%0D%0ACliente: ${nc}%0D%0ATeléfono: ${tel}%0D%0AProvincia: ${prov}%0D%0ALocalidad: ${loc}%0D%0A`;
    if (dir) body += `Dirección: ${dir}%0D%0A`;
    if (email) body += `Email: ${email}%0D%0A`;
    body += `%0D%0ADetalle del pedido:%0D%0A${items}%0D%0ATotal: $${tot}%0D%0AFecha: ${new Date().toLocaleDateString()}`;
    window.location.href = `mailto:marianoaliandri@gmail.com?subject=Presupuesto para ${nc}&body=${body.replace(/\s+/g,' ')}`;
  };

  const generarPDF = () => {
    if (!carritoVendedor.length) return mostrarNotificacion('No hay productos en el presupuesto', 'error');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('Presupuesto Colchones Premium', 105, 15, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 25);
    doc.text(`Vendedor: ${document.getElementById('nombreVendedor').value}`, 14, 30);
    doc.text(`Cliente: ${document.getElementById('nombreCliente').value}`, 14, 35);
    doc.text(`Teléfono: ${document.getElementById('telefonoCliente').value}`, 14, 40);
    doc.text(`Provincia: ${document.getElementById('provinciaCliente').value}`, 14, 45);
    doc.text(`Localidad: ${document.getElementById('localidadCliente').value}`, 14, 50);
    let y = 55; const dir = document.getElementById('direccionCliente').value;
    if (dir) { doc.text(`Dirección: ${dir}`, 14, y); y+=5; }
    doc.setFont('helvetica','bold'); doc.text('Detalle del pedido:', 14, y+5);
    doc.setFont('helvetica','normal'); y+=10;
    carritoVendedor.forEach(it => {
      doc.text(`${it.nombre} x${it.cantidad}`, 20, y);
      doc.text(`$${(it.precio*it.cantidad).toFixed(2)}`, 180, y, { align: 'right' });
      y += 7;
    });
    doc.setFont('helvetica','bold');
    doc.text(`Total: $${document.getElementById('totalPedido').textContent}`, 180, y+5, { align: 'right' });
    const clean = document.getElementById('nombreCliente').value.replace(/\s+/g,'_');
    doc.save(`Presupuesto_${clean}.pdf`);
  };

  // ================= EVENT LISTENERS =================
  btnVendedores.addEventListener('click', e => { e.preventDefault(); cargarProductosParaVendedor(); modalVendedores.style.display='block'; });
  spanCerrar.forEach(b => b.addEventListener('click', function(){ this.closest('.modal').style.display='none'; }));
  document.querySelector('.cart-icon').closest('a').addEventListener('click', e => { e.preventDefault(); mostrarCarrito(); });
  document.getElementById('enviarPresupuesto').addEventListener('click', enviarPresupuesto);
  document.getElementById('descargarPresupuesto').addEventListener('click', generarPDF);
  document.getElementById('resetearPresupuesto').addEventListener('click', function(){ carritoVendedor=[]; document.getElementById('nombreCliente').value=''; document.getElementById('emailCliente').value=''; document.querySelectorAll('.cantidad').forEach(i=>i.value=0); actualizarResumenPedido(); mostrarNotificacion('Presupuesto reseteado'); });
  document.getElementById('vaciarCarrito').addEventListener('click', vaciarCarrito);
  document.getElementById('comprarAhora').addEventListener('click', realizarCompra);
  filtroCategoriaVendedor.addEventListener('change', cargarProductosParaVendedor);
  categoriaSelect.addEventListener('change', aplicarFiltros);
  ordenSelect.addEventListener('change', aplicarFiltros);
  searchInput.addEventListener('input', aplicarFiltros);

  // ================= INICIALIZACIÓN FINAL =================
  cargarProductos();
  cargarLocalidades();
});
// ============== FIN SCRIPT ==============