# TheraDoc Deployment Runbook

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Procedures](#deployment-procedures)
4. [Verification Steps](#verification-steps)
5. [Troubleshooting](#troubleshooting)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring](#monitoring)
8. [Incident Response](#incident-response)

## Environment Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Docker (for containerized deployment)
- SSH access to servers
- AWS CLI (for cloud deployment)
- kubectl (for Kubernetes deployment)

### Environment Variables

Create `.env.production` file:
```bash
VITE_API_URL=https://api.theradoc.example.com
VITE_GEMINI_API_KEY=<production-key>
VITE_ENVIRONMENT=production
VITE_LOG_LEVEL=info
VITE_SENTRY_DSN=<sentry-dsn>
```

### Server Setup

#### Linux Server Setup
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /var/www/theradoc
sudo chown $USER:$USER /var/www/theradoc

# Setup SSL certificates
sudo certbot certonly --standalone -d theradoc.example.com
```

#### Docker Setup
```bash
# Build Docker image
docker build -t theradoc:latest .

# Tag for registry
docker tag theradoc:latest ghcr.io/your-org/theradoc:latest

# Push to registry
docker push ghcr.io/your-org/theradoc:latest
```

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing: `npm run test:run`
- [ ] No linting errors: `npm run lint`
- [ ] Type checking passed: `npm run type-check`
- [ ] Coverage >95%: `npm run test:coverage`
- [ ] E2E tests passing: `npm run e2e`

### Security
- [ ] Security audit passed: `npm audit`
- [ ] No critical vulnerabilities
- [ ] API keys rotated
- [ ] SSL certificates valid
- [ ] CORS headers configured
- [ ] Rate limiting enabled

### Performance
- [ ] Bundle size <500KB: `npm run build`
- [ ] Performance budgets met
- [ ] Web Vitals targets met
- [ ] Database queries optimized
- [ ] Caching configured

### Documentation
- [ ] Deployment guide updated
- [ ] API documentation current
- [ ] Runbook reviewed
- [ ] Incident response plan ready
- [ ] Team notified

### Backup & Recovery
- [ ] Database backup created
- [ ] Previous version tagged
- [ ] Rollback plan documented
- [ ] Recovery procedures tested

## Deployment Procedures

### Staging Deployment

#### Step 1: Build Application
```bash
npm ci
npm run build
```

#### Step 2: Deploy to Staging
```bash
# Using SSH
scp -r dist/* staging-user@staging.example.com:/var/www/staging/

# Or using Docker
docker build -t theradoc:staging .
docker push ghcr.io/your-org/theradoc:staging
kubectl set image deployment/theradoc-staging \
  theradoc=ghcr.io/your-org/theradoc:staging
```

#### Step 3: Verify Staging
```bash
# Check health endpoint
curl https://staging.theradoc.example.com/health

# Run smoke tests
npm run e2e -- --grep "smoke"

# Check logs
ssh staging-user@staging.example.com 'tail -f /var/log/theradoc/app.log'
```

### Production Deployment

#### Step 1: Create Release
```bash
# Tag release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Create GitHub release
gh release create v1.0.0 --generate-notes
```

#### Step 2: Build & Push
```bash
npm ci
npm run build

# Build Docker image
docker build -t theradoc:v1.0.0 .
docker tag theradoc:v1.0.0 ghcr.io/your-org/theradoc:v1.0.0
docker push ghcr.io/your-org/theradoc:v1.0.0
```

#### Step 3: Blue-Green Deployment
```bash
# Deploy to green environment
kubectl apply -f k8s/deployment-green.yaml

# Wait for pods to be ready
kubectl wait --for=condition=ready pod \
  -l app=theradoc,env=green \
  --timeout=300s

# Switch traffic to green
kubectl patch service theradoc -p \
  '{"spec":{"selector":{"env":"green"}}}'

# Monitor for errors
kubectl logs -f deployment/theradoc-green
```

#### Step 4: Verify Production
```bash
# Health check
curl https://theradoc.example.com/health

# Run smoke tests
npm run e2e -- --grep "smoke"

# Check metrics
curl https://metrics.example.com/api/theradoc/health
```

## Verification Steps

### Health Checks
```bash
# API health
curl -X GET https://theradoc.example.com/health

# Database connectivity
curl -X GET https://theradoc.example.com/api/health/db

# Cache status
curl -X GET https://theradoc.example.com/api/health/cache

# External services
curl -X GET https://theradoc.example.com/api/health/services
```

### Performance Verification
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://theradoc.example.com

# Monitor Core Web Vitals
# Check Sentry dashboard for performance metrics

# Verify bundle size
du -sh dist/
```

### Functional Verification
```bash
# Run E2E tests
npm run e2e

# Test critical workflows
npm run e2e -- --grep "note-generation"
npm run e2e -- --grep "brain-dump"
npm run e2e -- --grep "audit"
```

### Security Verification
```bash
# Check SSL certificate
openssl s_client -connect theradoc.example.com:443

# Verify security headers
curl -I https://theradoc.example.com | grep -i "security\|cache\|x-"

# Check CORS configuration
curl -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS https://theradoc.example.com/api/notes
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
pm2 logs theradoc

# Check port availability
lsof -i :3000

# Check Node.js version
node --version

# Restart application
pm2 restart theradoc
```

#### High Memory Usage
```bash
# Check memory usage
pm2 monit

# Check for memory leaks
node --inspect dist/index.js

# Restart with memory limit
pm2 start dist/index.js --max-memory-restart 500M
```

#### Database Connection Issues
```bash
# Test database connection
psql -h db.example.com -U user -d theradoc -c "SELECT 1"

# Check connection pool
curl https://theradoc.example.com/api/health/db

# Restart database connection
pm2 restart theradoc
```

#### API Latency Issues
```bash
# Check API response times
curl -w "Time: %{time_total}s\n" https://theradoc.example.com/api/notes

# Check database query performance
# Enable query logging in database

# Check cache hit rate
curl https://theradoc.example.com/api/health/cache
```

#### SSL Certificate Issues
```bash
# Check certificate expiration
openssl s_client -connect theradoc.example.com:443 -showcerts

# Renew certificate
sudo certbot renew

# Restart web server
sudo systemctl restart nginx
```

## Rollback Procedures

### Immediate Rollback (< 5 minutes)

#### Step 1: Identify Issue
```bash
# Check error rate
curl https://theradoc.example.com/api/health

# Check logs
pm2 logs theradoc | tail -100
```

#### Step 2: Rollback
```bash
# Using Git
git revert HEAD
npm run build
pm2 restart theradoc

# Or using Docker
docker pull ghcr.io/your-org/theradoc:previous
kubectl set image deployment/theradoc \
  theradoc=ghcr.io/your-org/theradoc:previous
```

#### Step 3: Verify
```bash
# Health check
curl https://theradoc.example.com/health

# Run smoke tests
npm run e2e -- --grep "smoke"
```

### Staged Rollback (5-30 minutes)

#### Step 1: Canary Rollback
```bash
# Route 10% traffic to previous version
kubectl patch service theradoc -p \
  '{"spec":{"selector":{"version":"v1.0.0"}}}'

# Monitor error rate
watch 'curl https://theradoc.example.com/api/health'
```

#### Step 2: Full Rollback
```bash
# If error rate increases, rollback completely
kubectl set image deployment/theradoc \
  theradoc=ghcr.io/your-org/theradoc:v0.9.9
```

### Database Rollback

#### Step 1: Backup Current Data
```bash
# Backup database
pg_dump -h db.example.com -U user theradoc > backup-$(date +%s).sql
```

#### Step 2: Restore Previous Version
```bash
# Restore from backup
psql -h db.example.com -U user theradoc < backup-previous.sql
```

## Monitoring

### Key Metrics to Monitor

#### Application Metrics
- Error rate (target: <0.1%)
- Response time (target: <2s)
- Uptime (target: 99.9%)
- CPU usage (target: <70%)
- Memory usage (target: <500MB)

#### Business Metrics
- Notes generated per hour
- Active users
- Feature usage
- User satisfaction

#### Infrastructure Metrics
- Disk usage
- Network I/O
- Database connections
- Cache hit rate

### Monitoring Setup

#### Prometheus Configuration
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'theradoc'
    static_configs:
      - targets: ['localhost:9090']
```

#### Grafana Dashboard
- Create dashboard for key metrics
- Set up alerts for thresholds
- Configure notification channels

#### Sentry Configuration
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.VITE_ENVIRONMENT,
  tracesSampleRate: 0.1,
});
```

### Alert Configuration

#### Critical Alerts
- Error rate > 1%
- Response time > 5s
- Uptime < 99%
- Disk usage > 90%

#### Warning Alerts
- Error rate > 0.5%
- Response time > 3s
- CPU usage > 80%
- Memory usage > 400MB

## Incident Response

### Incident Severity Levels

#### P1 - Critical
- Service completely down
- Data loss or corruption
- Security breach
- Response time: Immediate

#### P2 - High
- Service degraded
- Partial functionality lost
- Performance issues
- Response time: 15 minutes

#### P3 - Medium
- Minor functionality issues
- Non-critical features affected
- Response time: 1 hour

#### P4 - Low
- Cosmetic issues
- Documentation updates
- Response time: Next business day

### Incident Response Process

#### Step 1: Detect & Alert
```bash
# Automated alerts via Sentry, Datadog, etc.
# Manual detection via monitoring dashboards
```

#### Step 2: Assess Impact
```bash
# Check error rate
# Check affected users
# Check data integrity
```

#### Step 3: Communicate
```bash
# Notify team via Slack
# Update status page
# Notify customers if needed
```

#### Step 4: Mitigate
```bash
# Implement temporary fix
# Scale resources if needed
# Enable fallback mode
```

#### Step 5: Resolve
```bash
# Deploy permanent fix
# Verify resolution
# Monitor for recurrence
```

#### Step 6: Post-Mortem
```bash
# Document incident
# Identify root cause
# Implement preventive measures
# Share learnings with team
```

### Incident Communication Template

```
INCIDENT: [Title]
SEVERITY: [P1/P2/P3/P4]
START TIME: [Time]
STATUS: [Investigating/Mitigating/Resolved]

IMPACT:
- [Impact description]

ACTIONS TAKEN:
- [Action 1]
- [Action 2]

NEXT STEPS:
- [Next step 1]
- [Next step 2]

UPDATES:
[Time] - [Update]
```

## Disaster Recovery

### Recovery Time Objectives (RTO)
- P1 incidents: 15 minutes
- P2 incidents: 1 hour
- P3 incidents: 4 hours

### Recovery Point Objectives (RPO)
- Database: 1 hour
- Application: 15 minutes
- Configuration: Real-time

### Backup Strategy
```bash
# Daily database backups
0 2 * * * pg_dump -h db.example.com -U user theradoc | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz

# Weekly full backups
0 3 * * 0 tar -czf /backups/full-$(date +\%Y\%m\%d).tar.gz /var/www/theradoc

# Monthly archive
0 4 1 * * aws s3 cp /backups/ s3://theradoc-backups/$(date +\%Y\%m)/ --recursive
```

### Recovery Procedures

#### Database Recovery
```bash
# List available backups
ls -la /backups/db-*.sql.gz

# Restore from backup
gunzip < /backups/db-20240101.sql.gz | psql -h db.example.com -U user theradoc
```

#### Application Recovery
```bash
# Restore from backup
tar -xzf /backups/full-20240101.tar.gz -C /var/www/

# Restart application
pm2 restart theradoc
```

## Support & Escalation

### Support Contacts
- **On-Call Engineer**: [Contact info]
- **Engineering Lead**: [Contact info]
- **DevOps Team**: [Contact info]
- **Security Team**: [Contact info]

### Escalation Path
1. On-call engineer
2. Engineering lead
3. CTO
4. VP Engineering

### Documentation
- [Deployment Guide](./DEPLOYMENT.md)
- [Testing Guide](./TESTING.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [API Documentation](./API.md)

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Maintained By**: DevOps Team
