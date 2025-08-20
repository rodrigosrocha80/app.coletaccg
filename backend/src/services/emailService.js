const Imap = require('imap');
const { simpleParser } = require('mailparser');
const pool = require('../config/database');

class EmailService {
  constructor() {
    this.imapConfig = {
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD, // Corrigido: usar EMAIL_PASSWORD
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { 
        rejectUnauthorized: false,
        servername: 'imap.gmail.com' // Adicionado para melhor compatibilidade
      },
      authTimeout: 10000, // Timeout de autenticação
      connTimeout: 10000, // Timeout de conexão
      keepalive: true // Manter conexão viva
    };
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.imap = new Imap(this.imapConfig);

      this.imap.once('ready', () => {
        console.log('Conexão IMAP estabelecida com sucesso');
        resolve();
      });

      this.imap.once('error', (err) => {
        console.error('Erro na conexão IMAP:', err);
        reject(err);
      });

      this.imap.once('end', () => {
        console.log('Conexão IMAP encerrada');
      });

      // Adicionar timeout manual
      const timeout = setTimeout(() => {
        reject(new Error('Timeout na conexão IMAP'));
      }, 15000);

      this.imap.once('ready', () => {
        clearTimeout(timeout);
      });

      this.imap.connect();
    });
  }

  async processEmails() {
    try {
      console.log('Iniciando processamento de emails...');
      await this.connect();
      
      const emails = await this.fetchEmailsFromSender('adm@zepp.com.br');
      console.log(`Encontrados ${emails.length} emails para processar`);
      
      let processedCount = 0;

      for (const email of emails) {
        try {
          const orderInfo = this.extractOrderInfo(email.text);
          if (orderInfo) {
            const saved = await this.saveOrderToDatabase(orderInfo);
            if (saved) {
              processedCount++;
              console.log(`Email processado com sucesso: ${email.subject}`);
            }
          }
        } catch (emailError) {
          console.error('Erro ao processar email individual:', emailError);
          // Continua processando outros emails mesmo se um falhar
        }
      }

      await this.closeConnection();
      console.log(`Processamento concluído. ${processedCount} emails processados.`);
      return processedCount;
    } catch (error) {
      console.error('Erro ao processar emails:', error);
      await this.closeConnection(); // Garantir que a conexão seja fechada
      throw error;
    }
  }

  fetchEmailsFromSender(senderEmail) {
    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('Erro ao abrir caixa de entrada:', err);
          reject(err);
          return;
        }

        console.log(`Caixa de entrada aberta. Total de mensagens: ${box.messages.total}`);

        // Buscar emails do remetente específico e não lidos
        this.imap.search([['FROM', senderEmail], 'UNSEEN'], (err, results) => {
          if (err) {
            console.error('Erro na busca de emails:', err);
            reject(err);
            return;
          }

          console.log(`Encontrados ${results.length} emails não lidos de ${senderEmail}`);

          if (results.length === 0) {
            resolve([]);
            return;
          }

          const fetch = this.imap.fetch(results, { 
            bodies: '',
            markSeen: false // Não marcar como lido automaticamente
          });
          const emails = [];
          let processedEmails = 0;

          fetch.on('message', (msg, seqno) => {
            let emailBuffer = '';

            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                emailBuffer += chunk.toString('utf8');
              });

              stream.on('end', () => {
                simpleParser(emailBuffer, (err, parsed) => {
                  if (err) {
                    console.error('Erro ao analisar email:', err);
                    return;
                  }
                  emails.push(parsed);
                  processedEmails++;
                  
                  // Verificar se todos os emails foram processados
                  if (processedEmails === results.length) {
                    resolve(emails);
                  }
                });
              });
            });

            msg.once('attributes', (attrs) => {
              console.log(`Processando email ${seqno}: ${attrs.date}`);
            });
          });

          fetch.once('error', (err) => {
            console.error('Erro no fetch de emails:', err);
            reject(err);
          });

          fetch.once('end', () => {
            console.log('Fetch de emails concluído');
            // Se nenhum email foi processado, resolver com array vazio
            if (processedEmails === 0) {
              resolve([]);
            }
          });
        });
      });
    });
  }

  async closeConnection() {
    if (this.imap && this.imap.state !== 'disconnected') {
      try {
        this.imap.end();
        console.log('Conexão IMAP fechada');
      } catch (error) {
        console.error('Erro ao fechar conexão IMAP:', error);
      }
    }
  }

  extractOrderInfo(emailText) {
    try {
      // Implementar sua lógica de extração aqui
      // Exemplo básico de extração de informações do pedido
      const orderPattern = /Pedido\s*#?(\d+)/i;
      const customerPattern = /Cliente:\s*(.+)/i;
      const valuePattern = /Valor:\s*R\$\s*([\d,\.]+)/i;
      
      const orderMatch = emailText.match(orderPattern);
      const customerMatch = emailText.match(customerPattern);
      const valueMatch = emailText.match(valuePattern);
      
      if (orderMatch) {
        return {
          orderNumber: orderMatch[1],
          customer: customerMatch ? customerMatch[1].trim() : null,
          value: valueMatch ? parseFloat(valueMatch[1].replace(',', '.')) : null,
          emailContent: emailText,
          processedAt: new Date()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao extrair informações do pedido:', error);
      return null;
    }
  }

  async saveOrderToDatabase(orderInfo) {
    try {
      const query = `
        INSERT INTO orders (order_number, customer, value, email_content, processed_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (order_number) DO NOTHING
        RETURNING id
      `;
      
      const values = [
        orderInfo.orderNumber,
        orderInfo.customer,
        orderInfo.value,
        orderInfo.emailContent,
        orderInfo.processedAt
      ];
      
      const result = await pool.query(query, values);
      
      if (result.rows.length > 0) {
        console.log(`Pedido ${orderInfo.orderNumber} salvo no banco de dados`);
        return true;
      } else {
        console.log(`Pedido ${orderInfo.orderNumber} já existe no banco de dados`);
        return false;
      }
    } catch (error) {
      console.error('Erro ao salvar pedido no banco de dados:', error);
      return false;
    }
  }

  // Método para testar a conexão
  async testConnection() {
    try {
      await this.connect();
      console.log('Teste de conexão IMAP bem-sucedido!');
      await this.closeConnection();
      return true;
    } catch (error) {
      console.error('Teste de conexão IMAP falhou:', error);
      return false;
    }
  }
}

module.exports = EmailService;