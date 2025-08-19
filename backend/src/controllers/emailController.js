const EmailService = require('../services/emailService');

const emailService = new EmailService();

exports.processEmails = async (req, res) => {
  try {
    await emailService.connect();
    res.json({ message: 'Processamento de emails iniciado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};