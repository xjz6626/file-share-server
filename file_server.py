#!/usr/bin/env python3
"""
文件共享服务器 - 后端API
提供RESTful API支持文件上传、下载、删除、列表等操作
"""

from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import socket
import json
from datetime import datetime
from pathlib import Path

# 配置
PORT = 8000
SHARE_DIR = "./shared_files"
STATIC_DIR = "./frontend"
CLIPBOARD_FILE = "./clipboard_data.json"

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 确保目录存在
os.makedirs(SHARE_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

# 初始化剪贴板数据
if not os.path.exists(CLIPBOARD_FILE):
    with open(CLIPBOARD_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f)


def get_file_icon(filename):
    """根据文件扩展名返回对应图标"""
    ext = os.path.splitext(filename)[1].lower()
    icons = {
        '.pdf': '📄',
        '.doc': '📝', '.docx': '📝',
        '.xls': '📊', '.xlsx': '📊',
        '.ppt': '📽️', '.pptx': '📽️',
        '.jpg': '🖼️', '.jpeg': '🖼️', '.png': '🖼️', '.gif': '🖼️', '.bmp': '🖼️',
        '.mp4': '🎬', '.avi': '🎬', '.mov': '🎬', '.mkv': '🎬',
        '.mp3': '🎵', '.wav': '🎵', '.flac': '🎵',
        '.zip': '📦', '.rar': '📦', '.7z': '📦', '.tar': '📦', '.gz': '📦',
        '.txt': '📃',
        '.py': '🐍', '.js': '📜', '.html': '🌐', '.css': '🎨',
        '.json': '📋', '.xml': '📋',
    }
    return icons.get(ext, '📄')


def format_size(size):
    """格式化文件大小"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024.0:
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{size:.1f} PB"


def get_local_ip():
    """获取本机局域网IP地址"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


# ========== API 路由 ==========

@app.route('/')
def index():
    """返回前端页面"""
    return send_from_directory(STATIC_DIR, 'index.html')


@app.route('/api/files', methods=['GET'])
def list_files():
    """获取文件列表"""
    try:
        files = []
        for filename in os.listdir(SHARE_DIR):
            filepath = os.path.join(SHARE_DIR, filename)
            if os.path.isfile(filepath):
                stat = os.stat(filepath)
                files.append({
                    'name': filename,
                    'size': stat.st_size,
                    'size_formatted': format_size(stat.st_size),
                    'modified': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
                    'icon': get_file_icon(filename)
                })
        
        # 按修改时间倒序排序
        files.sort(key=lambda x: x['modified'], reverse=True)
        
        return jsonify({
            'success': True,
            'files': files,
            'count': len(files)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """上传文件"""
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': '没有文件'
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': '文件名为空'
            }), 400
        
        # 安全处理文件名
        filename = secure_filename(file.filename)
        filepath = os.path.join(SHARE_DIR, filename)
        
        # 如果文件已存在，添加序号
        if os.path.exists(filepath):
            name, ext = os.path.splitext(filename)
            counter = 1
            while os.path.exists(filepath):
                filename = f"{name}_{counter}{ext}"
                filepath = os.path.join(SHARE_DIR, filename)
                counter += 1
        
        file.save(filepath)
        
        return jsonify({
            'success': True,
            'message': '上传成功',
            'filename': filename
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    """下载文件"""
    try:
        return send_from_directory(SHARE_DIR, filename, as_attachment=True)
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 404


@app.route('/api/delete/<filename>', methods=['DELETE'])
def delete_file(filename):
    """删除文件"""
    try:
        filepath = os.path.join(SHARE_DIR, filename)
        
        if not os.path.exists(filepath):
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'message': '删除成功'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/info', methods=['GET'])
def server_info():
    """获取服务器信息"""
    try:
        total_size = sum(
            os.path.getsize(os.path.join(SHARE_DIR, f))
            for f in os.listdir(SHARE_DIR)
            if os.path.isfile(os.path.join(SHARE_DIR, f))
        )
        
        file_count = len([
            f for f in os.listdir(SHARE_DIR)
            if os.path.isfile(os.path.join(SHARE_DIR, f))
        ])
        
        return jsonify({
            'success': True,
            'info': {
                'file_count': file_count,
                'total_size': total_size,
                'total_size_formatted': format_size(total_size),
                'share_dir': os.path.abspath(SHARE_DIR)
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ========== 剪贴板 API ==========

@app.route('/api/clipboard', methods=['GET'])
def get_clipboard():
    """获取剪贴板列表"""
    try:
        with open(CLIPBOARD_FILE, 'r', encoding='utf-8') as f:
            clipboard_data = json.load(f)
        
        # 按时间倒序排序
        clipboard_data.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            'success': True,
            'items': clipboard_data,
            'count': len(clipboard_data)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/clipboard', methods=['POST'])
def add_clipboard():
    """添加剪贴板内容"""
    try:
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({
                'success': False,
                'error': '内容不能为空'
            }), 400
        
        content = data['content'].strip()
        
        if not content:
            return jsonify({
                'success': False,
                'error': '内容不能为空'
            }), 400
        
        # 读取现有数据
        with open(CLIPBOARD_FILE, 'r', encoding='utf-8') as f:
            clipboard_data = json.load(f)
        
        # 添加新项
        new_item = {
            'id': len(clipboard_data) + 1,
            'content': content,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'preview': content[:100] + ('...' if len(content) > 100 else '')
        }
        
        clipboard_data.append(new_item)
        
        # 保存数据
        with open(CLIPBOARD_FILE, 'w', encoding='utf-8') as f:
            json.dump(clipboard_data, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            'success': True,
            'message': '添加成功',
            'item': new_item
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/clipboard/<int:item_id>', methods=['DELETE'])
def delete_clipboard(item_id):
    """删除剪贴板项"""
    try:
        # 读取现有数据
        with open(CLIPBOARD_FILE, 'r', encoding='utf-8') as f:
            clipboard_data = json.load(f)
        
        # 查找并删除
        initial_length = len(clipboard_data)
        clipboard_data = [item for item in clipboard_data if item['id'] != item_id]
        
        if len(clipboard_data) == initial_length:
            return jsonify({
                'success': False,
                'error': '项目不存在'
            }), 404
        
        # 保存数据
        with open(CLIPBOARD_FILE, 'w', encoding='utf-8') as f:
            json.dump(clipboard_data, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            'success': True,
            'message': '删除成功'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/clipboard/clear', methods=['DELETE'])
def clear_clipboard():
    """清空剪贴板"""
    try:
        with open(CLIPBOARD_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)
        
        return jsonify({
            'success': True,
            'message': '清空成功'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# 静态文件服务
@app.route('/<path:path>')
def serve_static(path):
    """提供静态文件"""
    return send_from_directory(STATIC_DIR, path)


def main():
    """启动服务器"""
    local_ip = get_local_ip()
    
    print("=" * 60)
    print("🚀 文件共享服务器已启动!")
    print("=" * 60)
    print(f"\n📍 本地访问地址:")
    print(f"   http://localhost:{PORT}")
    print(f"\n📱 局域网访问地址 (其他设备使用此地址):")
    print(f"   http://{local_ip}:{PORT}")
    print(f"\n📁 共享目录: {os.path.abspath(SHARE_DIR)}")
    print(f"\n💡 API端点:")
    print(f"   文件管理:")
    print(f"     GET    /api/files          - 获取文件列表")
    print(f"     POST   /api/upload         - 上传文件")
    print(f"     GET    /api/download/<name> - 下载文件")
    print(f"     DELETE /api/delete/<name>   - 删除文件")
    print(f"   剪贴板:")
    print(f"     GET    /api/clipboard      - 获取剪贴板列表")
    print(f"     POST   /api/clipboard      - 添加剪贴板内容")
    print(f"     DELETE /api/clipboard/<id>  - 删除剪贴板项")
    print(f"     DELETE /api/clipboard/clear - 清空剪贴板")
    print(f"   其他:")
    print(f"     GET    /api/info           - 服务器信息")
    print(f"\n⚙️  按 Ctrl+C 停止服务器")
    print("=" * 60 + "\n")
    
    app.run(host='0.0.0.0', port=PORT, debug=False)


if __name__ == "__main__":
    main()
