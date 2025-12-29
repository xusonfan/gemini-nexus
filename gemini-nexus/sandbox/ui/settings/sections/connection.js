
// sandbox/ui/settings/sections/connection.js
import { sendToBackground } from '../../../../lib/messaging.js';

export class ConnectionSection {
    constructor() {
        this.elements = {};
        this.mcpServers = [];
        this.mcpActiveServerId = null;
        this.queryElements();
        this.bindEvents();
    }

    _makeServerId() {
        return `srv_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }

    _getDefaultServer() {
        return {
            id: this._makeServerId(),
            name: 'Local Proxy',
            transport: 'sse',
            url: 'http://127.0.0.1:3006/sse',
            enabled: true
        };
    }

    queryElements() {
        const get = (id) => document.getElementById(id);
        this.elements = {
            providerSelect: get('provider-select'),
            apiKeyContainer: get('api-key-container'),
            
            // Official Fields
            officialFields: get('official-fields'),
            apiKeyInput: get('api-key-input'),
            thinkingLevelSelect: get('thinking-level-select'),
            
            // OpenAI Fields
            openaiFields: get('openai-fields'),
            openaiBaseUrl: get('openai-base-url'),
            openaiApiKey: get('openai-api-key'),
            openaiModel: get('openai-model'),

            // MCP Fields
            mcpEnabled: get('mcp-enabled'),
            mcpFields: get('mcp-fields'),
            mcpServerSelect: get('mcp-server-select'),
            mcpAddServer: get('mcp-add-server'),
            mcpRemoveServer: get('mcp-remove-server'),
            mcpServerName: get('mcp-server-name'),
            mcpTransport: get('mcp-transport'),
            mcpServerUrl: get('mcp-server-url'),
            mcpServerEnabled: get('mcp-server-enabled'),
            mcpTestConnection: get('mcp-test-connection'),
            mcpTestStatus: get('mcp-test-status'),
        };
    }

    bindEvents() {
        const { providerSelect } = this.elements;
        if (providerSelect) {
            providerSelect.addEventListener('change', (e) => {
                this.updateVisibility(e.target.value);
            });
        }

        const { mcpEnabled } = this.elements;
        if (mcpEnabled) {
            mcpEnabled.addEventListener('change', (e) => {
                this.updateMcpVisibility(e.target.checked === true);
            });
        }

        const {
            mcpServerSelect,
            mcpAddServer,
            mcpRemoveServer,
            mcpServerName,
            mcpTransport,
            mcpServerUrl,
            mcpServerEnabled,
            mcpTestConnection
        } = this.elements;

        if (mcpServerSelect) {
            mcpServerSelect.addEventListener('change', (e) => {
                this._saveCurrentServerEdits();
                this.mcpActiveServerId = e.target.value;
                this._loadActiveServerIntoForm();
                this._renderMcpServerOptions();
                this.setMcpTestStatus('');
            });
        }

        if (mcpAddServer) {
            mcpAddServer.addEventListener('click', () => {
                this._saveCurrentServerEdits();
                const server = this._getDefaultServer();
                this.mcpServers.push(server);
                this.mcpActiveServerId = server.id;
                this._renderMcpServerOptions();
                this._loadActiveServerIntoForm();
                this.setMcpTestStatus('');
            });
        }

        if (mcpRemoveServer) {
            mcpRemoveServer.addEventListener('click', () => {
                this._saveCurrentServerEdits();
                const id = this.mcpActiveServerId;
                if (!id) return;

                this.mcpServers = this.mcpServers.filter(s => s.id !== id);

                if (this.mcpServers.length === 0) {
                    const server = this._getDefaultServer();
                    server.enabled = false;
                    this.mcpServers = [server];
                }

                this.mcpActiveServerId = this.mcpServers[0].id;
                this._renderMcpServerOptions();
                this._loadActiveServerIntoForm();
                this.setMcpTestStatus('');
            });
        }

        const onEdit = () => {
            this._saveCurrentServerEdits();
            this._renderMcpServerOptions();
        };

        if (mcpServerName) mcpServerName.addEventListener('input', onEdit);
        if (mcpServerUrl) mcpServerUrl.addEventListener('input', onEdit);
        if (mcpTransport) mcpTransport.addEventListener('change', onEdit);
        if (mcpServerEnabled) mcpServerEnabled.addEventListener('change', onEdit);

        if (mcpTestConnection) {
            mcpTestConnection.addEventListener('click', () => {
                this._saveCurrentServerEdits();
                const server = this._getActiveServer();
                if (!server) return;

                this.setMcpTestStatus('Testing connection...');
                sendToBackground({
                    action: 'MCP_TEST_CONNECTION',
                    serverId: server.id,
                    transport: server.transport || 'sse',
                    url: server.url || ''
                });
            });
        }
    }

    setData(data) {
        const { 
            providerSelect, apiKeyInput, thinkingLevelSelect, 
            openaiBaseUrl, openaiApiKey, openaiModel,
            mcpEnabled
        } = this.elements;

        // Provider
        if (providerSelect) {
            providerSelect.value = data.provider || 'web';
            this.updateVisibility(data.provider || 'web');
        }
        
        // Official
        if (apiKeyInput) apiKeyInput.value = data.apiKey || "";
        if (thinkingLevelSelect) thinkingLevelSelect.value = data.thinkingLevel || "low";
        
        // OpenAI
        if (openaiBaseUrl) openaiBaseUrl.value = data.openaiBaseUrl || "";
        if (openaiApiKey) openaiApiKey.value = data.openaiApiKey || "";
        if (openaiModel) openaiModel.value = data.openaiModel || "";

        // MCP
        if (mcpEnabled) {
            mcpEnabled.checked = data.mcpEnabled === true;
            this.updateMcpVisibility(mcpEnabled.checked);
        }

        // Servers list (preferred)
        const servers = Array.isArray(data.mcpServers) ? data.mcpServers : null;
        const activeId = typeof data.mcpActiveServerId === 'string' ? data.mcpActiveServerId : null;

        if (servers && servers.length > 0) {
            this.mcpServers = servers.map(s => ({
                id: s.id || this._makeServerId(),
                name: s.name || '',
                transport: s.transport || 'sse',
                url: s.url || '',
                enabled: s.enabled !== false
            }));
            this.mcpActiveServerId = activeId && this.mcpServers.some(s => s.id === activeId) ? activeId : this.mcpServers[0].id;
        } else {
            // Legacy single server fields
            const legacyUrl = data.mcpServerUrl || "";
            const legacyTransport = data.mcpTransport || "sse";
            const server = this._getDefaultServer();
            server.transport = legacyTransport;
            server.url = legacyUrl || server.url;
            server.enabled = data.mcpEnabled === true;
            this.mcpServers = [server];
            this.mcpActiveServerId = server.id;
        }

        this._renderMcpServerOptions();
        this._loadActiveServerIntoForm();
        this.setMcpTestStatus('');
    }

    getData() {
        const { 
            providerSelect, apiKeyInput, thinkingLevelSelect, 
            openaiBaseUrl, openaiApiKey, openaiModel,
            mcpEnabled
        } = this.elements;

        this._saveCurrentServerEdits();
        const servers = Array.isArray(this.mcpServers) ? this.mcpServers : [];
        const active = this._getActiveServer();

        return {
            provider: providerSelect ? providerSelect.value : 'web',
            // Official
            apiKey: apiKeyInput ? apiKeyInput.value.trim() : "",
            thinkingLevel: thinkingLevelSelect ? thinkingLevelSelect.value : "low",
            // OpenAI
            openaiBaseUrl: openaiBaseUrl ? openaiBaseUrl.value.trim() : "",
            openaiApiKey: openaiApiKey ? openaiApiKey.value.trim() : "",
            openaiModel: openaiModel ? openaiModel.value.trim() : "",

            // MCP
            mcpEnabled: mcpEnabled ? mcpEnabled.checked === true : false,
            mcpServers: servers,
            mcpActiveServerId: this.mcpActiveServerId || (servers[0] ? servers[0].id : null),

            // Legacy: keep in sync with active server for backward compatibility
            mcpTransport: active ? (active.transport || 'sse') : 'sse',
            mcpServerUrl: active ? (active.url || '') : ''
        };
    }

    updateVisibility(provider) {
        const { apiKeyContainer, officialFields, openaiFields } = this.elements;
        if (!apiKeyContainer) return;

        if (provider === 'web') {
            apiKeyContainer.style.display = 'none';
        } else {
            apiKeyContainer.style.display = 'flex';
            if (provider === 'official') {
                if (officialFields) officialFields.style.display = 'flex';
                if (openaiFields) openaiFields.style.display = 'none';
            } else if (provider === 'openai') {
                if (officialFields) officialFields.style.display = 'none';
                if (openaiFields) openaiFields.style.display = 'flex';
            }
        }
    }

    updateMcpVisibility(enabled) {
        const { mcpFields } = this.elements;
        if (!mcpFields) return;
        mcpFields.style.display = enabled ? 'flex' : 'none';
    }

    _getActiveServer() {
        if (!this.mcpServers || this.mcpServers.length === 0) return null;
        const activeId = this.mcpActiveServerId;
        const match = activeId ? this.mcpServers.find(s => s.id === activeId) : null;
        return match || this.mcpServers[0];
    }

    _saveCurrentServerEdits() {
        const {
            mcpServerName,
            mcpTransport,
            mcpServerUrl,
            mcpServerEnabled
        } = this.elements;

        const server = this._getActiveServer();
        if (!server) return;

        if (mcpServerName) server.name = mcpServerName.value || '';
        if (mcpTransport) server.transport = mcpTransport.value || 'sse';
        if (mcpServerUrl) server.url = (mcpServerUrl.value || '').trim();
        if (mcpServerEnabled) server.enabled = mcpServerEnabled.checked === true;
    }

    _loadActiveServerIntoForm() {
        const {
            mcpServerSelect,
            mcpServerName,
            mcpTransport,
            mcpServerUrl,
            mcpServerEnabled
        } = this.elements;

        const server = this._getActiveServer();
        if (!server) return;

        if (mcpServerSelect) mcpServerSelect.value = server.id;
        if (mcpServerName) mcpServerName.value = server.name || '';
        if (mcpTransport) mcpTransport.value = server.transport || 'sse';
        if (mcpServerUrl) mcpServerUrl.value = server.url || '';
        if (mcpServerEnabled) mcpServerEnabled.checked = server.enabled !== false;
    }

    _renderMcpServerOptions() {
        const { mcpServerSelect } = this.elements;
        if (!mcpServerSelect) return;

        const active = this._getActiveServer();
        if (active) this.mcpActiveServerId = active.id;

        mcpServerSelect.innerHTML = '';
        for (const server of this.mcpServers) {
            const opt = document.createElement('option');
            opt.value = server.id;

            const name = (server.name || '').trim();
            const label = name || (server.url || 'MCP Server');
            opt.textContent = server.enabled === false ? `${label} (disabled)` : label;
            mcpServerSelect.appendChild(opt);
        }

        if (active) mcpServerSelect.value = active.id;
    }

    setMcpTestStatus(text, isError = false) {
        const { mcpTestStatus } = this.elements;
        if (!mcpTestStatus) return;
        mcpTestStatus.textContent = text || '';
        mcpTestStatus.style.color = isError ? '#b00020' : '';
    }
}
