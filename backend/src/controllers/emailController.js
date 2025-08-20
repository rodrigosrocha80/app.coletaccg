const EmailService = require('../services/emailService');

const emailService = new EmailService();

exports.processEmails = async (req, res) => {
  try {
    const processedCount = await emailService.processEmails();
    res.json({ 
      success: true, 
      message: `Processamento de emails concluído. ${processedCount} pedidos processados.` 
    });
  } catch (error) {
    console.error('Erro no controlador de emails:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor ao processar emails' 
    });
  }
};