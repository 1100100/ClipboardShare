'use strict'

import { app, protocol, BrowserWindow, screen, ipcMain, dialog } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import config from './lib/config.js'
const isDevelopment = process.env.NODE_ENV !== 'production'

import program from "./program.js";
var suspensionWindow = null;
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
	{ scheme: 'app', privileges: { secure: true, standard: true } }
])
var mainWin = null;
var configs = config.GetConfig();
async function createWindow() {
	// Create the browser window.
	const win = mainWin = new BrowserWindow({
		width: 2000,
		height: 1500,
		webPreferences: {
			// Use pluginOptions.nodeIntegration, leave this alone
			// See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
			nodeIntegration: true
		}
	})

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		// Load the url of the dev server if in development mode
		await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
		if (!process.env.IS_TEST) win.webContents.openDevTools()
	} else {
		createProtocol('app')
		// Load the index.html when not in development
		win.loadURL('app://./index.html')
	}
	process.env.ELECTRON_RUN_AS_NODE = 0;
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		suspensionWindow.destroy();
		app.quit()
	}
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
	if (isDevelopment && !process.env.IS_TEST) {
		// Install Vue Devtools
		try {
			await installExtension(VUEJS_DEVTOOLS)
		} catch (e) {
			console.error('Vue Devtools failed to install:', e.toString())
		}
	}
	createWindow();
	createSuspensionWindow();

	program.Init(configs, mainWin, suspensionWindow)

})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
	if (process.platform === 'win32') {
		process.on('message', (data) => {
			if (data === 'graceful-exit') {
				suspensionWindow.destroy();
				app.quit()
			}
		})
	} else {
		process.on('SIGTERM', () => {
			suspensionWindow.destroy();
			app.quit()
		})
	}
}


async function createSuspensionWindow() {

	suspensionWindow = new BrowserWindow({
		title: "发送文件",
		width: 1500, height: 800,
		type: "toolbar",
		frame: true,//要创建无边框窗口
		resizable: false,
		show: configs.token ? true : false,
		webPreferences: {
			nodeIntegration: true
		},
		transparent: false,
		alwaysOnTop: true,
		skipTaskbar: false
	});

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		suspensionWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL + "#/sendfile")

	} else {
		// Load the index.html when not in development
		suspensionWindow.loadURL('app://./index.html/#/sendfile')
	}
	// suspensionWindow.once('ready-to-show', () => {
	// 	suspensionWindow.show()
	// });
	if (!process.env.IS_TEST)
		suspensionWindow.webContents.openDevTools()



	// const size = screen.getPrimaryDisplay().workAreaSize;   //获取显示器的宽高
	// const winSize = win.getSize();  //获取窗口宽高

	// //设置窗口的位置 注意x轴要桌面的宽度 - 窗口的宽度
	// win.setPosition(size.width - winSize[0], 100);

}
//将文件拖入悬浮窗
ipcMain.on("drag_in_files", (event, arg) => {
	if (suspensionWindow) {
		//suspensionWindow.setSize(300, 300, true);
	}
});
//选择文件保存目录
ipcMain.on("ChooseSaveFileFolder", (event, arg) => {
	dialog.showOpenDialog({ properties: ["openDirectory"] }).then(e => {
		//console.warn(e);
		if (e.canceled)
			return;
		mainWin.webContents.send("OnChangeSaveFileFolder", e.filePaths[0]);
	});
});
//基本信息填写完成
ipcMain.on("init-completed", (event, arg) => {
	suspensionWindow.show();
});
