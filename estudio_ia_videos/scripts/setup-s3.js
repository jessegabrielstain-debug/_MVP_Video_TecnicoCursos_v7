
const { S3Client, CreateBucketCommand, HeadBucketCommand, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
const envPath = path.join(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const REGION = envConfig.AWS_REGION || 'us-east-1';
const BUCKET_NAME = envConfig.AWS_S3_BUCKET || 'estudio-ia-videos-render';
const ACCESS_KEY = envConfig.AWS_ACCESS_KEY_ID;
const SECRET_KEY = envConfig.AWS_SECRET_ACCESS_KEY;

if (!ACCESS_KEY || !SECRET_KEY) {
    console.error('❌ Credenciais AWS não encontradas no .env.local');
    process.exit(1);
}

const client = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY
    }
});

async function setupBucket() {
    console.log(`🔧 Configurando Bucket S3: ${BUCKET_NAME} (${REGION})...`);

    try {
        // 1. Check if bucket exists
        try {
            await client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
            console.log('✅ Bucket já existe.');
        } catch (error) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                console.log('wm Bucket não existe. Criando...');
                await client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
                console.log('✅ Bucket criado com sucesso!');
            } else if (error.$metadata?.httpStatusCode === 403) {
                console.error('❌ Acesso negado ao bucket. Verifique se o nome é único globalmente ou se você tem permissão.');
                // Try to append a random suffix if name is taken (optional, but good for "force mode")
                // For now, let's just fail and report.
                throw error;
            } else {
                throw error;
            }
        }

        // 2. Configure CORS (Optional but good for direct browser access/preview)
        console.log('wm Configurando CORS...');
        await client.send(new PutBucketCorsCommand({
            Bucket: BUCKET_NAME,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ['*'],
                        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                        AllowedOrigins: ['*'], // In production, restrict this
                        ExposeHeaders: ['ETag']
                    }
                ]
            }
        }));
        console.log('✅ CORS configurado.');

        console.log('\n🎉 Configuração S3 concluída com sucesso!');
        console.log(`👉 Bucket: ${BUCKET_NAME}`);
        console.log(`👉 Região: ${REGION}`);

    } catch (error) {
        console.error('❌ Erro ao configurar S3:', error);
        process.exit(1);
    }
}

setupBucket();
