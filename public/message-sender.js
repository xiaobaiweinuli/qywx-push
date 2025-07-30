// 消息发送测试页面脚本

document.addEventListener('DOMContentLoaded', function () {
    // 元素引用
    const configCodeInput = document.getElementById('config-code');
    const resultSection = document.getElementById('result-section');
    const resultContent = document.getElementById('result-content');
    const toastContainer = document.getElementById('toast-container');

    // Tab切换功能
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有active状态
            tabs.forEach(t => t.classList.remove('tab-active'));
            tabContents.forEach(content => content.classList.add('hidden'));

            // 激活当前tab
            tab.classList.add('tab-active');
            const targetTab = tab.getAttribute('data-tab');
            document.getElementById(`tab-${targetTab}`).classList.remove('hidden');
        });
    });

    // 获取当前配置Code
    function getConfigCode() {
        const code = configCodeInput.value.trim();
        if (!code) {
            showToast('请输入配置Code', 'error');
            return null;
        }
        return code;
    }

    // 显示结果
    function showResult(success, data, requestData = null) {
        resultSection.classList.remove('hidden');

        const statusClass = success ? 'alert-success' : 'alert-error';
        const statusIcon = success ? 'check-circle' : 'alert-circle';
        const statusText = success ? '发送成功' : '发送失败';

        let resultHtml = `
            <div class="alert ${statusClass}">
                <i data-lucide="${statusIcon}" class="h-5 w-5"></i>
                <span>${statusText}</span>
            </div>
        `;

        if (requestData) {
            resultHtml += `
                <div class="mt-4">
                    <h4 class="font-medium mb-2">📤 请求数据</h4>
                    <div class="bg-base-200 p-3 rounded-md">
                        <pre class="text-sm">${JSON.stringify(requestData, null, 2)}</pre>
                    </div>
                </div>
            `;
        }

        resultHtml += `
            <div class="mt-4">
                <h4 class="font-medium mb-2">📥 响应数据</h4>
                <div class="bg-base-200 p-3 rounded-md">
                    <pre class="text-sm">${JSON.stringify(data, null, 2)}</pre>
                </div>
            </div>
        `;

        resultContent.innerHTML = resultHtml;
        lucide.createIcons();

        // 滚动到结果区域
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    // 显示提示消息
    function showToast(message, type = 'info') {
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-error',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const toast = document.createElement('div');
        toast.className = 'alert ' + alertClass;
        toast.innerHTML = `<span>${message}</span>`;

        toastContainer.appendChild(toast);

        gsap.fromTo(toast,
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: 0.3 }
        );

        setTimeout(() => {
            gsap.to(toast, {
                opacity: 0,
                y: -20,
                duration: 0.3,
                onComplete: () => toast.remove()
            });
        }, 3000);
    }

    // 通用发送函数
    async function sendMessage(endpoint, data, isFormData = false) {
        const code = getConfigCode();
        if (!code) return;

        try {
            const url = `/api/notify/${code}${endpoint}`;
            const options = {
                method: 'POST'
            };

            if (isFormData) {
                options.body = data;
            } else {
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            const result = await response.json();

            if (response.ok) {
                showResult(true, result, isFormData ? null : data);
                showToast('消息发送成功！', 'success');
            } else {
                showResult(false, result, isFormData ? null : data);
                showToast(`发送失败: ${result.error}`, 'error');
            }
        } catch (error) {
            const errorData = { error: error.message };
            showResult(false, errorData, isFormData ? null : data);
            showToast(`网络错误: ${error.message}`, 'error');
        }
    }

    // 1. 文本消息发送
    document.getElementById('text-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            title: formData.get('title') || undefined,
            content: formData.get('content')
        };
        await sendMessage('', data);
    });

    // 2. 文本卡片发送
    document.getElementById('textcard-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            url: formData.get('url'),
            btntxt: formData.get('btntxt') || '详情'
        };
        await sendMessage('/textcard', data);
    });

    // 3. Markdown消息发送
    document.getElementById('markdown-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            content: formData.get('content')
        };
        await sendMessage('/markdown', data);
    });

    // 4. 图文消息相关
    let articleCount = 1;

    document.getElementById('add-article').addEventListener('click', () => {
        articleCount++;
        const articleHtml = `
            <div class="article-item border border-base-300 rounded-lg p-4">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-medium">图文项 ${articleCount}</h4>
                    <button type="button" class="btn btn-ghost btn-xs remove-article">
                        <i data-lucide="x" class="h-3 w-3"></i>
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">标题</span>
                        </label>
                        <input type="text" name="title" class="input input-bordered input-sm" 
                               placeholder="图文标题" required>
                    </div>
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">链接</span>
                        </label>
                        <input type="url" name="url" class="input input-bordered input-sm" 
                               placeholder="https://example.com" required>
                    </div>
                    <div class="form-control md:col-span-2">
                        <label class="label">
                            <span class="label-text">描述（可选）</span>
                        </label>
                        <textarea name="description" class="textarea textarea-bordered textarea-sm h-16" 
                                placeholder="图文描述"></textarea>
                    </div>
                    <div class="form-control md:col-span-2">
                        <label class="label">
                            <span class="label-text">图片链接（可选）</span>
                        </label>
                        <input type="url" name="picurl" class="input input-bordered input-sm" 
                               placeholder="https://example.com/image.jpg">
                    </div>
                </div>
            </div>
        `;
        document.getElementById('news-articles').insertAdjacentHTML('beforeend', articleHtml);
        lucide.createIcons();
    });

    // 删除图文项
    document.getElementById('news-articles').addEventListener('click', (e) => {
        if (e.target.closest('.remove-article')) {
            e.target.closest('.article-item').remove();
            // 重新编号
            const articles = document.querySelectorAll('.article-item h4');
            articles.forEach((h4, index) => {
                h4.textContent = `图文项 ${index + 1}`;
            });
            articleCount = articles.length;
        }
    });

    // 发送图文消息
    document.getElementById('send-news').addEventListener('click', async () => {
        const articles = [];
        const articleItems = document.querySelectorAll('.article-item');

        for (const item of articleItems) {
            const title = item.querySelector('input[name="title"]').value.trim();
            const url = item.querySelector('input[name="url"]').value.trim();
            const description = item.querySelector('textarea[name="description"]').value.trim();
            const picurl = item.querySelector('input[name="picurl"]').value.trim();

            if (!title || !url) {
                showToast('请填写所有图文项的标题和链接', 'error');
                return;
            }

            const article = { title, url };
            if (description) article.description = description;
            if (picurl) article.picurl = picurl;

            articles.push(article);
        }

        if (articles.length === 0) {
            showToast('请至少添加一个图文项', 'error');
            return;
        }

        await sendMessage('/news', { articles });
    });

    // 5. 文件上传相关
    const fileInput = document.getElementById('file-input');
    const fileDropZone = document.getElementById('file-drop-zone');
    const dropText = document.getElementById('drop-text');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');

    // 点击选择文件
    fileDropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择处理
    fileInput.addEventListener('change', handleFileSelect);

    // 拖拽上传
    fileDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropZone.classList.add('dragover');
    });

    fileDropZone.addEventListener('dragleave', () => {
        fileDropZone.classList.remove('dragover');
    });

    fileDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropZone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect();
        }
    });

    function handleFileSelect() {
        const file = fileInput.files[0];
        if (file) {
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            dropText.classList.add('hidden');
            fileInfo.classList.remove('hidden');
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 文件发送
    document.getElementById('file-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const file = formData.get('file');

        if (!file || file.size === 0) {
            showToast('请选择要上传的文件', 'error');
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            showToast('文件大小不能超过20MB', 'error');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading loading-spinner loading-sm mr-2"></span>上传中...';

        try {
            await sendMessage('/file', formData, true);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    // 6. 自定义消息发送
    document.getElementById('enhanced-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const messageData = JSON.parse(formData.get('data'));
            messageData.type = formData.get('type');

            await sendMessage('/enhanced', messageData);
        } catch (error) {
            showToast('JSON格式错误: ' + error.message, 'error');
        }
    });

    // 预设示例数据
    const examples = {
        text: {
            title: '🚨 系统告警',
            content: '服务器CPU使用率过高，当前使用率：85%，请及时处理！'
        },
        textcard: {
            title: '🚨 服务器告警',
            description: '服务器CPU使用率过高，当前使用率：85%，请及时处理！',
            url: 'https://monitor.example.com/server-01',
            btntxt: '查看详情'
        },
        markdown: `# 📊 系统监控报告

## 服务器状态
- **CPU使用率**: 45%
- **内存使用率**: 67%
- **磁盘使用率**: 23%

## 网络状态
- **入站流量**: 1.2 MB/s
- **出站流量**: 0.8 MB/s

> 系统运行正常 ✅

[查看详细监控](https://monitor.example.com)`,
        news: [
            {
                title: '🚀 新版本发布',
                description: 'v2.0版本已发布，包含多项新功能和性能优化',
                url: 'https://example.com/release/v2.0',
                picurl: 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=New+Release'
            },
            {
                title: '📊 月度报告',
                description: '查看本月系统运行报告和统计数据',
                url: 'https://example.com/reports/monthly',
                picurl: 'https://via.placeholder.com/300x200/059669/ffffff?text=Monthly+Report'
            }
        ]
    };

    // 添加示例数据按钮
    function addExampleButtons() {
        // 文本消息示例
        const textForm = document.getElementById('text-form');
        const textExampleBtn = document.createElement('button');
        textExampleBtn.type = 'button';
        textExampleBtn.className = 'btn btn-outline btn-sm';
        textExampleBtn.innerHTML = '<i data-lucide="lightbulb" class="h-4 w-4 mr-1"></i>填入示例';
        textExampleBtn.addEventListener('click', () => {
            textForm.querySelector('input[name="title"]').value = examples.text.title;
            textForm.querySelector('textarea[name="content"]').value = examples.text.content;
        });
        textForm.appendChild(textExampleBtn);

        // 文本卡片示例
        const textcardForm = document.getElementById('textcard-form');
        const textcardExampleBtn = document.createElement('button');
        textcardExampleBtn.type = 'button';
        textcardExampleBtn.className = 'btn btn-outline btn-sm';
        textcardExampleBtn.innerHTML = '<i data-lucide="lightbulb" class="h-4 w-4 mr-1"></i>填入示例';
        textcardExampleBtn.addEventListener('click', () => {
            textcardForm.querySelector('input[name="title"]').value = examples.textcard.title;
            textcardForm.querySelector('textarea[name="description"]').value = examples.textcard.description;
            textcardForm.querySelector('input[name="url"]').value = examples.textcard.url;
            textcardForm.querySelector('input[name="btntxt"]').value = examples.textcard.btntxt;
        });
        textcardForm.appendChild(textcardExampleBtn);

        // Markdown示例
        const markdownForm = document.getElementById('markdown-form');
        const markdownExampleBtn = document.createElement('button');
        markdownExampleBtn.type = 'button';
        markdownExampleBtn.className = 'btn btn-outline btn-sm';
        markdownExampleBtn.innerHTML = '<i data-lucide="lightbulb" class="h-4 w-4 mr-1"></i>填入示例';
        markdownExampleBtn.addEventListener('click', () => {
            markdownForm.querySelector('textarea[name="content"]').value = examples.markdown;
        });
        markdownForm.appendChild(markdownExampleBtn);

        // 图文消息示例
        const newsSection = document.getElementById('tab-news');
        const newsExampleBtn = document.createElement('button');
        newsExampleBtn.type = 'button';
        newsExampleBtn.className = 'btn btn-outline btn-sm';
        newsExampleBtn.innerHTML = '<i data-lucide="lightbulb" class="h-4 w-4 mr-1"></i>填入示例';
        newsExampleBtn.addEventListener('click', () => {
            // 清空现有图文项
            document.getElementById('news-articles').innerHTML = '';
            articleCount = 0;

            // 添加示例图文项
            examples.news.forEach((article, index) => {
                document.getElementById('add-article').click();
                const lastArticle = document.querySelector('.article-item:last-child');
                lastArticle.querySelector('input[name="title"]').value = article.title;
                lastArticle.querySelector('input[name="url"]').value = article.url;
                lastArticle.querySelector('textarea[name="description"]').value = article.description;
                lastArticle.querySelector('input[name="picurl"]').value = article.picurl;
            });
        });
        newsSection.querySelector('.flex.gap-2').insertBefore(newsExampleBtn, newsSection.querySelector('#send-news'));

        lucide.createIcons();
    }

    // 初始化示例按钮
    addExampleButtons();

    // 页面加载完成提示
    showToast('消息发送测试页面已加载，请输入配置Code开始测试', 'info');
});