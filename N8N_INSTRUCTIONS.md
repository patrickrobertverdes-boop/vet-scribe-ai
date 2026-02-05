# n8n Custom Verification Flow

### 1. Webhook Node
- **HTTP Method**: POST
- **Path**: `ad6e1227-ad9a-4483-8bce-720937c9363a`
- **Authentication**: None (or use a header key for extra security)
- **Response Mode**: On Click (Success message)

### 2. Email Template (HTML)
Use this template in your "Gmail" or "SMTP" node. This template matches the **VetScribe Pro** dashboard's high-end aesthetic (mesh background, glassmorphism, and branded blue).

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your VetScribe Account</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background-color: #f8fafc;
            background-image: 
                radial-gradient(at 0% 0%, rgba(8, 145, 178, 0.05) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.05) 0px, transparent 50%);
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }

        .wrapper {
            width: 100%;
            table-layout: fixed;
            padding: 40px 0;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            border: 1px solid rgba(226, 232, 240, 0.8);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
            overflow: hidden;
        }

        .header {
            padding: 40px 40px 20px;
            text-align: center;
        }

        .logo-box {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 48px;
            width: 48px;
            background-color: #0891b2;
            border-radius: 12px;
            margin-bottom: 24px;
        }

        .content {
            padding: 0 40px 40px;
            text-align: center;
            color: #1e293b;
        }

        h1 {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 16px;
            letter-spacing: -0.025em;
        }

        p {
            font-size: 16px;
            line-height: 1.6;
            color: #475569;
            margin-bottom: 32px;
        }

        .button-container {
            margin: 32px 0;
        }

        .button {
            display: inline-block;
            background-color: #0891b2;
            color: #ffffff !important;
            font-size: 14px;
            font-weight: 700;
            text-decoration: none;
            padding: 16px 36px;
            border-radius: 14px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            box-shadow: 0 10px 15px -3px rgba(8, 145, 178, 0.3);
        }

        .footer {
            padding: 32px 40px;
            background-color: #f8fafc;
            border-top: 1px solid #f1f5f9;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
        }

        .link-text {
            word-break: break-all;
            color: #0891b2;
            text-decoration: none;
            font-size: 13px;
        }
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
                <h1>Verify Your Identity</h1>
            </div>
            
            <div class="content">
                <p>Hello, <strong>{{ $json.name }}</strong>. Welcome to VetScribe Pro. To ensure security and grant you access to the clinical intelligence dashboard, please verify your email address.</p>
                
                <div class="button-container">
                    <a href="{{ $json.verificationLink }}" class="button">Verify & Access Dashboard</a>
                </div>
                
                <p style="font-size: 13px; margin-bottom: 0;">Once verified, you will be redirected automatically to your clinical console.</p>
            </div>

            <div class="footer">
                <p style="margin-bottom: 12px; font-size: 12px;">Difficulty with the button? Copy this link:</p>
                <a href="{{ $json.verificationLink }}" class="link-text">{{ $json.verificationLink }}</a>
                <p style="margin-top: 24px; font-size: 11px;">&copy; 2026 VetScribe Pro Clinical Intelligence. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
```

### 3. Redirect Logic
The `verificationLink` generated by the backend is pre-configured to redirect users back to your dashboard (the `/login` route, which auto-redirects to `/` if verified) once the link is clicked. This ensure a seamless "click-to-dashboard" experience.
