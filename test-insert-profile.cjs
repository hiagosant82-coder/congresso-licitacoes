const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

if (!urlMatch || !keyMatch) {
  console.error('Could not read Supabase credentials from .env');
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseAnonKey = keyMatch[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Logging in as admin to test profiles insert...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@envolve.com.br',
    password: 'admin123456'
  });
  
  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }
  
  // Try inserting a record with a fake ID but bypass the reference constraint? 
  // Wait, profiles references auth.users(id), so we must use a real auth user ID!
  // Let's get the admin's ID which is f3dea000-6f5f-4911-a82e-c8703dcb6149.
  // Wait, if we try to insert a profile with an existing ID, it will throw a primary key violation.
  // Let's see if we can do an insert into participants instead to see if there is any issue there!
  console.log('Testing insert into participants...');
  const { data: partData, error: partError } = await supabase.from('participants').insert({
    organization_id: 'fe16f58b-adcc-45e8-bb05-0a2cb446bc2b',
    full_name: 'Test Insertion',
    email: 'test_insert@envolve.com.br',
    status: 'ativo',
    payment_status: 'paid',
    access_status: 'active'
  }).select();
  
  if (partError) {
    console.error('❌ Participants insert failed:', partError.message);
  } else {
    console.log('✅ Participants insert success:', partData);
    
    // Clean up
    const { error: delError } = await supabase.from('participants').delete().eq('id', partData[0].id);
    if (delError) {
      console.error('Failed to delete test participant:', delError.message);
    } else {
      console.log('Test participant cleaned up.');
    }
  }
}

run();
