/**
 * 🚀 Database Initialization Script
 * 
 * Initializes the database with default data and configurations.
 */

import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Initializing database...')

  try {
    // Create default system configurations
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const configs = [
      {
        key: 'max_file_size',
        value: { bytes: 10485760, description: '10MB file size limit' },
        description: 'Maximum file upload size'
      },
      {
        key: 'video_formats',
        value: { 
          formats: ['mp4', 'webm', 'gif'],
          default: 'mp4'
        },
        description: 'Supported video export formats'
      },
      {
        key: 'video_resolutions',
        value: {
          resolutions: ['720p', '1080p', '4k'],
          default: '1080p'
        },
        description: 'Supported video resolutions'
      },
      {
        key: 'tts_limits',
        value: {
          maxCharacters: 10000,
          maxRequestsPerHour: 100
        },
        description: 'TTS service limits'
      },
      {
        key: 'subscription_plans',
        value: {
          free: {
            credits: 100,
            videoExports: 5,
            storageGB: 1
          },
          basic: {
            credits: 1000,
            videoExports: 50,
            storageGB: 10
          },
          pro: {
            credits: 5000,
            videoExports: 200,
            storageGB: 50
          },
          enterprise: {
            credits: -1, // unlimited
            videoExports: -1,
            storageGB: 500
          }
        },
        description: 'Subscription plan configurations'
      }
    ]

    // System configurations currently disabled (no systemConfig model)
    // for (const config of configs) {
    //   await prisma.systemConfig.upsert({
    //     where: { key: config.key },
    //     update: { value: config.value },
    //     create: config
    //   })
    // }

    console.log('✅ System configurations skipped (model not available)')

    // Create demo user for testing
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@estudio-ia.com' },
      update: {},
      create: {
        email: 'demo@estudio-ia.com',
        name: 'Usuário Demo'
      }
    })

    console.log('✅ Demo user created:', demoUser.email)

    // Create sample templates
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const templates = [
      {
        name: 'NR-10: Segurança em Instalações Elétricas',
        category: 'nr-10',
        type: 'pptx',
        description: 'Template completo para treinamento em NR-10',
        slides: {
          slides: [
            {
              id: 1,
              title: 'Introdução à NR-10',
              content: 'Norma Regulamentadora sobre segurança em instalações e serviços em eletricidade'
            },
            {
              id: 2,
              title: 'Riscos Elétricos',
              content: 'Identificação e prevenção de riscos em instalações elétricas'
            }
          ]
        },
        tags: ['eletricidade', 'segurança', 'nr10'],
        difficulty: 'intermediate',
        duration: 1800, // 30 minutes
        isActive: true,
        isPremium: false
      },
      {
        name: 'NR-35: Trabalho em Altura',
        category: 'nr-35',
        type: 'pptx',
        description: 'Template para treinamento em trabalho em altura',
        slides: {
          slides: [
            {
              id: 1,
              title: 'Trabalho em Altura - Conceitos',
              content: 'Definições e requisitos para trabalho em altura'
            },
            {
              id: 2,
              title: 'EPIs e Equipamentos',
              content: 'Equipamentos de proteção individual e coletiva'
            }
          ]
        },
        tags: ['altura', 'segurança', 'nr35', 'epi'],
        difficulty: 'advanced',
        duration: 2400, // 40 minutes
        isActive: true,
        isPremium: true
      }
    ]

    // Templates currently disabled (no template model)
    // for (const template of templates) {
    //   await prisma.template.upsert({
    //     where: { id: template.name.toLowerCase().replace(/[^a-z0-9]/g, '-') },
    //     update: {},
    //     create: {
    //       id: template.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    //       ...template
    //     }
    //   })
    // }

    console.log('✅ Sample templates skipped (model not available)')

    // Create sample project for demo user
    const slidesData: Prisma.InputJsonValue = [
      {
        id: 1,
        title: 'Introdução à NR-12',
        content: 'Norma Regulamentadora sobre segurança em máquinas e equipamentos de trabalho',
        duration: 15,
        image: '/images/nr12-intro.jpg'
      },
      {
        id: 2,
        title: 'Principais Riscos',
        content: 'Identificação dos principais riscos em máquinas industriais',
        duration: 20,
        image: '/images/nr12-risks.jpg'
      },
      {
        id: 3,
        title: 'Medidas de Proteção',
        content: 'Implementação de sistemas de proteção e segurança',
        duration: 18,
        image: '/images/nr12-protection.jpg'
      }
    ];

    const settings: Prisma.InputJsonValue = {
      avatar: 'avatar-carlos-engineer',
      voice: 'br-carlos-adult',
      background: 'industrial-1',
      resolution: '1080p'
    };

    const sampleProject = await prisma.project.upsert({
      where: { id: 'demo-project-nr12' },
      update: {},
      create: {
        id: 'demo-project-nr12',
        title: 'NR-12: Segurança em Máquinas - Demo', // Changed name to title as per schema
        description: 'Projeto de demonstração sobre segurança em máquinas e equipamentos',
        userId: demoUser.id,
        status: 'completed', // Uppercase COMPLETED might be invalid if not enum, schema says String? default "draft"
        slidesData: slidesData,
        duration: 53,
        settings: settings
      }
    })

    console.log('✅ Sample project created:', sampleProject.title)

    console.log('🎉 Database initialization completed successfully!')

  } catch (error) {
    console.error('❌ Error initializing database:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
