<template>
  <div class="pb-20 min-h-screen">
    <!-- Header -->
    <header class="sticky top-0 z-30 glass border-b border-copa-border">
      <div class="px-4 py-3">
        <h1 class="text-lg font-bold text-white flex items-center gap-1.5">
          <PhCards :size="20" class="text-white" /> Admin: Criar Carta
        </h1>
      </div>
    </header>

    <div class="px-4 py-6 space-y-4">
      <form @submit.prevent="submitCard" class="glass rounded-xl p-4 space-y-4">
        
        <div>
          <label class="block text-sm font-bold text-slate-300 mb-1">Selecione o Jogo</label>
          <select v-model="form.jogo_id" required class="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-copa-accent outline-none">
            <option value="" disabled>Escolha um jogo</option>
            <option v-for="jogo in jogos" :key="jogo.id" :value="jogo.id">
              [{{ jogo.data_formatada }}] {{ jogo.mandante }} vs {{ jogo.visitante }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-300 mb-1">Título da Carta</label>
          <input v-model="form.title" type="text" required placeholder="Ex: Goleada Histórica" class="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-copa-accent outline-none" />
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-300 mb-1">Descrição</label>
          <textarea v-model="form.description" rows="3" placeholder="Descrição do que aconteceu no jogo..." class="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-copa-accent outline-none"></textarea>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-300 mb-1">Imagem da Carta</label>
          <div class="flex items-center gap-4">
            <label class="cursor-pointer glass px-4 py-2 rounded-lg text-sm font-bold text-white hover:bg-slate-800 transition-colors border border-slate-600 flex items-center gap-2">
              <PhUpload :size="18" /> {{ imageFile ? 'Imagem Selecionada' : 'Escolher Imagem' }}
              <input type="file" accept="image/*" class="hidden" @change="handleFileSelect" />
            </label>
            <span v-if="imageFile" class="text-xs text-slate-400 truncate w-32">{{ imageFile.name }}</span>
          </div>
        </div>

        <div v-if="errorMsg" class="p-3 rounded-lg bg-red-900/50 border border-red-500/50 text-red-200 text-sm">
          {{ errorMsg }}
        </div>
        
        <div v-if="successMsg" class="p-3 rounded-lg bg-green-900/50 border border-green-500/50 text-green-200 text-sm">
          {{ successMsg }}
        </div>

        <button type="submit" :disabled="loading" class="w-full btn-primary py-3 rounded-lg font-black text-slate-900 flex justify-center items-center gap-2 mt-4 disabled:opacity-50">
          <svg v-if="loading" class="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading ? 'Criando...' : 'Criar Carta' }}
        </button>
      </form>

      <!-- Preview -->
      <div v-if="form.title || imagePreviewUrl" class="mt-8 pb-8">
        <h2 class="text-sm font-bold text-slate-400 mb-4 text-center uppercase tracking-widest">Preview da Carta</h2>
        <div class="max-w-[280px] mx-auto">
          <CardMagic 
            :title="form.title || 'Título da Carta'" 
            :description="form.description || 'Descrição vai aparecer aqui.'" 
            :imageUrl="imagePreviewUrl" 
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { PhCards, PhUpload } from '@phosphor-icons/vue'
import { supabase } from '../lib/supabaseClient'
import CardMagic from '../components/CardMagic.vue'

const jogos = ref([])
const form = ref({
  jogo_id: '',
  title: '',
  description: ''
})
const imageFile = ref(null)
const imagePreviewUrl = ref('')

const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

onMounted(async () => {
  // Carregar jogos para o select
  const { data, error } = await supabase
    .from('jogos')
    .select('id, data, mandante, visitante')
    .order('data', { ascending: false })
  
  if (data) {
    jogos.value = data.map(j => ({
      ...j,
      data_formatada: new Date(j.data).toLocaleDateString('pt-BR')
    }))
  }
})

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    imageFile.value = file
    imagePreviewUrl.value = URL.createObjectURL(file)
  }
}

const submitCard = async () => {
  if (!form.value.jogo_id || !form.value.title || !imageFile.value) {
    errorMsg.value = 'Preencha todos os campos obrigatórios e escolha uma imagem.'
    return
  }
  
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    // 1. Upload image to bucket
    const fileExt = imageFile.value.name.split('.').pop()
    const fileName = `${form.value.jogo_id}-${Date.now()}.${fileExt}`
    const filePath = `cartas/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('cartas')
      .upload(filePath, imageFile.value)

    if (uploadError) throw uploadError

    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('cartas')
      .getPublicUrl(filePath)

    // 3. Insert into DB
    const { error: dbError } = await supabase
      .from('cartas')
      .insert({
        jogo_id: form.value.jogo_id,
        title: form.value.title,
        description: form.value.description,
        image_url: publicUrl
      })

    if (dbError) throw dbError

    successMsg.value = 'Carta criada com sucesso!'
    
    // Reset form
    form.value = { jogo_id: '', title: '', description: '' }
    imageFile.value = null
    imagePreviewUrl.value = ''
    
    setTimeout(() => { successMsg.value = '' }, 3000)
    
  } catch (error) {
    console.error('Erro ao criar carta:', error)
    errorMsg.value = error.message || 'Ocorreu um erro ao criar a carta.'
  } finally {
    loading.value = false
  }
}
</script>
