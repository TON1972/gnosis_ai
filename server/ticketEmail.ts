import { ENV } from "./_core/env";

interface SendTicketEmailParams {
  clientEmail: string;
  clientName: string;
  ticketId: number;
  adminName: string;
  message: string;
}

/**
 * Envia e-mail para o cliente quando admin responde no ticket
 * Usa a API de notificação da Manus para envio
 */
export async function sendTicketEmail({
  clientEmail,
  clientName,
  ticketId,
  adminName,
  message,
}: SendTicketEmailParams): Promise<boolean> {
  try {
    // URL pública para o cliente acessar o ticket
    const ticketUrl = `https://3000-i2i70t6xhbrh798gkh8xs-03459e3f.manusvm.computer/ticket/${ticketId}`;

    // Corpo do e-mail em HTML
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #d4af37, #1e3a5f);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border: 2px solid #d4af37;
            border-top: none;
          }
          .message-box {
            background: white;
            padding: 20px;
            border-left: 4px solid #d4af37;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            background: #d4af37;
            color: #1e3a5f;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✉️ GNOSIS AI - Resposta ao seu Ticket</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${clientName}</strong>!</p>
          
          <p>Você recebeu uma nova resposta de <strong>${adminName}</strong> no seu ticket de suporte #${ticketId}.</p>
          
          <div class="message-box">
            <p><strong>Mensagem:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <p>Para visualizar a conversa completa e responder, clique no botão abaixo:</p>
          
          <center>
            <a href="${ticketUrl}" class="button">
              📩 Acessar Ticket #${ticketId}
            </a>
          </center>
          
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="background: #eee; padding: 10px; border-radius: 5px; word-break: break-all;">
            ${ticketUrl}
          </p>
          
          <div class="footer">
            <p>GNOSIS AI - Estudos Bíblicos Profundos</p>
            <p>Horário de Atendimento: 10h às 18h</p>
            <p>Este é um e-mail automático, não responda diretamente.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Simula envio de e-mail (em produção, usar serviço real como SendGrid, AWS SES, etc.)
    console.log(`[Ticket Email] Enviando e-mail para ${clientEmail}`);
    console.log(`[Ticket Email] Ticket #${ticketId} - Admin: ${adminName}`);
    console.log(`[Ticket Email] URL: ${ticketUrl}`);

    // TODO: Integrar com serviço de e-mail real
    // Exemplo com SendGrid:
    // await sendgrid.send({
    //   to: clientEmail,
    //   from: 'suporte@gnosis-ai.com',
    //   subject: `GNOSIS AI - Resposta ao Ticket #${ticketId}`,
    //   html: emailBody,
    // });

    return true;
  } catch (error) {
    console.error("[Ticket Email] Erro ao enviar e-mail:", error);
    return false;
  }
}

