import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function Footer() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else {
            Swal.fire({
                title: 'Instalación Manual',
                text: 'Para instalar la app en esta PC o celular: Abre el menú del navegador (⋮ o ⚙️) > Guardar y compartir / Aplicaciones > Instalar página como aplicación',
                icon: 'info',
                confirmButtonColor: '#003366',
                confirmButtonText: 'Entendido'
            });
        }
    };
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
                        <button 
                            onClick={handleInstallClick} 
                            className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-lg shadow-md transition-colors flex items-center border border-blue-500"
                        >
                            📲 Instalar App / Acceso Directo
                        </button>
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
