# STATUS DO ENVIO DE E-MAIL
Tudo preenchido em js/auth.js: Service ID `service_5bywu2x`, Public Key, template do código `template_jdhjrrl` e template de contato `template_6ek7boh`.
Confira no EmailJS > Email Templates:
- **Contate-nos**: "To Email" = `samanthapaulaa@gmail.com` (fixo) e "Reply To" = `{{email}}`.
- **Senha de uso único**: "To Email" = `{{email}}`; o texto usa `{{passcode}}` e `{{time}}`.
Em Account > Security, coloque o domínio do site em "Allowed origins".

---
# Como ativar o envio REAL de e-mail (EmailJS, grátis)

Sem isso o site fica em "modo simulado": o código aparece na tela de verificação.

1. Crie uma conta em https://www.emailjs.com
2. **Email Services → Add New Service** → conecte seu Gmail/Outlook. Copie o **Service ID**.
3. **Email Templates → Create New Template**
   - To Email: `{{to_email}}`
   - Subject: `Seu código de verificação IncluiPro`
   - Conteúdo:
     Olá, {{to_name}}! Seu código no {{app_name}} é: {{code}}. Vale por {{expires_min}} minutos.
   Salve e copie o **Template ID**.
4. **Account → General** → copie a **Public Key**.
5. Abra `js/auth.js`. No topo está:
   ```js
   var INCLUIPRO_EMAIL = { serviceId: '', templateId: '', publicKey: '' };
   ```
   Cole os 3 valores entre as aspas.
6. Teste abrindo o site por um servidor (não clicando duas vezes no arquivo):
   - local: na pasta do projeto rode `python -m http.server 8000` e abra http://localhost:8000
   - ou publique no Netlify / Vercel / GitHub Pages.
7. (Recomendado) EmailJS → Account → Security: coloque o domínio do seu site em "Allowed origins".

Se o envio falhar, abra o console do navegador (F12): o motivo aparece em "EmailJS erro ...".

Limitação: o código ainda é conferido no navegador (não há servidor). Para produção, use um backend (Supabase/Firebase Auth).
