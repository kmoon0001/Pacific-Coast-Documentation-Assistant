# TheraDoc Incident Response Guide

## Overview

This guide provides procedures for responding to incidents affecting TheraDoc. It covers detection, assessment, mitigation, resolution, and post-incident activities.

## Table of Contents
1. [Incident Classification](#incident-classification)
2. [Detection & Alerting](#detection--alerting)
3. [Response Procedures](#response-procedures)
4. [Communication](#communication)
5. [Mitigation Strategies](#mitigation-strategies)
6. [Post-Incident](#post-incident)

## Incident Classification

### Severity Levels

#### P1 - Critical (Immediate Response)
- Service completely unavailable
- Data loss or corruption
- Security breach
- Affects all users
- **Response Time**: Immediate
- **Resolution Target**: 15 minutes

Examples:
- Database down
- Application crash
- Security breach
- Data corruption

#### P2 - High (Urgent Response)
- Service significantly degraded
- Partial functionality lost
- Performance severely impacted
- Affects many users
- **Response Time**: 15 minutes
- **Resolution Target**: 1 hour

Examples:
- API latency >5s
- Error rate >5%
- Memory leak
- Database connection pool exhausted

#### P3 - Medium (Standard Response)
- Service partially impacted
- Non-critical features affected
- Performance issues
- Affects some users
- **Response Time**: 1 hour
- **Resolution Target**: 4 hours

Examples:
- API latency 2-5s
- Error rate 1-5%
- UI bugs
- Feature not working

#### P4 - Low (Scheduled Response)
- Minor issues
- Cosmetic problems
- Documentation updates
- No user impact
- **Response Time**: Next business day
- **Resolution Target**: 1 week

Examples:
- Typos
- UI alignment issues
- Documentation outdated
- Minor performance improvement

## Detection & Alerting

### Monitoring Systems

#### Application Monitoring
```javascript
// Sentry configuration
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.VITE_ENVIRONMENT,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

#### Infrastructure Monitoring
```yaml
# Prometheus alerts
groups:
  - name: theradoc
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 5
        for: 5m
        annotations:
          summary: "High API latency detected"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        annotations:
          summary: "High memory usage detected"
```

#### Custom Alerts
```bash
# Health check script
#!/bin/bash
HEALTH=$(curl -s https://theradoc.example.com/health)
if [ $? -ne 0 ]; then
  # Send alert
  curl -X POST https://alerts.example.com/incident \
    -d '{"severity":"P1","message":"Service down"}'
fi
```

### Alert Channels
- **Slack**: #incidents
- **PagerDuty**: On-call rotation
- **Email**: incidents@theradoc.example.com
- **SMS**: Critical incidents only

## Response Procedures

### Initial Response (0-5 minutes)

#### Step 1: Acknowledge Incident
```bash
# Acknowledge alert in PagerDuty
# Post in #incidents Slack channel
# Start incident timer
```

#### Step 2: Assess Severity
```bash
# Check error rate
curl https://theradoc.example.com/api/health

# Check affected users
# Check data integrity
# Determine if P1, P2, P3, or P4
```

#### Step 3: Assemble Team
```bash
# For P1: Page on-call engineer + lead
# For P2: Page on-call engineer
# For P3: Notify team
# For P4: Schedule for next sprint
```

#### Step 4: Create Incident Channel
```bash
# Create Slack channel: #incident-YYYYMMDD-HHMM
# Invite relevant team members
# Post incident details
```

### Investigation (5-30 minutes)

#### Step 1: Gather Information
```bash
# Check application logs
pm2 logs theradoc | tail -100

# Check system logs
tail -100 /var/log/syslog

# Check database logs
tail -100 /var/log/postgresql/postgresql.log

# Check monitoring dashboards
# Check Sentry for errors
# Check performance metrics
```

#### Step 2: Identify Root Cause
```bash
# Check recent deployments
git log --oneline -10

# Check recent changes
git diff HEAD~1

# Check infrastructure changes
aws ec2 describe-instances

# Check database changes
psql -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

#### Step 3: Determine Impact
```bash
# Affected services
# Affected users
# Data at risk
# Business impact
```

#### Step 4: Document Findings
```
INCIDENT INVESTIGATION

Root Cause: [Description]
Affected Services: [List]
Affected Users: [Count/Percentage]
Data Impact: [Description]
Business Impact: [Description]

Timeline:
- [Time] - Incident detected
- [Time] - Root cause identified
- [Time] - Mitigation started
```

### Mitigation (30-60 minutes)

#### Step 1: Implement Quick Fix
```bash
# Option 1: Restart service
pm2 restart theradoc

# Option 2: Scale resources
kubectl scale deployment theradoc --replicas=5

# Option 3: Enable fallback mode
# Disable expensive operations
# Use cached data
# Reduce feature set

# Option 4: Rollback
git revert HEAD
npm run build
pm2 restart theradoc
```

#### Step 2: Monitor Mitigation
```bash
# Check error rate
watch 'curl https://theradoc.example.com/api/health'

# Check performance
watch 'curl -w "Time: %{time_total}s\n" https://theradoc.example.com/api/notes'

# Check logs
pm2 logs theradoc
```

#### Step 3: Verify Resolution
```bash
# Run smoke tests
npm run e2e -- --grep "smoke"

# Check user reports
# Check monitoring metrics
# Confirm incident resolved
```

### Resolution (60+ minutes)

#### Step 1: Implement Permanent Fix
```bash
# Fix root cause
# Deploy fix to staging
# Test thoroughly
# Deploy to production
```

#### Step 2: Verify Fix
```bash
# Run full test suite
npm run test:run
npm run e2e

# Monitor for recurrence
# Check metrics
# Verify no side effects
```

#### Step 3: Close Incident
```bash
# Update incident status
# Post resolution summary
# Thank team members
# Schedule post-mortem
```

## Communication

### Incident Notification Template

```
🚨 INCIDENT ALERT

Service: TheraDoc
Severity: [P1/P2/P3/P4]
Status: [Investigating/Mitigating/Resolved]
Start Time: [Time]
Duration: [Duration]

Impact:
- [Impact 1]
- [Impact 2]

Actions Taken:
- [Action 1]
- [Action 2]

Next Steps:
- [Next step 1]
- [Next step 2]

Updates:
[Time] - [Update]
[Time] - [Update]
```

### Status Page Updates

#### During Incident
```
INVESTIGATING: TheraDoc API
We are investigating an issue with the TheraDoc API. 
Some users may experience degraded performance.
Last updated: [Time]
```

#### During Mitigation
```
DEGRADED PERFORMANCE: TheraDoc API
We are actively working to resolve an issue affecting the TheraDoc API.
We expect to have this resolved within 30 minutes.
Last updated: [Time]
```

#### After Resolution
```
RESOLVED: TheraDoc API
The issue affecting the TheraDoc API has been resolved.
All services are operating normally.
Last updated: [Time]
```

### Escalation Contacts

#### On-Call Rotation
```
Monday-Friday:
- 9am-5pm: [Engineer 1]
- 5pm-9am: [Engineer 2]

Weekends:
- [Engineer 3]
- [Engineer 4]
```

#### Escalation Path
1. On-call engineer (5 min)
2. Engineering lead (10 min)
3. CTO (15 min)
4. VP Engineering (20 min)

## Mitigation Strategies

### Application Issues

#### High Error Rate
```bash
# Check error logs
pm2 logs theradoc | grep ERROR

# Restart application
pm2 restart theradoc

# If restart fails, rollback
git revert HEAD
npm run build
pm2 restart theradoc

# If still failing, restore from backup
tar -xzf /backups/app-previous.tar.gz -C /var/www/
pm2 restart theradoc
```

#### High Latency
```bash
# Check database performance
psql -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Scale application
kubectl scale deployment theradoc --replicas=5

# Clear cache
redis-cli FLUSHALL

# Optimize queries
# Disable expensive features
```

#### Memory Leak
```bash
# Check memory usage
pm2 monit

# Restart application
pm2 restart theradoc

# Enable memory limit
pm2 start theradoc --max-memory-restart 500M

# Investigate code
node --inspect dist/index.js
```

### Infrastructure Issues

#### Database Down
```bash
# Check database status
pg_isready -h db.example.com

# Restart database
sudo systemctl restart postgresql

# If restart fails, failover to replica
# Update connection string
# Restart application
```

#### Server Down
```bash
# Launch new instance
aws ec2 run-instances --image-id ami-xxxxx --instance-type t3.medium

# Restore application
scp -r /backups/app-latest.tar.gz ec2-user@new-instance:/tmp/
ssh ec2-user@new-instance 'tar -xzf /tmp/app-latest.tar.gz -C /var/www/'

# Update DNS
aws route53 change-resource-record-sets --hosted-zone-id Z123 \
  --change-batch file://dns-update.json
```

#### Network Issues
```bash
# Check network connectivity
ping theradoc.example.com
traceroute theradoc.example.com

# Check DNS
nslookup theradoc.example.com

# Check firewall rules
aws ec2 describe-security-groups

# Check load balancer
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:...
```

### Security Issues

#### Unauthorized Access
```bash
# Check access logs
tail -100 /var/log/auth.log

# Rotate credentials
# Generate new API keys
# Update database passwords
# Rotate SSH keys

# Block suspicious IPs
# Update firewall rules
# Enable 2FA
```

#### Data Breach
```bash
# Isolate affected systems
# Collect forensic evidence
# Notify security team
# Notify affected users
# Implement additional security measures
```

## Post-Incident

### Incident Report Template

```markdown
# Incident Report

## Summary
- **Incident ID**: INC-20240115-001
- **Date**: January 15, 2024
- **Duration**: 45 minutes
- **Severity**: P2
- **Status**: Resolved

## Timeline
- 14:00 - Incident detected
- 14:05 - Team assembled
- 14:15 - Root cause identified
- 14:30 - Mitigation implemented
- 14:45 - Incident resolved

## Root Cause
[Description of root cause]

## Impact
- Affected users: [Number]
- Data loss: [Yes/No]
- Revenue impact: [Amount]

## Resolution
[Description of how incident was resolved]

## Preventive Measures
- [Measure 1]
- [Measure 2]
- [Measure 3]

## Action Items
- [ ] [Action 1] - Owner: [Name] - Due: [Date]
- [ ] [Action 2] - Owner: [Name] - Due: [Date]
- [ ] [Action 3] - Owner: [Name] - Due: [Date]
```

### Post-Mortem Meeting

#### Agenda
1. Timeline review (10 min)
2. Root cause analysis (15 min)
3. Impact assessment (10 min)
4. What went well (10 min)
5. What could be improved (15 min)
6. Action items (10 min)

#### Participants
- On-call engineer
- Engineering lead
- Relevant team members
- Product manager (if user-facing)

### Action Items

#### Immediate (1-2 days)
- [ ] Deploy permanent fix
- [ ] Update documentation
- [ ] Notify stakeholders

#### Short-term (1-2 weeks)
- [ ] Implement monitoring improvements
- [ ] Add automated tests
- [ ] Update runbooks

#### Long-term (1-3 months)
- [ ] Architectural improvements
- [ ] Infrastructure upgrades
- [ ] Process improvements

### Lessons Learned

#### What Went Well
- [Item 1]
- [Item 2]
- [Item 3]

#### What Could Be Improved
- [Item 1]
- [Item 2]
- [Item 3]

#### Process Improvements
- [Improvement 1]
- [Improvement 2]
- [Improvement 3]

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Maintained By**: Engineering Team
