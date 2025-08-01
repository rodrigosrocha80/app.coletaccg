function extractOrderData(emailBody) {
  const orderNumberMatch = emailBody.match(/Pedido de Compra: #(\d+)/);
  const supplierMatch = emailBody.match(/Fornecedor: (.+?) \((\d+)\)/);
  const valueMatch = emailBody.match(/Valor: R\$\s*([\d.,]+)/);

  if (!orderNumberMatch || !supplierMatch || !valueMatch) {
    throw new Error('Dados essenciais não encontrados no e-mail');
  }

  const orderNumber = orderNumberMatch[1];
  const supplierName = supplierMatch[1];
  const supplierCode = supplierMatch[2];
  const totalValue = parseFloat(valueMatch[1].replace('.', '').replace(',', '.'));

  return {
    orderNumber,
    supplierName,
    supplierCode,
    totalValue
  };
}

module.exports = {
  extractOrderData
};