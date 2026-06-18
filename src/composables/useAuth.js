import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'vue-router'

const user = ref(null)
const loading = ref(false)
const error = ref(null)

// Restore user from localStorage on init
const savedId = localStorage.getItem('bolao_user_id')
const savedNome = localStorage.getItem('bolao_user_nome')
if (savedId && savedNome) {
  user.value = { id: savedId, nome: savedNome }
}

export function useAuth() {
  const router = useRouter()
  const isLoggedIn = computed(() => !!user.value)

  async function login(nome, senha) {
    const groupPassword = import.meta.env.VITE_GROUP_PASSWORD

    if (senha !== groupPassword) {
      error.value = 'Senha do grupo incorreta!'
      return false
    }

    loading.value = true
    error.value = null

    try {
      // Try to find existing user
      let { data: existingUser, error: fetchError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('nome', nome.trim())
        .maybeSingle()

      if (fetchError) throw fetchError

      if (existingUser) {
        user.value = existingUser
      } else {
        // Create new user
        const { data: newUser, error: insertError } = await supabase
          .from('usuarios')
          .insert({ nome: nome.trim() })
          .select()
          .single()

        if (insertError) {
          if (insertError.code === '23505') {
            error.value = 'Esse nome já está em uso!'
          } else {
            throw insertError
          }
          return false
        }

        user.value = newUser
      }

      // Persist to localStorage
      localStorage.setItem('bolao_user_id', user.value.id)
      localStorage.setItem('bolao_user_nome', user.value.nome)
      
      router.push({ name: 'jogos' })
      return true
    } catch (err) {
      error.value = 'Erro ao conectar. Tente novamente.'
      console.error(err)
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    localStorage.removeItem('bolao_user_id')
    localStorage.removeItem('bolao_user_nome')
    router.push({ name: 'login' })
  }

  return {
    user,
    loading,
    error,
    isLoggedIn,
    login,
    logout,
  }
}
