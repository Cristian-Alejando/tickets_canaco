export default function Footer() {
    return (
        <footer className="w-full bg-[#003366] text-gray-300 py-10 mt-auto border-t border-blue-900 shadow-inner">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Sección Principal */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-3">
                            Cámara Nacional de Comercio, Servicios y Turismo (CANACO)
                        </h2>
                        <p className="text-sm leading-relaxed text-blue-200 opacity-90 max-w-md">
                            Representando, impulsando y fortaleciendo al comercio formal, los servicios y el turismo a través de servicios de infraestructura, innovación y soporte de calidad para nuestra comunidad empresarial.
                        </p>
                    </div>

                    {/* Información del Sistema */}
                    <div className="md:text-right flex flex-col justify-between h-full">
                        <div className="mb-4">
                            <h3 className="text-md font-semibold text-blue-100 uppercase tracking-widest text-sm mb-2">
                                Plataforma Interna
                            </h3>
                            <p className="text-xs text-blue-300 bg-blue-900/50 inline-block px-3 py-1.5 rounded-lg border border-blue-800">
                                Sistema Interno de Gestión de Mantenimiento y Reportes
                            </p>
                        </div>
                        
                        <div className="text-xs text-blue-400 font-medium">
                            &copy; 2026 CANACO. Todos los derechos reservados.
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
