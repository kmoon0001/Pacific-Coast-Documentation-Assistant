# TheraDoc Disaster Recovery Guide

## Overview

This guide provides comprehensive procedures for recovering from various disaster scenarios. It covers data loss, infrastructure failure, security breaches, and other critical incidents.

## Table of Contents
1. [Recovery Objectives](#recovery-objectives)
2. [Backup Strategy](#backup-strategy)
3. [Disaster Scenarios](#disaster-scenarios)
4. [Recovery Procedures](#recovery-procedures)
5. [Testing & Validation](#testing--validation)
6. [Communication Plan](#communication-plan)

## Recovery Objectives

### RTO (Recovery Time Objective)
- **Critical Systems**: 15 minutes
- **Important Systems**: 1 hour
- **Non-critical Systems**: 4 hours

### RPO (Recovery Point Objective)
- **Database**: 1 hour
- **Application Code**: 15 minutes
- **Configuration**: Real-time
- **User Data**: 1 hour

### Availability Targets
- **Production**: 99.9% uptime
- **Staging**: 99% uptime
- **Development**: 95% uptime

## Backup Strategy

### Backup Schedule

#### Database Backups
```bash
# Hourly incremental backups
0 * * * * pg_basebackup -h db.example.com -U backup_user -D /backups/hourly/$(date +\%H) -Ft -z

# Daily full backups
0 2 * * * pg_dump -h db.example.com -U backup_user theradoc | gzip > /backups/daily/db-$(date +\%Y\%m\%d).sql.gz

# Weekly full backups with retention
0 3 * * 0 tar -czf /backups/weekly/db-$(date +\%Y\%m\%d).tar.gz /backups/daily/

# Monthly archive to S3
0 4 1 * * aws s3 sync /backups/weekly/ s3://theradoc-backups/monthly/$(date +\%Y\%m)/
```

#### Application Backups
```bash
# Daily application backup
0 2 * * * tar -czf /backups/app-$(date +\%Y\%m\%d).tar.gz /var/www/theradoc/

# Weekly backup to S3
0 3 * * 0 aws s3 cp /backups/app-$(date +\%Y\%m\%d).tar.gz s3://theradoc-backups/app/
```

#### Configuration Backups
```bash
# Real-time configuration backup
# Store in version control (Git)
git add .env.production
git commit -m "Config backup $(date)"
git push origin main
```

### Backup Verification

```bash
#!/bin/bash
# verify-backups.sh

# Check database backup integrity
pg_restore --list /backups/daily/db-$(date +\%Y\%m\%d).sql.gz > /dev/null
if [ $? -eq 0 ]; then
  echo "✓ Database backup verified"
else
  echo "✗ Database backup corrupted"
  exit 1
fi

# Check application backup
tar -tzf /backups/app-$(date +\%Y\%m\%d).tar.gz > /dev/null
if [ $? -eq 0 ]; then
  echo "✓ Application backup verified"
else
  echo "✗ Application backup corrupted"
  exit 1
fi

# Check S3 backups
aws s3 ls s3://theradoc-backups/daily/ | tail -5
```

## Disaster Scenarios

### Scenario 1: Database Corruption

#### Detection
```bash
# Check database integrity
psql -h db.example.com -U user theradoc -c "SELECT pg_database.datname, 
  pg_size_pretty(pg_database_size(pg_database.datname)) 
  FROM pg_database 
  WHERE datname = 'theradoc';"

# Check for errors
tail -100 /var/log/postgresql/postgresql.log | grep ERROR
```

#### Recovery Steps
```bash
# Step 1: Stop application
pm2 stop theradoc

# Step 2: Backup corrupted database
pg_dump -h db.example.com -U user theradoc > corrupted-backup.sql

# Step 3: Restore from backup
psql -h db.example.com -U user theradoc < /backups/daily/db-$(date -d '1 day ago' +\%Y\%m\%d).sql

# Step 4: Verify restoration
psql -h db.example.com -U user theradoc -c "SELECT COUNT(*) FROM notes;"

# Step 5: Restart application
pm2 start theradoc

# Step 6: Monitor for issues
pm2 logs theradoc
```

### Scenario 2: Complete Data Loss

#### Detection
```bash
# Check if data is accessible
curl https://theradoc.example.com/api/notes

# Check database size
du -sh /var/lib/postgresql/
```

#### Recovery Steps
```bash
# Step 1: Restore from most recent backup
aws s3 cp s3://theradoc-backups/monthly/$(date +\%Y\%m)/db-latest.sql.gz .
gunzip db-latest.sql.gz

# Step 2: Create new database
createdb -h db.example.com -U user theradoc_restored

# Step 3: Restore data
psql -h db.example.com -U user theradoc_restored < db-latest.sql

# Step 4: Verify data integrity
psql -h db.example.com -U user theradoc_restored -c "SELECT COUNT(*) FROM notes;"

# Step 5: Switch to restored database
# Update connection string in application
# Restart application

# Step 6: Notify users of data loss
# Send notification about recovery
```

### Scenario 3: Infrastructure Failure

#### Detection
```bash
# Check server status
ping theradoc.example.com
curl https://theradoc.example.com/health

# Check AWS status
aws ec2 describe-instances --instance-ids i-xxxxx
```

#### Recovery Steps
```bash
# Step 1: Launch new instance from AMI
aws ec2 run-instances --image-id ami-xxxxx --instance-type t3.medium

# Step 2: Restore application
scp -r /backups/app-latest.tar.gz ec2-user@new-instance:/tmp/
ssh ec2-user@new-instance 'tar -xzf /tmp/app-latest.tar.gz -C /var/www/'

# Step 3: Restore configuration
scp .env.production ec2-user@new-instance:/var/www/theradoc/

# Step 4: Start application
ssh ec2-user@new-instance 'pm2 start theradoc'

# Step 5: Update DNS
aws route53 change-resource-record-sets --hosted-zone-id Z123 \
  --change-batch file://dns-update.json

# Step 6: Verify
curl https://theradoc.example.com/health
```

### Scenario 4: Security Breach

#### Detection
```bash
# Check for unauthorized access
grep "Failed password" /var/log/auth.log | tail -20

# Check for suspicious processes
ps aux | grep -v grep | grep -E "nc|ncat|bash|sh"

# Check network connections
netstat -tulpn | grep ESTABLISHED
```

#### Recovery Steps
```bash
# Step 1: Isolate affected systems
# Disconnect from network if necessary

# Step 2: Collect forensic evidence
tar -czf forensics-$(date +\%s).tar.gz /var/log/ /var/www/theradoc/

# Step 3: Rotate credentials
# Generate new API keys
# Update database passwords
# Rotate SSH keys

# Step 4: Patch vulnerabilities
# Apply security updates
# Update dependencies
npm audit fix

# Step 5: Restore from clean backup
# Restore application from backup
# Restore database from backup

# Step 6: Notify affected users
# Send security notification
# Recommend password reset

# Step 7: Implement additional security
# Enable 2FA
# Implement rate limiting
# Add WAF rules
```

### Scenario 5: Application Failure

#### Detection
```bash
# Check application status
pm2 status

# Check logs
pm2 logs theradoc | tail -50

# Check health endpoint
curl https://theradoc.example.com/health
```

#### Recovery Steps
```bash
# Step 1: Check logs for errors
pm2 logs theradoc | grep ERROR

# Step 2: Restart application
pm2 restart theradoc

# Step 3: If restart fails, rollback
git revert HEAD
npm run build
pm2 restart theradoc

# Step 4: If rollback fails, restore from backup
tar -xzf /backups/app-previous.tar.gz -C /var/www/
pm2 restart theradoc

# Step 5: Verify functionality
npm run e2e -- --grep "smoke"

# Step 6: Monitor for recurrence
pm2 logs theradoc
```

## Recovery Procedures

### Database Recovery

#### Point-in-Time Recovery
```bash
# List available backups
ls -la /backups/daily/

# Restore to specific point in time
pg_restore -h db.example.com -U user -d theradoc \
  --recovery-target-time='2024-01-15 14:30:00' \
  /backups/daily/db-20240115.sql.gz
```

#### Partial Recovery
```bash
# Restore specific table
pg_restore -h db.example.com -U user -d theradoc \
  --table=notes \
  /backups/daily/db-20240115.sql.gz
```

### Application Recovery

#### Code Recovery
```bash
# List available versions
git tag | sort -V

# Checkout previous version
git checkout v1.0.0

# Rebuild and restart
npm run build
pm2 restart theradoc
```

#### Configuration Recovery
```bash
# List configuration backups
git log --oneline .env.production | head -10

# Restore previous configuration
git checkout HEAD~1 .env.production

# Restart application
pm2 restart theradoc
```

### Infrastructure Recovery

#### Server Recovery
```bash
# Create AMI from current instance
aws ec2 create-image --instance-id i-xxxxx --name theradoc-backup-$(date +%s)

# Launch new instance from AMI
aws ec2 run-instances --image-id ami-xxxxx --instance-type t3.medium

# Attach volumes
aws ec2 attach-volume --volume-id vol-xxxxx --instance-id i-yyyyy --device /dev/sdf
```

#### Database Recovery
```bash
# Create RDS snapshot
aws rds create-db-snapshot --db-instance-identifier theradoc-db \
  --db-snapshot-identifier theradoc-backup-$(date +%s)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier theradoc-db-restored \
  --db-snapshot-identifier theradoc-backup-xxxxx
```

## Testing & Validation

### Recovery Testing Schedule
- **Monthly**: Full database recovery test
- **Quarterly**: Full infrastructure recovery test
- **Annually**: Complete disaster recovery drill

### Database Recovery Test
```bash
#!/bin/bash
# test-db-recovery.sh

echo "Starting database recovery test..."

# Create test database
createdb -h db.example.com -U user theradoc_test

# Restore from backup
gunzip < /backups/daily/db-latest.sql.gz | \
  psql -h db.example.com -U user theradoc_test

# Verify data
RECORD_COUNT=$(psql -h db.example.com -U user theradoc_test \
  -t -c "SELECT COUNT(*) FROM notes;")

if [ "$RECORD_COUNT" -gt 0 ]; then
  echo "✓ Database recovery test passed"
  echo "  Records restored: $RECORD_COUNT"
else
  echo "✗ Database recovery test failed"
  exit 1
fi

# Cleanup
dropdb -h db.example.com -U user theradoc_test
```

### Application Recovery Test
```bash
#!/bin/bash
# test-app-recovery.sh

echo "Starting application recovery test..."

# Extract backup
tar -xzf /backups/app-latest.tar.gz -C /tmp/test-recovery/

# Verify files
if [ -f "/tmp/test-recovery/dist/index.html" ]; then
  echo "✓ Application recovery test passed"
else
  echo "✗ Application recovery test failed"
  exit 1
fi

# Cleanup
rm -rf /tmp/test-recovery/
```

### Infrastructure Recovery Test
```bash
#!/bin/bash
# test-infra-recovery.sh

echo "Starting infrastructure recovery test..."

# Create test instance
INSTANCE_ID=$(aws ec2 run-instances --image-id ami-xxxxx \
  --instance-type t3.micro --query 'Instances[0].InstanceId' --output text)

# Wait for instance to start
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Verify instance
if [ ! -z "$INSTANCE_ID" ]; then
  echo "✓ Infrastructure recovery test passed"
  echo "  Instance ID: $INSTANCE_ID"
else
  echo "✗ Infrastructure recovery test failed"
  exit 1
fi

# Terminate test instance
aws ec2 terminate-instances --instance-ids $INSTANCE_ID
```

## Communication Plan

### Notification Channels
- **Slack**: #incidents channel
- **Email**: incidents@theradoc.example.com
- **SMS**: Critical incidents only
- **Status Page**: https://status.theradoc.example.com

### Notification Template

```
DISASTER RECOVERY INITIATED

Incident: [Description]
Severity: [P1/P2/P3/P4]
Start Time: [Time]
Estimated Recovery: [Time]

Actions:
- [Action 1]
- [Action 2]

Next Update: [Time]
```

### Escalation Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| On-Call | [Name] | [Phone] | [Email] |
| Engineering Lead | [Name] | [Phone] | [Email] |
| CTO | [Name] | [Phone] | [Email] |
| VP Engineering | [Name] | [Phone] | [Email] |

## Post-Recovery

### Validation Checklist
- [ ] All services operational
- [ ] Data integrity verified
- [ ] Performance metrics normal
- [ ] Security verified
- [ ] User access restored
- [ ] Monitoring active

### Post-Incident Review
- [ ] Root cause analysis
- [ ] Timeline documentation
- [ ] Preventive measures identified
- [ ] Process improvements
- [ ] Team debriefing
- [ ] Documentation updated

### Lessons Learned
- Document what went well
- Document what could be improved
- Update procedures
- Share with team
- Update training materials

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Maintained By**: DevOps & Engineering Teams
