#!/bin/bash

# Script to update all remaining Supabase API routes from old auth pattern to new server pattern

echo "Updating Supabase imports in API routes..."

# Find all files that still import from @supabase/supabase-js
find app/api -name "*.ts" -exec grep -l "from '@supabase/supabase-js'" {} \; | while read file; do
    echo "Updating: $file"
    
    # Replace import
    sed -i "s|from '@supabase/supabase-js'|from '@/utils/supabase/server'|g" "$file"
    
    # Replace auth pattern - this is a complex pattern, so we'll show what needs to be done
    echo "  - Updated import"
    echo "  - Manual auth pattern update needed:"
    echo "    OLD:"
    echo "      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)"
    echo "      const authHeader = request.headers.get('authorization')"
    echo "      const token = authHeader.split(' ')[1]"
    echo "      const { data: { user }, error } = await supabase.auth.getUser(token)"
    echo "    NEW:"
    echo "      const supabase = await createClient()"
    echo "      const { data: { user }, error } = await supabase.auth.getUser()"
    echo ""
done

echo "Update complete! Please review each file and update the auth patterns manually."
