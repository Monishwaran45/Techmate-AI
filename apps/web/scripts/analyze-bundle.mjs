#!/usr/bin/env node

/**
 * Enhanced bundle analysis script
 * Analyzes the production build and reports bundle sizes with compression metrics
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, '../dist');

function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

function getCompressedSize(filePath, algorithm = 'gzip') {
  const content = fs.readFileSync(filePath);
  if (algorithm === 'gzip') {
    return zlib.gzipSync(content).length;
  } else if (algorithm === 'brotli') {
    return zlib.brotliCompressSync(content).length;
  }
  return content.length;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function analyzeDirectory(dir, prefix = '') {
  const files = fs.readdirSync(dir);
  const results = [];

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results.push(...analyzeDirectory(filePath, `${prefix}${file}/`));
    } else {
      const size = getFileSize(filePath);
      const ext = path.extname(file);
      
      // Only compress text-based files
      let gzipSize = size;
      let brotliSize = size;
      if (['.js', '.css', '.html', '.json', '.svg'].includes(ext)) {
        try {
          gzipSize = getCompressedSize(filePath, 'gzip');
          brotliSize = getCompressedSize(filePath, 'brotli');
        } catch (e) {
          // Skip compression errors
        }
      }
      
      results.push({
        name: `${prefix}${file}`,
        size,
        gzipSize,
        brotliSize,
        ext,
      });
    }
  });

  return results;
}

function printReport(files) {
  console.log('\n📦 Bundle Analysis Report\n');
  console.log('='.repeat(80));

  // Sort by gzip size descending
  const sorted = files.sort((a, b) => b.gzipSize - a.gzipSize);

  // Calculate totals
  const totalRaw = sorted.reduce((sum, file) => sum + file.size, 0);
  const totalGzip = sorted.reduce((sum, file) => sum + file.gzipSize, 0);
  const totalBrotli = sorted.reduce((sum, file) => sum + file.brotliSize, 0);

  // Group by type
  const byType = {};
  sorted.forEach((file) => {
    const type = file.ext || 'other';
    if (!byType[type]) {
      byType[type] = { count: 0, raw: 0, gzip: 0, brotli: 0 };
    }
    byType[type].count++;
    byType[type].raw += file.size;
    byType[type].gzip += file.gzipSize;
    byType[type].brotli += file.brotliSize;
  });

  // Print summary by type
  console.log('\n📊 Summary by File Type:\n');
  Object.keys(byType)
    .sort((a, b) => byType[b].gzip - byType[a].gzip)
    .forEach((type) => {
      const data = byType[type];
      const compressionRatio = ((1 - data.gzip / data.raw) * 100).toFixed(1);
      console.log(`${type.padEnd(10)} (${data.count} files):`);
      console.log(`  Raw: ${formatBytes(data.raw).padStart(10)} | Gzip: ${formatBytes(data.gzip).padStart(10)} (${compressionRatio}% reduction)`);
    });

  // Print largest files
  console.log('\n📁 Largest Files (by gzipped size):\n');
  sorted.slice(0, 10).forEach((file, index) => {
    const compressionRatio = ((1 - file.gzipSize / file.size) * 100).toFixed(1);
    console.log(`${(index + 1).toString().padStart(2)}. ${file.name}`);
    console.log(`    Raw: ${formatBytes(file.size).padStart(10)} | Gzip: ${formatBytes(file.gzipSize).padStart(10)} (${compressionRatio}% reduction)`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n📦 Total Bundle Size:');
  console.log(`   Raw:    ${formatBytes(totalRaw)}`);
  console.log(`   Gzip:   ${formatBytes(totalGzip)} (${((1 - totalGzip / totalRaw) * 100).toFixed(1)}% reduction)`);
  console.log(`   Brotli: ${formatBytes(totalBrotli)} (${((1 - totalBrotli / totalRaw) * 100).toFixed(1)}% reduction)`);

  // Performance analysis
  console.log('\n💡 Performance Analysis:\n');

  const jsFiles = sorted.filter((f) => f.ext === '.js');
  const largeJsFiles = jsFiles.filter((f) => f.gzipSize > 100 * 1024); // > 100KB gzipped

  if (largeJsFiles.length > 0) {
    console.log('⚠️  Large JavaScript chunks detected (>100KB gzipped):');
    largeJsFiles.forEach((file) => {
      console.log(`   - ${file.name}: ${formatBytes(file.gzipSize)}`);
    });
    console.log('   💡 Consider further code splitting or lazy loading.\n');
  }

  if (totalGzip > 500 * 1024) {
    console.log('⚠️  Total bundle size exceeds 500KB (gzipped)');
    console.log('   💡 Consider aggressive code splitting and lazy loading.\n');
  } else if (totalGzip > 200 * 1024) {
    console.log('⚠️  Total bundle size exceeds 200KB (gzipped)');
    console.log('   💡 Monitor bundle size and consider optimization.\n');
  } else {
    console.log('✅ Bundle size is within recommended limits (<200KB gzipped).\n');
  }

  const cssFiles = sorted.filter((f) => f.ext === '.css');
  const largeCssFiles = cssFiles.filter((f) => f.gzipSize > 50 * 1024);
  if (largeCssFiles.length > 0) {
    console.log('⚠️  Large CSS files detected (>50KB gzipped):');
    largeCssFiles.forEach((file) => {
      console.log(`   - ${file.name}: ${formatBytes(file.gzipSize)}`);
    });
    console.log('   💡 Consider CSS code splitting or removing unused styles.\n');
  }

  // Recommendations
  console.log('📋 Optimization Checklist:');
  console.log('   ' + (totalGzip < 200 * 1024 ? '✅' : '❌') + ' Initial bundle < 200KB (gzipped)');
  console.log('   ' + (largeJsFiles.length === 0 ? '✅' : '❌') + ' No JS chunks > 100KB (gzipped)');
  console.log('   ' + (largeCssFiles.length === 0 ? '✅' : '❌') + ' No CSS files > 50KB (gzipped)');
  console.log('   ' + (jsFiles.length > 3 ? '✅' : '⚠️ ') + ' Code splitting enabled');
  
  console.log('\n' + '='.repeat(80) + '\n');
}

// Run analysis
if (!fs.existsSync(distPath)) {
  console.error('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

const files = analyzeDirectory(distPath);
printReport(files);
