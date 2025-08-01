import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import RouteMap from '../components/RouteMap';

const RoutesPage = () => {
  const [couriers, setCouriers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [routePoints, setRoutePoints] = useState([]);

  useEffect(() => {
    fetchCouriers();
    fetchOrders();
  }, []);

  const fetchCouriers = async () => {
    const { data, error } = await supabase.from('couriers').select('*');
    if (!error) setCouriers(data);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(coordinates)')
      .eq('status', 'pending');

    if (!error) setOrders(data);
  };

  const addOrderToRoute = (order) => {
    setSelectedOrders([...selectedOrders, order]);
  };

  const removeOrderFromRoute = (orderId) => {
    setSelectedOrders(selectedOrders.filter(order => order.id !== orderId));
  };

  const createRoute = async () => {
    if (!selectedCourier || selectedOrders.length === 0) return;

    const orderIds = selectedOrders.map(order => order.id);
    
    const { error } = await supabase
      .from('routes')
      .insert({
        courier_id: selectedCourier,
        orders: orderIds
      });

    if (!error) {
      // Atualizar status dos pedidos
      await Promise.all(
        selectedOrders.map(order => 
          supabase
            .from('purchase_orders')
            .update({ status: 'in_transit' })
            .eq('id', order.id)
        )
      );
      
      alert('Rota criada com sucesso!');
      setSelectedOrders([]);
      fetchOrders();
    }
  };

  // Converter coordenadas para pontos no mapa
  useEffect(() => {
    const points = selectedOrders
      .map(order => {
        if (order.suppliers?.coordinates) {
          const [lng, lat] = order.suppliers.coordinates.coordinates;
          return [lat, lng];
        }
        return null;
      })
      .filter(point => point !== null);
    
    setRoutePoints(points);
  }, [selectedOrders]);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Criação de Rotas</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="mb-6">
            <label className="block mb-2">Selecionar Motoboy:</label>
            <select
              value={selectedCourier}
              onChange={(e) => setSelectedCourier(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Selecione um motoboy</option>
              {couriers.map(courier => (
                <option key={courier.id} value={courier.id}>
                  {courier.name}
                </option>
              ))}
            </select>
          </div>

          <h2 className="text-xl font-semibold mb-4">Pedidos Pendentes</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {orders.map(order => (
              <div 
                key={order.id} 
                className="p-3 border rounded flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">Pedido #{order.order_number}</div>
                  <div>Valor: R$ {order.total_value.toFixed(2)}</div>
                </div>
                <button
                  onClick={() => addOrderToRoute(order)}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Adicionar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Rota Atual</h2>
          
          <div className="mb-6">
            <button
              onClick={createRoute}
              disabled={!selectedCourier || selectedOrders.length === 0}
              className={`w-full py-2 rounded ${
                selectedCourier && selectedOrders.length > 0 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-300 text-gray-500'
              }`}
            >
              Criar Rota ({selectedOrders.length} pedidos)
            </button>
          </div>
          
          <div className="mb-6 space-y-3 max-h-96 overflow-y-auto">
            {selectedOrders.map(order => (
              <div 
                key={order.id} 
                className="p-3 border rounded flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">Pedido #{order.order_number}</div>
                </div>
                <button
                  onClick={() => removeOrderFromRoute(order.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
          
          <div className="h-96">
            <RouteMap points={routePoints} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutesPage;