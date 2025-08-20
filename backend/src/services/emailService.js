const pool = require('../config/database');

class EmailService {
  constructor() {
    console.log('Serviço de email inicializado (modo simulação)');
  }

  async connect() {
    console.log('Simulando conexão com servidor de email...');
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Conexão simulada bem-sucedida');
        resolve();
      }, 1000);
    });
  }

  async processEmails() {
    try {
      await this.connect();
      
      // Simulação de extração de emails - em produção, isso viria de um servidor IMAP real
      const simulatedEmails = [
        `Pedido de Compra: #65408 foi criado em 19/08/2025 00:00 e segue para aprovação.

        Pedido de Compra: #65408
        Fornecedor: MASON EQUIPAMENTOS LTDA. (5167)
        Obra: SINFRA - OBRA SÃO JOÃO BATISTA 2 ª FASE (510)
        Comprador: JEFFERSON
        Data: 19/08/2025
        Valor: R$ 5.148,87
        Centro de Custos: SINFRA - OBRA SÃO JOÃO BATISTA 2 ª FASE (510)
        Departamento: MN-26 KOMATSU GD535-5 (409)`
      ];

      let processedCount = 0;

      for (const emailText of simulatedEmails) {
        const orderInfo = this.extractOrderInfo(emailText);
        if (orderInfo) {
          await this.saveOrderToDatabase(orderInfo);
          processedCount++;
        }
      }

      console.log(`Processamento concluído. ${processedCount} pedidos processados.`);
      return processedCount;
    } catch (error) {
      console.error('Erro ao processar emails:', error);
      throw error;
    }
  }

  extractOrderInfo(emailText) {
    // Expressões regulares para extrair informações do pedido
    const orderNumberMatch = emailText.match(/Pedido de Compra: (#\d+)/);
    const supplierMatch = emailText.match(/Fornecedor: (.+?) \(/);
    const constructionSiteMatch = emailText.match(/Obra: (.+?) \(/);
    const buyerMatch = emailText.match(/Comprador: (.+)/);
    const dateMatch = emailText.match(/Data: (\d{2}\/\d{2}\/\d{4})/);
    const valueMatch = emailText.match(/Valor: R\$\s?([\d.,]+)/);
    const costCenterMatch = emailText.match(/Centro de Custos: (.+?) \(/);
    const departmentMatch = emailText.match(/Departamento: (.+?) \(/);

    if (orderNumberMatch && supplierMatch) {
      return {
        order_number: orderNumberMatch[1],
        supplier: supplierMatch[1],
        construction_site: constructionSiteMatch ? constructionSiteMatch[1] : '',
        buyer: buyerMatch ? buyerMatch[1] : '',
        order_date: dateMatch ? new Date(dateMatch[1].split('/').reverse().join('-')) : new Date(),
        value: valueMatch ? parseFloat(valueMatch[1].replace('.', '').replace(',', '.')) : 0,
        cost_center: costCenterMatch ? costCenterMatch[1] : '',
        department: departmentMatch ? departmentMatch[1] : ''
      };
    }
    
    return null;
  }

  async saveOrderToDatabase(orderInfo) {
    const query = `
      INSERT INTO orders (order_number, supplier, construction_site, buyer, order_date, value, cost_center, department)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (order_number) DO NOTHING
    `;
    
    const values = [
      orderInfo.order_number,
      orderInfo.supplier,
      orderInfo.construction_site,
      orderInfo.buyer,
      orderInfo.order_date,
      orderInfo.value,
      orderInfo.cost_center,
      orderInfo.department
    ];

    try {
      const result = await pool.query(query, values);
      if (result.rowCount > 0) {
        console.log(`Pedido ${orderInfo.order_number} salvo no banco de dados.`);
        return true;
      } else {
        console.log(`Pedido ${orderInfo.order_number} já existe.`);
        return false;
      }
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      throw error;
    }
  }
}

module.exports = EmailService;