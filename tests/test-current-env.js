require('dotenv').config()

console.log('Current DATABASE_URL:', process.env.DATABASE_URL)
console.log('URL includes port 6543:', process.env.DATABASE_URL?.includes('6543'))
console.log('URL includes port 5432:', process.env.DATABASE_URL?.includes('5432'))

// Test different connection methods
const testUrls = [
  process.env.DATABASE_URL,
  'postgresql://postgres:NuKind123%23%24%25@db.svolcabvxuvvsidwxmwf.supabase.co:6543/postgres?sslmode=require',
  'postgresql://postgres:NuKind123%23%24%25@db.svolcabvxuvvsidwxmwf.supabase.co:5432/postgres?sslmode=require'
]

const { PrismaClient } = require('@prisma/client')

async function testMultipleConnections() {
  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i]
    console.log(`\n🧪 Testing connection ${i + 1}:`)
    console.log('URL:', url?.substring(0, 50) + '...')
    
    try {
      const originalUrl = process.env.DATABASE_URL
      process.env.DATABASE_URL = url
      
      const prisma = new PrismaClient()
      await prisma.$connect()
      console.log('✅ Connection successful!')
      
      const userCount = await prisma.user.count()
      console.log('✅ Query successful! User count:', userCount)
      
      await prisma.$disconnect()
      process.env.DATABASE_URL = originalUrl
      
      console.log('🎉 Found working connection!')
      break
      
    } catch (error) {
      console.log('❌ Failed:', error.message.split('\n')[0])
      if (error.message.includes('timeout')) {
        console.log('   → Network timeout')
      } else if (error.message.includes('ENOTFOUND')) {
        console.log('   → DNS resolution failed')
      } else if (error.message.includes('refused')) {
        console.log('   → Connection refused')
      }
    }
  }
}

testMultipleConnections()