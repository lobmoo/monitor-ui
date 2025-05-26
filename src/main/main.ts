import { BrowserWindow, app, dialog, session, Menu } from "electron";
import log from "electron-log/main";
import PrimaryWindow from "./windows/primary";
import { CreateAppTray } from "./tray";
import appState from "./app-state";

// 禁用沙盒
// 在某些系统环境上，不禁用沙盒会导致界面花屏
//app.commandLine.appendSwitch("no-sandbox");


 // 设置中文菜单栏
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "文件",
      submenu: [
        {
          label: "退出",
          accelerator: "CmdOrCtrl+Q",
          click: () => { app.quit(); }
        }
      ]
    },
    {
      label: "帮助",
      submenu: [
        {
          label: "关于",
          click: () => {
            dialog.showMessageBox({
              type: "info",
              title: "关于",
              message: "DDSMonitor\n版本: 1.0.0",
              detail: "基于 Electron + Vue3 开发"
            });
          }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
// 移除默认菜单栏
 Menu.setApplicationMenu(menu);

const gotLock = app.requestSingleInstanceLock();

// 如果程序只允许启动一个实例时，第二个实例启动后会直接退出
if(!gotLock && appState.onlyAllowSingleInstance){
  app.quit();
}else{
  app.whenReady().then(() => {
    if(!appState.initialize()){
      dialog.showErrorBox("App initialization failed", "The program will exit after click the OK button.",);
      app.exit();
      return;
    }

    log.info("App initialize ok");

    appState.primaryWindow = new PrimaryWindow();
    appState.tray = CreateAppTray();

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [ "script-src 'self'" ],
        },
      });
    });
  });

  // 当程序的第二个实例启动时，显示第一个实例的主窗口
  app.on("second-instance", () => {
    appState.primaryWindow?.browserWindow?.show();
  });

  app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
    if(BrowserWindow.getAllWindows().length === 0)
      appState.primaryWindow = new PrimaryWindow();
  });

  app.on("window-all-closed", () => {
    if(process.platform !== "darwin")
      app.quit();
  });

  app.on("will-quit", () => {
    appState.uninitialize();
  });
}