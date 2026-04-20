
// content/toolbar/i18n.js

(function() {
    // Simple localization for Content Script
    const isZh = navigator.language.startsWith('zh');

    const buildTranslationTargetRules = (lang) => lang === 'zh'
        ? [
            "- 如果原文是英文，翻译为中文。",
            "- 如果原文是中文，翻译为英文。",
            "- 如果原文是其他语言，翻译为中文。"
        ].join('\n')
        : [
            "- If the source text is English, translate it into Chinese.",
            "- If the source text is Chinese, translate it into English.",
            "- If the source text is any other language, translate it into Chinese."
        ].join('\n');

    const buildProfessionalTranslatePrompt = (text, mode) => {
        if (isZh) {
            const header = mode === 'image'
                ? "你是一名专业翻译顾问。请先识别图片中的文字，再进行高质量翻译。"
                : "你是一名专业翻译顾问。请对下面的文本进行高质量翻译。";
            const body = mode === 'image'
                ? "如果 OCR 存在不确定内容，请保留原文并用 [识别不清] 标注，不要猜测。"
                : "请先判断原文语言，再按规则翻译。";
            const source = text ? `\n\n原文：\n\"${text}\"` : "";
            return `${header}

${buildTranslationTargetRules('zh')}

${body}

请使用 Markdown 输出，并严格遵守以下规则：
1. 保留原文的语气、语境和专业含义；遇到术语时优先采用自然、专业、常用的译法。
2. 不要输出类似“## 译文”“## 音标 / 发音”这类大标题，但要保留清晰层次。
3. 使用紧凑列表格式输出，整体控制在 4 到 6 行内：
- 第 1 行：直接给出完整译文，不加标题。
- 第 2 行：如果有英文关键词、单词或短语，合并展示“词 + IPA + 词性”；多个词用分号分隔。没有则写“发音：无”。
- 第 3 行：以“说明：”开头，用 1 句话说明核心含义、使用场景、常见搭配、语气差异或翻译取舍。
- 第 4 到 5 行：以“例：”开头给出 1 到 2 条简短例句，格式使用“原句 -> 译文”。
4. 不要把说明写成长段落，不要连续输出大段正文。
5. 如果原文很短（如单词、短语），输出应更偏词典/词条风格。
6. 如果原文较长（如句子、段落），输出应更偏专业翻译讲解风格，但保持简洁。
7. 不要输出与翻译无关的客套话、免责声明或多余换行。

输出示例（仅作格式参考，请按实际内容替换）：
- 有韧性的；适应力强的；能迅速恢复的
- resilient /rɪˈzɪliənt/ adj.
- 说明：常用于描述人、系统或组织在压力、变化或挫折下依然能恢复和适应；相比 strong，更强调“受冲击后恢复”的能力。
- 例：Children are often more resilient than adults expect. -> 孩子的适应力往往比成年人想象的更强。
- 例：We need a more resilient supply chain. -> 我们需要一个更具韧性的供应链。${source}`;
        }

        const header = mode === 'image'
            ? "You are a professional translator. First extract the text from the image, then provide a high-quality translation."
            : "You are a professional translator. Provide a high-quality translation for the text below.";
        const body = mode === 'image'
            ? "If any OCR content is uncertain, keep the original fragment and mark it as [unclear] instead of guessing."
            : "Detect the source language first, then translate according to the rules below.";
        const source = text ? `\n\nSource text:\n\"${text}\"` : "";
        return `${header}

${buildTranslationTargetRules('en')}

${body}

Use Markdown and follow this exact structure:
1. Do not output large section headers such as "Translation" or "Pronunciation", but keep the hierarchy clear.
2. Use a compact bullet-card layout and keep the whole answer within 4 to 6 lines:
- Line 1: the final translation only, without a heading.
- Line 2: if there are English keywords, words, or phrases, merge them as "term + IPA + part of speech"; separate multiple items with semicolons. If not applicable, write "Pronunciation: N/A".
- Line 3: start with "Notes:" and explain the key meaning, usage, collocations, tone differences, or translation choices in 1 concise sentence.
- Line 4 to 5: start with "Example:" and provide 1 to 2 short examples in the format "Original -> Translation".
3. Do not write long paragraphs or dense blocks of text.
4. Preserve tone, context, and domain-specific meaning.
5. For technical, legal, business, or academic content, prefer professional and standard terminology.
6. For short input, make the answer more dictionary-like.
7. For long input, keep it concise but still explanatory.
8. Do not add filler, greetings, unrelated commentary, or excessive blank lines.

Example output (format reference only, replace with the actual content):
- resilient: resilient; adaptable; able to recover quickly
- resilient /rɪˈzɪliənt/ adj.
- Notes: Often used for people, systems, or organizations that can recover from stress, disruption, or setbacks; compared with strong, it emphasizes the ability to bounce back after difficulty.
- Example: Children are often more resilient than adults expect. -> 孩子的适应力往往比成年人想象的更强。
- Example: We need a more resilient supply chain. -> 我们需要一个更具韧性的供应链。${source}`;
    };
    
    window.GeminiToolbarStrings = {
        askAi: isZh ? "询问 AI" : "Ask AI",
        copy: isZh ? "复制" : "Copy",
        fixGrammar: isZh ? "语法修正" : "Fix Grammar",
        translate: isZh ? "翻译" : "Translate",
        explain: isZh ? "解释" : "Explain",
        summarize: isZh ? "总结" : "Summarize",
        summarizePage: isZh ? "总结网页" : "Summarize Page",
        askImage: isZh ? "询问这张图片" : "Ask AI about this image",
        close: isZh ? "关闭" : "Close",
        askPlaceholder: isZh ? "询问 Gemini..." : "Ask Gemini...",
        windowTitle: "Gemini Nexus",
        retry: isZh ? "重试" : "Retry",
        openSidebar: isZh ? "在侧边栏继续" : "Open in Sidebar",
        chat: isZh ? "对话" : "Chat",
        insert: isZh ? "插入" : "Insert",
        insertTooltip: isZh ? "插入到光标位置" : "Insert at cursor",
        replace: isZh ? "替换" : "Replace",
        replaceTooltip: isZh ? "替换选中文本" : "Replace selected text",
        copyResult: isZh ? "复制结果" : "Copy Result",
        pin: isZh ? "固定" : "Pin",
        unpin: isZh ? "取消固定" : "Unpin",
        stopGenerating: isZh ? "停止生成" : "Stop generating",
        opacity: isZh ? "透明度" : "Opacity",
        
        // AI Tools Menu
        aiTools: isZh ? "AI 工具" : "AI Tools",
        chatWithImage: isZh ? "带图片聊天" : "Chat with image",
        describeImage: isZh ? "描述图片" : "Describe image",
        extractText: isZh ? "提取文本" : "Extract text",
        imageTools: isZh ? "图像工具" : "Image tools",
        removeBg: isZh ? "背景移除" : "Remove background",
        removeText: isZh ? "文字移除" : "Remove text",
        removeWatermark: isZh ? "去水印" : "Remove Watermark",
        upscale: isZh ? "画质提升" : "Upscale",
        expand: isZh ? "扩图" : "Expand",

        // Actions UI
        browserControl: isZh ? "浏览器控制" : "Browser Control",
        pageContext: isZh ? "网页" : "Page",
        quote: isZh ? "引用" : "Quote",
        ocr: isZh ? "OCR" : "OCR",
        translateAction: isZh ? "翻译" : "Translate",
        snip: isZh ? "截图" : "Snip",

        // --- AI Prompts (Centralized) ---
        prompts: {
            // Image Actions
            ocr: isZh ? 
                "请识别并提取这张图片中的文字 (OCR)。仅输出识别到的文本内容，不需要任何解释。" : 
                "Please OCR this image. Extract the text content exactly as is, without any explanation.",
            
            imageTranslate: buildProfessionalTranslatePrompt(null, 'image'),
            
            analyze: isZh ? 
                "请详细分析并描述这张图片的内容。" : 
                "Please analyze and describe the content of this image in detail.",
            
            upscale: isZh ? 
                "请根据这张图片生成一个更高清晰度、更高分辨率的版本 (Upscale)。" : 
                "Please generate a higher quality, higher resolution version of this image (Upscale).",
            
            expand: isZh ?
                "请对这张图片进行扩图 (Outpainting)，在保持原图风格的基础上，向四周扩展画面内容。" :
                "Please expand this image (Outpainting), extending the content around the edges while maintaining the original style.",
            
            removeText: isZh ? 
                "请将这张图片中的所有文字移除，并填充背景，生成一张干净的图片。" : 
                "Please remove all text from this image, inpaint the background, and generate the clean image.",
            
            removeBg: isZh ? 
                "请移除这张图片的背景。生成一张带有透明背景的主体图片。" : 
                "Please remove the background from this image. Generate a new image of the subject on a transparent background.",
            
            removeWatermark: isZh ? 
                "请移除这张图片上的所有水印、Logo 或覆盖文字，并完美填充背景，使其看起来像原始图片。" : 
                "Please remove any watermarks, logos, or overlay text from this image, filling in the background seamlessly to look like the original image.",
            
            snipAnalyze: isZh ? 
                "请详细描述这张截图的内容。" : 
                "Please describe the content of this screenshot in detail.",

            // Text Actions
            textTranslate: (text) => buildProfessionalTranslatePrompt(text, 'text'),
            
            explain: (text) => isZh ? 
                `用通俗易懂的语言简要解释以下内容：\n\n"${text}"` : 
                `Briefly explain the following text in simple language:\n\n"${text}"`,
            
            summarize: (text) => isZh ?
                `请尽量简洁地总结以下内容：\n\n"${text}"` :
                `Concise summary of the following text:\n\n"${text}"`,
            
            summarizePage: isZh ?
                "请对当前网页的主要内容进行全面而简洁的总结。提取核心观点、关键信息和结论，并以清晰的结构（如要点列表）呈现。" :
                "Please provide a comprehensive yet concise summary of the main content of this webpage. Extract core ideas, key information, and conclusions, presenting them in a clear structure (e.g., bullet points).",

            grammar: (text) => isZh ?
                `请修正以下文本的语法和拼写错误，保持原意不变。仅输出修正后的文本，不要添加任何解释：\n\n"${text}"` : 
                `Correct the grammar and spelling of the following text. Output ONLY the corrected text without any explanation:\n\n"${text}"`
        },
        
        // Loading Messages
        loading: {
            ocr: isZh ? "正在识别文字..." : "Extracting text...",
            translate: isZh ? "正在翻译..." : "Translating...",
            analyze: isZh ? "正在分析图片内容..." : "Analyzing image content...",
            upscale: isZh ? "正在提升画质..." : "Upscaling...",
            expand: isZh ? "正在扩图..." : "Expanding image...",
            removeText: isZh ? "正在移除文字..." : "Removing text...",
            removeBg: isZh ? "正在移除背景..." : "Removing background...",
            removeWatermark: isZh ? "正在去除水印..." : "Removing watermark...",
            snip: isZh ? "正在分析截图..." : "Analyzing snip...",
            explain: isZh ? '正在解释...' : 'Explaining...',
            summarize: isZh ? '正在总结...' : 'Summarizing...',
            summarizePage: isZh ? '正在总结网页...' : 'Summarizing page...',
            grammar: isZh ? '正在修正...' : 'Fixing grammar...',
            regenerate: isZh ? "正在重新生成..." : "Regenerating..."
        },

        // Input Placeholders (for quick action UI)
        inputs: {
            ocr: isZh ? "文字提取" : "OCR Extract",
            translate: isZh ? "截图翻译" : "Image Translate",
            analyze: isZh ? "分析图片内容" : "Analyze image",
            upscale: isZh ? "画质提升" : "Upscale",
            expand: isZh ? "扩图" : "Expand Image",
            removeText: isZh ? "文字移除" : "Remove Text",
            removeBg: isZh ? "背景移除" : "Remove Background",
            removeWatermark: isZh ? "去水印" : "Remove Watermark",
            snip: isZh ? "截图分析" : "Analyze Snip",
            explain: isZh ? '解释选中内容' : 'Explain selected text',
            textTranslate: isZh ? '翻译选中内容' : 'Translate selected text',
            summarize: isZh ? '总结选中内容' : 'Summarize selected text',
            summarizePage: isZh ? '总结网页内容' : 'Summarize page content',
            grammar: isZh ? '修正语法' : 'Fixing grammar'
        },
        
        titles: {
            ocr: isZh ? "OCR 文字提取" : "OCR Extraction",
            translate: isZh ? "截图翻译" : "Image Translate",
            analyze: isZh ? "图片分析" : "Image Analysis",
            upscale: isZh ? "画质提升" : "Upscale Image",
            expand: isZh ? "扩图" : "Image Expansion",
            removeText: isZh ? "文字移除" : "Remove Text",
            removeBg: isZh ? "背景移除" : "Remove Background",
            removeWatermark: isZh ? "去水印" : "Remove Watermark",
            snip: isZh ? "截图分析" : "Snip Analysis",
            explain: isZh ? '解释' : 'Explain',
            textTranslate: isZh ? '翻译' : 'Translate',
            summarize: isZh ? '总结' : 'Summarize',
            summarizePage: isZh ? '总结网页' : 'Summarize Page',
            grammar: isZh ? '语法修正' : 'Fix Grammar'
        }
    };
})();
