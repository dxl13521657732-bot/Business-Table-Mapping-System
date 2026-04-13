<template>
  <div class="register-page">
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="register-card">
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="url(#grad2)"/>
            <rect x="8" y="11" width="24" height="3.5" rx="1.75" fill="white"/>
            <rect x="8" y="18" width="24" height="3.5" rx="1.75" fill="white"/>
            <rect x="8" y="25" width="16" height="3.5" rx="1.75" fill="white"/>
            <defs>
              <linearGradient id="grad2" x1="0" y1="0" x2="40" y2="40">
                <stop offset="0%" stop-color="#4f46e5"/>
                <stop offset="100%" stop-color="#3b82f6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="brand-name">用户注册</h1>
        <p class="brand-desc">业务表映射系统</p>
      </div>

      <a-form :model="form" layout="vertical" @finish="handleRegister" :rules="rules" ref="formRef">
        <a-form-item name="username">
          <a-input
            v-model:value="form.username"
            placeholder="请输入用户名"
            size="large"
            class="reg-input"
            :prefix="h(UserOutlined)"
            allow-clear
          />
        </a-form-item>

        <a-form-item name="password">
          <a-input-password
            v-model:value="form.password"
            placeholder="请设置密码"
            size="large"
            class="reg-input"
            :prefix="h(LockOutlined)"
          />
        </a-form-item>

        <a-form-item name="confirmPassword">
          <a-input-password
            v-model:value="form.confirmPassword"
            placeholder="请再次输入密码"
            size="large"
            class="reg-input"
            :prefix="h(LockOutlined)"
          />
        </a-form-item>

        <a-alert
          v-if="errorMsg"
          type="error"
          :message="errorMsg"
          show-icon
          style="margin-bottom: 16px; border-radius: 8px"
        />

        <a-alert
          v-if="successMsg"
          type="success"
          :message="successMsg"
          show-icon
          style="margin-bottom: 16px; border-radius: 8px"
        />

        <a-button
          type="primary"
          html-type="submit"
          size="large"
          block
          :loading="loading"
          class="reg-btn"
        >
          注 册
        </a-button>
      </a-form>

      <div class="reg-footer">
        已有账号？
        <router-link to="/login" style="color: #4f46e5; font-weight: 600">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, h } from 'vue'
import { useRouter } from 'vue-router'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { checkUsernameExists, registerUser } from '@/api/auth'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const settingsStore = useSettingsStore()

const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const formRef = ref()

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
})

const rules = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 2, message: '用户名至少 2 个字符' },
  ],
  password: [
    { required: true, message: '请设置密码' },
    { min: 6, message: '密码至少 6 位' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码' },
    {
      validator: (_: unknown, value: string) => {
        if (value !== form.password) return Promise.reject('两次密码输入不一致')
        return Promise.resolve()
      },
    },
  ],
}

async function handleRegister() {
  if (!settingsStore.usersTableId) {
    errorMsg.value = '系统未配置用户表，请联系管理员'
    return
  }
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const exists = await checkUsernameExists(form.username)
    if (exists) {
      errorMsg.value = `用户名"${form.username}"已被使用，请换一个`
      return
    }
    await registerUser({
      用户名: form.username,
      密码: form.password,
    })
    successMsg.value = '注册成功！2 秒后自动跳转到登录页...'
    setTimeout(() => router.push('/login'), 2000)
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
  position: relative;
  overflow: hidden;
}

.bg-decoration { position: absolute; inset: 0; pointer-events: none; }
.circle { position: absolute; border-radius: 50%; opacity: 0.15; }
.circle-1 { width: 500px; height: 500px; background: linear-gradient(135deg, #4f46e5, #3b82f6); top: -200px; right: -150px; }
.circle-2 { width: 300px; height: 300px; background: linear-gradient(135deg, #818cf8, #60a5fa); bottom: -100px; left: -80px; }
.circle-3 { width: 150px; height: 150px; background: #4f46e5; bottom: 100px; right: 200px; opacity: 0.08; }

.register-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 40px 40px 32px;
  width: 420px;
  box-shadow: 0 20px 60px rgba(79, 70, 229, 0.15), 0 4px 20px rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1;
}

.brand { text-align: center; margin-bottom: 28px; }
.brand-icon { width: 52px; height: 52px; margin: 0 auto 10px; }
.brand-icon svg { width: 100%; height: 100%; }
.brand-name {
  font-size: 20px; font-weight: 700;
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  margin: 0 0 4px; letter-spacing: 1px;
}
.brand-desc { color: #94a3b8; font-size: 13px; margin: 0; }

.reg-input { border-radius: 10px !important; height: 44px; }

.reg-btn {
  height: 46px !important;
  border-radius: 10px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%) !important;
  border: none !important;
  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.35) !important;
  transition: all 0.2s !important;
}
.reg-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45) !important; }

.reg-footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
</style>
