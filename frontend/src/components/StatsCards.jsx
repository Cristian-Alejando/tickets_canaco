import { motion } from 'framer-motion';

// Definimos la coreografía de la cascada
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15 // Retardo de 0.15s entre cada tarjeta
    }
  }
};

// Definimos la animación de CADA tarjeta
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function StatsCards({ stats }) {
  return (
    // Cambiamos el contenedor padre a motion.div
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
    >
        {/* Tarjeta 1 */}
        <motion.div variants={cardVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition cursor-default">
            <div className="bg-orange-100 p-4 rounded-xl text-orange-600 text-2xl">⚠️</div>
            <div>
                <p className="text-gray-500 text-sm font-medium">Pendientes</p>
                <p className="text-3xl font-bold text-gray-800">{stats.abiertos}</p>
            </div>
        </motion.div>
        
        {/* Tarjeta 2 */}
        <motion.div variants={cardVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition cursor-default">
            <div className="bg-blue-100 p-4 rounded-xl text-blue-600 text-2xl">🛠️</div>
            <div>
                <p className="text-gray-500 text-sm font-medium">En Proceso</p>
                <p className="text-3xl font-bold text-gray-800">{stats.proceso}</p>
            </div>
        </motion.div>
        
        {/* Tarjeta 3 */}
        <motion.div variants={cardVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition cursor-default">
            <div className="bg-green-100 p-4 rounded-xl text-green-600 text-2xl">✅</div>
            <div>
                <p className="text-gray-500 text-sm font-medium">Resueltos</p>
                <p className="text-3xl font-bold text-gray-800">{stats.resueltos}</p>
            </div>
        </motion.div>
    </motion.div>
  );
}