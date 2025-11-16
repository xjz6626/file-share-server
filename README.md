# 📁 文件共享服务器

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.7+-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

一个轻量级的局域网文件共享服务器，支持文件上传下载、共享剪贴板和 PWA 渐进式 Web 应用。

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [安装部署](#-安装部署) • [API 文档](#-api-文档)

</div>

---

## ✨ 功能特性

### 📂 文件管理
- ✅ **拖拽上传** - 支持点击选择和拖拽文件上传
- ✅ **批量操作** - 可同时上传多个文件
- ✅ **在线预览** - 支持各类文件类型识别和图标显示
- ✅ **快速下载** - 一键下载任意文件
- ✅ **文件删除** - 支持删除不需要的文件
- ✅ **实时统计** - 显示文件数量和占用空间

### 📋 共享剪贴板
- ✅ **文本共享** - 在设备间快速共享文本内容
- ✅ **时间排序** - 按时间倒序自动排列
- ✅ **一键复制** - 支持现代浏览器和降级方案
- ✅ **查看详情** - 模态框展示完整文本
- ✅ **批量管理** - 支持单条删除和清空全部

### �� PWA 支持
- ✅ **安装到主屏幕** - 像原生 App 一样使用
- ✅ **离线缓存** - Service Worker 缓存静态资源
- ✅ **全屏体验** - 无浏览器地址栏干扰
- ✅ **跨平台** - 支持 Android/iOS/桌面端

### 🎨 界面设计
- ✅ **响应式布局** - 完美适配手机、平板、电脑
- ✅ **现代 UI** - 清爽的蓝色渐变主题
- ✅ **标签页切换** - 文件和剪贴板独立管理
- ✅ **实时反馈** - Toast 消息提示和进度条

## 🚀 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/xjz6626/file-share-server.git
cd file-share-server

# 2. 安装依赖
pip3 install -r requirements.txt

# 3. 启动服务器
python3 file_server.py

# 4. 访问应用
# 本地: http://localhost:8000
# 局域网: http://你的IP:8000
```

## 📦 系统服务安装

将服务安装为 systemd 服务，实现开机自启：

```bash
# 1. 复制服务文件
sudo cp file-share.service /etc/systemd/system/

# 2. 重新加载并启动
sudo systemctl daemon-reload
sudo systemctl enable file-share
sudo systemctl start file-share

# 3. 查看状态
sudo systemctl status file-share
```

## 📱 PWA 安装

### Android
1. Chrome/Edge 访问服务器
2. 点击弹出的"安装"提示
3. 或菜单 → "添加到主屏幕"

### iOS
1. Safari 访问服务器
2. 点击分享按钮 📤
3. 选择"添加到主屏幕"

## 🔌 API 文档

完整的 RESTful API：

- `GET /api/files` - 获取文件列表
- `POST /api/upload` - 上传文件
- `GET /api/download/<name>` - 下载文件
- `DELETE /api/delete/<name>` - 删除文件
- `GET /api/clipboard` - 获取剪贴板
- `POST /api/clipboard` - 添加剪贴板
- `DELETE /api/clipboard/<id>` - 删除剪贴板项
- `GET /api/info` - 服务器信息

详细文档见 [API.md](API.md)

## ❓ 常见问题

**Q: 其他设备无法访问？**  
A: 确保设备在同一局域网，检查防火墙 8000 端口

**Q: 如何修改端口？**  
A: 编辑 `file_server.py` 中的 `PORT` 变量

**Q: 支持HTTPS吗？**  
A: 建议使用 Nginx 反向代理配置 HTTPS

## 📝 更新日志

### v1.0.0 (2025-11-16)
- 🎉 初始版本发布
- ✅ 文件管理功能
- ✅ 共享剪贴板
- ✅ PWA 支持

## 📄 许可证

MIT License

---

<div align="center">

**⭐ 如果觉得有用，请给个 Star 支持一下！**

Made with ❤️ by [xjz6626](https://github.com/xjz6626)

</div>
