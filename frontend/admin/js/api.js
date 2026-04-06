const BASE_URL = CONFIG.BASE_URL;

const apiCall = async (endpoint, method = 'GET', body = null) => {
    const token = obtenerToken();
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return data;
};

const apiPreguntas = {
    obtenerTodas: () => apiCall('/preguntas'),
    filtrar: (categoria, escuela, evento_id) => {
        let url = '/preguntas/filtrar';
        const params = [];
        if (evento_id) params.push(`evento_id=${evento_id}`);
        if (categoria) params.push(`categoria=${categoria}`);
        if (escuela) params.push(`escuela=${escuela}`);
        if (params.length > 0) url += '?' + params.join('&');
        return apiCall(url);
    },
    crear: (datos) => apiCall('/preguntas', 'POST', datos),
    editar: (id, datos) => apiCall(`/preguntas/${id}`, 'PUT', datos),
    eliminar: (id) => apiCall(`/preguntas/${id}`, 'DELETE')
};

const apiEventos = {
    obtenerTodos: () => apiCall('/eventos'),
    obtenerActivo: () => apiCall('/eventos/activo'),
    crear: (datos) => apiCall('/eventos', 'POST', datos),
    editar: (id, datos) => apiCall(`/eventos/${id}`, 'PUT', datos),
    activar: (id) => apiCall(`/eventos/activar/${id}`, 'PUT'),
    finalizar: (id) => apiCall(`/eventos/finalizar/${id}`, 'PUT'),
    reprogramar: (id, datos) => apiCall(`/eventos/reprogramar/${id}`, 'PUT', datos),
    reabrir: (id) => apiCall(`/eventos/reabrir/${id}`, 'PUT')
};

const apiReportes = {
    estadisticas: (eventoId, fecha) => {
        let url = '/participaciones/estadisticas';
        const params = [];
        if (eventoId) params.push(`evento_id=${eventoId}`);
        if (fecha) params.push(`fecha=${fecha}`);
        if (params.length > 0) url += '?' + params.join('&');
        return apiCall(url);
    },
    metricasPorDia: (eventoId) => apiCall(`/participaciones/metricas-por-dia?evento_id=${eventoId}`),
    exportarExcel: (body) => apiCall('/participaciones/exportar-excel', 'POST', body),
};