# AI Performance Feedback Setup Guide

## Overview
The application now uses **Google Gemini AI** to generate personalized performance feedback for students based on their test results.

## Features
- Real-time AI-powered performance analysis
- Personalized feedback based on accuracy, attempt rate, and weak topics
- JEE-specific benchmarks and recommendations
- Automatic fallback to rule-based suggestions if API is unavailable

## Getting Your Gemini API Key (FREE)

### Step 1: Visit Google AI Studio
Go to: https://aistudio.google.com/app/apikey

### Step 2: Sign in with Google Account
Use your Google account to sign in.

### Step 3: Create API Key
1. Click on **"Get API Key"** or **"Create API Key"**
2. Select "Create API key in new project" (or use existing project)
3. Copy the generated API key

### Step 4: Add to Your .env File
Add the following line to your backend `.env` file:

```bash
GEMINI_API_KEY=your_actual_api_key_here
```

Replace `your_actual_api_key_here` with the key you copied.

### Step 5: Restart Backend Server
Stop and restart your backend server for the changes to take effect:

```bash
cd backend
npm start
```

## API Details

### Endpoint
**POST** `/api/ai/performance-feedback`

### Request Body
```json
{
  "resultId": "65f8a9c0d123456789abcdef"
}
```

### Response
```json
{
  "feedback": "🌟 OUTSTANDING PERFORMANCE!\n\nYou scored 92.5% with excellent accuracy...",
  "source": "gemini",
  "metadata": {
    "accuracy": "85.2",
    "attemptRate": "92.5",
    "weakTopicsCount": 2
  }
}
```

### Authentication
Requires valid JWT token in `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

## Gemini API Pricing

| Tier | Price | Requests/Min |
|------|-------|--------------|
| **Free** | $0 | 15 RPM |
| **Pay-as-you-go** | $0.00025/request | 1000 RPM |

**For testing and small-scale use, the free tier is sufficient!**

## Fallback Mode

If the Gemini API key is not configured or the API is unavailable:
- The system automatically uses a **rule-based fallback** algorithm
- Students still get performance feedback (just not AI-powered)
- Response includes `"source": "fallback"` to indicate this

## Testing the AI Feature

1. Take a demo test or any test on the platform
2. View the test result page
3. Click **"🤖 Get AI Performance Insights"** button
4. Wait 2-3 seconds for AI analysis
5. Review personalized feedback

## Troubleshooting

### Error: "GEMINI_API_KEY not found"
- Make sure `.env` file exists in `backend/` folder
- Verify the key is named exactly `GEMINI_API_KEY`
- Restart the backend server

### Error: "Failed to generate feedback"
- Check internet connection
- Verify API key is valid (try regenerating from Google AI Studio)
- Check backend console logs for detailed error messages
- System will automatically fallback to rule-based suggestions

### API Rate Limits
If you exceed 15 requests/minute on free tier:
- Wait 1 minute before trying again
- Consider upgrading to pay-as-you-go ($0.00025/request)
- Implement caching to reduce API calls

## Alternative: Using OpenAI Instead

If you prefer OpenAI (ChatGPT) instead of Gemini, update the code in `backend/routes/ai.js`:

```javascript
// Replace Gemini API call with OpenAI
const openaiResponse = await axios.post(
  'https://api.openai.com/v1/chat/completions',
  {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
    temperature: 0.7
  },
  {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  }
);

const aiResponse = openaiResponse.data.choices[0].message.content;
```

Add to `.env`:
```bash
OPENAI_API_KEY=sk-your-openai-key-here
```

Get OpenAI API key from: https://platform.openai.com/api-keys

**Note:** OpenAI charges $0.002 per request (8x more expensive than Gemini)

## Production Deployment

### Render.com
1. Go to your backend service dashboard
2. Navigate to **Environment** tab
3. Add environment variable:
   - Key: `GEMINI_API_KEY`
   - Value: Your API key
4. Click **Save Changes**
5. Service will auto-redeploy

### Vercel (if backend is on Vercel)
```bash
vercel env add GEMINI_API_KEY
# Paste your API key when prompted
vercel --prod
```

### Railway
```bash
railway variables set GEMINI_API_KEY=your_key_here
```

## Security Best Practices

1. **Never commit API keys to Git**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for documentation

2. **Restrict API key usage**
   - In Google AI Studio, restrict key to your server's IP
   - Set up API quotas and alerts

3. **Monitor usage**
   - Check Google AI Studio dashboard regularly
   - Set up billing alerts if using paid tier

4. **Rate limiting**
   - Consider implementing rate limiting on your endpoint
   - Cache AI responses for identical result IDs

## Support

For issues or questions:
- Check backend console logs: `npm start` output
- Test API key manually: https://aistudio.google.com/
- Review Google AI documentation: https://ai.google.dev/docs
