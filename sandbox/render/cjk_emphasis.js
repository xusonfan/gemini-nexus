const CJK_CHAR_RE =
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\u3040-\u30ff\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/u;
const PUNCT_OR_SYMBOL_RE = /[\p{P}\p{S}]/u;
const ZWS = '\u200b';

function isWhiteSpace(code) {
    if (code >= 0x2000 && code <= 0x200a) return true;

    switch (code) {
        case 0x09:
        case 0x0a:
        case 0x0b:
        case 0x0c:
        case 0x0d:
        case 0x20:
        case 0x00a0:
        case 0x1680:
        case 0x202f:
        case 0x205f:
        case 0x3000:
            return true;
        default:
            return false;
    }
}

function isMdAsciiPunct(code) {
    return code >= 0x21 && code <= 0x7e && /[!-/:-@[-`{-~]/.test(String.fromCharCode(code));
}

function isPunctOrSymbol(code) {
    if (!code) return false;
    return PUNCT_OR_SYMBOL_RE.test(String.fromCodePoint(code));
}

function isCjkChar(code) {
    if (!code) return false;
    return CJK_CHAR_RE.test(String.fromCodePoint(code));
}

function getPreviousCodePoint(str, index) {
    if (index <= 0) return 0x20;

    const previousUnit = str.charCodeAt(index - 1);
    if (previousUnit >= 0xdc00 && previousUnit <= 0xdfff && index > 1) {
        return str.codePointAt(index - 2);
    }

    return str.codePointAt(index - 1);
}

function shouldInsertBoundary(lastChar, nextChar) {
    const isLastWhiteSpace = isWhiteSpace(lastChar);
    const isNextWhiteSpace = isWhiteSpace(nextChar);
    const isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctOrSymbol(lastChar);
    const isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctOrSymbol(nextChar);
    const isLastCjkChar = isCjkChar(lastChar);
    const isNextCjkChar = isCjkChar(nextChar);

    const leftFlanking =
        !isNextWhiteSpace &&
        (!isNextPunctChar || isLastWhiteSpace || isLastPunctChar || isLastCjkChar);

    const rightFlanking =
        !isLastWhiteSpace &&
        (!isLastPunctChar || isNextWhiteSpace || isNextPunctChar || isNextCjkChar);

    return leftFlanking || rightFlanking;
}

/**
 * Adapted from markdown-it CJK emphasis delimiter rules for marked: insert zero-width
 * spaces so emphasis markers adjacent to CJK characters parse correctly.
 */
export function preprocessCjkEmphasis(src) {
    if (!src) return src;

    let output = '';
    for (let index = 0; index < src.length; index++) {
        const marker = src.charCodeAt(index);
        if (marker !== 0x2a && marker !== 0x5f) {
            output += src[index];
            continue;
        }

        const lastChar = getPreviousCodePoint(src, index);
        const nextChar = index + 1 < src.length ? src.codePointAt(index + 1) : 0x20;

        if (shouldInsertBoundary(lastChar, marker) && (isCjkChar(lastChar) || isCjkChar(nextChar))) {
            if (isCjkChar(lastChar) && output.at(-1) !== ZWS) {
                output += ZWS;
            }
        }

        output += src[index];

        if (shouldInsertBoundary(marker, nextChar) && (isCjkChar(lastChar) || isCjkChar(nextChar))) {
            if (isCjkChar(nextChar)) {
                output += ZWS;
            }
        }
    }

    return output;
}
