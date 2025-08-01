import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="font-semibold text-xl">Sistema de Coleta</span>
          </div>
          <div className="flex space-x-4">
            <Link to="/suppliers" className="hover:bg-blue-700 px-3 py-2 rounded">Fornecedores</Link>
            <Link to="/couriers" className="hover:bg-blue-700 px-3 py-2 rounded">Motoboys</Link>
            <Link to="/orders" className="hover:bg-blue-700 px-3 py-2 rounded">Pedidos</Link>
            <Link to="/routes" className="hover:bg-blue-700 px-3 py-2 rounded">Rotas</Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;