import { MailService } from '@sendgrid/mail';
import queryString from 'query-string';
import jwt from 'jsonwebtoken';

class Mailer {
  constructor() {
    this.sendgrid = new MailService();
    this.sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    this.sendgrid.setSubstitutionWrappers('{{', '}}');
  }

  async sendViewerResetMail(userUrl, domain, user) {
    const token = jwt.sign({
      domainId: domain.id,
      userUrl,
      userId: user.id,
      email: user.email
    }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const query = queryString.stringify({ t: token });
    return await this.sendgrid.send({
      to: user.email,
      from: process.env.SENDGRID_EMAIL,
      templateId: 'd-6fefc2b288524749ba69c45e67d92efb',
      dynamicTemplateData: {
        name: user.displayName,
        reset_url: `https://${domain.domain}/resetPassword?${query}`
      }
    });
  }
}

export default Mailer;
