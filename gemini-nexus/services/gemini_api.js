
// services/gemini_api.js
import { fetchRequestParams } from './auth.js';
import { uploadImage } from './upload.js';
import { generateUUID } from '../lib/utils.js';
import { parseGeminiLine } from './parser.js';

const MODELS = {
    'gemini-3-flash': {
        rpcId: "!CAulC1PNAAZT9fabc_VC8rLCMsLJAyg7ADQBEArZ1IRxxhfgPLlv6Isf-i-W4X2Kd7R8hHV_8X3H9AL-XqLENK1sX3kB7xjYbaq_c8spAgAAAYpSAAAABGgBB34AQdTncjSej-M91oOSbC0iQpGmWBobLATdOi6tDVnZNucqq1l1y4S2n-eVTYF0E2eXbGV0xp3c4O3g194ZHTnNkK0NmQM_W6AhrR1Wpds6EHNM12-fJZkybQmqFUh8c9UcIS_0dIPuL-mS0hT2sUqgLn7eJ2ub2snP7YXRoI0kPyaWFXe43CfcCNfL41piY89KnS-ZwI5ZId8ZbhreiE-rP_HQ3DXtD474dos9FQ7B3ALztPvJ_LT_W2DSQtsZlXdFL3MtkxdKAeYbofJ90AgWLU1uvBvf1SOojfjECifu4cnCNYYtNlK7RyV9Z6-Dig6Kg-xDVD05WGGfpE8eihjS9Us_dd8GFrBJA0xzgkog2N-segjEXyHwetRY_PhVg7nvO0GXMDaArkh6-rIOw9hUiMfWKQujHXT4lq__cPDntVbzUrMdxso9XFz_4NlDw55BqN942nLGCXk3_l16N9i5JaMddv9ZRgg7BWgVbqMOI2uaRAvVQTv-TIpNm3F2cP55oC9slkmY6XpywJlSz09LmR2oghh0uS3yxulZNqd_PKteZfI8QHSOcNK-Hc5-57CHUCK09FMRkb5v0f06SvxjvoFkYdCaFdUThVn70g-XZQ58bElSYX1Qx36XK3Xf1EXMRyCB2kr-lQ-1CpJajW_EKtTA7rH92igzTaueVcQpsFZzNxdCTY296LGQWqWky4HmUw4zl6S33_Z-28yvwrHqt0xHXJfRkiotWez4GpqfJE98287vKvMDGsrlPRxAUrxDctU-XZLV9gZU9Lj2mmnNhHCCpOMJPyNd8GFZ5CIUXa7aI-WE0OVwqVJGSLFyQ7K2qH6FVguG1Mm4twYhtxv-B6mXCrZbuGj_J3jp2Pu8-DP-kwnNJOi2hPUUtIjQ3dF5g_Z27LZFjwh8EII8_ncRdVH8NX7CS5rqnOtNh56iZGEKLJW99zKv9_4ifI10KOdUKacdS-_4WZbFADyrrM3q4MBDo0fzCCpiYyL2gHZjcQsnoFitApgGOXqAFQOpJI7Xz1-cGDa5UCpfHkUR-Y6WYUUZeNEwSgWKgS0gDh84CcEi30MgspV8wvc0k-VlcM1En6wemahCFXlvn4H3Q7GtreB1PUL655ovhxT2elBWKJvmzr2934IAUHBlJx1dF_itdxWj8xd-qPrxOKanHmoXYRbE8tWPIIgeznGkVRuYQQPIKy8D",
        entityId: "d03dc8335c664cec22eb3a40c626d7eb"
    },
    'gemini-3-flash-thinking': {
        rpcId: "!LyylLHTNAAZT9fabc_VCdj6LRBEE5Bo7ADQBEArZ1Iknw-C1wxjbXOechiXddNszXNASBbGTnDvKsMXWYbYmM3t-AWpHF2_zAcFIWIGwAgAAAbRSAAAAA2gBB34AQc-mgvru0rjP8X-bqquNVRvTLeRbWNbWT3CAzfwgb9K4Br-Xz9eqBGej1BxDK4rufI3JqcJYBa-yknW8k5HJuGP8mQM0iBwUCwsXpZTwKjpUNm7U9TCJYkCJSW_PYAgCSw9GeL6VXp6XZyuOOxJe6wlYmmRC0Z12WaMDx-dzZgb06kDtvk0MrsCh7xIqERB2zrXnpCNkKihhI4i8EqHreOLevjf6VcF4g19lWEJ0K9qOg_TouHCSUAMBrEGfa0MLBuaGysjacOGAlAEayyPxH99ZbVQVP4EavC93dLTA2CSFWbFi1yVfBosjAMxADvOTc_zDuxX6s21m-6npY4AGS3IfhImB9IXcu46hzEb0NqEs_ocboD14dWqm2A7McY8T75CADeshO7-Z0_5ANWIMj30-iJzadiNb5u-c_jEIWbND5k5gYOqmhGQwFDul0bafSMxriix5Fa7XxU4ibn-EWrh0i_dwNKht90AmPr8BV94iNeHiuWrPJTWb5sBfsf88FXAKhH-u2Y-MP8C09nL7SdGeNt_6qS1lARmCp3alyoix0_VcCGHsb4LqOWONQY4HBQ6PM3qFnDwnLjSwdCT9DA-s-YV2wXimVhcdsGMKOpcCAVAFF2ARWgarrNu8M7sIYhvEkIGZO64CqTufwTp7vmVvklDbxLuHmUGfH0ta5vf8HrldU8zVWgS0HJgpv1Y1rYCs0u64Yi3C-4yCy4dPqABOUArsbUmqgJYA-IdKgpXMXSb76aK4hfoINBqmxOceIs_jO0vLLoM1yE20fkoSnbkiqOVCZDwxXq17LTwg6mNV9Cn3T0tOgpuZbb2PIXp-_hzzRTGcdGwCZzlXksj9o9HzycEpUkacjhkT3lcefOP7jtFcfGRS6DEYcsPx-AIihlgONreOp6lmnGLRXwMMmqHV1ODXDe9-krsI9PBhYXD2P_YMDi3H-X0rggxDEOxHNamyBtwHWG6qttWoMZPHU2NlkaWDscf4rbH3vEEO98q5X1o8KmCsWQD2Ybar4eRnL-fAOxExwhTb4-LqeglmzTg5LViVZkZKzL7OT7bIksQM1FqqHYFbMWEzXiefhK822gMOzjsS4EWrXRnejYVx_WTZdNqR3iI51TfAmdLX-jEb1omRLyemAQ5EBQubY77yajrisUxYJydSe97-5K33eFyFd1nMpp1tSA",
        entityId: "8a8a12e5f2a6aba991b29ce74dd76112"
    },
    'gemini-3-pro': {
        rpcId: "!NTalNm7NAAZT9fabc_VC9-zBxt3uOjo7ADQBEArZ1FhRurWv5T_zr_Xem7DSowmRm_ZTFSBfRBJCClndgaI63yApM3rKgmJ_ipyGGqIYAgAAAYZSAAAAA2gBB34AQbWe-lBPEW2DxHczoD4pc5xfCV4qSgLLi2NLa1zoNNFsUs93ZjnvvcRahtQh-4C0ghngavIvlJnbGDNag0mohckBmQM1cuMZZfKRcN9NwzgHSpVnUI8nqL5-cdqvdmkNdzFOBAUfIOj34hibWg0jL_AUa44KV0fKSf74nCfyJ2qqgYFzGFkxoBp2wYJPyWkqKUplPvSFmweTh0rs83z7JYbdx7NVOGvflpL-NZxRCLS0HyCG6ibLNTkrBq2970oLNtbiK-4qrxrj2UMQrjqREjfnATcvDARnGYCRAB3bhW8pgmGhcGH6_e1jgcz-W1L1uLUNW0mlV7-jZE92-WIa1nhHO2BPS1QQ0kByNP8ri-HqqWI70ujp_BF6Mrjs313oJOgnGyb1ZjERmvS--hyQnuJkDQVB9S_nnnIRjT8YqXzLkoSSWoXBmMdUezyLTgj7Qf8vvutl_jVxJhLiyenZsQi-6NeAihD-davvbA72s-e0vOT86JmoG8dE9vDG5u7uBxzrRX-GLcpsAwVG460YcjyjTn6qcX2r3Ff8Qa5XzdNxWbhfnng5Sx3RRUzV3tN8sq-IR4DGDvo0MemztZtVqeOdZbqsk27YmT9V8Bz-WdGWBbdqxROyK63j7jrfadtB-ZExm6SdNmptMbHiyz6ymHdZaSY0ZejkEcBOuLHDPJYjXmjOA-n4isaD7X8wFGc15hRKDVPs71fJ2Mr8oqSFOx4Xfd-OU3gP1ZyHn9cZOtEK3yqMzOh-LSuuxIQtMiPfiUr2RETy2tGP6FQVpQOUCXc43i85oBXZdfoAKepU9ADLZXdFr5ZBLLGO0yaBoK7PCB2l5QvElK5QPyeVp-K2ULkq5BsxDwOTCk264h0VOhJ9fqd4xjdS1CHP-Jams9a8H_ZmMhPSWBUc8AsD_Ku_v-bujTLnMsZYlMAze3WlezwE8Fp7rx1zW8dBHlK0Fo3aI-S8yanX0XHTGf93hUc5zWw_DkJDUTis9llJWHHwVffTbPm-oRNnz-xoqrxspOFC67-QF7kqIIF6QTjhaMSGpyg9zpfAfmXr63lZmVbKpt90SsoipPQX4vGt9RWrXLOIZEcpt3wZ-p1yTN9pLXHzddSkVrh37gsqD6ucrbeXwsUF7NSQuSqz0HYzgBAU-nvORi01rLmGe52bxR0vbAHT6aVKvbfrQtFEuHM",
        entityId: "137e5cc0a61876691d56d9c609eab4df"
    }
};

export async function sendGeminiMessage(prompt, context, model, imageObj, signal, onUpdate) {
    // If no context (first conversation), fetch credentials
    if (!context || !context.atValue) {
        const params = await fetchRequestParams();
        context = {
            atValue: params.atValue,
            blValue: params.blValue,
            // [conversationId, responseId, choiceId]
            contextIds: ['', '', ''] 
        };
    }

    // Default to Flash if model not found
    const modelConfig = MODELS[model] || MODELS['gemini-3-flash'];

    // Handle image upload
    let imageList = [];
    if (imageObj) {
        try {
            // Pass signal to uploadImage
            const imageUrl = await uploadImage(imageObj, signal);
            // Construct Gemini image format: [[[url, 1], filename]]
            imageList = [[[imageUrl, 1], imageObj.name]];
        } catch (e) {
            // If user cancelled, just rethrow silently (handled by session manager)
            if (e.name === 'AbortError') {
                throw e;
            }
            console.error("Image upload failed:", e);
            throw e;
        }
    }

    const conversationId = context.contextIds[0] || "";
    const responseId = context.contextIds[1] || "";
    const choiceId = context.contextIds[2] || "";

    // --- Construct Payload ---
    // Array total length 95
    const reqData = new Array(95).fill(null);

    // [0] User Input (text + image)
    reqData[0] = [prompt, 0, null, imageList.length > 0 ? imageList : null, null, null, 0];
    
    // [1] Language
    reqData[1] = ["zh-CN"];
    
    // [2] Context IDs
    reqData[2] = [conversationId, responseId, choiceId, null, null, [], null, null, null, ""];
    
    // [3] Model/Routing params (RPC ID)
    reqData[3] = modelConfig.rpcId;
    
    // [4] Constant identifier (Entity ID)
    reqData[4] = modelConfig.entityId;

    // Standard feature values
    reqData[6] = [0];
    reqData[7] = 1;
    reqData[10] = 1;
    reqData[11] = 0;
    reqData[17] = [[0]];
    reqData[18] = 0;
    reqData[27] = 1;
    
    // --- Model specific features ---
    // Flash and Pro share these in the provided examples
    reqData[30] = [4];
    reqData[41] = [2]; 
    // ----------------------

    reqData[53] = 0;
    
    // [59] UUID
    reqData[59] = generateUUID(); 

    reqData[61] = [];
    
    // [66] Timestamp [seconds, microseconds]
    const now = Date.now();
    reqData[66] = [Math.floor(now / 1000), 287000000]; 
    
    // [94] End
    reqData[94] = []; 

    const reqPayload = [
        null,
        JSON.stringify(reqData)
    ];

    const queryParams = new URLSearchParams({
        bl: context.blValue || 'boq_assistant-bard-web-server_20230713.13_p0',
        _reqid: Math.floor(Math.random() * 900000) + 100000,
        rt: 'c'
    });

    // Send Request
    const response = await fetch(
        `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?${queryParams.toString()}`, 
        {
            method: 'POST',
            signal: signal, 
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'Origin': 'https://gemini.google.com',
                'Referer': 'https://gemini.google.com/',
                'X-Same-Domain': '1'
            },
            body: new URLSearchParams({
                at: context.atValue,
                'f.req': JSON.stringify(reqPayload)
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Network Error: ${response.status}`);
    }

    // --- Streaming Response Handling ---
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let finalResult = null;
    let isFirstChunk = true;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            
            // Check for HTML Login Page signature on early chunks
            if (isFirstChunk) {
                if (chunk.includes('<!DOCTYPE html>') || chunk.includes('<html') || chunk.includes('Sign in')) {
                    throw new Error("未登录 (Session expired)");
                }
                isFirstChunk = false;
            }

            buffer += chunk;

            // Process complete lines
            let newlineIndex;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, newlineIndex);
                buffer = buffer.slice(newlineIndex + 1);

                const parsed = parseGeminiLine(line);
                if (parsed) {
                    finalResult = parsed; // Keep track of latest full state
                    if (onUpdate) {
                        onUpdate(parsed.text);
                    }
                }
            }
        }
    } catch (e) {
        if (e.name === 'AbortError') throw e;
        // If we identified it as "未登录", rethrow it so it bubbles up correctly
        if (e.message.includes("未登录")) throw e;
        console.error("Stream reading error:", e);
    }

    // Process any remaining buffer
    if (buffer.length > 0) {
        const parsed = parseGeminiLine(buffer);
        if (parsed) finalResult = parsed;
    }

    if (!finalResult) {
        // Double check buffer content if we failed
        if (buffer.includes('<!DOCTYPE html>') || buffer.includes('<html')) {
             throw new Error("未登录 (Session expired)");
        }
        throw new Error("No valid response found in stream. Please check your network or login status.");
    }

    // Update Context from final result
    context.contextIds = finalResult.ids;

    return {
        text: finalResult.text,
        newContext: context
    };
}
