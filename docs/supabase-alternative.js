// Test Supabase REST API access (might work even if DB direct access is blocked)
const fetch = require('node-fetch')

async function testSupabaseAPI() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('Testing Supabase REST API...')
  console.log('URL:', supabaseUrl)
  console.log('Has Key:', !!supabaseKey)
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/users?select=id&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    
    if (response.ok) {
      console.log('✅ Supabase REST API is accessible!')
      console.log('Status:', response.status)
      console.log('This means you can use Supabase SDK instead of direct Prisma connection')
    } else {
      console.log('❌ Supabase REST API failed:', response.status, response.statusText)
    }
    
  } catch (error) {
    console.log('❌ Supabase API test failed:', error.message)
  }
}

testSupabaseAPI()