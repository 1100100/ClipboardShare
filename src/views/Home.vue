<template>
    <div class="home">
        <SendFile v-show="!showInit" ref="sf" :config="config"></SendFile>
        <!-- <router-link to="/sendfile">SENDFILE</router-link> -->

        <!-- <input
            type="text"
            placeholder="连接要共享剪切板的电脑IP"
            v-model="host"
        />
        <input type="text" placeholder="秘钥" v-model="connection_token" />
        <input type="button" value="连接" @click="connect_to_server" /> -->

        <div class="mask" v-if="showInit">
            <div class="container">
                <div class="group">
                    <label>连接秘钥:</label>
                    <input
                        type="text"
                        placeholder="请输入秘钥"
                        v-model="server_token"
                    />
                </div>
                <div class="group">
                    <label>接收文件保存目录:</label>
                    <div>
                        <input
                            type="text"
                            placeholder="请选择接收文件默认保存目录"
                            v-model="save_file_dir"
                            readonly="readonly"
                        />
                        <span @click="OnChooseFolder">选择</span>
                    </div>
                </div>
                <input type="button" value="保存" @click="SaveConfig" />
            </div>
        </div>
    </div>
</template>

<script>
const { ipcRenderer, remote } = require("electron");
import SendFile from "@/components/SendFile.vue";

import conf from "../lib/config.js";

export default {
    name: "Home",
    components: {
        SendFile,
    },
    data() {
        return {
            showInit: false,
            config: null,
            showSettings: false,
            showConnect: false,
            server_token:"",
            save_file_dir:""
        };
    },
    mounted() {
        ipcRenderer.on("OnUserJoin", (event, arg) => {
            console.warn(arg);
        });
        ipcRenderer.on("OnConnect", () => {
            console.warn("连接成功");
        });
        ipcRenderer.on("OnDisconnect", () => {
            console.warn("连接断开");
        });
        ipcRenderer.on("OnConnectError", (event, err) => {
            console.error("连接错误", err);
            remote.dialog.showErrorBox("错误", err);
        });
        this.config = conf.GetConfig();
        // this.token = this.conf.token;
        // this.nick_name = this.conf.nick_name;
        // this.token = this.conf.token;
        // this.folder = this.conf.save_file_dir;



        if (this.config.token) return;
        this.showInit = true;

        ipcRenderer.on("OnChangeSaveFileFolder", (event, folder) => {
            this.save_file_dir = folder;
        });
        ipcRenderer.on("SetShareStatus",(event,status)=>{
            this.config.enable=status;
        })
    },
    watch:{
        config:{
            handler:(newVal)=>{
                //监听配置是否修改，自动保存
                conf.ModifyConfig(newVal);
            },
            deep:true
        }
    },
    methods: {
        SaveConfig() {
            if (!this.server_token) {
                remote.dialog.showErrorBox("错误", "请输入秘钥");
                return;
            }
            if (!this.save_file_dir) {
                remote.dialog.showErrorBox("错误", "请选择文件默认保存目录！");
                return;
            }

            //conf.ModifyConfig(this.config);
            this.config.token=this.server_token;
            this.config.save_file_dir=this.save_file_dir;
            this.showInit = false;
            ipcRenderer.send("SetServerToken",this.server_token);
             this.$refs.sf.OnShow();
            //ipcRenderer.send("init-completed");
           
        },
        OnChooseFolder() {
            ipcRenderer.send("ChooseSaveFileFolder");
        },
    },
};
</script>
<style scoped>
.home {
    color: #333;
    height: 100%;
}
.config * {
    color: #fff;
}
.config .group {
    width: 100%;
    display: flex;
}

.mask {
    position: fixed;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    -webkit-app-region: drag;
}
.mask .container {
    background: #fff;
    padding: 30px;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    width: 320px;
    -webkit-app-region:none;
}
.mask .container .group {
    display: flex;
    flex-direction: column;
    margin-bottom: 15px;
}
.mask .container .group div {
    display: flex;
}
input[type="text"] {
    flex: 1;
    color: #000 !important;
}
.mask .container .group div span {
    margin: 0 0 0 5px;
    display: flex;
    align-items: center;
    border: 1px #ccc solid;
    padding: 0 5px;
    cursor: pointer;
}
.mask .container .group label {
    font-size: 12px;
    text-align: left;
    margin-bottom: 4px;
}
</style>
