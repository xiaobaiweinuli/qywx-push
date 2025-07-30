// 企业微信通知配置前端交互脚本 - 完整版

document.addEventListener('DOMContentLoaded', function () {
    // 元素引用
    const callbackForm = document.getElementById('callbackForm');
    const configForm = document.getElementById('configForm');
    const validateBtn = document.getElementById('validateBtn');
    const userListSection = document.getElementById('userListSection');
    const userList = document.getElementById('userList');
    const lookupForm = document.getElementById('lookupForm');
    const lookupResultDiv = document.getElementById('lookup-result');
    const resultDiv = document.getElementById('result');
    const saveAlert = document.getElementById('save-alert');
    const step1Container = document.getElementById('step1-container');
    const step2Container = document.getElementById('step2-container');
    const callbackResult = document.getElementById('callbackResult');

    let usersCache = [];
    let currentCode = null; // 存储当前的code

    // 第一步：生成回调URL
    callbackForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        resultDiv.innerHTML = '';

        const corpid = callbackForm.corpid.value.trim();
        const callbackToken = callbackForm.callback_token.value.trim();
        const encodingAesKey = callbackForm.encoding_aes_key.value.trim();

        if (!corpid || !callbackToken || !encodingAesKey) {
            showError('请填写所有必填项');
            return;
        }
        if (encodingAesKey.length !== 43) {
            showError('EncodingAESKey必须是43位字符');
            return;
        }

        const submitBtn = callbackForm.querySelector('button[type=submit]');
        submitBtn.disabled = true;
        submitBtn.textContent = '生成中...';

        try {
            const res = await fetch('/api/generate-callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    corpid,
                    callback_token: callbackToken,
                    encoding_aes_key: encodingAesKey
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '生成失败');

            currentCode = data.code;
            showCallbackResult(data);

            // 显示第二步
            step2Container.classList.remove('hidden');
            gsap.from(step2Container, { opacity: 0, y: 20, duration: 0.5 });

            // 将CorpID传递到第二步
            configForm.corpid = { value: corpid };

        } catch (err) {
            showError('生成回调URL失败: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '生成回调URL';
        }
    });

    // 验证并获取成员列表
    validateBtn.addEventListener('click', async function (e) {
        e.preventDefault();
        resultDiv.innerHTML = '';
        userList.innerHTML = '';
        userListSection.classList.add('hidden');

        const corpid = callbackForm.corpid.value.trim(); // 从第一步获取
        const corpsecret = configForm.corpsecret.value.trim();
        if (!corpid || !corpsecret) {
            showError('请填写CorpSecret');
            return;
        }
        validateBtn.disabled = true;
        validateBtn.textContent = '验证中...';
        try {
            const res = await fetch('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ corpid, corpsecret })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '验证失败');
            usersCache = data.users || [];
            if (usersCache.length === 0) {
                showError('未获取到任何成员');
                return;
            }
            userList.innerHTML = usersCache.map(user =>
                `<label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" class="checkbox checkbox-sm" value="${user.userid}">
                    <span>${user.name} <span class="text-xs text-gray-400">(${user.userid})</span></span>
                </label>`
            ).join('');
            userListSection.classList.remove('hidden');
            gsap.from(userListSection, { opacity: 0, y: 20, duration: 0.5 });
        } catch (err) {
            showError(err.message);
        } finally {
            validateBtn.disabled = false;
            validateBtn.textContent = '验证并获取成员列表';
        }
    });

    // 查找配置
    lookupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = lookupForm.code.value.trim();
        if (!code) return;

        lookupResultDiv.innerHTML = '<div class="loading loading-spinner loading-md mx-auto"></div>';

        try {
            const res = await fetch(`/api/configuration/${code}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || '查找配置失败');

            // 显示配置信息
            const apiUrl = `/api/notify/${data.code}`;
            lookupResultDiv.innerHTML = `
                <div class="card bg-base-100 shadow-md">
                    <div class="card-body">
                        <h2 class="card-title flex items-center gap-2">
                            <i data-lucide="settings" class="h-5 w-5"></i>
                            配置详情
                        </h2>
                        <div class="space-y-2 mt-2">
                            <p><span class="font-medium">CorpID:</span> ${data.corpid}</p>
                            <p><span class="font-medium">AgentID:</span> ${data.agentid}</p>
                            <p><span class="font-medium">接收用户:</span> ${data.touser.join(', ')}</p>
                            <p><span class="font-medium">描述:</span> ${data.description || '无'}</p>
                            <p><span class="font-medium">回调状态:</span> ${data.callback_enabled ? '已启用' : '未启用'}</p>
                            ${data.callback_enabled ? `<p><span class="font-medium">回调Token:</span> ${data.callback_token || '未设置'}</p>` : ''}
                            <p><span class="font-medium">创建时间:</span> ${new Date(data.created_at).toLocaleString()}</p>
                        </div>
                        <div class="card-actions justify-end mt-4">
                            <button class="btn btn-primary btn-sm" id="edit-config-btn" data-code="${data.code}">
                                <i data-lucide="edit" class="h-4 w-4"></i>
                                编辑配置
                            </button>
                            <button class="btn btn-outline btn-sm" id="copy-api-btn" data-code="${data.code}">
                                <i data-lucide="copy" class="h-4 w-4"></i>
                                复制API地址
                            </button>
                        </div>

                        <div class="divider">API使用说明</div>

                        <div class="space-y-4">
                            <div>
                                <h3 class="font-medium mb-2">请求方式</h3>
                                <div class="bg-base-200 p-3 rounded-md">
                                    <code class="text-sm">POST ${apiUrl}</code>
                                </div>
                            </div>

                            <div>
                                <h3 class="font-medium mb-2">请求头</h3>
                                <div class="bg-base-200 p-3 rounded-md">
                                    <code class="text-sm">Content-Type: application/json</code>
                                </div>
                            </div>

                            <div>
                                <h3 class="font-medium mb-2">请求参数</h3>
                                <div class="overflow-x-auto">
                                    <table class="table table-zebra w-full">
                                        <thead>
                                            <tr>
                                                <th>参数名</th>
                                                <th>类型</th>
                                                <th>必填</th>
                                                <th>说明</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td class="font-mono">title</td>
                                                <td>String</td>
                                                <td>否</td>
                                                <td>消息标题，可选</td>
                                            </tr>
                                            <tr>
                                                <td class="font-mono">content</td>
                                                <td>String</td>
                                                <td>是</td>
                                                <td>消息内容，必填</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div>
                                <h3 class="font-medium mb-2">请求示例</h3>
                                <div class="bg-base-200 p-3 rounded-md">
<pre class="text-sm whitespace-pre-wrap">curl -X POST "${apiUrl}" \\
-H "Content-Type: application/json" \\
-d '{
  "title": "服务器告警",
  "content": "CPU使用率超过90%，请及时处理！"
}'</pre>
                                </div>
                            </div>

                            <div>
                                <h3 class="font-medium mb-2">返回示例</h3>
                                <div class="bg-base-200 p-3 rounded-md">
<pre class="text-sm whitespace-pre-wrap">{
  "message": "发送成功",
  "response": {
    "errcode": 0,
    "errmsg": "ok",
    "msgid": "MSGID1234567890"
  }
}</pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            lucide.createIcons();
            gsap.from(lookupResultDiv.firstElementChild, { opacity: 0, y: 20, duration: 0.5 });

            // 绑定编辑和复制按钮事件
            document.getElementById('edit-config-btn').addEventListener('click', (e) => {
                const code = e.currentTarget.dataset.code;
                showEditModal(data);
            });

            document.getElementById('copy-api-btn').addEventListener('click', (e) => {
                const code = e.currentTarget.dataset.code;
                navigator.clipboard.writeText(`/api/notify/${code}`);
                showToast('API地址已复制到剪贴板');
            });

        } catch (err) {
            lookupResultDiv.innerHTML = `
                <div class="alert alert-error">
                    <i data-lucide="alert-circle" class="h-5 w-5"></i>
                    <span>${err.message}</span>
                </div>
            `;
            lucide.createIcons();
        }
    });

    // 第二步：完善配置
    configForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        resultDiv.innerHTML = '';

        if (!currentCode) {
            showError('请先完成第一步生成回调URL');
            return;
        }

        const corpsecret = configForm.corpsecret.value.trim();
        const agentid = configForm.agentid.value.trim();
        const description = configForm.description.value.trim();
        const checked = userListSection.classList.contains('hidden')
            ? []
            : Array.from(userList.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value);
        if (!corpsecret || !agentid || checked.length === 0) {
            showError('请填写所有必填项并选择至少一个成员');
            return;
        }

        const payload = {
            code: currentCode,
            corpsecret,
            agentid: Number(agentid),
            touser: checked,
            description
        };
        configForm.querySelector('button[type=submit]').disabled = true;
        configForm.querySelector('button[type=submit]').textContent = '完成中...';
        try {
            const res = await fetch('/api/complete-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '完成失败');
            showFinalResult(data);

            // 显示一次性保存提醒
            saveAlert.classList.remove('hidden');
            gsap.from(saveAlert, { opacity: 0, y: -50, duration: 0.5 });
            setTimeout(() => {
                gsap.to(saveAlert, { opacity: 0, y: -50, duration: 0.5, onComplete: () => {
                    saveAlert.classList.add('hidden');
                    saveAlert.style.opacity = 1;
                    saveAlert.style.transform = 'none';
                }});
            }, 5000);
        } catch (err) {
            showError(err.message);
        } finally {
            configForm.querySelector('button[type=submit]').disabled = false;
            configForm.querySelector('button[type=submit]').textContent = '完成配置';
        }
    });

    function showError(msg) {
        resultDiv.innerHTML = `<div class="alert alert-error"><span>${msg}</span></div>`;
        gsap.from(resultDiv, { opacity: 0, y: 20, duration: 0.5 });
    }

    function showCallbackResult(data) {
        callbackResult.innerHTML = `
            <div class="card bg-base-100 shadow-md">
                <div class="card-body">
                    <h2 class="card-title text-primary flex items-center gap-2">
                        <i data-lucide="check-circle" class="h-6 w-6"></i>
                        回调URL生成成功！
                    </h2>

                    <div class="space-y-4 mt-4">
                        <div>
                            <div class="font-medium">您的配置Code</div>
                            <div class="bg-base-200 p-2 rounded-md font-mono text-sm overflow-x-auto">${data.code}</div>
                        </div>
                        <div>
                            <div class="font-medium">回调URL</div>
                            <div class="bg-base-200 p-2 rounded-md font-mono text-sm overflow-x-auto">${window.location.origin}${data.callbackUrl}</div>
                            <button class="btn btn-sm btn-outline mt-1" id="copy-callback-url-btn">
                                <i data-lucide="copy" class="h-4 w-4 mr-1"></i>复制回调URL
                            </button>
                        </div>
                    </div>

                    <div class="alert alert-info mt-4">
                        <i data-lucide="info" class="h-5 w-5"></i>
                        <div>
                            <div class="font-medium">下一步操作</div>
                            <div class="text-sm">
                                1. 复制上方回调URL到企业微信管理后台<br>
                                2. 配置IP白名单（添加您的服务器IP）<br>
                                3. 完成下方第二步配置
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 绑定复制按钮事件
        document.getElementById('copy-callback-url-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.origin + data.callbackUrl);
            showToast('回调URL已复制到剪贴板');
        });

        callbackResult.classList.remove('hidden');
        lucide.createIcons();
        gsap.from(callbackResult.firstElementChild, { opacity: 0, y: 20, duration: 0.5 });
    }

    function showFinalResult(data) {
        resultDiv.innerHTML = `
            <div class="card bg-base-100 shadow-md">
                <div class="card-body">
                    <h2 class="card-title text-success flex items-center gap-2">
                        <i data-lucide="check-circle-2" class="h-6 w-6"></i>
                        配置完成！
                    </h2>

                    <div class="space-y-4 mt-4">
                        <div>
                            <div class="font-medium">配置Code</div>
                            <div class="bg-base-200 p-2 rounded-md font-mono text-sm overflow-x-auto">${data.code}</div>
                        </div>
                        <div>
                            <div class="font-medium">通知API地址</div>
                            <div class="bg-base-200 p-2 rounded-md font-mono text-sm overflow-x-auto">${window.location.origin}${data.apiUrl}</div>
                            <button class="btn btn-sm btn-outline mt-1" id="copy-api-url-btn">
                                <i data-lucide="copy" class="h-4 w-4 mr-1"></i>复制API地址
                            </button>
                        </div>
                        <div>
                            <div class="font-medium">回调地址</div>
                            <div class="bg-base-200 p-2 rounded-md font-mono text-sm overflow-x-auto">${window.location.origin}${data.callbackUrl}</div>
                        </div>
                    </div>

                    <div class="alert alert-success mt-4">
                        <i data-lucide="check" class="h-5 w-5"></i>
                        <span>配置已完成！您现在可以使用API发送通知，也可以接收企业微信回调消息。</span>
                    </div>
                </div>
            </div>
        `;

        // 绑定复制按钮事件
        document.getElementById('copy-api-url-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.origin + data.apiUrl);
            showToast('API地址已复制到剪贴板');
        });

        lucide.createIcons();
        gsap.from(resultDiv.firstElementChild, { opacity: 0, y: 20, duration: 0.5 });
    }

    // 显示编辑模态框
    function showEditModal(configData) {
        // 创建模态框HTML
        const modalHtml = `
            <div id="edit-modal" class="modal modal-open">
                <div class="modal-box w-11/12 max-w-2xl">
                    <h3 class="font-bold text-lg flex items-center gap-2">
                        <i data-lucide="edit" class="h-5 w-5"></i>
                        编辑配置
                    </h3>
                    
                    <form id="edit-form" class="space-y-4 mt-4">
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-medium">CorpID</span>
                            </label>
                            <input type="text" name="corpid" class="input input-bordered" value="${configData.corpid}" readonly>
                            <div class="label">
                                <span class="label-text-alt text-base-content/60">企业ID不可修改</span>
                            </div>
                        </div>

                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-medium">CorpSecret</span>
                            </label>
                            <input type="password" name="corpsecret" class="input input-bordered" placeholder="如需修改请输入新的CorpSecret">
                            <div class="label">
                                <span class="label-text-alt text-base-content/60">留空则不修改</span>
                            </div>
                        </div>

                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-medium">AgentID</span>
                            </label>
                            <input type="number" name="agentid" class="input input-bordered" value="${configData.agentid}">
                        </div>

                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-medium">接收用户</span>
                            </label>
                            <div id="edit-user-list" class="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-base-100 rounded-lg p-2 border border-base-200">
                                <div class="col-span-2 text-center text-sm text-base-content/60">
                                    点击"获取成员列表"来选择用户
                                </div>
                            </div>
                            <button type="button" id="edit-get-users-btn" class="btn btn-outline btn-sm mt-2">
                                <i data-lucide="users" class="h-4 w-4 mr-1"></i>
                                获取成员列表
                            </button>
                        </div>

                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-medium">描述</span>
                            </label>
                            <input type="text" name="description" class="input input-bordered" value="${configData.description || ''}" placeholder="配置描述（可选）">
                        </div>

                        ${configData.callback_enabled ? `
                        <div class="divider">回调配置</div>
                        
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-medium">回调Token</span>
                            </label>
                            <input type="text" name="callback_token" class="input input-bordered" value="${configData.callback_token || ''}" placeholder="回调验证Token">
                        </div>

                        <div class="form-control">
                            <label class="label">
                                <span class="label-text font-medium">EncodingAESKey</span>
                            </label>
                            <input type="text" name="encoding_aes_key" class="input input-bordered" placeholder="如需修改请输入新的43位AES密钥">
                            <div class="label">
                                <span class="label-text-alt text-base-content/60">留空则不修改，必须是43位字符</span>
                            </div>
                        </div>

                        <div class="form-control">
                            <label class="cursor-pointer label">
                                <span class="label-text font-medium">启用回调</span>
                                <input type="checkbox" name="callback_enabled" class="checkbox" ${configData.callback_enabled ? 'checked' : ''}>
                            </label>
                        </div>
                        ` : `
                        <div class="form-control">
                            <label class="cursor-pointer label">
                                <span class="label-text font-medium">启用回调功能</span>
                                <input type="checkbox" name="callback_enabled" class="checkbox">
                            </label>
                            <div class="label">
                                <span class="label-text-alt text-base-content/60">启用后需要配置Token和AES密钥</span>
                            </div>
                        </div>
                        `}
                    </form>

                    <div class="modal-action">
                        <button type="button" class="btn btn-ghost" onclick="closeEditModal()">取消</button>
                        <button type="button" class="btn btn-primary" onclick="saveEditConfig('${configData.code}')">
                            <i data-lucide="save" class="h-4 w-4 mr-1"></i>
                            保存修改
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 添加模态框到页面
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // 初始化用户列表
        const currentUsers = configData.touser || [];
        if (usersCache.length > 0) {
            updateEditUserList(currentUsers);
        }

        // 绑定获取用户列表按钮事件
        document.getElementById('edit-get-users-btn').addEventListener('click', async () => {
            const corpid = configData.corpid;
            const corpsecret = document.querySelector('#edit-form input[name="corpsecret"]').value.trim();
            
            if (!corpsecret) {
                showToast('请先输入CorpSecret');
                return;
            }

            const btn = document.getElementById('edit-get-users-btn');
            btn.disabled = true;
            btn.textContent = '获取中...';

            try {
                const res = await fetch('/api/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ corpid, corpsecret })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || '获取失败');
                
                usersCache = data.users || [];
                updateEditUserList(currentUsers);
                showToast('成员列表获取成功');
            } catch (err) {
                showToast('获取成员列表失败: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="users" class="h-4 w-4 mr-1"></i>获取成员列表';
                lucide.createIcons();
            }
        });

        // 创建图标
        lucide.createIcons();
    }

    // 更新编辑模态框中的用户列表
    function updateEditUserList(selectedUsers = []) {
        const userListDiv = document.getElementById('edit-user-list');
        if (!userListDiv || usersCache.length === 0) return;

        userListDiv.innerHTML = usersCache.map(user => `
            <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" class="checkbox checkbox-sm" value="${user.userid}" 
                       ${selectedUsers.includes(user.userid) ? 'checked' : ''}>
                <span class="text-sm">${user.name} <span class="text-xs text-gray-400">(${user.userid})</span></span>
            </label>
        `).join('');
    }

    // 关闭编辑模态框
    window.closeEditModal = function() {
        const modal = document.getElementById('edit-modal');
        if (modal) {
            modal.remove();
        }
    }

    // 保存编辑配置
    window.saveEditConfig = async function(code) {
        const form = document.getElementById('edit-form');
        const formData = new FormData(form);
        
        // 获取选中的用户
        const selectedUsers = Array.from(document.querySelectorAll('#edit-user-list input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        if (selectedUsers.length === 0) {
            showToast('请至少选择一个接收用户');
            return;
        }

        // 构建更新数据
        const updateData = {
            agentid: parseInt(formData.get('agentid')),
            touser: selectedUsers,
            description: formData.get('description') || ''
        };

        // 如果提供了新的CorpSecret，则包含它
        const corpsecret = formData.get('corpsecret');
        if (corpsecret) {
            updateData.corpsecret = corpsecret;
        }

        // 处理回调配置
        const callbackEnabled = formData.get('callback_enabled') === 'on';
        updateData.callback_enabled = callbackEnabled;
        
        if (callbackEnabled) {
            const callbackToken = formData.get('callback_token');
            const encodingAesKey = formData.get('encoding_aes_key');
            
            if (callbackToken) {
                updateData.callback_token = callbackToken;
            }
            
            if (encodingAesKey) {
                if (encodingAesKey.length !== 43) {
                    showToast('EncodingAESKey必须是43位字符');
                    return;
                }
                updateData.encoding_aes_key = encodingAesKey;
            }
        }

        // 发送更新请求
        try {
            const res = await fetch(`/api/configuration/${code}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || '更新失败');

            showToast('配置更新成功');
            closeEditModal();
            
            // 刷新配置显示
            lookupForm.dispatchEvent(new Event('submit'));
            
        } catch (err) {
            showToast('更新配置失败: ' + err.message);
        }
    }

    // 显示提示消息
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-top toast-center';
        toast.innerHTML = `
            <div class="alert alert-info">
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);

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
});