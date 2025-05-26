<template>
  <div style="padding: 40px; max-width: 900px; margin: 0 auto;">
    <h1>DDSMonitor</h1>
    <a-upload
      :show-upload-list="false"
      accept=".json"
      :before-upload="onImportJson"
    >
      <a-button type="primary">导入JSON文件</a-button>
    </a-upload>
    <div v-if="jsonContent" style="margin-top: 32px;">
      <h3>解析结果：</h3>
      <pre style="background: #f6f6f6; padding: 16px; border-radius: 6px; overflow-x: auto;">
{{ jsonContent }}
      </pre>
    </div>
    <div v-if="errorMsg" style="color: red; margin-top: 16px;">
      {{ errorMsg }}
    </div>

    <!-- 退出弹窗 -->
    <a-modal
      :open="showExitAppMsgbox"
      :confirm-loading="isExitingApp"
      :cancel-button-props="{ disabled: isExitingApp }"
      :closable="!isExitingApp"
      ok-text="确定"
      cancel-text="取消"
      @ok="onExitApp"
      @cancel="showExitAppMsgbox = false"
    >
      <div style="font-weight:bold;font-size:14px;">
        <span style="color:#ff0000;">警告</span>
      </div>
      <p>{{ isExitingApp ? "正在退出客户端......" : "您确定要退出客户端软件吗？" }}</p>
    </a-modal>

    <!-- 最小化到托盘弹窗 -->
    <a-modal
      :open="showClosePrimaryWinMsgbox"
      title="警告"
      @ok="onMinPrimaryWinToTray"
      @cancel="showClosePrimaryWinMsgbox = false"
    >
      <template #footer>
        <a-button key="minimize" type="primary" @click="onMinPrimaryWinToTray">
          最小化
        </a-button>
        <a-button key="exit-app" :loading="isExitingApp" @click="onExitApp">
          退出
        </a-button>
      </template>
      <p>退出客户端软件将导致功能不可用，建议您最小化到系统托盘！</p>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "ant-design-vue";

const jsonContent = ref<string>("");
const errorMsg = ref<string>("");

const showExitAppMsgbox = ref(false);
const showClosePrimaryWinMsgbox = ref(false);
const isExitingApp = ref(false);

function onImportJson(file: File) {
  errorMsg.value = "";
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string;
      const json = JSON.parse(text);
      jsonContent.value = JSON.stringify(json, null, 2);
      message.success("JSON文件解析成功！");
    } catch (err: any) {
      errorMsg.value = "JSON解析失败：" + err.message;
      jsonContent.value = "";
    }
  };
  reader.onerror = () => {
    errorMsg.value = "文件读取失败";
    jsonContent.value = "";
  };
  reader.readAsText(file);
  // 阻止自动上传
  return false;
}

// 获取主进程API
function getElectronApi() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).primaryWindowAPI;
}

// 退出应用
async function onExitApp() {
  isExitingApp.value = true;
  await getElectronApi().asyncExitApp();
  isExitingApp.value = false;
  showExitAppMsgbox.value = false;
}

// 最小化到托盘
function onMinPrimaryWinToTray() {
  showClosePrimaryWinMsgbox.value = false;
  getElectronApi().minToTray();
}

// 监听主进程信号
onMounted(() => {
  const api = getElectronApi();
  if (api?.onShowExitAppMsgbox) {
    api.onShowExitAppMsgbox(() => {
      showExitAppMsgbox.value = true;
    });
  }
  if (api?.onShowClosePrimaryWinMsgbox) {
    api.onShowClosePrimaryWinMsgbox(() => {
      showClosePrimaryWinMsgbox.value = true;
    });
  }
});
</script>

<style scoped>
h1 {
  text-align: center;
  margin-bottom: 32px;
}
</style>