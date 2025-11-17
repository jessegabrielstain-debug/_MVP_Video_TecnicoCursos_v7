#!/usr/bin/env node

/**
 * 🧪 EXECUTOR DE TODOS OS TESTES
 * Sistema de Produção de Vídeos - Validação Completa
 * 
 * Este script executa todos os testes em sequência:
 * 1. Validação do banco de dados
 * 2. Testes de integração completos
 * 3. Testes de TTS
 * 4. Teste end-to-end
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Cores para output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(70)}`);
    console.log(`🧪 ${title}`);
    console.log(`${'='.repeat(70)}${colors.reset}\n`);
}

function logTest(name, status, details = '') {
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : status === 'running' ? '🔄' : '⚠️';
    const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : status === 'running' ? 'blue' : 'yellow';
    log(`${icon} ${name}`, color);
    if (details) {
        log(`   ${details}`, 'reset');
    }
}

// Configuração dos testes
const testSuites = [
    {
        name: 'Validação do Banco de Dados',
        script: 'scripts/validate-database-setup.js',
        description: 'Verifica conectividade e estrutura do banco',
        critical: true
    },
    {
        name: 'Testes de Integração Completos',
        script: 'scripts/test-integration-complete.js',
        description: 'Valida todas as funcionalidades do sistema',
        critical: true
    },
    {
        name: 'Testes de TTS',
        script: 'scripts/test-tts-integration.js',
        description: 'Valida Azure Speech Services e ElevenLabs',
        critical: false
    },
    {
        name: 'Teste End-to-End',
        script: 'scripts/test-end-to-end.js',
        description: 'Simula fluxo completo do usuário',
        critical: true
    }
];

// Resultados dos testes
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    suites: []
};

function runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'pipe',
            shell: true,
            ...options
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        child.on('close', (code) => {
            resolve({
                code,
                stdout,
                stderr
            });
        });
        
        child.on('error', (error) => {
            reject(error);
        });
    });
}

async function runTestSuite(suite) {
    logTest(suite.name, 'running', suite.description);
    
    const scriptPath = path.join(process.cwd(), suite.script);
    
    // Verificar se o script existe
    if (!fs.existsSync(scriptPath)) {
        logTest(suite.name, 'fail', `Script não encontrado: ${suite.script}`);
        return {
            name: suite.name,
            status: 'failed',
            error: 'Script não encontrado',
            output: '',
            duration: 0
        };
    }
    
    const startTime = Date.now();
    
    try {
        const result = await runCommand('node', [suite.script], {
            cwd: process.cwd(),
            timeout: 120000 // 2 minutos timeout
        });
        
        const duration = Date.now() - startTime;
        const success = result.code === 0;
        
        if (success) {
            logTest(suite.name, 'pass', `Concluído em ${(duration / 1000).toFixed(1)}s`);
        } else {
            logTest(suite.name, 'fail', `Falhou após ${(duration / 1000).toFixed(1)}s`);
            
            // Mostrar últimas linhas do erro se houver
            if (result.stderr) {
                const errorLines = result.stderr.split('\n').slice(-3).join('\n');
                log(`   Erro: ${errorLines}`, 'red');
            }
        }
        
        return {
            name: suite.name,
            status: success ? 'passed' : 'failed',
            error: success ? null : result.stderr,
            output: result.stdout,
            duration,
            exitCode: result.code
        };
        
    } catch (error) {
        const duration = Date.now() - startTime;
        logTest(suite.name, 'fail', `Erro de execução: ${error.message}`);
        
        return {
            name: suite.name,
            status: 'failed',
            error: error.message,
            output: '',
            duration,
            exitCode: -1
        };
    }
}

function generateDetailedReport() {
    logSection('RELATÓRIO DETALHADO DOS TESTES');
    
    // Resumo geral
    log(`📊 Total de suítes: ${testResults.total}`, 'blue');
    log(`✅ Aprovadas: ${testResults.passed}`, 'green');
    log(`❌ Falharam: ${testResults.failed}`, 'red');
    log(`⏭️ Puladas: ${testResults.skipped}`, 'yellow');
    
    const successRate = testResults.total > 0 ? 
        ((testResults.passed / testResults.total) * 100).toFixed(1) : 0;
    log(`📈 Taxa de sucesso: ${successRate}%`, 'cyan');
    
    // Detalhes por suíte
    console.log(`\n${colors.bold}Detalhes por Suíte:${colors.reset}`);
    testResults.suites.forEach((suite, index) => {
        const icon = suite.status === 'passed' ? '✅' : suite.status === 'failed' ? '❌' : '⏭️';
        const duration = (suite.duration / 1000).toFixed(1);
        
        console.log(`\n${index + 1}. ${icon} ${suite.name}`);
        console.log(`   Duração: ${duration}s`);
        console.log(`   Status: ${suite.status}`);
        
        if (suite.error) {
            console.log(`   Erro: ${suite.error.split('\n')[0]}`);
        }
    });
    
    // Recomendações
    console.log(`\n${colors.bold}Recomendações:${colors.reset}`);
    
    if (testResults.failed === 0) {
        log('🎉 Todos os testes passaram! Sistema pronto para produção.', 'green');
    } else {
        const criticalFailures = testResults.suites.filter(s => 
            s.status === 'failed' && 
            testSuites.find(ts => ts.name === s.name)?.critical
        );
        
        if (criticalFailures.length > 0) {
            log('🚨 Falhas críticas encontradas. Correção necessária antes da produção.', 'red');
            criticalFailures.forEach(failure => {
                log(`   - ${failure.name}`, 'red');
            });
        } else {
            log('⚠️ Algumas falhas não-críticas. Sistema pode funcionar com limitações.', 'yellow');
        }
    }
    
    // Próximos passos
    console.log(`\n${colors.bold}Próximos Passos:${colors.reset}`);
    
    if (testResults.failed === 0) {
        log('1. ✅ Executar deploy para ambiente de produção', 'green');
        log('2. ✅ Configurar monitoramento e alertas', 'green');
        log('3. ✅ Documentar procedimentos operacionais', 'green');
    } else {
        log('1. 🔧 Corrigir falhas identificadas nos testes', 'yellow');
        log('2. 🔄 Re-executar testes após correções', 'yellow');
        log('3. 📋 Validar funcionalidades manualmente se necessário', 'yellow');
    }
}

function saveTestReport() {
    const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
            total: testResults.total,
            passed: testResults.passed,
            failed: testResults.failed,
            skipped: testResults.skipped,
            successRate: testResults.total > 0 ? 
                ((testResults.passed / testResults.total) * 100).toFixed(1) : 0
        },
        suites: testResults.suites,
        environment: {
            node_version: process.version,
            platform: process.platform,
            cwd: process.cwd()
        }
    };
    
    const reportPath = path.join(process.cwd(), 'test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    log(`\n📄 Relatório salvo em: ${reportPath}`, 'blue');
}

async function runAllTests() {
    log('🧪 INICIANDO EXECUÇÃO DE TODOS OS TESTES', 'bold');
    log('Sistema de Produção de Vídeos - Validação Completa\n', 'cyan');
    
    const startTime = Date.now();
    
    try {
        // Executar cada suíte de testes
        for (const suite of testSuites) {
            testResults.total++;
            
            const result = await runTestSuite(suite);
            testResults.suites.push(result);
            
            if (result.status === 'passed') {
                testResults.passed++;
            } else if (result.status === 'failed') {
                testResults.failed++;
                
                // Se for um teste crítico e falhou, considerar parar
                if (suite.critical) {
                    log(`\n⚠️ Teste crítico falhou: ${suite.name}`, 'yellow');
                    log('Continuando com os próximos testes...', 'yellow');
                }
            } else {
                testResults.skipped++;
            }
            
            // Pequena pausa entre testes
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const totalDuration = Date.now() - startTime;
        
        // Gerar relatório detalhado
        generateDetailedReport();
        
        // Salvar relatório em arquivo
        saveTestReport();
        
        // Estatísticas finais
        console.log(`\n${colors.bold}Estatísticas Finais:${colors.reset}`);
        log(`⏱️ Tempo total: ${(totalDuration / 1000).toFixed(1)}s`, 'blue');
        log(`🎯 Eficiência: ${testResults.total} testes em ${(totalDuration / 1000 / 60).toFixed(1)} minutos`, 'cyan');
        
        console.log('='.repeat(70));
        
        // Determinar código de saída
        const exitCode = testResults.failed === 0 ? 0 : 1;
        
        if (exitCode === 0) {
            log('🎉 TODOS OS TESTES CONCLUÍDOS COM SUCESSO!', 'green');
        } else {
            log('⚠️ ALGUNS TESTES FALHARAM - VERIFIQUE O RELATÓRIO', 'yellow');
        }
        
        process.exit(exitCode);
        
    } catch (error) {
        log(`\n❌ ERRO CRÍTICO NA EXECUÇÃO DOS TESTES: ${error.message}`, 'red');
        
        // Salvar relatório mesmo com erro
        try {
            saveTestReport();
        } catch (saveError) {
            log(`Erro ao salvar relatório: ${saveError.message}`, 'red');
        }
        
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests();
}

export { runAllTests, testResults };