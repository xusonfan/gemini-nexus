const CJK_CHAR_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\u3040-\u30ff\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/u;
const PUNCT_OR_SYMBOL_RE = /[\p{P}\p{S}]/u;

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
    switch (code) {
        case 0x21:
        case 0x22:
        case 0x23:
        case 0x24:
        case 0x25:
        case 0x26:
        case 0x27:
        case 0x28:
        case 0x29:
        case 0x2a:
        case 0x2b:
        case 0x2c:
        case 0x2d:
        case 0x2e:
        case 0x2f:
        case 0x3a:
        case 0x3b:
        case 0x3c:
        case 0x3d:
        case 0x3e:
        case 0x3f:
        case 0x40:
        case 0x5b:
        case 0x5c:
        case 0x5d:
        case 0x5e:
        case 0x5f:
        case 0x60:
        case 0x7b:
        case 0x7c:
        case 0x7d:
        case 0x7e:
            return true;
        default:
            return false;
    }
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

export function cjkFriendlyEmphasis(md) {
    const BaseState = md.inline.State;

    class CjkFriendlyState extends BaseState {
        scanDelims(start, canSplitWord) {
            const marker = this.src.charCodeAt(start);

            if (marker !== 0x2a && marker !== 0x5f) {
                return super.scanDelims(start, canSplitWord);
            }

            const max = this.posMax;
            const lastChar = getPreviousCodePoint(this.src, start);
            let pos = start;

            while (pos < max && this.src.charCodeAt(pos) === marker) {
                pos++;
            }

            const count = pos - start;
            const nextChar = pos < max ? this.src.codePointAt(pos) : 0x20;

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

            const canOpen =
                leftFlanking &&
                (canSplitWord || !rightFlanking || isLastPunctChar || isLastCjkChar);

            const canClose =
                rightFlanking &&
                (canSplitWord || !leftFlanking || isNextPunctChar || isNextCjkChar);

            return {
                can_open: canOpen,
                can_close: canClose,
                length: count
            };
        }
    }

    md.inline.State = CjkFriendlyState;
}
