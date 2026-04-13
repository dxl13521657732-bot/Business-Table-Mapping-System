<template>
  <div class="login-page">
    <!-- 装饰性几何背景 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="login-card">
      <!-- 顶部品牌区 -->
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="url(#grad)"/>
            <rect x="8" y="11" width="24" height="3.5" rx="1.75" fill="white"/>
            <rect x="8" y="18" width="24" height="3.5" rx="1.75" fill="white"/>
            <rect x="8" y="25" width="16" height="3.5" rx="1.75" fill="white"/>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40">
                <stop offset="0%" stop-color="#4f46e5"/>
                <stop offset="100%" stop-color="#3b82f6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="brand-name">业务表映射系统</h1>
        <p class="brand-desc">数据开发效率工具</p>
      </div>

      <!-- 登录表单 -->
      <a-form :model="form" layout="vertical" @finish="handleLogin">
        <a-form-item
          name="username"
          :rules="[{ required: true, message: '请输入用户名' }]"
        >
          <a-input
            v-model:value="form.username"
            placeholder="请输入用户名"
            size="large"
            class="login-input"
            :prefix="h(UserOutlined)"
            allow-clear
          />
        </a-form-item>

        <a-form-item
          name="password"
          :rules="[{ required: true, message: '请输入密码' }]"
        >
          <a-input-password
            v-model:value="form.password"
            placeholder="请输入密码"
            size="large"
            class="login-input"
            :prefix="h(LockOutlined)"
          />
        </a-form-item>

        <div class="remember-row">
          <a-checkbox v-model:checked="form.remember">记住我（7天）</a-checkbox>
        </div>

        <a-alert
          v-if="errorMsg"
          type="error"
          :message="errorMsg"
          show-icon
          style="margin-bottom: 16px; border-radius: 8px"
        />

        <a-button
          type="primary"
          html-type="submit"
          size="large"
          block
          :loading="loading"
          class="login-btn"
        >
          登 录
        </a-button>
      </a-form>

      <div class="login-footer">
        <div style="color: #64748b; font-size: 14px">
          没有账号？
          <router-link to="/register" style="color: #4f46e5; font-weight: 600">立即注册</router-link>
        </div>
      </div>
    </div>

    <SettingsModal v-model:open="settingsOpen" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, h } from 'vue'
import { useRouter } from 'vue-router'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import SettingsModal from '@/components/SettingsModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

const loading = ref(false)
const errorMsg = ref('')
const settingsOpen = ref(!settingsStore.isConfigured)

const form = reactive({
  username: '',
  password: '',
  remember: false,
})

async function handleLogin() {
  if (!settingsStore.usersTableId) {
    errorMsg.value = '未配置用户表，请点击下方"系统设置"填写用户表 ID'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    await authStore.login(form.username, form.password, form.remember)
    router.push('/mapping')
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
  position: relative;
  overflow: hidden;
}

/* 背景装饰圆 */
.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
}

.circle-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
  top: -200px;
  right: -150px;
}

.circle-2 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #818cf8, #60a5fa);
  bottom: -100px;
  left: -80px;
}

.circle-3 {
  width: 150px;
  height: 150px;
  background: #4f46e5;
  bottom: 100px;
  right: 200px;
  opacity: 0.08;
}

/* 登录卡片 */
.login-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 44px 40px 36px;
  width: 420px;
  box-shadow: 0 20px 60px rgba(79, 70, 229, 0.15), 0 4px 20px rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1;
}

/* 品牌区 */
.brand {
  text-align: center;
  margin-bottom: 32px;
}

.brand-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
}

.brand-icon svg {
  width: 100%;
  height: 100%;
}

.brand-name {
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 4px;
  letter-spacing: 1px;
}

.brand-desc {
  color: #94a3b8;
  font-size: 13px;
  margin: 0;
}

/* 输入框 */
.login-input {
  border-radius: 10px !important;
  height: 46px;
}

.remember-row {
  margin-bottom: 16px;
  margin-top: -4px;
}

/* 登录按钮 */
.login-btn {
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

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45) !important;
}

/* 底部 */
.login-footer {
  text-align: center;
  margin-top: 20px;
}
</style>
