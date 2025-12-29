// background/handlers/session/prompt/tool_executor.js
import { parseToolCommand } from '../utils.js';
import { ToolDispatcher } from '../../../control/dispatcher.js';

export class ToolExecutor {
    constructor(controlManager, mcpManager) {
        this.controlManager = controlManager;
        this.mcpManager = mcpManager;
    }

    async executeIfPresent(text, request, onUpdate) {
        const toolCommand = parseToolCommand(text);
        if (!toolCommand) return null;

        const toolName = toolCommand.name;
        onUpdate(`Executing tool: ${toolName}...`, "Processing tool execution...");

        let output = "";
        let files = null;
        let source = "unknown";

        try {
            if (ToolDispatcher.isLocalTool(toolName)) {
                if (!this.controlManager) {
                    throw new Error('Browser control is unavailable.');
                }

                source = "browser_control";
                const execResult = await this.controlManager.execute({
                    name: toolName,
                    args: toolCommand.args || {}
                });

                // Handle structured result (image + text) which usually comes from take_screenshot
                if (execResult && typeof execResult === 'object' && execResult.image) {
                    output = execResult.text;
                    files = [{
                        base64: execResult.image,
                        type: "image/png",
                        name: "screenshot.png"
                    }];
                } else {
                    output = execResult;
                }
            } else {
                if (!this.mcpManager || !this.mcpManager.isEnabled(request)) {
                    throw new Error(`Unknown tool '${toolName}'. (External MCP tools are disabled)`);
                }

                if (request && request.mcpToolMode === 'selected') {
                    const enabled = Array.isArray(request.mcpEnabledTools) ? request.mcpEnabledTools : [];
                    const enabledSet = new Set(enabled);
                    if (!enabledSet.has(toolName)) {
                        throw new Error(`External MCP tool '${toolName}' is disabled (not in selected tools).`);
                    }
                }

                source = "mcp_remote";
                const remote = await this.mcpManager.callTool(request, toolName, toolCommand.args || {});
                output = remote.text;
                files = remote.files && remote.files.length ? remote.files : null;
            }
        } catch (err) {
            output = `Error executing tool: ${err.message}`;
        }

        return {
            toolName,
            output,
            files,
            source
        };
    }
}
