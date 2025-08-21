const Imap = require('imap');
const { simpleParser } = require('mailparser');
const pool = require('../config/database');

class EmailService {
  constructor() {
    this.imapConfig = {
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { 
        rejectUnauthorized: false,
        servername: 'imap.gmail.com'
      },
      authTimeout: 10000,
      connTimeout: 10000,
      keepalive: true
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
      console.log('=== INICIANDO PROCESSAMENTO DE EMAILS ===');
      
      // Verificar conexão com banco de dados
      await this.testDatabaseConnection();
      
      await this.connect();
      
      const emails = await this.fetchEmailsFromSender('adm@zepp.com.br');
      console.log(`📧 Encontrados ${emails.length} emails para processar`);
      
      let processedCount = 0;
      let extractedCount = 0;
      let savedCount = 0;

      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        console.log(`\n--- Processando email ${i + 1}/${emails.length} ---`);
        console.log(`Assunto: ${email.subject || 'Sem assunto'}`);
        console.log(`De: ${email.from?.text || 'Remetente desconhecido'}`);
        console.log(`Data: ${email.date || 'Data desconhecida'}`);
        
        try {
          // Log do conteúdo do email para debug
          const emailContent = email.text || email.html || '';
          console.log(`📄 Conteúdo do email (primeiros 500 chars):`);
          console.log(emailContent.substring(0, 500) + '...');
          
          const orderInfo = this.extractOrderInfo(emailContent, email);
          
          if (orderInfo) {
            extractedCount++;
            console.log(`✅ Informações extraídas:`, orderInfo);
            
            const saved = await this.saveOrderToDatabase(orderInfo);
            if (saved) {
              savedCount++;
              processedCount++;
              console.log(`💾 Pedido salvo com sucesso no banco de dados`);
            } else {
              console.log(`⚠️ Pedido não foi salvo (pode já existir)`);
            }
          } else {
            console.log(`❌ Nenhuma informação de pedido encontrada neste email`);
          }
        } catch (emailError) {
          console.error(`❌ Erro ao processar email individual:`, emailError);
        }
      }

      await this.closeConnection();
      
      console.log(`\n=== RESUMO DO PROCESSAMENTO ===`);
      console.log(`📧 Total de emails processados: ${emails.length}`);
      console.log(`🔍 Emails com informações extraídas: ${extractedCount}`);
      console.log(`💾 Pedidos salvos no banco: ${savedCount}`);
      console.log(`✅ Processamento concluído com sucesso`);
      
      return processedCount;
    } catch (error) {
      console.error('❌ Erro ao processar emails:', error);
      await this.closeConnection();
      throw error;
    }
  }

  async testDatabaseConnection() {
    try {
      console.log('🔍 Testando conexão com banco de dados...');
      const result = await pool.query('SELECT NOW() as current_time');
      console.log('✅ Conexão com banco de dados OK');
      
      // Verificar se a tabela orders existe
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'orders'
        ) as table_exists;
      `);
      
      if (tableCheck.rows[0].table_exists) {
        console.log('✅ Tabela "orders" encontrada');
        
        // Verificar estrutura da tabela
        const columns = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'orders'
          ORDER BY ordinal_position;
        `);
        
        console.log('📋 Estrutura da tabela "orders":');
        columns.rows.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
        });
      } else {
        console.log('⚠️ Tabela "orders" NÃO encontrada - será criada automaticamente');
        await this.createOrdersTable();
      }
    } catch (error) {
      console.error('❌ Erro ao testar conexão com banco:', error);
      throw error;
    }
  }

  async createOrdersTable() {
    try {
      console.log('🔨 Criando tabela "orders"...');
      
      // Query para criar a tabela com todas as colunas necessárias
      await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          order_number VARCHAR(50) UNIQUE NOT NULL,
          customer VARCHAR(255),
          value DECIMAL(10,2),
          address TEXT,
          phone VARCHAR(50),
          email_content TEXT,
          email_subject VARCHAR(500),
          email_from VARCHAR(255),
          email_date TIMESTAMP,
          status VARCHAR(20) DEFAULT 'PENDENTE',
          fornecedor VARCHAR(255),
          obra VARCHAR(255),
          processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Criar índices para melhor performance
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_orders_processed_at ON orders(processed_at);
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
      `);
      
      console.log('✅ Tabela "orders" e índices criados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar tabela "orders":', error);
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

        console.log(`📬 Caixa de entrada aberta. Total de mensagens: ${box.messages.total}`);

        // Buscar emails do remetente específico e não lidos
        this.imap.search([['FROM', senderEmail], 'UNSEEN'], (err, results) => {
          if (err) {
            console.error('Erro na busca de emails:', err);
            reject(err);
            return;
          }

          console.log(`🔍 Encontrados ${results.length} emails não lidos de ${senderEmail}`);

          if (results.length === 0) {
            resolve([]);
            return;
          }

          const fetch = this.imap.fetch(results, { 
            bodies: '',
            markSeen: false
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
                  
                  if (processedEmails === results.length) {
                    resolve(emails);
                  }
                });
              });
            });

            msg.once('attributes', (attrs) => {
              console.log(`📨 Processando email ${seqno}: ${attrs.date}`);
            });
          });

          fetch.once('error', (err) => {
            console.error('Erro no fetch de emails:', err);
            reject(err);
          });

          fetch.once('end', () => {
            console.log('✅ Fetch de emails concluído');
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
        console.log('🔌 Conexão IMAP fechada');
      } catch (error) {
        console.error('Erro ao fechar conexão IMAP:', error);
      }
    }
  }

  extractOrderInfo(emailContent, emailObj) {
    try {
      console.log('🔍 Iniciando extração de informações do pedido...');
      
      // Padrões mais flexíveis para diferentes formatos de email
      const patterns = {
        // Padrões para número do pedido
        orderNumber: [
          /(?:pedido|order|n[úu]mero|#)\s*:?\s*#?(\d+)/gi,
          /(?:ref|referencia|reference)\s*:?\s*#?(\d+)/gi,
          /#(\d{4,})/g,
          /\b(\d{6,})\b/g
        ],
        
        // Padrões para cliente
        customer: [
          /(?:cliente|customer|nome)\s*:?\s*(.+?)(?:\n|$)/gi,
          /(?:para|to|destinat[áa]rio)\s*:?\s*(.+?)(?:\n|$)/gi,
          /(?:empresa|company)\s*:?\s*(.+?)(?:\n|$)/gi
        ],
        
        // Padrões para valor
        value: [
          /(?:valor|value|total|pre[çc]o)\s*:?\s*r?\$?\s*([\d.,]+)/gi,
          /r\$\s*([\d.,]+)/gi,
          /\$\s*([\d.,]+)/gi
        ],
        
        // Padrões para endereço
        address: [
          /(?:endere[çc]o|address)\s*:?\s*(.+?)(?:\n|$)/gi,
          /(?:rua|street|av|avenida)\s*:?\s*(.+?)(?:\n|$)/gi
        ],
        
        // Padrões para telefone
        phone: [
          /(?:telefone|phone|cel|celular|fone)\s*:?\s*([\d\s\-\(\)]+)/gi,
          /\(?\d{2}\)?\s*\d{4,5}\-?\d{4}/g
        ],
        
        // Padrões para fornecedor
        fornecedor: [
          /(?:fornecedor|supplier|vendedor)\s*:?\s*(.+?)(?:\n|$)/gi,
          /(?:from|de)\s*:?\s*(.+?)(?:\n|$)/gi
        ],
        
        // Padrões para obra
        obra: [
          /(?:obra|project|projeto|local)\s*:?\s*(.+?)(?:\n|$)/gi,
          /(?:destino|destination)\s*:?\s*(.+?)(?:\n|$)/gi
        ]
      };

      const extracted = {};
      let foundAny = false;

      // Extrair número do pedido
      for (const pattern of patterns.orderNumber) {
        const match = pattern.exec(emailContent);
        if (match && match[1]) {
          extracted.orderNumber = match[1].trim();
          foundAny = true;
          console.log(`📋 Número do pedido encontrado: ${extracted.orderNumber}`);
          break;
        }
      }

      // Extrair cliente
      for (const pattern of patterns.customer) {
        const match = pattern.exec(emailContent);
        if (match && match[1]) {
          extracted.customer = match[1].trim().substring(0, 255);
          console.log(`👤 Cliente encontrado: ${extracted.customer}`);
          break;
        }
      }

      // Extrair valor
      for (const pattern of patterns.value) {
        const match = pattern.exec(emailContent);
        if (match && match[1]) {
          const valueStr = match[1].replace(/[^\d.,]/g, '').replace(',', '.');
          extracted.value = parseFloat(valueStr);
          if (!isNaN(extracted.value)) {
            console.log(`💰 Valor encontrado: R$ ${extracted.value}`);
            break;
          }
        }
      }

      // Extrair endereço
      for (const pattern of patterns.address) {
        const match = pattern.exec(emailContent);
        if (match && match[1]) {
          extracted.address = match[1].trim().substring(0, 500);
          console.log(`📍 Endereço encontrado: ${extracted.address}`);
          break;
        }
      }

      // Extrair telefone
      for (const pattern of patterns.phone) {
        const match = pattern.exec(emailContent);
        if (match && match[1]) {
          extracted.phone = match[1].trim();
          console.log(`📞 Telefone encontrado: ${extracted.phone}`);
          break;
        }
      }

      // Extrair fornecedor
      for (const pattern of patterns.fornecedor) {
        const match = pattern.exec(emailContent);
        if (match && match[1]) {
          extracted.fornecedor = match[1].trim().substring(0, 255);
          console.log(`🏭 Fornecedor encontrado: ${extracted.fornecedor}`);
          break;
        }
      }

      // Extrair obra
      for (const pattern of patterns.obra) {
        const match = pattern.exec(emailContent);
        if (match && match[1]) {
          extracted.obra = match[1].trim().substring(0, 255);
          console.log(`🏗️ Obra encontrada: ${extracted.obra}`);
          break;
        }
      }

      // Se não encontrou número do pedido, tentar usar timestamp + hash do email
      if (!extracted.orderNumber && emailObj) {
        const timestamp = Date.now().toString().slice(-6);
        const hash = emailObj.messageId ? emailObj.messageId.slice(-4) : Math.random().toString(36).slice(-4);
        extracted.orderNumber = `AUTO_${timestamp}_${hash}`;
        foundAny = true;
        console.log(`🔄 Número do pedido gerado automaticamente: ${extracted.orderNumber}`);
      }

      if (foundAny) {
        const orderInfo = {
          orderNumber: extracted.orderNumber,
          customer: extracted.customer || 'Cliente não identificado',
          value: extracted.value || null,
          address: extracted.address || null,
          phone: extracted.phone || null,
          fornecedor: extracted.fornecedor || 'Fornecedor não identificado',
          obra: extracted.obra || 'Obra não identificada',
          emailContent: emailContent.substring(0, 5000),
          emailSubject: emailObj?.subject || 'Sem assunto',
          emailFrom: emailObj?.from?.text || 'Remetente desconhecido',
          emailDate: emailObj?.date || new Date(),
          status: 'PENDENTE', // Status inicial sempre PENDENTE
          processedAt: new Date()
        };

        console.log('✅ Informações extraídas com sucesso');
        return orderInfo;
      } else {
        console.log('❌ Nenhuma informação relevante encontrada no email');
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao extrair informações do pedido:', error);
      return null;
    }
  }

  async saveOrderToDatabase(orderInfo) {
    const client = await pool.connect();
    try {
      console.log('💾 Tentando salvar pedido no banco de dados...');
      
      await client.query('BEGIN');

      // Primeiro tenta atualizar
      const updateQuery = `
        UPDATE orders 
        SET customer = $2, value = $3, email_content = $4, status = $5, processed_at = $6,
            address = $7, phone = $8, fornecedor = $9, obra = $10,
            email_subject = $11, email_from = $12, email_date = $13
        WHERE order_number = $1
        RETURNING id
      `;
      
      const values = [
        orderInfo.orderNumber,
        orderInfo.customer,
        orderInfo.value,
        orderInfo.emailContent,
        orderInfo.status || 'PENDENTE',
        orderInfo.processedAt,
        orderInfo.address,
        orderInfo.phone,
        orderInfo.fornecedor,
        orderInfo.obra,
        orderInfo.emailSubject,
        orderInfo.emailFrom,
        orderInfo.emailDate
      ];
      
      console.log('📝 Executando query com valores:', {
        orderNumber: values[0],
        customer: values[1],
        value: values[2],
        status: values[4],
        fornecedor: values[8],
        obra: values[9]
      });
      
      const updateResult = await client.query(updateQuery, values);
      
      if (updateResult.rows.length > 0) {
        console.log(`✅ Pedido ${orderInfo.orderNumber} atualizado com ID ${updateResult.rows[0].id}`);
        await client.query('COMMIT');
        return true;
      }
      
      // Se não atualizou, tenta inserir
      const insertQuery = `
        INSERT INTO orders (
          order_number, customer, value, email_content, 
          status, processed_at, address, phone, fornecedor, obra,
          email_subject, email_from, email_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, order_number
      `;
      
      const insertResult = await client.query(insertQuery, values);
      
      if (insertResult.rows.length > 0) {
        console.log(`✅ Pedido ${insertResult.rows[0].order_number} inserido com ID ${insertResult.rows[0].id}`);
        await client.query('COMMIT');
        return true;
      }
      
      await client.query('COMMIT');
      return false;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro ao salvar pedido no banco de dados:', error);
      console.error('Detalhes do erro:', error.message);
      
      // Se der erro de coluna não existir, tentar com estrutura básica
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('🔄 Tentando salvar com estrutura básica da tabela...');
        return await this.saveOrderBasic(orderInfo);
      }
      
      return false;
    } finally {
      client.release();
    }
  }

  async saveOrderBasic(orderInfo) {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO orders (order_number, customer, value, email_content, status, processed_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, order_number
      `;
      
      const values = [
        orderInfo.orderNumber,
        orderInfo.customer,
        orderInfo.value,
        orderInfo.emailContent,
        'PENDENTE',
        new Date()
      ];
      
      const result = await client.query(query, values);
      
      if (result.rows.length > 0) {
        console.log(`✅ Pedido ${result.rows[0].order_number} salvo com estrutura básica`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro ao salvar com estrutura básica:', error);
      return false;
    } finally {
      client.release();
    }
  }

  async testConnection() {
    try {
      await this.connect();
      console.log('✅ Teste de conexão IMAP bem-sucedido!');
      await this.closeConnection();
      return true;
    } catch (error) {
      console.error('❌ Teste de conexão IMAP falhou:', error);
      return false;
    }
  }

  // Método para listar pedidos salvos
async function listOrders(limit = 10) {
    try {
        const query = `
            SELECT id, order_number, customer, value, status, fornecedor, obra, processed_at
            FROM orders 
            ORDER BY processed_at DESC 
            LIMIT $1
        `;
        
        const result = await pool.query(query, [limit]);
        return result.rows;
    } catch (error) {
        console.error('Erro ao listar pedidos:', error);
        return [];
    }
}
}

module.exports = EmailService;