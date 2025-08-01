import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const Orders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(name)');
      
    if (!error) setOrders(data);
  };

  const updateOrderStatus = async (orderId, status) => {
    const { error } = await supabase
      .from('purchase_orders')
      .update({ status })
      .eq('id', orderId);
      
    if (!error) fetchOrders();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pedidos de Compra</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Número</th>
              <th className="py-2 px-4 border-b">Fornecedor</th>
              <th className="py-2 px-4 border-b">Valor</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Ações</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td className="py-2 px-4 border-b">#{order.order_number}</td>
                <td className="py-2 px-4 border-b">{order.suppliers?.name}</td>
                <td className="py-2 px-4 border-b">R$ {order.total_value.toFixed(2)}</td>
                <td className="py-2 px-4 border-b">
                  <span className={`px-2 py-1 rounded ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {order.status === 'pending' ? 'Pendente' : 
                     order.status === 'in_transit' ? 'Em Trânsito' : 
                     'Concluído'}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'in_transit')}
                      className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                    >
                      Iniciar Coleta
                    </button>
                  )}
                  {order.status === 'in_transit' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="bg-green-500 text-white px-3 py-1 rounded"
                    >
                      Finalizar Coleta
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;