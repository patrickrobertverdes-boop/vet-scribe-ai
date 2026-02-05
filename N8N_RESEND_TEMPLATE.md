# n8n Resend Verification Template

Use this HTML in your n8n "Gmail" or "SMTP" node for the **Resend** flow. It uses the same webhook but is phrased as a reminder/resend.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resending Your Verification Link</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
        .wrapper { width: 100%; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid rgba(226,232,240,0.8); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); overflow: hidden; }
        .header { padding: 40px 40px 20px; text-align: center; }
        .logo-box { display: inline-flex; align-items: center; justify-content: center; height: 48px; width: 48px; background-color: #0891b2; border-radius: 12px; margin-bottom: 24px; }
        .content { padding: 0 40px 40px; text-align: center; color: #1e293b; }
        h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 16px; }
        p { font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 32px; }
        .button { display: inline-block; background-color: #0891b2; color: #ffffff !important; font-size: 14px; font-weight: 700; text-decoration: none; padding: 16px 36px; border-radius: 14px; text-transform: uppercase; letter-spacing: 0.1em; }
        .footer { padding: 32px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <div class="logo-box">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                    </svg>
                </div>
                <h1>Verification Link Resent</h1>
            </div>
            
            <div class="content">
                <p>Hello, <strong>{{ $json.name }}</strong>. You requested a new verification link for your VetScribe Pro account. Click the button below to activate your account and access the dashboard.</p>
                
                <div style="margin: 32px 0;">
                    <a href="{{ $json.verificationLink }}" class="button">Verify My Account</a>
                </div>
                
                <p style="font-size: 13px; color: #64748b;">This link will expire soon for your security. If you didn't request this, you can safely ignore this email.</p>
            </div>

            <div class="footer">
                <p style="margin-bottom: 12px;">Difficulty with the button? Copy this link:</p>
                <a href="{{ $json.verificationLink }}" style="color: #0891b2; word-break: break-all;">{{ $json.verificationLink }}</a>
                <p style="margin-top: 24px;">&copy; 2026 VetScribe Pro Clinical Intelligence.</p>
            </div>
        </div>
    </div>
</body>
</html>
```
