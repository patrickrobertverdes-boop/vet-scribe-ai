# n8n Verification Templates (Final)

Use these templates in your n8n workflow. These are optimized for your webhook structure and use the variables `{{ $json.body.name }}` and `{{ $json.body.verificationLink }}`.

## 1. Signup / First Verification Template
**Subject**: Welcome to VetScribe Pro - Verify Your Identity

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your VetScribe Account</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Logo -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px;">
                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <div style="background-color: #0f172a; width: 40px; height: 40px; border-radius: 10px; display: inline-block; vertical-align: middle; line-height: 40px; color: white; font-weight: bold; font-size: 20px;">V</div>
                        </td>
                    </tr>
                </table>

                <!-- Main Card -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; width: 100%; border-collapse: separate; border-spacing: 0;">
                    <tr>
                        <td style="
                            background-color: #ffffff;
                            border-radius: 20px; 
                            padding: 48px 40px; 
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                        ">
                            <!-- Header -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 24px;">
                                        <h1 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Verify Email Address</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-bottom: 32px;">
                                        <p style="margin: 0; color: #64748b; font-size: 16px; line-height: 26px;">
                                            Hello {{ $json.body.name }}, you've initiated a new VetScribe AI access request. Complete your registration by verifying this email address.
                                        </p>
                                    </td>
                                </tr>
                                <!-- CTA Button -->
                                <tr>
                                    <td align="center" style="padding-bottom: 32px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="border-radius: 12px; background-color: #0f172a;">
                                                    <a href="{{ $json.body.verificationLink }}" target="_blank" style="
                                                        display: inline-block;
                                                        padding: 14px 32px;
                                                        color: #ffffff;
                                                        text-decoration: none;
                                                        font-size: 14px;
                                                        font-weight: 600;
                                                        border-radius: 12px;
                                                        background-color: #0f172a;
                                                    ">Verify Account</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 24px; border-top: 1px solid #f1f5f9;">
                                        <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 20px;">
                                            This link expires in 24 hours. If this wasn't you, safely ignore this message.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px;">
                    <tr>
                        <td align="center" style="padding-top: 24px;">
                            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                                &copy; 2026 VetScribe AI. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

## 2. Resend Link Template
**Subject**: Verification Link Resent - VetScribe Pro

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Link Resent</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
        .wrapper { width: 100%; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 32px; border: 1px solid rgba(226, 232, 240, 0.8); box-shadow: 0 30px 60px -12px rgba(0,0,0,0.1); overflow: hidden; }
        .header { padding: 50px 40px 30px; text-align: center; background: linear-gradient(to bottom, rgba(8,145,178,0.05), transparent); }
        .logo { height: 60px; width: auto; margin-bottom: 24px; }
        .content { padding: 0 40px 50px; text-align: center; color: #1e293b; }
        h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 16px; letter-spacing: -0.03em; }
        p { font-size: 16px; line-height: 1.7; color: #475569; margin-bottom: 32px; }
        .button { display: inline-block; background: linear-gradient(135deg, #0891b2 0%, #4f46e5 100%); color: #ffffff !important; font-size: 13px; font-weight: 800; text-decoration: none; padding: 20px 40px; border-radius: 18px; text-transform: uppercase; letter-spacing: 0.15em; box-shadow: 0 15px 30px -5px rgba(8, 145, 178, 0.4); }
        .footer { padding: 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
        .link { color: #0891b2; text-decoration: none; word-break: break-all; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <img src="https://vets-scribe.web.app/icon.png" alt="VetScribe Logo" class="logo">
                <h1>Verification Link Resent</h1>
            </div>
            
            <div class="content">
                <p>Hello, <strong>{{ $json.body.name }}</strong>. You requested a new verification link for your VetScribe Pro account.</p>
                
                <div style="margin: 32px 0;">
                    <a href="{{ $json.body.verificationLink }}" class="button">Verify My Account</a>
                </div>
                
                <p style="font-size: 13px; color: #64748b;">This link will expire soon for your security. If you didn't request this, you can safely ignore this email.</p>
            </div>

            <div class="footer">
                <p style="margin-bottom: 12px;">Difficulty with the button? Copy this link:</p>
                <a href="{{ $json.body.verificationLink }}" class="link">{{ $json.body.verificationLink }}</a>
                <p style="margin-top: 24px;">&copy; 2026 VetScribe Pro Clinical Intelligence. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
```
