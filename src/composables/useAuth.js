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

  async function login(nome, senhaGrupo, codigoPessoal) {
    const groupPassword = import.meta.env.VITE_GROUP_PASSWORD

    if (senhaGrupo !== groupPassword) {
      error.value = 'Senha do grupo incorreta!'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: rpcError } = await supabase.rpc('login_ou_registro', {
        p_nome: nome.trim(),
        p_codigo: codigoPessoal.trim()
      })

      if (rpcError) throw rpcError

      if (!data.sucesso) {
        error.value = data.mensagem
        return false
      }

      user.value = data.usuario

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
