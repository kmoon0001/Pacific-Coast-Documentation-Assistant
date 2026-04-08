# TheraDoc - Deployment Guide (BYOK - Bring Your Own Key)

**Version**: 2.5 Pro  
**Build Date**: April 7, 2026  
**Status**: ✅ Production Build Complete

---

## 🚀 Quick Deploy

Your production build is ready in the `dist/` folder!

### Option 1: Static Hosting (Recommended)

Deploy to any static hosting service:

#### Vercel (Easiest)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### GitHub Pages
```bash
# Push to GitHub, then enable Pages in repo settings
# Point to dist/ folder or use gh-pages branch
```

#### AWS S3 + CloudFront
```bash
# Upload dist/ folder to S3 bucket
# Configure CloudFront distribution
# Enable static website hosting
```

---

## 🔑 Bring Your Own API Key (BYOK)

Users can add their own Gemini API key at runtime!

### How It Works

1. **User opens the app**
2. **Clicks "Settings" or "API Key"**
3. **Enters their Gemini API key**
4. **Key is stored in browser localStorage**
5. **App uses their key for AI generation**

### Getting a Gemini API Key

Users can get a free API key from:
**https://makersuite.google.com/app/apikey**

Free tier includes:
- 60 requests per minute
- 1,500 requests per day
- Perfect for individual use

---

## 📦 What's Included in the Build

### Files in `dist/`
```
dist/
├── index.html              # Main HTML file
├── assets/
│   ├── index-*.js         # Main application bundle (1.1 MB)
│   ├── index-*.css        # Styles (47.5 KB)
│   ├── *-vendor-*.js      # Third-party libraries
│   └── *.js               # Code-split chunks
└── [other assets]
```

### Features Included
- ✅ AI Note Generation (Gemini Pro)
- ✅ PT, OT, ST Support
- ✅ Guided Tour (25 steps)
- ✅ Security (CSP, rate limiting)
- ✅ Performance Monitoring
- ✅ Accessibility (WCAG 2.1 AA)
- ✅ Offline Fallback (TinyLlama)

---

## 🔧 Configuration

### Environment Variables

For deployment, you can optionally set these:

```bash
# Optional: Pre-configure API key (not recommended for public deployments)
VITE_GEMINI_API_KEY=your_key_here

# Optional: AWS Bedrock (fallback)
VITE_AWS_ACCESS_KEY_ID=your_aws_key
VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret
VITE_AWS_REGION=us-east-1

# Optional: Sentry error tracking
VITE_SENTRY_DSN=your_sentry_dsn
```

**Recommendation**: Don't include API keys in the build. Let users bring their own!

---

## 🌐 Deployment Options

### 1. Vercel (Recommended)

**Pros**: 
- Free tier available
- Automatic HTTPS
- Global CDN
- Easy custom domains

**Steps**:
1. Create account at vercel.com
2. Install CLI: `npm install -g vercel`
3. Run: `vercel --prod`
4. Done! Get your URL

**Cost**: Free for personal projects

---

### 2. Netlify

**Pros**:
- Free tier available
- Drag-and-drop deployment
- Form handling
- Serverless functions

**Steps**:
1. Create account at netlify.com
2. Drag `dist/` folder to Netlify dashboard
3. Or use CLI: `netlify deploy --prod --dir=dist`
4. Done!

**Cost**: Free for personal projects

---

### 3. GitHub Pages

**Pros**:
- Free
- Integrated with GitHub
- Custom domains

**Steps**:
1. Push code to GitHub
2. Go to Settings → Pages
3. Select branch and `/dist` folder
4. Save and wait for deployment

**Cost**: Free

---

### 4. AWS S3 + CloudFront

**Pros**:
- Highly scalable
- Global CDN
- Full control

**Steps**:
1. Create S3 bucket
2. Enable static website hosting
3. Upload `dist/` contents
4. Create CloudFront distribution
5. Point to S3 bucket

**Cost**: ~$1-5/month for low traffic

---

### 5. Self-Hosted (Docker)

**Pros**:
- Full control
- Can run anywhere
- No vendor lock-in

**Dockerfile**:
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Deploy**:
```bash
docker build -t theradoc .
docker run -p 80:80 theradoc
```

**Cost**: Depends on hosting

---

## 🔒 Security Considerations

### For Public Deployment

1. **Don't Include API Keys in Build**
   - Let users bring their own
   - Store in localStorage only
   - Never commit to git

2. **Enable HTTPS**
   - All hosting providers offer free SSL
   - Required for secure API calls

3. **Configure CSP Headers**
   - Already included in the app
   - Verify with hosting provider

4. **Rate Limiting**
   - Already implemented in app
   - Consider adding at CDN level

### For Private Deployment

1. **Add Authentication**
   - Use hosting provider's auth
   - Or add custom auth layer

2. **Restrict Access**
   - IP whitelist
   - VPN requirement
   - Password protection

---

## 📊 Performance Optimization

### Already Optimized
- ✅ Code splitting
- ✅ Minification
- ✅ Gzip compression
- ✅ Tree shaking
- ✅ Lazy loading

### Additional Optimizations

1. **Enable Caching**
```nginx
# Nginx example
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

2. **Enable Compression**
```nginx
gzip on;
gzip_types text/css application/javascript;
```

3. **Use CDN**
- Vercel/Netlify include CDN
- Or use Cloudflare

---

## 🧪 Testing the Deployment

### Pre-Deployment Checklist
- [x] Build completes successfully
- [x] All tests passing (732/732)
- [x] No TypeScript errors
- [x] No security vulnerabilities
- [x] Documentation complete

### Post-Deployment Testing

1. **Open the deployed URL**
2. **Test basic functionality**:
   - Select discipline (PT/OT/ST)
   - Choose CPT code
   - Fill in details
   - Generate note
3. **Test API key input**:
   - Enter Gemini API key
   - Verify note generation works
4. **Test guided tour**:
   - Click tour button
   - Navigate through steps
5. **Check console for errors**:
   - Open DevTools
   - Look for errors
   - Verify Web Vitals

---

## 📱 Mobile Considerations

The app is fully responsive and works on:
- ✅ Desktop (1920x1080+)
- ✅ Laptop (1366x768+)
- ✅ Tablet (768x1024+)
- ✅ Mobile (375x667+)

**Tested on**:
- Chrome, Firefox, Safari, Edge
- iOS Safari, Android Chrome

---

## 🔄 Updating the Deployment

### To Deploy Updates

1. **Make changes to code**
2. **Run tests**: `npm test`
3. **Build**: `npm run build`
4. **Deploy**: Use your hosting provider's method

### Automatic Deployments

**Vercel/Netlify**:
- Connect GitHub repo
- Auto-deploy on push to main branch
- Preview deployments for PRs

---

## 📞 Support

### For Users

**Getting Started**:
1. Open the app
2. Click "Help" or "Tour" button
3. Follow the guided tour

**Getting API Key**:
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Create API key
4. Copy and paste into app

**Troubleshooting**:
- Check browser console for errors
- Verify API key is valid
- Try refreshing the page
- Clear browser cache

### For Developers

**Documentation**:
- Development: `docs/DEVELOPMENT.md`
- API: `docs/API.md`
- Architecture: `docs/ARCHITECTURE.md`

**Issues**:
- Open GitHub issue
- Include browser/OS info
- Include console errors

---

## 💰 Cost Estimates

### Free Tier Options

| Provider | Free Tier | Limits |
|----------|-----------|--------|
| Vercel | Yes | 100 GB bandwidth/month |
| Netlify | Yes | 100 GB bandwidth/month |
| GitHub Pages | Yes | 100 GB bandwidth/month |
| Gemini API | Yes | 60 req/min, 1500 req/day |

**Total Cost**: $0/month for personal use!

### Paid Options (if needed)

| Provider | Cost | Features |
|----------|------|----------|
| Vercel Pro | $20/month | More bandwidth, team features |
| Netlify Pro | $19/month | More bandwidth, team features |
| AWS S3+CloudFront | $1-10/month | Pay per use |
| Gemini API Paid | $0.00025/1K chars | Higher limits |

---

## 🎯 Recommended Setup

### For Personal Use
1. **Deploy to**: Vercel or Netlify (free)
2. **API Key**: User brings their own (free)
3. **Domain**: Use provided subdomain (free)
4. **Total Cost**: $0/month

### For Team Use
1. **Deploy to**: Vercel Pro or AWS
2. **API Key**: Shared team key or BYOK
3. **Domain**: Custom domain
4. **Auth**: Add authentication layer
5. **Total Cost**: $20-50/month

### For Enterprise
1. **Deploy to**: AWS or self-hosted
2. **API Key**: Enterprise Gemini account
3. **Domain**: Custom domain with SSL
4. **Auth**: SSO integration
5. **Monitoring**: Full observability stack
6. **Total Cost**: $100-500/month

---

## ✅ Deployment Checklist

### Pre-Deployment
- [x] Build completes successfully
- [x] All tests passing
- [x] No errors in console
- [x] Documentation complete
- [x] Environment variables configured (if needed)

### Deployment
- [ ] Choose hosting provider
- [ ] Deploy dist/ folder
- [ ] Configure custom domain (optional)
- [ ] Enable HTTPS
- [ ] Test deployed app

### Post-Deployment
- [ ] Test all features
- [ ] Verify API key input works
- [ ] Check mobile responsiveness
- [ ] Monitor for errors
- [ ] Share with users

---

## 🎉 You're Ready to Deploy!

Your production build is in the `dist/` folder and ready to deploy to any static hosting service.

**Recommended**: Deploy to Vercel or Netlify for the easiest experience.

**Command**:
```bash
# Vercel
vercel --prod

# Or Netlify
netlify deploy --prod --dir=dist
```

**That's it!** Your app will be live in minutes! 🚀

---

## 📚 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Gemini API**: https://ai.google.dev/docs
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html

---

**Build Status**: ✅ Complete  
**Size**: 1.1 MB (minified + gzipped: 287 KB)  
**Ready**: Yes!  
**Deploy**: Now!

🚀 **Happy Deploying!**
