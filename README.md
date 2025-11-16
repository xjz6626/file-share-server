# 文件共享服务器

一个基于 Flask + HTML/CSS/JS 的前后端分离文件共享服务器，支持多设备访问。

## ✨ 功能特性

- 📤 **文件上传** - 支持点击上传和拖拽上传，可批量上传
- 📥 **文件下载** - 支持所有类型文件的下载
- 🗑️ **文件删除** - 一键删除不需要的文件
- 🎨 **美观界面** - 响应式设计，完美支持手机、平板、电脑
- 📊 **实时统计** - 显示文件数量和总大小
- � **自动刷新** - 文件列表每30秒自动更新
- 🎯 **RESTful API** - 前后端分离，API可独立使用
- �🔒 **局域网访问** - 仅限内网访问，安全可靠

## 🏗️ 技术架构

### 后端 (Flask)
- Python 3.x
- Flask Web框架
- Flask-CORS 跨域支持
- RESTful API设计

### 前端
- 原生 HTML5/CSS3/JavaScript
- 响应式设计
- 拖拽上传支持
- 实时进度显示

## 🚀 快速开始

### 方式一：使用启动脚本（推荐）

```bash
# 1. 进入项目目录
cd /home/xjz/workplace/share

# 2. 添加执行权限
chmod +x start.sh

# 3. 运行服务器
./start.sh
```

### 方式二：手动安装依赖

```bash
# 1. 安装依赖
pip3 install -r requirements.txt

# 2. 运行服务器
python3 file_server.py
```

### 方式二：使用后台运行

```bash
# 后台运行服务器
nohup python3 file_server.py > server.log 2>&1 &

# 查看运行状态
ps aux | grep file_server.py

# 停止服务器
pkill -f file_server.py
```

## 📱 设备访问方式

### 1️⃣ 启动服务器后，会显示访问地址：

```
🚀 文件共享服务器已启动!
============================================================

📍 本地访问地址:
   http://localhost:8000

📱 局域网访问地址 (其他设备使用此地址):
   http://192.168.x.x:8000

📁 共享目录: /home/xjz/workplace/share/shared_files
```

### 2️⃣ 在其他设备上访问：

- **手机/平板**: 打开浏览器，输入局域网地址
- **其他电脑**: 打开浏览器，输入局域网地址

### 3️⃣ 确保所有设备连接到同一局域网

## 🔧 配置说明

在 `file_server.py` 中可以修改以下配置：

```python
PORT = 8000              # 服务器端口
SHARE_DIR = "./shared_files"  # 共享文件存储目录
```

## 📂 目录结构

```
share/
├── file_server.py              # Flask后端服务器
├── requirements.txt            # Python依赖
├── frontend/                   # 前端文件
│   ├── index.html             # 主页面
│   ├── styles.css             # 样式文件
│   └── app.js                 # JavaScript逻辑
├── shared_files/              # 共享文件存储目录（自动创建）
├── start.sh                   # 启动脚本
├── start_background.sh        # 后台启动脚本
├── stop.sh                    # 停止脚本
└── README.md                  # 说明文档
```

## 🔌 API 文档

### 获取文件列表
```
GET /api/files
Response: {
    "success": true,
    "files": [
        {
            "name": "example.pdf",
            "size": 1024,
            "size_formatted": "1.0 KB",
            "modified": "2025-11-16 10:30:00",
            "icon": "📄"
        }
    ],
    "count": 1
}
```

### 上传文件
```
POST /api/upload
Content-Type: multipart/form-data
Body: file=<文件>
Response: {
    "success": true,
    "message": "上传成功",
    "filename": "example.pdf"
}
```

### 下载文件
```
GET /api/download/<filename>
Response: 文件流
```

### 删除文件
```
DELETE /api/delete/<filename>
Response: {
    "success": true,
    "message": "删除成功"
}
```

### 服务器信息
```
GET /api/info
Response: {
    "success": true,
    "info": {
        "file_count": 10,
        "total_size": 1048576,
        "total_size_formatted": "1.0 MB",
        "share_dir": "/path/to/shared_files"
    }
}
```

## 🛡️ 安全提示

- 此服务器仅适用于**可信任的局域网环境**
- 不建议在公网使用，因为没有身份验证机制
- 如需公网访问，建议配置防火墙和身份验证

## 🔥 进阶使用

### 开机自动启动

创建 systemd 服务文件：

```bash
sudo nano /etc/systemd/system/file-share.service
```

添加以下内容：

```ini
[Unit]
Description=File Share Server
After=network.target

[Service]
Type=simple
User=xjz
WorkingDirectory=/home/xjz/workplace/share
ExecStart=/usr/bin/python3 /home/xjz/workplace/share/file_server.py
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl enable file-share.service
sudo systemctl start file-share.service
sudo systemctl status file-share.service
```

### 使用不同端口

如果端口 8000 被占用，可以修改 `PORT` 变量：

```python
PORT = 9000  # 或其他未被占用的端口
```

### 配置防火墙

确保防火墙允许相应端口：

```bash
# Ubuntu/Debian
sudo ufw allow 8000/tcp

# CentOS/RHEL
sudo firewall-cmd --add-port=8000/tcp --permanent
sudo firewall-cmd --reload
```

## 🆘 常见问题

### Q: 其他设备无法访问？
A: 检查以下几点：
1. 确保所有设备在同一局域网
2. 检查服务器防火墙是否开放对应端口
3. 确认使用的是局域网IP地址，不是 localhost

### Q: 如何查看服务器IP地址？
A: 运行服务器时会自动显示，或者使用命令：
```bash
ip addr show | grep inet
# 或
hostname -I
```

### Q: 支持哪些文件类型？
A: 支持所有文件类型的上传和下载

## 📝 更新日志

- **v1.0** (2025-11-16)
  - 初始版本发布
  - 支持文件上传、下载、删除
  - 响应式Web界面

## 📄 许可证

MIT License
