export default function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition cursor-default">
            <div className="bg-orange-100 p-4 rounded-xl text-orange-600 text-2xl">⚠️</div>
            <div>
                <p className="text-gray-500 text-sm font-medium">Pendientes</p>
                <p className="text-3xl font-bold text-gray-800">{stats.abiertos}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition cursor-default">
            <div className="bg-blue-100 p-4 rounded-xl text-blue-600 text-2xl">🛠️</div>
            <div>
                <p className="text-gray-500 text-sm font-medium">En Proceso</p>
                <p className="text-3xl font-bold text-gray-800">{stats.proceso}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition cursor-default">
            <div className="bg-green-100 p-4 rounded-xl text-green-600 text-2xl">✅</div>
            <div>
                <p className="text-gray-500 text-sm font-medium">Resueltos</p>
                <p className="text-3xl font-bold text-gray-800">{stats.resueltos}</p>
            </div>
        </div>
    </div>
  );
}