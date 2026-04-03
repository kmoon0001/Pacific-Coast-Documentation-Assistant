# TheraDoc Production Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying TheraDoc to production environments with security, compliance, and reliability best practices.

## Prerequisites

- Node.js 18+ and npm 9+
- Docker (for containerized deployment)
- Cloud provider account (GCP Cloud Run, AWS, or similar)
- SSL/TLS certificates
- HIPAA-compliant infrastructure
- Monitoring and logging infrastructure

## Pre-Deployment Checklist

### Security
- [ ] All API keys and secrets stored in secure vault (not in code)
- [ ] HTTPS/TLS enabled for all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting configured
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] PII scrubbing enabled and tested
- [ ] Encryption at rest and in transit enabled
- [ ] HIPAA Business Associate Agreement (BAA) signed with cloud provider

### Testing
- [ ] Unit tests passing (>95% coverage)
- [ ] Integration tests passing (>95% coverage)
- [ ] E2E tests passing on staging
- [ ] Performance tests completed
- [ ] Security audit completed
- [ ] Accessibility audit completed

### Documentation
- [ ] API documentation complete
- [ ] Runbook created
- [ ] Troubleshooting guide created
- [ ] Rollback procedures documented
- [ ] Monitoring dashboard configured

### Infrastructure
- [ ] Database backups configured
- [ ] Disaster recovery plan in place
- [ ] Monitoring and alerting configured
- [ ] Log aggregation configured
- [ ] CDN configured (if applicable)

## Deployment Steps

### 1. Build and Test

```bash
# Install dependencies
npm ci

# Run all tests
npm run test:run
npm run test:coverage

# Build application
npm run build

# Verify build
ls -la dist/
```

### 2. Environment Configuration

Create `.env.production`:

```env
# API Configuration
GEMINI_API_KEY=<secure-vault-reference>
APP_URL=https://theradoc.example.com

# Database
DATABASE_URL=<secure-vault-reference>
DATABASE_POOL_SIZE=20

# Security
ENCRYPTION_KEY=<secure-vault-reference>
JWT_SECRET=<secure-vault-reference>

# Monitoring
SENTRY_DSN=<your-sentry-dsn>
LOG_LEVEL=info

# Feature Flags
ENABLE_LOCAL_MODE=false
ENABLE_AUDIT_LOGGING=true
ENABLE_RATE_LIMITING=true
```

### 3. Docker Build (if using containers)

```bash
# Build Docker image
docker build -t theradoc:latest .

# Tag for registry
docker tag theradoc:latest gcr.io/your-project/theradoc:latest

# Push to registry
docker push gcr.io/your-project/theradoc:latest
```

### 4. Database Migration

```bash
# Run migrations
npm run migrate:prod

# Verify migration
npm run migrate:verify
```

### 5. Deploy to Staging

```bash
# Deploy to staging environment
npm run deploy:staging

# Run smoke tests
npm run e2e:staging

# Monitor logs
npm run logs:staging
```

### 6. Production Deployment

```bash
# Deploy to production
npm run deploy:prod

# Verify deployment
npm run health-check:prod

# Monitor metrics
npm run metrics:prod
```

## Deployment Strategies

### Blue-Green Deployment

1. Deploy new version to "green" environment
2. Run smoke tests on green environment
3. Switch traffic from blue to green
4. Keep blue environment as rollback target

### Canary Deployment

1. Deploy new version to 5% of traffic
2. Monitor error rates and performance
3. Gradually increase traffic (10%, 25%, 50%, 100%)
4. Rollback if issues detected

### Rolling Deployment

1. Deploy to one instance at a time
2. Health check each instance
3. Remove from load balancer if unhealthy
4. Continue until all instances updated

## Monitoring and Alerting

### Key Metrics to Monitor

- API response time (target: <2s)
- Error rate (target: <0.1%)
- CPU usage (target: <70%)
- Memory usage (target: <80%)
- Database connection pool usage
- Compliance audit findings

### Alert Thresholds

```
- Error rate > 1% → Critical
- Response time > 5s → Warning
- CPU > 80% → Warning
- Memory > 90% → Critical
- Database connections > 90% → Warning
```

### Logging

All logs should include:
- Timestamp
- Log level
- Context (user ID, session ID, etc.)
- Message
- Stack trace (for errors)

Example log format:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "error",
  "context": "gemini-service",
  "message": "API call failed",
  "error": "Quota exceeded",
  "userId": "user-123",
  "sessionId": "session-456"
}
```

## Rollback Procedures

### Immediate Rollback

```bash
# If critical issues detected
npm run rollback:prod

# Verify rollback
npm run health-check:prod

# Notify team
npm run notify:rollback
```

### Gradual Rollback

1. Reduce traffic to new version to 0%
2. Monitor error rates on old version
3. If stable, complete rollback
4. If issues persist, investigate

## Post-Deployment

### Verification

- [ ] Health checks passing
- [ ] All endpoints responding
- [ ] Database connectivity verified
- [ ] External integrations working
- [ ] Monitoring data flowing
- [ ] Logs being collected

### Performance Baseline

- [ ] Record baseline metrics
- [ ] Compare to pre-deployment
- [ ] Identify any regressions
- [ ] Optimize if needed

### Communication

- [ ] Notify stakeholders of deployment
- [ ] Update status page
- [ ] Document any issues
- [ ] Schedule post-deployment review

## Troubleshooting

### Common Issues

#### High Error Rate
1. Check logs for error patterns
2. Verify database connectivity
3. Check API quota usage
4. Review recent code changes
5. Consider rollback if critical

#### High Response Time
1. Check database query performance
2. Review API call patterns
3. Check for resource contention
4. Consider scaling up
5. Profile application

#### Memory Leak
1. Check for unclosed connections
2. Review event listener cleanup
3. Check for circular references
4. Monitor memory over time
5. Consider restart if critical

### Debug Commands

```bash
# View recent logs
npm run logs:prod --tail=100

# Check health status
npm run health-check:prod

# View metrics
npm run metrics:prod

# SSH into instance (if applicable)
npm run ssh:prod

# View database connections
npm run db:connections:prod
```

## Security Considerations

### API Key Rotation

```bash
# Rotate API keys
npm run rotate-keys:prod

# Update environment variables
# Restart application
npm run restart:prod
```

### Database Backups

```bash
# Create backup
npm run backup:db:prod

# Verify backup
npm run verify:backup:prod

# Restore from backup (if needed)
npm run restore:db:prod --backup-id=<id>
```

### Audit Logging

All operations should be logged:
- User authentication
- Note generation
- Note modifications
- Data access
- Configuration changes

## Compliance

### HIPAA Requirements

- [ ] Encryption at rest and in transit
- [ ] Access controls and authentication
- [ ] Audit logging of all access
- [ ] Data retention policies
- [ ] Breach notification procedures
- [ ] Business Associate Agreement

### Data Retention

- Generated notes: Retain per facility policy (typically 6-7 years)
- Audit logs: Retain for 3 years minimum
- User activity logs: Retain for 1 year minimum
- Backups: Retain for 30 days minimum

## Disaster Recovery

### Recovery Time Objective (RTO)
- Target: 1 hour

### Recovery Point Objective (RPO)
- Target: 15 minutes

### Backup Strategy

1. Daily full backups
2. Hourly incremental backups
3. Replicate to secondary region
4. Test restore procedures monthly

### Disaster Recovery Plan

1. Detect outage
2. Activate DR procedures
3. Restore from backup
4. Verify data integrity
5. Switch traffic to DR environment
6. Notify stakeholders
7. Post-incident review

## Performance Optimization

### Caching Strategy

- Static assets: 1 year cache
- API responses: 5 minute cache
- User data: No cache (always fresh)

### Database Optimization

- Index frequently queried columns
- Archive old audit logs
- Optimize query performance
- Monitor slow queries

### CDN Configuration

- Cache static assets globally
- Compress responses
- Enable HTTP/2
- Use edge locations

## References

- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa/)
- [CMS Documentation Guidelines](https://www.cms.gov/)
- [Cloud Security Best Practices](https://cloud.google.com/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Support

For deployment issues, contact:
- DevOps Team: devops@example.com
- Security Team: security@example.com
- On-call Engineer: [PagerDuty link]
