import { Routes, Route } from 'react-router-dom';
import Suppliers from './pages/Suppliers';
import Couriers from './pages/Couriers';
import Orders from './pages/Orders';
import RoutesPage from './pages/Routes';
import Navbar from './components/Navbar';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/couriers" element={<Couriers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="*" element={<Suppliers />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;