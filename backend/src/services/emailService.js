const Imap = require('imap');
const { simpleParser } = require('mailparser');
const pool = require('../config/database');

class EmailService {
  constructor() {
    this.imapConfig = {
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      host: 'imap.gmail.com', // Altere conforme necessário
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    };
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.imap = new Imap(this.imapConfig);

      this.imap.once('ready', () => {
        resolve();
      });

      this.imap.once('error', (err) => {
        reject(err);
      });

      this.imap.connect();
    });
  }

  async processEmails() {
    try {
      await this.connect();
      const emails = await this.fetchEmailsFromSender('adm@zepp.com.br');
      let processedCount = 0;

      for (const email of emails) {
        const orderInfo = this.extractOrderInfo(email.text);
        if (orderInfo) {
          const saved = await this.saveOrderToDatabase(orderInfo);
          if (saved) processedCount++;
        }
      }

      await this.closeConnection();
      return processedCount;
    } catch (error) {
      console.error('Erro ao processar emails:', error);
      throw error;
    }
  }

  fetchEmailsFromSender(senderEmail) {
    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', false, (err, box) => {
        if (err) reject(err);

        // Buscar emails do remetente específico e não lidos
        this.imap.search([['FROM', senderEmail], 'UNSEEN'], (err, results) => {
          if (err) reject(err);

          if (results.length === 0) {
            resolve([]);
            return;
          }

          const fetch = this.imap.fetch(results, { bodies: '' });
          const emails = [];

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
                });
              });
            });
          });

          fetch.once('error', reject);
          fetch.once('end', () => resolve(emails));
        });
      });
    });
  }

  async closeConnection() {
    if (this.imap) {
      this.imap.end();
    }
  }

  extractOrderInfo(emailText) {
    // Sua lógica de extração aqui (mantenha a mesma)
  }

  async saveOrderToDatabase(orderInfo) {
    // Sua lógica de salvamento aqui (mantenha a mesma)
  }
}

module.exports = EmailService;