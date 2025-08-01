import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    supplier_code: '',
    name: '',
    address: '',
    city: '',
    coordinates: null
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const { data, error } = await supabase.from('suppliers').select('*');
    if (!error) setSuppliers(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('suppliers').insert([form]);
    if (!error) {
      setForm({ supplier_code: '', name: '', address: '', city: '', coordinates: null });
      fetchSuppliers();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cadastro de Fornecedores</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Código do Fornecedor</label>
            <input
              type="text"
              value={form.supplier_code}
              onChange={(e) => setForm({ ...form, supplier_code: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>
        <div>
          <label className="block mb-1">Endereço</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Cidade</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Coordenadas (opcional)</label>
          <input
            type="text"
            placeholder="Ex: -23.550520, -46.633308"
            onChange={(e) => {
              const [lat, lng] = e.target.value.split(',').map(Number);
              if (!isNaN(lat) && !isNaN(lng)) {
                setForm({ ...form, coordinates: `POINT(${lng} ${lat})` });
              }
            }}
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Cadastrar Fornecedor
        </button>
      </form>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Fornecedores Cadastrados</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Código</th>
                <th className="py-2 px-4 border-b">Nome</th>
                <th className="py-2 px-4 border-b">Endereço</th>
                <th className="py-2 px-4 border-b">Cidade</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td className="py-2 px-4 border-b">{supplier.supplier_code}</td>
                  <td className="py-2 px-4 border-b">{supplier.name}</td>
                  <td className="py-2 px-4 border-b">{supplier.address}</td>
                  <td className="py-2 px-4 border-b">{supplier.city}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Suppliers;