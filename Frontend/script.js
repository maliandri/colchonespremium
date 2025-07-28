document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = location.hostname.includes('localhost')
        ? 'http://localhost:4000/api'
        : 'https://colchonqn.onrender.com/api';

    try {
        const res = await fetch(`${API_URL}/productos`);
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

        const json = await res.json();
        if (!json.data || !Array.isArray(json.data)) throw new Error('Respuesta inválida');

        const productos = json.data.filter(p => p.Mostrar?.toLowerCase() === 'si');
        const categorias = [...new Set(productos.map(p => p.Categoria).filter(Boolean))];

        renderCategorias(categorias);
        renderProductos(productos);
        setupFiltros(productos);
        setupBusqueda(productos);
        setupOrden(productos);
    } catch (error) {
        console.error('Error al cargar productos:', error);
        document.getElementById('contenedor-productos').innerHTML = `
            <p style="color: red;">Error al cargar productos. Intenta recargar la página.</p>
        `;
    }
});

function renderCategorias(categorias) {
    const contenedor = document.getElementById('categorias-grid');
    if (!contenedor) return;

    contenedor.innerHTML = categorias.map((cat, i) => `
        <div class="categoria-card">
            <div class="categoria-img">
                <img src="assets/categoria${(i % 4) + 1}.jpg" alt="${cat}" />
            </div>
            <div class="categoria-overlay">${cat}</div>
        </div>
    `).join('');

    // Filtro dinámico
    const select = document.getElementById('filtro-categoria');
    if (select) {
        select.innerHTML = '<option value="">Todas</option>' + categorias.map(cat => `
            <option value="${cat.toLowerCase()}">${cat}</option>
        `).join('');
    }
}

function renderProductos(productos) {
    const contenedor = document.getElementById('contenedor-productos');
    if (!contenedor) return;

    if (productos.length === 0) {
        contenedor.innerHTML = '<p>No hay productos para mostrar.</p>';
        return;
    }

    contenedor.innerHTML = productos.map(p => `
        <div class="producto-card">
            <div class="producto-img">
                <img src="${p.Imagen?.trim() || 'https://via.placeholder.com/200x150?text=Sin+imagen'}" alt="${p.Nombre}" />
            </div>
            <div class="producto-info">
                <h3 class="producto-nombre">${p.Nombre}</h3>
                <div class="producto-categoria">${p.Categoria || 'Sin categoría'}</div>
                <div class="producto-precio">${p.Precio != null ? `$${p.Precio.toLocaleString('es-AR')}` : 'Precio no disponible'}</div>
            </div>
        </div>
    `).join('');
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
