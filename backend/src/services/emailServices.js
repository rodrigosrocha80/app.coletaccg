const Imap = require('imap');
const { simpleParser } = require('mailparser');
const pool = require('../config/database');

class EmailService {
  constructor() {
    this.imap = new Imap({
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });
  }

  connect() {
    this.imap.connect();
    this.imap.once('ready', () => {
      this.openInbox();
    });

    this.imap.once('error', (err) => {
      console.error('Erro de conexão IMAP:', err);
    });
  }

  openInbox() {
    this.imap.openBox('INBOX', false, (err, box) => {
      if (err) throw err;
      
      this.imap.search(['UNSEEN'], (err, results) => {
        if (err) throw err;
        
        if (results.length === 0) {
          console.log('Nenhum email novo encontrado.');
          this.imap.end();
          return;
        }

        const fetch = this.imap.fetch(results, { bodies: '' });
        
        fetch.on('message', (msg, seqno) => {
          msg.on('body', (stream, info) => {
            simpleParser(stream, async (err, parsed) => {
              if (err) throw err;
              
              const orderInfo = this.extractOrderInfo(parsed.text);
              
              if (orderInfo) {
                await this.saveOrderToDatabase(orderInfo);
              }
            });
          });
        });

        fetch.once('error', (err) => {
          console.error('Erro ao buscar emails:', err);
        });

        fetch.once('end', () => {
          console.log('Processamento de emails concluído.');
          this.imap.end();
        });
      });
    });
  }

  extractOrderInfo(emailText) {
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
      }
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
    }
  }
}

module.exports = EmailService;