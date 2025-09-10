const { PrismaClient } = require('@prisma/client')

// Test all possible connection configurations
const connectionConfigs = [
  {
    name: "Direct Connection (Port 5432)",
    url: "postgresql://postgres:NuKind123%23%24%25@db.svolcabvxuvvsidwxmwf.supabase.co:5432/postgres"
  },
  {
    name: "Connection Pooler (Port 6543)", 
    url: "postgresql://postgres:NuKind123%23%24%25@db.svolcabvxuvvsidwxmwf.supabase.co:6543/postgres"
  },
  {
    name: "Direct with SSL Mode",
    url: "postgresql://postgres:NuKind123%23%24%25@db.svolcabvxuvvsidwxmwf.supabase.co:5432/postgres?sslmode=require"
  },
  {
    name: "Pooler with SSL Mode",
    url: "postgresql://postgres:NuKind123%23%24%25@db.svolcabvxuvvsidwxmwf.supabase.co:6543/postgres?sslmode=require"
  },
  {
    name: "Pooler with pgbouncer",
    url: "postgresql://postgres:NuKind123%23%24%25@db.svolcabvxuvvsidwxmwf.supabase.co:6543/postgres?pgbouncer=true"
  }
]

async function testAllConnections() {
  console.log('🔍 Testing all possible Supabase connection methods...\n')
  
  for (const config of connectionConfigs) {
    console.log(`Testing: ${config.name}`)
    console.log(`URL: ${config.url.substring(0, 60)}...`)
    
    try {
      // Set environment variable for this test
      process.env.DATABASE_URL = config.url
      
      const prisma = new PrismaClient({
        log: ['error'],
        datasources: {
          db: {
            url: config.url
          }
        }
      })
      
      // Test connection with timeout
      const connectPromise = prisma.$connect()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
      
      await Promise.race([connectPromise, timeoutPromise])
      
      // If we get here, connection worked
      console.log('✅ CONNECTION SUCCESSFUL!')
      
      // Try a simple query
      try {
        const userCount = await prisma.user.count()
        console.log(`✅ Query successful! User count: ${userCount}`)
        console.log(`\n🎉 WORKING CONNECTION FOUND: ${config.name}`)
        console.log(`Use this URL in your .env file:`)
        console.log(`DATABASE_URL=${config.url}\n`)
        
        await prisma.$disconnect()
        return config.url
        
      } catch (queryError) {
        console.log(`⚠️  Connection OK but query failed: ${queryError.message}`)
        await prisma.$disconnect()
      }
      
    } catch (error) {
      if (error.message.includes('timeout')) {
        console.log('❌ Connection timeout (10s)')
      } else if (error.message.includes('ENOTFOUND')) {
        console.log('❌ DNS resolution failed')
      } else if (error.message.includes('ECONNREFUSED')) {
        console.log('❌ Connection refused')
      } else if (error.message.includes("Can't reach")) {
        console.log('❌ Network unreachable')
      } else {
        console.log(`❌ Error: ${error.message.split('\n')[0]}`)
      }
    }
    
    console.log('') // Empty line for readability
  }
  
  console.log('❌ No working connection found.')
  console.log('\n📋 Next steps:')
  console.log('1. Check Supabase Dashboard for IP restrictions')
  console.log('2. Verify database password is correct')
  console.log('3. Try from your local machine')
  console.log('4. Contact Supabase support if issue persists')
}

testAllConnections().catch(console.error)