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
  const email = 'admin@envolve.com.br';
  const password = 'admin123456';
  
  console.log(`Logging in as ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }
  
  const user = authData.user;
  console.log('Logged in successfully. User ID:', user.id);
  
  // Try to query current profile
  console.log('Fetching current profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (profileError) {
    console.error('Failed to fetch profile:', profileError.message);
    return;
  }
  
  console.log('Current profile:', profile);
  
  if (profile.organization_id) {
    console.log('Profile already has organization_id:', profile.organization_id);
    return;
  }
  
  // 1. Insert a new organization
  console.log("Inserting a new organization 'Envolve Mato Grosso'...");
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: 'Envolve Mato Grosso',
      plan: 'gratuito'
    })
    .select();
    
  if (orgError) {
    console.error('Failed to insert organization:', orgError.message);
    return;
  }
  
  const newOrg = orgData[0];
  console.log('Organization created successfully:', newOrg);
  
  // 2. Update current profile to set organization_id
  console.log(`Linking profile to organization ID ${newOrg.id}...`);
  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({
      organization_id: newOrg.id
    })
    .eq('id', user.id)
    .select();
    
  if (updateError) {
    console.error('Failed to link profile:', updateError.message);
  } else {
    console.log('🎉 SUCCESS! Profile linked to organization:', updatedProfile);
  }
}

run();
