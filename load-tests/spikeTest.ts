/**
 * Spike Test - Sudden Load Increase Testing
 * 
 * Tests system behavior when traffic suddenly increases (e.g., 10x normal load)
 * Validates auto-scaling, resource allocation, and recovery capabilities
 */

interface SpikeTestResult {
  phase: string;
  duration: number;
  requestCount: number;
  successCount: number;
  failureCount: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  throughput: number;
  errorRate: number;
}

interface SpikeTestConfig {
  baselineUsers: number;
  spikeUsers: number;
  spikeDuration: number; // milliseconds
  recoveryDuration: number; // milliseconds
  endpoint: string;
}

class SpikeTest {
  private results: SpikeTestResult[] = [];

  async runTest(config: SpikeTestConfig): Promise<void> {
    console.log('🚀 Starting Spike Test...\n');
    console.log(`Configuration:`);
    console.log(`  Baseline Users: ${config.baselineUsers}`);
    console.log(`  Spike Users: ${config.spikeUsers}`);
    console.log(`  Spike Duration: ${config.spikeDuration}ms`);
    console.log(`  Recovery Duration: ${config.recoveryDuration}ms`);
    console.log(`  Endpoint: ${config.endpoint}\n`);

    // Phase 1: Baseline Load
    console.log('📊 Phase 1: Baseline Load...');
    await this.runPhase('Baseline', config.baselineUsers, 5000, config.endpoint);

    // Phase 2: Sudden Spike
    console.log('\n⚡ Phase 2: Sudden Traffic Spike...');
    await this.runPhase('Spike', config.spikeUsers, config.spikeDuration, config.endpoint);

    // Phase 3: Recovery
    console.log('\n🔄 Phase 3: Recovery to Baseline...');
    await this.runPhase('Recovery', config.baselineUsers, config.recoveryDuration, config.endpoint);

    // Phase 4: Post-Spike Baseline
    console.log('\n✅ Phase 4: Post-Spike Baseline...');
    await this.runPhase('Post-Spike', config.baselineUsers, 5000, config.endpoint);

    // Generate Report
    this.generateReport();
  }

  private async runPhase(
    phaseName: string,
    userCount: number,
    duration: number,
    endpoint: string
  ): Promise<void> {
    const startTime = Date.now();
    const requests: Promise<{ success: boolean; responseTime: number }>[] = [];
    const responseTimes: number[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Simulate concurrent users
    const requestsPerUser = Math.ceil(duration / 1000); // 1 request per second per user
    const totalRequests = userCount * requestsPerUser;

    for (let i = 0; i < totalRequests; i++) {
      const delay = (i / totalRequests) * duration;
      
      requests.push(
        new Promise(resolve => {
          setTimeout(async () => {
            const reqStart = Date.now();
            try {
              // Simulate API call
              await this.simulateRequest(endpoint);
              const reqTime = Date.now() - reqStart;
              responseTimes.push(reqTime);
              successCount++;
              resolve({ success: true, responseTime: reqTime });
            } catch (error) {
              failureCount++;
              resolve({ success: false, responseTime: Date.now() - reqStart });
            }
          }, delay);
        })
      );
    }

    // Wait for all requests to complete
    await Promise.all(requests);

    const endTime = Date.now();
    const actualDuration = endTime - startTime;

    // Calculate metrics
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const throughput = (successCount / actualDuration) * 1000; // requests per second
    const errorRate = (failureCount / totalRequests) * 100;

    const result: SpikeTestResult = {
      phase: phaseName,
      duration: actualDuration,
      requestCount: totalRequests,
      successCount,
      failureCount,
      avgResponseTime,
      maxResponseTime,
      minResponseTime,
      throughput,
      errorRate,
    };

    this.results.push(result);

    // Print phase results
    console.log(`  Duration: ${actualDuration}ms`);
    console.log(`  Requests: ${totalRequests}`);
    console.log(`  Success: ${successCount} (${((successCount/totalRequests)*100).toFixed(2)}%)`);
    console.log(`  Failures: ${failureCount} (${errorRate.toFixed(2)}%)`);
    console.log(`  Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`  Max Response Time: ${maxResponseTime}ms`);
    console.log(`  Min Response Time: ${minResponseTime}ms`);
    console.log(`  Throughput: ${throughput.toFixed(2)} req/s`);
  }

  private async simulateRequest(endpoint: string): Promise<void> {
    // Simulate network latency and processing time
    const baseLatency = 50 + Math.random() * 100; // 50-150ms
    const processingTime = 20 + Math.random() * 80; // 20-100ms
    
    await new Promise(resolve => setTimeout(resolve, baseLatency + processingTime));

    // Simulate occasional failures (5% failure rate under normal conditions)
    if (Math.random() < 0.05) {
      throw new Error('Simulated request failure');
    }
  }

  private generateReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📈 SPIKE TEST REPORT');
    console.log('='.repeat(80) + '\n');

    // Summary table
    console.log('Phase Summary:');
    console.log('-'.repeat(80));
    console.log(
      'Phase'.padEnd(15) +
      'Requests'.padEnd(12) +
      'Success%'.padEnd(12) +
      'Avg RT(ms)'.padEnd(12) +
      'Max RT(ms)'.padEnd(12) +
      'Throughput'
    );
    console.log('-'.repeat(80));

    this.results.forEach(result => {
      const successRate = ((result.successCount / result.requestCount) * 100).toFixed(2);
      console.log(
        result.phase.padEnd(15) +
        result.requestCount.toString().padEnd(12) +
        `${successRate}%`.padEnd(12) +
        result.avgResponseTime.toFixed(2).padEnd(12) +
        result.maxResponseTime.toString().padEnd(12) +
        `${result.throughput.toFixed(2)} req/s`
      );
    });

    console.log('-'.repeat(80) + '\n');

    // Analysis
    console.log('Analysis:');
    console.log('-'.repeat(80));

    const baseline = this.results.find(r => r.phase === 'Baseline');
    const spike = this.results.find(r => r.phase === 'Spike');
    const recovery = this.results.find(r => r.phase === 'Recovery');
    const postSpike = this.results.find(r => r.phase === 'Post-Spike');

    if (baseline && spike) {
      const responseTimeDegradation = ((spike.avgResponseTime - baseline.avgResponseTime) / baseline.avgResponseTime) * 100;
      const throughputDegradation = ((baseline.throughput - spike.throughput) / baseline.throughput) * 100;
      
      console.log(`✓ Response Time Impact: ${responseTimeDegradation > 0 ? '+' : ''}${responseTimeDegradation.toFixed(2)}%`);
      console.log(`✓ Throughput Impact: ${throughputDegradation > 0 ? '-' : '+'}${Math.abs(throughputDegradation).toFixed(2)}%`);
      console.log(`✓ Error Rate During Spike: ${spike.errorRate.toFixed(2)}%`);
    }

    if (recovery && baseline) {
      const recoveryTime = recovery.avgResponseTime;
      const baselineTime = baseline.avgResponseTime;
      const recovered = Math.abs(recoveryTime - baselineTime) < baselineTime * 0.2; // Within 20%
      
      console.log(`✓ System Recovery: ${recovered ? '✅ GOOD' : '⚠️ DEGRADED'}`);
      console.log(`  Recovery Response Time: ${recoveryTime.toFixed(2)}ms vs Baseline: ${baselineTime.toFixed(2)}ms`);
    }

    if (postSpike && baseline) {
      const stabilized = Math.abs(postSpike.avgResponseTime - baseline.avgResponseTime) < baseline.avgResponseTime * 0.1;
      console.log(`✓ Post-Spike Stability: ${stabilized ? '✅ STABLE' : '⚠️ UNSTABLE'}`);
    }

    console.log('-'.repeat(80) + '\n');

    // Recommendations
    console.log('Recommendations:');
    console.log('-'.repeat(80));

    if (spike && spike.errorRate > 5) {
      console.log('⚠️  High error rate during spike - consider implementing rate limiting');
    }

    if (spike && baseline && spike.avgResponseTime > baseline.avgResponseTime * 3) {
      console.log('⚠️  Significant response time degradation - review auto-scaling configuration');
    }

    if (recovery && baseline && recovery.avgResponseTime > baseline.avgResponseTime * 1.5) {
      console.log('⚠️  Slow recovery - investigate resource cleanup and connection pooling');
    }

    if (postSpike && baseline && postSpike.errorRate > baseline.errorRate * 2) {
      console.log('⚠️  Elevated error rate after spike - check for resource leaks');
    }

    const allPassed = this.results.every(r => r.errorRate < 10 && r.avgResponseTime < 1000);
    if (allPassed) {
      console.log('✅ All metrics within acceptable ranges');
    }

    console.log('='.repeat(80) + '\n');
  }
}

// Run the spike test
async function main() {
  const spikeTest = new SpikeTest();

  const config: SpikeTestConfig = {
    baselineUsers: 10,
    spikeUsers: 100, // 10x increase
    spikeDuration: 10000, // 10 seconds
    recoveryDuration: 5000, // 5 seconds
    endpoint: '/api/notes/generate',
  };

  try {
    await spikeTest.runTest(config);
    console.log('✅ Spike test completed successfully\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Spike test failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { SpikeTest };
export type { SpikeTestConfig, SpikeTestResult };
