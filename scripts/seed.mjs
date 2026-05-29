import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { createInterface } from 'readline'

function ask(query) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((res) => rl.question(query, (ans) => { rl.close(); res(ans) }))
}

function loadEnv() {
  try {
    const envPath = resolve(import.meta.dirname, '..', '.env')
    const content = readFileSync(envPath, 'utf-8')
    const env = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1)
    }
    return { env, envPath }
  } catch {
    return { env: {}, envPath: null }
  }
}

function saveEnvVar(envPath, key, value) {
  if (!envPath) return
  try {
    let content = readFileSync(envPath, 'utf-8')
    const lines = content.split('\n')
    let found = false
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(key + '=')) {
        lines[i] = key + '=' + value
        found = true
        break
      }
    }
    if (!found) {
      lines.push(key + '=' + value)
    }
    writeFileSync(envPath, lines.join('\n'), 'utf-8')
    console.log(`  Atualizado ${key} no .env`)
  } catch (err) {
    console.error('  Não foi possível salvar no .env:', err.message)
  }
}

async function main() {
  const { env, envPath } = loadEnv()
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error('ERRO: VITE_SUPABASE_URL não encontrada.')
    process.exit(1)
  }

  if (!serviceRoleKey) {
    console.log('\nA chave SUPABASE_SERVICE_ROLE_KEY não está definida no ambiente.')
    console.log('Para obtê-la:')
    console.log('  1. Acesse https://supabase.com/dashboard')
    console.log('  2. Selecione o projeto')
    console.log('  3. Vá em Project Settings > API')
    console.log('  4. Copie a "service_role" key\n')
    serviceRoleKey = await ask('Cole a service_role key: ')

    if (!serviceRoleKey || !serviceRoleKey.trim()) {
      console.error('Nenhuma chave fornecida. Abortando.')
      process.exit(1)
    }
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey.trim(), {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const email = 'admin@envolve.com.br'
  const password = 'admin123456'
  const fullName = 'Administrador'
  const orgName = 'Envolve Mato Grosso'

  console.log(`\n1. Verificando organização "${orgName}"...`)

  let orgId
  const { data: orgs } = await adminClient.from('organizations').select('*').eq('name', orgName)
  if (orgs && orgs.length > 0) {
    orgId = orgs[0].id
    console.log(`   Organização já existe: ${orgId}`)
  } else {
    const { data: newOrg, error: orgError } = await adminClient
      .from('organizations')
      .insert({ name: orgName, plan: 'gratuito' })
      .select('id')
      .single()

    if (orgError) {
      console.error('   Erro ao criar organização:', orgError.message)
      process.exit(1)
    }
    orgId = newOrg.id
    console.log(`   Organização criada: ${orgId}`)
  }

  if (orgId && envPath) {
    saveEnvVar(envPath, 'VITE_ORGANIZATION_ID', orgId)
  }

  console.log(`\n2. Verificando usuário: ${email}...`)

  const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers()

  if (listError) {
    console.error('Erro ao listar usuários:', listError.message)
    process.exit(1)
  }

  const existingUser = existingUsers.users.find((u) => u.email === email)
  let userId

  if (existingUser) {
    userId = existingUser.id
    console.log(`   Usuário já existe com ID: ${userId}`)

    const shouldReset = await ask('   Deseja redefinir a senha? (s/N): ')
    if (shouldReset.toLowerCase() === 's') {
      const { error: pwError } = await adminClient.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      })
      if (pwError) {
        console.error('   Erro ao atualizar senha:', pwError.message)
      } else {
        console.log('   Senha atualizada com sucesso.')
      }
    }
  } else {
    console.log('   Usuário não encontrado. Criando...')
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (createError) {
      console.error('   Erro ao criar usuário:', createError.message)
      process.exit(1)
    }

    userId = newUser.user.id
    console.log(`   Usuário criado com ID: ${userId}`)
  }

  if (userId && orgId) {
    console.log('\n3. Atualizando perfil...')
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: userId,
        organization_id: orgId,
        full_name: fullName,
        email,
        role: 'admin',
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('   Erro ao atualizar perfil:', profileError.message)
    } else {
      console.log('   Perfil atualizado com role = admin e organization_id.')
    }
  }

  console.log('\n=== CONFIGURAÇÃO CONCLUÍDA ===')
  console.log(`  Email: ${email}`)
  console.log(`  Senha: ${password}`)
  console.log(`  Organization ID: ${orgId}`)
  console.log('\nExecute: npm run dev')
}

main().catch(console.error)
