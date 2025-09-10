const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  console.log('Testing database connection...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
  
  try {
    const prisma = new PrismaClient()
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Try a simple query
    const userCount = await prisma.user.count()
    console.log('✅ Query successful! User count:', userCount)
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('Error code:', error.code)
    
    if (error.message.includes('invalid port number')) {
      console.log('\n🔍 Debugging URL format:')
      const url = process.env.DATABASE_URL
      if (url) {
        console.log('URL length:', url.length)
        console.log('URL preview:', url.substring(0, 50) + '...')
        console.log('Has special chars:', /[#$%]/.test(url))
        console.log('Encoded version:', encodeURI(url))
      }
    }
  }
}

testConnection()