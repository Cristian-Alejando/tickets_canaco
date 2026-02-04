export const calcularDias = (fechaInicio, fechaFin = null) => {
    if (!fechaInicio) return 0;
    const inicio = new Date(fechaInicio);
    const fin = fechaFin ? new Date(fechaFin) : new Date(); 
    
    const diferencia = fin - inicio;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24)); 
    
    if (dias === 0) return "Hoy";
    if (dias === 1) return "1 día";
    return `${dias} días`;
};

export const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    return new Date(fecha).toLocaleDateString();
};