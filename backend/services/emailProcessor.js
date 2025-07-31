export const extractOrderData = (emailBody) => {
  const orderNumber = emailBody.match(/Pedido de Compra: #(\d+)/)?.[1];
  const supplierMatch = emailBody.match(/Fornecedor: (.+?) \((\d+)\)/);
  const valueMatch = emailBody.match(/Valor: R\$\s*([\d.,]+)/);
  
  return {
    orderNumber,
    supplierName: supplierMatch?.[1],
    supplierCode: supplierMatch?.[2],
    totalValue: valueMatch ? parseFloat(valueMatch[1].replace('.', '').replace(',', '.')) : 0
  };
};