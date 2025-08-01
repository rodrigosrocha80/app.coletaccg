import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const Couriers = () => {
  const [couriers, setCouriers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    cpf: '',
    cnh_number: '',
    email: ''
  });

  useEffect(() => {
    fetchCouriers();
  }, []);

  const fetchCouriers = async () => {
    const { data, error } = await supabase.from('couriers').select('*');
    if (!error) setCouriers(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('couriers').insert([form]);
    if (!error) {
      setForm({ name: '', cpf: '', cnh_number: '', email: '' });
      fetchCouriers();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cadastro de Motoboys</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Nome Completo</label>
            <input
              type="text"
              placeholder="Nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1">CPF</label>
            <input
              type="text"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Número CNH</label>
            <input
              type="text"
              placeholder="Número da CNH"
              value={form.cnh_number}
              onChange={(e) => setForm({ ...form, cnh_number: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              placeholder="email@exemplo.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Cadastrar Motoboy
        </button>
      </form>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Motoboys Cadastrados</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Nome</th>
                <th className="py-2 px-4 border-b">CPF</th>
                <th className="py-2 px-4 border-b">CNH</th>
                <th className="py-2 px-4 border-b">Email</th>
              </tr>
            </thead>
            <tbody>
              {couriers.map(courier => (
                <tr key={courier.id}>
                  <td className="py-2 px-4 border-b">{courier.name}</td>
                  <td className="py-2 px-4 border-b">{courier.cpf}</td>
                  <td className="py-2 px-4 border-b">{courier.cnh_number}</td>
                  <td className="py-2 px-4 border-b">{courier.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Couriers;