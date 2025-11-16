// API 基础URL
const API_BASE = window.location.origin;

// DOM 元素
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const fileListContainer = document.getElementById('fileListContainer');
const fileCount = document.getElementById('fileCount');
const totalSize = document.getElementById('totalSize');
const toast = document.getElementById('toast');
const clipboardInput = document.getElementById('clipboardInput');
const clipboardListContainer = document.getElementById('clipboardListContainer');
const clipboardCount = document.getElementById('clipboardCount');
const viewModal = document.getElementById('viewModal');
const modalContent = document.getElementById('modalContent');

// 当前标签页
let currentTab = 'files';
let currentModalItemId = null;
let deferredPrompt = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadFiles();
    loadServerInfo();
    loadClipboard();
    setupEventListeners();
    registerServiceWorker();
    setupPWA();
});

// 设置事件监听
function setupEventListeners() {
    // 点击上传区域
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            uploadFiles(e.target.files);
        }
    });

    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            uploadFiles(e.dataTransfer.files);
        }
    });
}

// 加载文件列表
async function loadFiles() {
    try {
        const response = await fetch(`${API_BASE}/api/files`);
        const data = await response.json();

        if (data.success) {
            renderFiles(data.files);
        } else {
            showToast('加载文件列表失败', 'error');
        }
    } catch (error) {
        console.error('加载文件列表错误:', error);
        showToast('加载文件列表失败', 'error');
    }
}

// 加载服务器信息
async function loadServerInfo() {
    try {
        const response = await fetch(`${API_BASE}/api/info`);
        const data = await response.json();

        if (data.success) {
            fileCount.textContent = data.info.file_count;
            totalSize.textContent = data.info.total_size_formatted;
        }
    } catch (error) {
        console.error('加载服务器信息错误:', error);
    }
}

// 渲染文件列表
function renderFiles(files) {
    if (files.length === 0) {
        fileListContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>暂无文件</h3>
                <p>上传文件开始共享吧!</p>
            </div>
        `;
        return;
    }

    fileListContainer.innerHTML = files.map(file => `
        <div class="file-item">
            <div class="file-info">
                <div class="file-icon">${file.icon}</div>
                <div class="file-details">
                    <div class="file-name">${escapeHtml(file.name)}</div>
                    <div class="file-meta">
                        ${file.size_formatted} • ${file.modified}
                    </div>
                </div>
            </div>
            <div class="file-actions">
                <button class="btn btn-download" onclick="downloadFile('${escapeHtml(file.name)}')">
                    ⬇️ 下载
                </button>
                <button class="btn btn-delete" onclick="deleteFile('${escapeHtml(file.name)}')">
                    🗑️ 删除
                </button>
            </div>
        </div>
    `).join('');
}

// 上传文件
async function uploadFiles(files) {
    const totalFiles = files.length;
    let uploadedCount = 0;

    uploadProgress.style.display = 'block';

    for (let file of files) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                uploadedCount++;
                const percent = Math.round((uploadedCount / totalFiles) * 100);
                progressFill.style.width = percent + '%';
                progressText.textContent = `上传中... ${percent}% (${uploadedCount}/${totalFiles})`;
            } else {
                showToast(`上传 ${file.name} 失败: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('上传错误:', error);
            showToast(`上传 ${file.name} 失败`, 'error');
        }
    }

    // 上传完成
    setTimeout(() => {
        uploadProgress.style.display = 'none';
        progressFill.style.width = '0%';
        fileInput.value = '';
        
        if (uploadedCount > 0) {
            showToast(`成功上传 ${uploadedCount} 个文件`, 'success');
            loadFiles();
            loadServerInfo();
        }
    }, 500);
}

// 下载文件
function downloadFile(filename) {
    const url = `${API_BASE}/api/download/${encodeURIComponent(filename)}`;
    window.location.href = url;
}

// 删除文件
async function deleteFile(filename) {
    if (!confirm(`确定要删除文件 "${filename}" 吗?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/delete/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showToast('删除成功', 'success');
            loadFiles();
            loadServerInfo();
        } else {
            showToast('删除失败: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('删除错误:', error);
        showToast('删除失败', 'error');
    }
}

// 显示提示消息
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 定期刷新
setInterval(() => {
    loadFiles();
    loadServerInfo();
    loadClipboard();
}, 30000); // 每30秒刷新一次

// ========== 标签页切换 ==========

function switchTab(tab) {
    currentTab = tab;
    
    // 更新标签按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 更新内容显示
    document.getElementById('filesTab').classList.remove('active');
    document.getElementById('clipboardTab').classList.remove('active');
    
    if (tab === 'files') {
        document.getElementById('filesTab').classList.add('active');
        loadFiles();
        loadServerInfo();
    } else if (tab === 'clipboard') {
        document.getElementById('clipboardTab').classList.add('active');
        loadClipboard();
    }
}

// ========== 剪贴板功能 ==========

// 加载剪贴板列表
async function loadClipboard() {
    try {
        const response = await fetch(`${API_BASE}/api/clipboard`);
        const data = await response.json();

        if (data.success) {
            renderClipboard(data.items);
            clipboardCount.textContent = data.count;
        } else {
            showToast('加载剪贴板失败', 'error');
        }
    } catch (error) {
        console.error('加载剪贴板错误:', error);
        showToast('加载剪贴板失败', 'error');
    }
}

// 渲染剪贴板列表
function renderClipboard(items) {
    if (items.length === 0) {
        clipboardListContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>剪贴板为空</h3>
                <p>添加文本开始共享吧!</p>
            </div>
        `;
        return;
    }

    clipboardListContainer.innerHTML = items.map(item => `
        <div class="clipboard-item">
            <div class="clipboard-item-header">
                <span class="clipboard-item-time">🕐 ${item.timestamp}</span>
            </div>
            <div class="clipboard-item-preview">${escapeHtml(item.preview)}</div>
            <div class="clipboard-item-actions">
                <button class="btn btn-copy" onclick="copyClipboard('${escapeHtml(item.content)}')">
                    📋 复制
                </button>
                <button class="btn btn-view" onclick="viewClipboard(${item.id}, '${escapeHtml(item.content)}')">
                    👁️ 查看
                </button>
                <button class="btn btn-delete" onclick="deleteClipboard(${item.id})">
                    🗑️ 删除
                </button>
            </div>
        </div>
    `).join('');
}

// 添加剪贴板内容
async function addClipboard() {
    const content = clipboardInput.value.trim();
    
    if (!content) {
        showToast('请输入内容', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/clipboard`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        const data = await response.json();

        if (data.success) {
            showToast('添加成功', 'success');
            clipboardInput.value = '';
            loadClipboard();
        } else {
            showToast('添加失败: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('添加剪贴板错误:', error);
        showToast('添加失败', 'error');
    }
}

// 复制剪贴板内容
function copyClipboard(content) {
    // 解码HTML实体
    const textarea = document.createElement('textarea');
    textarea.innerHTML = content;
    const decodedContent = textarea.value;
    
    // 尝试使用现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(decodedContent).then(() => {
            showToast('已复制到剪贴板', 'success');
        }).catch(err => {
            console.error('Clipboard API 失败，使用降级方案:', err);
            fallbackCopy(decodedContent);
        });
    } else {
        // 降级方案
        fallbackCopy(decodedContent);
    }
}

// 降级复制方案（兼容方案）
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    
    textarea.focus();
    textarea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast('已复制到剪贴板', 'success');
        } else {
            showToast('复制失败，请手动复制', 'error');
        }
    } catch (err) {
        console.error('复制失败:', err);
        showToast('复制失败，请手动复制', 'error');
    }
    
    document.body.removeChild(textarea);
}

// 查看剪贴板详情
function viewClipboard(id, content) {
    currentModalItemId = id;
    // 解码HTML实体
    const textarea = document.createElement('textarea');
    textarea.innerHTML = content;
    modalContent.textContent = textarea.value;
    viewModal.classList.add('show');
}

// 删除剪贴板项
async function deleteClipboard(id) {
    if (!confirm('确定要删除这条记录吗?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/clipboard/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showToast('删除成功', 'success');
            loadClipboard();
        } else {
            showToast('删除失败: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('删除错误:', error);
        showToast('删除失败', 'error');
    }
}

// 清空全部剪贴板
async function clearAllClipboard() {
    if (!confirm('确定要清空所有剪贴板内容吗?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/clipboard/clear`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showToast('清空成功', 'success');
            loadClipboard();
        } else {
            showToast('清空失败: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('清空错误:', error);
        showToast('清空失败', 'error');
    }
}

// 清空输入框
function clearInput() {
    clipboardInput.value = '';
}

// 关闭模态框
function closeModal() {
    viewModal.classList.remove('show');
    currentModalItemId = null;
}

// 复制模态框内容
function copyModalContent() {
    const content = modalContent.textContent;
    
    // 尝试使用现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(content).then(() => {
            showToast('已复制到剪贴板', 'success');
        }).catch(err => {
            console.error('Clipboard API 失败，使用降级方案:', err);
            fallbackCopy(content);
        });
    } else {
        // 降级方案
        fallbackCopy(content);
    }
}

// 点击模态框外部关闭
viewModal.addEventListener('click', (e) => {
    if (e.target === viewModal) {
        closeModal();
    }
});

// ========== PWA 功能 ==========

// 注册 Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker 注册成功:', registration);
            })
            .catch(error => {
                console.log('Service Worker 注册失败:', error);
            });
    }
}

// 设置 PWA 安装
function setupPWA() {
    const installPrompt = document.getElementById('installPrompt');
    const installBtn = document.getElementById('installBtn');
    const dismissBtn = document.getElementById('dismissBtn');

    // 监听安装提示事件
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // 显示自定义安装提示
        setTimeout(() => {
            installPrompt.classList.add('show');
        }, 3000); // 3秒后显示
    });

    // 安装按钮点击
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            showToast('应用安装成功！', 'success');
        }
        
        deferredPrompt = null;
        installPrompt.classList.remove('show');
    });

    // 稍后按钮点击
    dismissBtn.addEventListener('click', () => {
        installPrompt.classList.remove('show');
        // 7天后再次提示
        localStorage.setItem('installDismissed', Date.now());
    });

    // 检查是否已安装
    window.addEventListener('appinstalled', () => {
        showToast('应用已添加到主屏幕！', 'success');
        installPrompt.classList.remove('show');
    });

    // iOS Safari 提示（iOS 不支持 beforeinstallprompt）
    if (isIOS() && !isInStandaloneMode()) {
        setTimeout(() => {
            showIOSInstallPrompt();
        }, 5000);
    }
}

// 检测是否为 iOS
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// 检测是否在独立模式（已安装）
function isInStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// iOS 安装提示
function showIOSInstallPrompt() {
    const dismissed = localStorage.getItem('iosInstallDismissed');
    if (dismissed && Date.now() - dismissed < 7 * 24 * 60 * 60 * 1000) {
        return; // 7天内不再提示
    }

    const message = '💡 提示：点击 Safari 底部的分享按钮，然后选择"添加到主屏幕"，即可像App一样使用本应用。';
    
    if (confirm(message)) {
        localStorage.setItem('iosInstallDismissed', Date.now());
    }
}
