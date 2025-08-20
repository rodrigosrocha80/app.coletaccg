const EmailService = require('../services/emailService');

class EmailController {
  constructor() {
    this.emailService = new EmailService();
  }

  // Processar emails manualmente
  async processEmails(req, res) {
    try {
      console.log('Iniciando processamento manual de emails...');
      const processedCount = await this.emailService.processEmails();
      
      res.status(200).json({
        success: true,
        message: `${processedCount} emails processados com sucesso`,
        processedCount
      });
    } catch (error) {
      console.error('Erro no controlador de emails:', error);
      
      // Retornar erro mais específico baseado no tipo
      let errorMessage = 'Erro interno do servidor';
      let statusCode = 500;
      
      if (error.message.includes('authentication') || error.message.includes('login')) {
        errorMessage = 'Erro de autenticação: Verifique as credenciais de email e se a senha de aplicativo está configurada corretamente';
        statusCode = 401;
      } else if (error.message.includes('connection') || error.message.includes('timeout')) {
        errorMessage = 'Erro de conexão: Não foi possível conectar ao servidor de email';
        statusCode = 503;
      } else if (error.message.includes('IMAP')) {
        errorMessage = 'Erro IMAP: Verifique se o IMAP está habilitado na conta de email';
        statusCode = 502;
      }
      
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Testar conexão com o servidor de email
  async testConnection(req, res) {
    try {
      console.log('Testando conexão IMAP...');
      const isConnected = await this.emailService.testConnection();
      
      if (isConnected) {
        res.status(200).json({
          success: true,
          message: 'Conexão IMAP estabelecida com sucesso'
        });
      } else {
        res.status(503).json({
          success: false,
          message: 'Falha na conexão IMAP'
        });
      }
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      
      let errorMessage = 'Erro ao testar conexão';
      if (error.message.includes('authentication')) {
        errorMessage = 'Erro de autenticação: Verifique as credenciais de email';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Timeout na conexão: Verifique a conectividade de rede';
      }
      
      res.status(503).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obter status do processamento de emails
  async getEmailStatus(req, res) {
    try {
      // Aqui você pode implementar lógica para verificar o status
      // Por exemplo, última vez que emails foram processados, quantos emails pendentes, etc.
      
      res.status(200).json({
        success: true,
        message: 'Status do processamento de emails',
        data: {
          lastProcessed: new Date().toISOString(),
          status: 'ready'
        }
      });
    } catch (error) {
      console.error('Erro ao obter status:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter status do processamento de emails'
      });
    }
  }

  // Configurar processamento automático (se necessário)
  async setupAutomaticProcessing(req, res) {
    try {
      const { intervalMinutes = 30 } = req.body;
      
      // Implementar lógica de agendamento automático
      // Por exemplo, usando node-cron ou similar
      
      res.status(200).json({
        success: true,
        message: `Processamento automático configurado para cada ${intervalMinutes} minutos`
      });
    } catch (error) {
      console.error('Erro ao configurar processamento automático:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao configurar processamento automático'
      });
    }
  }
}

module.exports = new EmailController();
