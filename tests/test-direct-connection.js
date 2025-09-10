// Test with hardcoded connection string to bypass env variable issues
const { PrismaClient } = require('@prisma/client')

const directUrl = 'postgresql://postgres:NuKind123%23%24%25@db.svolcabvxuvvsidwxmwf.supabase.co:5432/postgres'

async function testDirectConnection() {
  console.log('Testing direct database connection...')
  console.log('Using URL:', directUrl)
  
  try {
    // Override the DATABASE_URL for this test
    const originalUrl = process.env.DATABASE_URL
    process.env.DATABASE_URL = directUrl
    
    const prisma = new PrismaClient()
    await prisma.$connect()
    console.log('✅ Direct connection successful!')
    
    // Try a simple query
    const userCount = await prisma.user.count()
    console.log('✅ Query successful! User count:', userCount)
    
    await prisma.$disconnect()
    
    // Restore original URL
    process.env.DATABASE_URL = originalUrl
    
  } catch (error) {
    console.error('❌ Direct connection failed:', error.message)
    console.error('Error code:', error.code)
    
    if (error.message.includes('timeout') || error.message.includes('ENOTFOUND')) {
      console.log('🌐 This might be a network connectivity issue')
    }
  }
}

testDirectConnection()