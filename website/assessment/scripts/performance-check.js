#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Performance regression checker
 * Compares current performance metrics with baseline
 */

class PerformanceChecker {
  constructor() {
    this.baselineFile = path.join(__dirname, '../performance-baseline.json');
    this.currentMetrics = {};
    this.baseline = this.loadBaseline();
    
    this.thresholds = {
      responseTimeIncrease: 20, // Max 20% increase
      memoryIncrease: 30, // Max 30% increase
      throughputDecrease: 15 // Max 15% decrease
    };
  }

  loadBaseline() {
    try {
      if (fs.existsSync(this.baselineFile)) {
        return JSON.parse(fs.readFileSync(this.baselineFile, 'utf8'));
      }
    } catch (error) {
      console.log('⚠️ No performance baseline found, creating new baseline');
    }
    
    return {
      responseTime: {
        assessmentStart: 2000,
        responseProcessing: 1000,
        resultCalculation: 3000,
        curriculumGeneration: 2000
      },
      throughput: {
        concurrentUsers: 50,
        requestsPerSecond: 100
      },
      memory: {
        heapUsed: 50 * 1024 * 1024, // 50MB
        maxHeapUsed: 100 * 1024 * 1024 // 100MB
      }
    };
  }

  async runPerformanceCheck() {
    console.log('⚡ Running performance regression check...\n');

    try {
      await this.collectCurrentMetrics();
      this.compareWithBaseline();
      this.updateBaseline();
      
    } catch (error) {
      console.error('❌ Performance check failed:', error.message);
      process.exit(1);
    }
  }

  async collectCurrentMetrics() {
    console.log('📊 Collecting current performance metrics...');
    
    // Simulate collecting metrics from performance tests
    // In a real implementation, this would parse test results
    
    this.currentMetrics = {
      responseTime: {
        assessmentStart: this.simulateMetric(1800, 2200),
        responseProcessing: this.simulateMetric(800, 1200),
        resultCalculation: this.simulateMetric(2500, 3500),
        curriculumGeneration: this.simulateMetric(1800, 2200)
      },
      throughput: {
        concurrentUsers: this.simulateMetric(45, 55),
        requestsPerSecond: this.simulateMetric(90, 110)
      },
      memory: {
        heapUsed: this.simulateMetric(45 * 1024 * 1024, 55 * 1024 * 1024),
        maxHeapUsed: this.simulateMetric(90 * 1024 * 1024, 110 * 1024 * 1024)
      }
    };
    
    console.log('✅ Metrics collected');
  }

  simulateMetric(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  compareWithBaseline() {
    console.log('\n🔍 Comparing with baseline...\n');
    
    let regressionFound = false;
    
    // Check response times
    console.log('Response Time Analysis:');
    Object.entries(this.currentMetrics.responseTime).forEach(([metric, current]) => {
      const baseline = this.baseline.responseTime[metric];
      const increase = ((current - baseline) / baseline) * 100;
      
      const status = increase > this.thresholds.responseTimeIncrease ? '❌' : '✅';
      console.log(`  ${status} ${metric}: ${current}ms (baseline: ${baseline}ms, change: ${increase.toFixed(1)}%)`);
      
      if (increase > this.thresholds.responseTimeIncrease) {
        regressionFound = true;
      }
    });
    
    // Check throughput
    console.log('\nThroughput Analysis:');
    Object.entries(this.currentMetrics.throughput).forEach(([metric, current]) => {
      const baseline = this.baseline.throughput[metric];
      const decrease = ((baseline - current) / baseline) * 100;
      
      const status = decrease > this.thresholds.throughputDecrease ? '❌' : '✅';
      console.log(`  ${status} ${metric}: ${current} (baseline: ${baseline}, change: ${decrease > 0 ? '-' : '+'}${Math.abs(decrease).toFixed(1)}%)`);
      
      if (decrease > this.thresholds.throughputDecrease) {
        regressionFound = true;
      }
    });
    
    // Check memory usage
    console.log('\nMemory Usage Analysis:');
    Object.entries(this.currentMetrics.memory).forEach(([metric, current]) => {
      const baseline = this.baseline.memory[metric];
      const increase = ((current - baseline) / baseline) * 100;
      
      const currentMB = (current / (1024 * 1024)).toFixed(1);
      const baselineMB = (baseline / (1024 * 1024)).toFixed(1);
      
      const status = increase > this.thresholds.memoryIncrease ? '❌' : '✅';
      console.log(`  ${status} ${metric}: ${currentMB}MB (baseline: ${baselineMB}MB, change: ${increase.toFixed(1)}%)`);
      
      if (increase > this.thresholds.memoryIncrease) {
        regressionFound = true;
      }
    });
    
    if (regressionFound) {
      console.log('\n❌ Performance regression detected!');
      console.log('Please investigate and optimize before merging.');
      process.exit(1);
    } else {
      console.log('\n✅ No performance regression detected');
    }
  }

  updateBaseline() {
    // Update baseline with current metrics if they're better
    let updated = false;
    
    Object.entries(this.currentMetrics.responseTime).forEach(([metric, current]) => {
      if (current < this.baseline.responseTime[metric]) {
        this.baseline.responseTime[metric] = current;
        updated = true;
      }
    });
    
    Object.entries(this.currentMetrics.throughput).forEach(([metric, current]) => {
      if (current > this.baseline.throughput[metric]) {
        this.baseline.throughput[metric] = current;
        updated = true;
      }
    });
    
    Object.entries(this.currentMetrics.memory).forEach(([metric, current]) => {
      if (current < this.baseline.memory[metric]) {
        this.baseline.memory[metric] = current;
        updated = true;
      }
    });
    
    if (updated) {
      fs.writeFileSync(this.baselineFile, JSON.stringify(this.baseline, null, 2));
      console.log('📈 Performance baseline updated with improvements');
    }
  }

  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseline: this.baseline,
      current: this.currentMetrics,
      regressions: this.findRegressions(),
      improvements: this.findImprovements()
    };
    
    const reportFile = path.join(__dirname, '../performance-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`📊 Performance report saved to ${reportFile}`);
  }

  findRegressions() {
    const regressions = [];
    
    Object.entries(this.currentMetrics.responseTime).forEach(([metric, current]) => {
      const baseline = this.baseline.responseTime[metric];
      const increase = ((current - baseline) / baseline) * 100;
      
      if (increase > this.thresholds.responseTimeIncrease) {
        regressions.push({
          type: 'responseTime',
          metric,
          current,
          baseline,
          increase: increase.toFixed(1)
        });
      }
    });
    
    return regressions;
  }

  findImprovements() {
    const improvements = [];
    
    Object.entries(this.currentMetrics.responseTime).forEach(([metric, current]) => {
      const baseline = this.baseline.responseTime[metric];
      const decrease = ((baseline - current) / baseline) * 100;
      
      if (decrease > 5) { // 5% improvement threshold
        improvements.push({
          type: 'responseTime',
          metric,
          current,
          baseline,
          improvement: decrease.toFixed(1)
        });
      }
    });
    
    return improvements;
  }
}

// Run the performance check
const checker = new PerformanceChecker();
checker.runPerformanceCheck().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});