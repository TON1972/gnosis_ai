export function generateBaseEmailHtml(content: string, previewText?: string): string {
  const brandNavy = "#1e3a5f";
  const brandGold = "#d4af37";
  const brandCream = "#FFFACD";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gnosis AI</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: ${brandNavy};
    }
    table {
      border-spacing: 0;
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f4f5;
      padding-bottom: 40px;
      padding-top: 40px;
    }
    .main {
      background-color: ${brandCream};
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-spacing: 0;
      color: ${brandNavy};
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: ${brandNavy};
      padding: 30px 20px;
      text-align: center;
      border-bottom: 4px solid ${brandGold};
    }
    .content {
      padding: 40px 30px;
      line-height: 1.6;
      font-size: 16px;
    }
    .content h1, .content h2, .content h3 {
      color: ${brandNavy};
      margin-top: 0;
    }
    .content a {
      color: ${brandGold};
      text-decoration: underline;
    }
    .footer {
      background-color: ${brandNavy};
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
      font-size: 14px;
    }
    .social-links {
      margin-bottom: 20px;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: ${brandGold};
      text-decoration: none;
      font-weight: bold;
    }
    .social-icon {
      width: 24px;
      height: 24px;
      vertical-align: middle;
      margin-right: 5px;
    }
    .footer-text {
      margin: 0;
      color: #a1a1aa;
      font-size: 12px;
      line-height: 1.5;
    }
    .footer-text a {
      color: ${brandGold};
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <!--[if mso]>
    <table width="600" align="center" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
    <![endif]-->
    <table class="main" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="header">
          <a href="https://gnosis-ai-platform.vercel.app" target="_blank">
            <img src="https://gnosis-ai-platform.vercel.app/logo-gnosis.png" alt="Gnosis AI" width="180" style="display: inline-block; max-width: 100%; height: auto;" />
          </a>
        </td>
      </tr>
      <tr>
        <td class="content">
          ${content}
        </td>
      </tr>
      <tr>
        <td class="footer">
          <div class="social-links">
            <a href="https://www.instagram.com/ai.gnosis/" target="_blank">
              <img src="https://img.icons8.com/color/48/000000/instagram-new--v1.png" alt="Instagram" class="social-icon" />
              Instagram
            </a>
            <a href="https://www.youtube.com/@GnosisAIEstudoBiblicos" target="_blank">
              <img src="https://img.icons8.com/color/48/000000/youtube-play.png" alt="YouTube" class="social-icon" />
              YouTube
            </a>
          </div>
          <p class="footer-text">
            © ${new Date().getFullYear()} Gnosis AI. Todos os direitos reservados.
          </p>
          <p class="footer-text">
            Você está recebendo este e-mail porque se cadastrou em nossa plataforma.
          </p>
        </td>
      </tr>
    </table>
    <!--[if mso]>
        </td>
      </tr>
    </table>
    <![endif]-->
  </div>
</body>
</html>
  `;
}
