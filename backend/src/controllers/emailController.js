const EmailService = require('../services/emailService');

// Criar instância do serviço de email
const emailService = new EmailService();

// Função para processar emails
const processEmails = async (req, res) => {
  try {
    console.log('🚀 Iniciando processamento de emails via controller...');
    
    if (!emailService) {
      throw new Error('EmailService não foi inicializado corretamente');
    }
    
    const processedCount = await emailService.processEmails();
    
    console.log(`✅ Processamento concluído: ${processedCount} emails processados`);
    
    res.status(200).json({ 
      success: true, 
      message: `Processamento de emails concluído. ${processedCount} pedidos processados.`,
      processedCount: processedCount
    });
  } catch (error) {
    console.error('❌ Erro no controlador de emails:', error);
    
    let statusCode = 500;
    let errorMessage = 'Erro interno do servidor ao processar emails';
    
    if (error.message.includes('authentication') || error.message.includes('login')) {
      statusCode = 401;
      errorMessage = 'Erro de autenticação: Verifique as credenciais de email';
    } else if (error.message.includes('connection') || error.message.includes('timeout')) {
      statusCode = 503;
      errorMessage = 'Erro de conexão: Não foi possível conectar ao servidor de email';
    } else if (error.message.includes('IMAP')) {
      statusCode = 502;
      errorMessage = 'Erro IMAP: Verifique se o IMAP está habilitado';
    }
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Função para testar conexão
const testConnection = async (req, res) => {
  try {
    console.log('🔍 Testando conexão IMAP...');
    
    if (!emailService) {
      throw new Error('EmailService não foi inicializado corretamente');
    }
    
    const isConnected = await emailService.testConnection();
    
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
    console.error('❌ Erro no teste de conexão:', error);
    
    let errorMessage = 'Erro ao testar conexão IMAP';
    if (error.message.includes('authentication')) {
      errorMessage = 'Erro de autenticação: Verifique as credenciais de email';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Timeout na conexão: Verifique a conectividade de rede';
    }
    
    res.status(503).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Função para obter status
const getStatus = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Sistema de processamento de emails ativo',
      timestamp: new Date().toISOString(),
      status: 'ready'
    });
  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter status do sistema'
    });
  }
};

// Função para listar pedidos salvos
const listOrders = async (req, res) => {
  try {
    console.log('📋 Listando pedidos salvos...');
    
    const limit = parseInt(req.query.limit) || 10;
    const orders = await emailService.listOrders(limit);
    
    res.status(200).json({
      success: true,
      message: `${orders.length} pedidos encontrados`,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('❌ Erro ao listar pedidos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar pedidos'
    });
  }
};

// Função para testar banco de dados
const testDatabase = async (req, res) => {
  try {
    console.log('🔍 Testando conexão com banco de dados...');
    
    await emailService.testDatabaseConnection();
    
    res.status(200).json({
      success: true,
      message: 'Conexão com banco de dados OK e tabela orders verificada'
    });
  } catch (error) {
    console.error('❌ Erro no teste do banco:', error);
    res.status(503).json({
      success: false,
      error: 'Erro na conexão com banco de dados',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Função para debug - mostrar conteúdo de um email específico
const debugEmail = async (req, res) => {
  try {
    console.log('🐛 Modo debug ativado - processando emails com logs detalhados...');
    
    // Conectar ao IMAP
    await emailService.connect();
    
    // Buscar emails
    const emails = await emailService.fetchEmailsFromSender('adm@zepp.com.br');
    
    if (emails.length === 0) {
      await emailService.closeConnection();
      return res.status(200).json({
        success: true,
        message: 'Nenhum email não lido encontrado',
        emails: []
      });
    }
    
    // Processar apenas o primeiro email para debug
    const email = emails[0];
    const emailContent = email.text || email.html || '';
    
    console.log('📧 Email para debug:', {
      subject: email.subject,
      from: email.from?.text,
      date: email.date,
      contentLength: emailContent.length
    });
    
    // Tentar extrair informações
    const orderInfo = emailService.extractOrderInfo(emailContent, email);
    
    await emailService.closeConnection();
    
    res.status(200).json({
      success: true,
      message: 'Debug concluído',
      debug: {
        totalEmails: emails.length,
        emailSubject: email.subject,
        emailFrom: email.from?.text,
        emailDate: email.date,
        contentPreview: emailContent.substring(0, 1000),
        extractedInfo: orderInfo
      }
    });
  } catch (error) {
    console.error('❌ Erro no debug:', error);
    await emailService.closeConnection();
    res.status(500).json({
      success: false,
      error: 'Erro no modo debug',
      details: error.message
    });
  }
};

// Exportar as funções
module.exports = {
  processEmails,
  testConnection,
  getStatus,
  listOrders,
  testDatabase,
  debugEmail
};

// Também exportar no formato antigo para compatibilidade
exports.processEmails = processEmails;
exports.testConnection = testConnection;
exports.getStatus = getStatus;
exports.listOrders = listOrders;
exports.testDatabase = testDatabase;
exports.debugEmail = debugEmail;
