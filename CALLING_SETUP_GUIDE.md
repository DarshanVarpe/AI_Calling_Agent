# 📞 Real Calling Integration Guide - Aegis Nexus AI

This guide helps you connect your Aegis Nexus AI system to **Exotel** or **Twilio** for real outbound calls to on-call engineers during a security incident or server outage.

## 🎯 What You'll Get

✅ **Real Phone Calls**: Make actual automated calls to engineers using cloud telephony
✅ **AI-Powered Conversations**: Aria handles the entire incident diagnosis conversation automatically
✅ **Dynamic Alerting**: Engineers get specific node details and error logs over the phone
✅ **Automated Escalation**: Process your on-call roster automatically
✅ **Cost-Effective**: ₹1.2-1.8 per minute with Indian providers

---

## 🚀 Step 1: Sign Up for Exotel / Twilio

1. **Visit**: [https://my.exotel.com](https://my.exotel.com) or [https://twilio.com](https://twilio.com)
2. **Choose Plan**: "Startup Plan" or "Business Plan" (based on volume)
3. **Get Credentials**: Note down your:
   - Account SID
   - Auth Token
   - Phone Number

---

## 🔧 Step 2: Configure Your System

### Add Telephony Credentials
Copy `.env.exotel.example` to your `.env` file and update:

```env
# ── EXOTEL CREDENTIALS ──────────────────────────────
EXOTEL_SID=your_account_sid_here
EXOTEL_TOKEN=your_auth_token_here
EXOTEL_FROM_NUMBER=your_exotel_number_here

# ── TWILIO CREDENTIALS ──────────────────────────────
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_number_here

# ── WEBHOOK URL (for call handling) ──────────────────
BASE_URL=https://your-domain.com
```

### Set Up Public URL (Required for Webhooks)
Telephony providers need to send call events to your server. Use **ngrok** for testing:

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3001

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Add it to your .env as BASE_URL
```

---

## 🔄 Step 3: Test the Integration

### Start Your Server
```bash
node dashboard-server.js
```

### Test Single Call
```bash
curl -X POST http://localhost:3001/api/exotel/call \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "name": "Test Engineer"}'
```

### Test from Dashboard
1. Open `http://localhost:3001`
2. Go to "Engineers" section
3. Click "Call" next to any engineer
4. Monitor the call flow in server logs

---

## 📋 Step 4: Incident Alerting Campaign

### Prepare Engineer Roster
Ensure your `contacts.csv` has proper format:
```csv
name,phone,team
Rahul Sharma,+919876543210,DevOps
Alice Smith,+919876543211,SecOps
Amit Kumar,+919876543212,Backend
```

### Start Alerting
```bash
curl -X POST http://localhost:3001/api/automation/start \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 5}'
```

---

## 🎯 How the Call Flow Works

1. **🔍 System dials engineer number**
2. **👋 Aria introduces**: "Hi! I'm Aria, the Aegis Nexus Security Copilot..."
3. **📍 Diagnoses Incident**: "The primary database in us-east-1 is down."
4. **🎯 Provides details**: "Latency is over 5000ms. CPU usage is at 99%."
5. **📚 Requests Action**: "Do you want me to initiate a rollback to the previous deployment?"
6. **🎓 Acquires Authorization**: The engineer verbally authorizes the patch.
7. **✅ Acknowledges & Hangs up**: System logs the authorization and ends the call.

---

## 🔍 Monitoring & Logs

### Real-time Monitoring
```bash
# Watch server logs
tail -f server.log

# Monitor call status
curl http://localhost:3001/api/automation/status
```

### Call Analytics
- **Dashboard**: `http://localhost:3001` → View incident statistics
- **Database**: All conversations logged with authorization outcomes
- **CSV Reports**: Exported results

---

## 💡 Pro Tips

### ✅ Best Practices
- **Test thoroughly** with your own phone number first
- **Configure Escalations** – if the primary engineer doesn't pick up, route to the secondary.
- **Review scripts** – ensure Aria's diagnosis terminology matches your infrastructure

### ⚡ Optimization
- **Low Latency TTS**: Use ElevenLabs turbo models for critical fast responses.

---

## 🆘 Troubleshooting

### Common Issues

**❌ "Exotel/Twilio not configured"**
→ Check your `.env` file has correct SIDs and Tokens

**❌ "Webhook failed"**
→ Ensure BASE_URL is publicly accessible (use ngrok)

**❌ "Call failed to connect"**
→ Check phone number format (+91XXXXXXXXXX)

**❌ "TTS not working"**
→ Verify ElevenLabs API key and voice IDs

### Need Help?
- Check server logs for detailed error messages

---

## 🎉 You're Ready!

Your Aegis Nexus AI calling system is now ready to alert your engineering team!

🚀 **Start protecting your infrastructure with AI-driven incident response!**