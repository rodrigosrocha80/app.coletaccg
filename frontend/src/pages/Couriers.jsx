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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cadastro de Motoboys</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="CPF"
          value={form.cpf}
          onChange={(e) => setForm({ ...form, cpf: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Número CNH"
          value={form.cnh_number}
          onChange={(e) => setForm({ ...form, cnh_number: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          Cadastrar Motoboy
        </button>
      </form>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Motoboys Cadastrados</h2>
        <ul className="space-y-2">
          {couriers.map(courier => (
            <li key={courier.id} className="p-3 bg-gray-100 rounded">
              {courier.name} - {courier.cpf}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Couriers;