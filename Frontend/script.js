document.addEventListener('DOMContentLoaded', async () => {
    mostrarSpinner();

    const API_URL = location.hostname.includes('localhost')
        ? 'http://localhost:4000/api'
        : 'https://colchonqn.onrender.com/api';

    try {
        const productosResponse = await fetch(`${API_URL}/productos`);
        if (!productosResponse.ok) throw new Error(`Error HTTP: ${productosResponse.status}`);

        const json = await productosResponse.json();

        if (!json.data || !Array.isArray(json.data)) {
            throw new Error('La respuesta no contiene productos');
        }

        // Filtrar solo productos con Mostrar === 'si'
        const productos = json.data.filter(p => p.Mostrar && p.Mostrar.toLowerCase() === 'si');

        // Inicializar componentes
        initCarousel();
        mostrarProductosDestacados(productos);
        mostrarCategorias(productos);
        setupFiltros(productos);
        setupFormularioContacto();
        mostrarProductos(productos);

    } catch (error) {
        console.error("Error al cargar datos:", error);
        mostrarError();
    } finally {
        ocultarSpinner();
    }
});

function mostrarSpinner() {
    const spinner = document.createElement('div');
    spinner.id = 'spinner-carga';
    spinner.innerHTML = `
        <div class="spinner-overlay">
            <div class="spinner"></div>
        </div>`;
    document.body.appendChild(spinner);
}

function ocultarSpinner() {
    document.getElementById('spinner-carga')?.remove();
}

function initCarousel() {
    const carousel = document.querySelector('.carousel-inner');
    const items = document.querySelectorAll('.carousel-item');
    if (items.length === 0 || !carousel) return;

    let currentIndex = 0;
    const totalItems = items.length;
    let interval;

    const updateIndicators = () => {
        document.querySelectorAll('.carousel-indicators span').forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });
    };

    const goToSlide = (index) => {
        currentIndex = (index + totalItems) % totalItems;
        carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateIndicators();
    };

    const startAutoPlay = () => {
        interval = setInterval(() => goToSlide(currentIndex + 1), 5000);
    };

    document.querySelector('.carousel-control.next')?.addEventListener('click', () => {
        clearInterval(interval);
        goToSlide(currentIndex + 1);
        startAutoPlay();
    });

    document.querySelector('.carousel-control.prev')?.addEventListener('click', () => {
        clearInterval(interval);
        goToSlide(currentIndex - 1);
        startAutoPlay();
    });

    let touchStartX = 0;
    carousel.parentElement.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].clientX;
        clearInterval(interval);
    }, { passive: true });

    carousel.parentElement.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        if (touchEndX < touchStartX - 50) goToSlide(currentIndex + 1);
        if (touchEndX > touchStartX + 50) goToSlide(currentIndex - 1);
        startAutoPlay();
    }, { passive: true });

    startAutoPlay();
}

function mostrarProductosDestacados(productos) {
    const contenedor = document.querySelector('.productos-destacados');
    if (!contenedor) return;

    const destacados = [...productos]
        .sort(() => 0.5 - Math.random())
        .slice(0, 4)
        .map(producto => {
            const urlImagen = producto.Imagen || `https://via.placeholder.com/300x200?text=${encodeURIComponent(producto.Nombre.substring(0, 20))}`;
            const urlLink = producto.Link || null;

            const imagenHTML = urlLink
                ? `<a href="${urlLink}" target="_blank" rel="noopener noreferrer"><div class="producto-destacado-img" style="background-image: url('${urlImagen}')"><span class="etiqueta-oferta">OFERTA</span></div></a>`
                : `<div class="producto-destacado-img" style="background-image: url('${urlImagen}')"><span class="etiqueta-oferta">OFERTA</span></div>`;

            return `
                <div class="producto-destacado">
                    ${imagenHTML}
                    <div class="producto-destacado-info">
                        <h3>${producto.Nombre.substring(0, 30)}${producto.Nombre.length > 30 ? '...' : ''}</h3>
                        <div class="precio">
                            ${producto.Precio != null ? `$${producto.Precio.toLocaleString('es-AR')}` : 'N/A'}
                        </div>
                        <button class="btn ver-detalle" data-nombre="${encodeURIComponent(producto.Nombre)}">Ver Detalle</button>
                    </div>
                </div>
            `;
        }).join('');

    contenedor.innerHTML = destacados;

    contenedor.addEventListener('click', (e) => {
        if (e.target.classList.contains('ver-detalle')) {
            mostrarDetalleProducto(decodeURIComponent(e.target.dataset.nombre));
        }
    });
}

function mostrarCategorias(productos) {
    const contenedor = document.querySelector('.categorias-grid');
    const filtroCategoria = document.getElementById('filtro-categoria');
    if (!contenedor || !filtroCategoria) return;

    const categorias = [...new Set(productos.map(p => p.Categoria))].filter(Boolean);

    filtroCategoria.innerHTML = '<option value="">Todas las categorías</option>' +
        categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('');

    contenedor.innerHTML = categorias.slice(0, 4).map(categoria => {
        const productoCat = productos.find(p => p.Categoria === categoria && p.Imagen);
        const imagenCat = productoCat ? productoCat.Imagen : `https://via.placeholder.com/300x200?text=${encodeURIComponent(categoria)}`;

        return `
            <div class="categoria-card" data-categoria="${categoria}">
                <div class="categoria-img" style="background-image: url('${imagenCat}')"></div>
                <div class="categoria-info">
                    <h3>${categoria}</h3>
                    <p>${productos.filter(p => p.Categoria === categoria).length} productos</p>
                </div>
            </div>
        `;
    }).join('');

    contenedor.addEventListener('click', (e) => {
        const card = e.target.closest('.categoria-card');
        if (card) filtrarPorCategoria(card.dataset.categoria);
    });
}

function mostrarProductos(productos, filtros = {}) {
    const contenedor = document.getElementById('contenedor-productos');
    if (!contenedor) return;

    let resultados = [...productos];

    if (filtros.busqueda) {
        const termino = filtros.busqueda.toLowerCase();
        resultados = resultados.filter(p =>
            p.Nombre?.toLowerCase().includes(termino) ||
            p.Categoria?.toLowerCase().includes(termino)
        );
    }

    if (filtros.categoria) {
        resultados = resultados.filter(p => p.Categoria === filtros.categoria);
    }

    switch(filtros.orden) {
        case 'nombre-asc': resultados.sort((a, b) => a.Nombre?.localeCompare(b.Nombre)); break;
        case 'nombre-desc': resultados.sort((a, b) => b.Nombre?.localeCompare(a.Nombre)); break;
        case 'precio-asc': resultados.sort((a, b) => (a.Precio || 0) - (b.Precio || 0)); break;
        case 'precio-desc': resultados.sort((a, b) => (b.Precio || 0) - (a.Precio || 0)); break;
        default: resultados.sort((a, b) => a.Nombre?.localeCompare(b.Nombre));
    }

    contenedor.innerHTML = resultados.length > 0 ?
        resultados.map(producto => {
            const urlImagen = producto.Imagen || `https://via.placeholder.com/200x150?text=Sin+imagen`;
            const urlLink = producto.Link || null;

            const imagenHTML = urlLink
                ? `<a href="${urlLink}" target="_blank" rel="noopener noreferrer"><img src="${urlImagen}" alt="${producto.Nombre}"></a>`
                : `<img src="${urlImagen}" alt="${producto.Nombre}">`;

            return `
                <div class="producto-card">
                    <div class="producto-header">
                        <h4>${producto.Nombre}</h4>
                        <span class="precio">${producto.Precio != null ? `$${producto.Precio.toLocaleString('es-AR')}` : 'N/A'}</span>
                    </div>
                    <div class="etiquetas">
                        <span class="categoria">${producto.Categoria || 'Sin categoría'}</span>
                    </div>
                    <div class="producto-img">
                        ${imagenHTML}
                    </div>
                    <button class="btn ver-detalle" data-nombre="${encodeURIComponent(producto.Nombre)}">Ver Detalle</button>
                </div>
            `;
        }).join('') :
        `<div class="no-resultados">
            <h3>No se encontraron productos</h3>
            <p>Intenta con otros criterios de búsqueda</p>
        </div>`;

    contenedor.querySelectorAll('.ver-detalle').forEach(btn => {
        btn.addEventListener('click', () => {
            mostrarDetalleProducto(decodeURIComponent(btn.dataset.nombre));
        });
    });
}

function setupFormularioContacto() {
    const formulario = document.getElementById('formulario-contacto');
    if (!formulario) return;

    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(formulario);
        const data = Object.fromEntries(formData.entries());

        try {
            alert(`Gracias ${data.nombre}, tu mensaje ha sido enviado. Te responderemos a ${data.email} pronto.`);
            formulario.reset();
        } catch (error) {
            console.error('Error al enviar el formulario:', error);
            alert('Error al enviar el mensaje. Por favor intenta nuevamente.');
        }
    });
}

function setupFiltros(productos) {
    const filtroCategoria = document.getElementById('filtro-categoria');
    const busqueda = document.getElementById('busqueda');
    const orden = document.getElementById('orden');

    if (!filtroCategoria || !busqueda || !orden) return;
    const estadoFiltros = { categoria: '', busqueda: '', orden: 'nombre-asc' };
    const aplicarFiltros = () => mostrarProductos(productos, estadoFiltros);
    filtroCategoria.addEventListener('change', e => { estadoFiltros.categoria = e.target.value; aplicarFiltros(); });
    busqueda.addEventListener('input', e => { estadoFiltros.busqueda = e.target.value; aplicarFiltros(); });
    orden.addEventListener('change', e => { estadoFiltros.orden = e.target.value; aplicarFiltros(); });
}

function filtrarPorCategoria(categoria) {
    const filtro = document.getElementById('filtro-categoria');
    if (filtro) {
        filtro.value = categoria;
        filtro.dispatchEvent(new Event('change'));
    }
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
}

function mostrarDetalleProducto(nombre) {
    const modal = document.createElement('div');
    modal.className = 'modal-producto';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <h2>Detalle del producto</h2>
            <p>${nombre}</p>
            <button class="btn cerrar-modal">Cerrar</button>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.cerrar-modal').addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-overlay').addEventListener('click', () => modal.remove());
}

function mostrarError() {
    const contenedor = document.getElementById('contenedor-productos') || document.body;
    contenedor.innerHTML = `
        <div class="error-alert">
            <h3>⚠️ Error al cargar los productos</h3>
            <p>Por favor, recarga la página o inténtalo más tarde.</p>
            <button class="btn" onclick="location.reload()">Recargar</button>
        </div>
    `;
}
