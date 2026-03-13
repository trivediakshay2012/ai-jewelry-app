"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
require("jsr:@supabase/functions-js/edge-runtime.d.ts");
var supabase_js_2_1 = require("npm:@supabase/supabase-js@2");
var corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
function safeJsonParse(text) {
    try {
        return JSON.parse(text);
    }
    catch (_a) {
        var match = text.match(/\{[\s\S]*\}/);
        if (!match)
            return null;
        try {
            return JSON.parse(match[0]);
        }
        catch (_b) {
            return null;
        }
    }
}
Deno.serve(function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, images, designData, openaiApiKey, supabaseAdmin, bucketName_1, buckets, exists, uploadedUrls, _i, images_1, image, extension, mimeType, path, binary, uploadError, publicData, inputContent, analysisResponse, analysisJson, outputText, parsed, analysisSummary, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (req.method === 'OPTIONS') {
                    return [2 /*return*/, new Response('ok', { headers: corsHeaders })];
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 12, , 13]);
                return [4 /*yield*/, req.json()];
            case 2:
                _a = _b.sent(), images = _a.images, designData = _a.designData;
                if (!images || !Array.isArray(images) || images.length === 0) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'No inspiration images provided' }), {
                            status: 400,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                openaiApiKey = Deno.env.get('OPENAI_API_KEY');
                if (!openaiApiKey) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY secret in Supabase' }), {
                            status: 500,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                supabaseAdmin = (0, supabase_js_2_1.createClient)(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
                bucketName_1 = 'inspiration-images';
                return [4 /*yield*/, supabaseAdmin.storage.listBuckets()];
            case 3:
                buckets = (_b.sent()).data;
                exists = buckets === null || buckets === void 0 ? void 0 : buckets.some(function (bucket) { return bucket.name === bucketName_1; });
                if (!!exists) return [3 /*break*/, 5];
                return [4 /*yield*/, supabaseAdmin.storage.createBucket(bucketName_1, {
                        public: true,
                        fileSizeLimit: '10MB',
                    })];
            case 4:
                _b.sent();
                _b.label = 5;
            case 5:
                uploadedUrls = [];
                _i = 0, images_1 = images;
                _b.label = 6;
            case 6:
                if (!(_i < images_1.length)) return [3 /*break*/, 9];
                image = images_1[_i];
                extension = image.extension || 'jpg';
                mimeType = image.mimeType || 'image/jpeg';
                path = "public/".concat(crypto.randomUUID(), ".").concat(extension);
                binary = Uint8Array.from(atob(image.base64), function (c) { return c.charCodeAt(0); });
                return [4 /*yield*/, supabaseAdmin.storage
                        .from(bucketName_1)
                        .upload(path, binary, {
                        contentType: mimeType,
                        upsert: false,
                    })];
            case 7:
                uploadError = (_b.sent()).error;
                if (uploadError) {
                    return [2 /*return*/, new Response(JSON.stringify({
                            error: 'Failed to upload inspiration image to storage',
                            details: uploadError.message,
                        }), {
                            status: 500,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                publicData = supabaseAdmin.storage
                    .from(bucketName_1)
                    .getPublicUrl(path).data;
                uploadedUrls.push(publicData.publicUrl);
                _b.label = 8;
            case 8:
                _i++;
                return [3 /*break*/, 6];
            case 9:
                inputContent = __spreadArray([
                    {
                        type: 'input_text',
                        text: "You are analyzing jewelry inspiration images for an AI jewelry design app.\n\nUser context:\n- Jewelry type: ".concat((designData === null || designData === void 0 ? void 0 : designData.jewelryType) || 'unknown', "\n- Occasion: ").concat((designData === null || designData === void 0 ? void 0 : designData.occasion) || 'unknown', "\n- Country / region: ").concat((designData === null || designData === void 0 ? void 0 : designData.country) || 'unknown', "\n- Wearer gender: ").concat((designData === null || designData === void 0 ? void 0 : designData.wearerGender) || 'unknown', "\n- Wearer style: ").concat((designData === null || designData === void 0 ? void 0 : designData.wearerStyle) || 'unknown', "\n- Metal: ").concat((designData === null || designData === void 0 ? void 0 : designData.metal) || 'unknown', "\n- Metal purity: ").concat((designData === null || designData === void 0 ? void 0 : designData.metalPurity) || 'unknown', "\n- Stone: ").concat((designData === null || designData === void 0 ? void 0 : designData.stone) || 'unknown', "\n- Shape: ").concat((designData === null || designData === void 0 ? void 0 : designData.shape) || 'unknown', "\n- Final custom note: ").concat((designData === null || designData === void 0 ? void 0 : designData.finalCustomNote) || 'none', "\n\nAnalyze the uploaded inspiration images and return strict JSON with these exact keys:\n{\n  \"style_family\": string,\n  \"motif_language\": string,\n  \"silhouette\": string,\n  \"detail_density\": string,\n  \"layering_behavior\": string,\n  \"cultural_cues\": string,\n  \"materials_impression\": string,\n  \"what_must_be_preserved\": string,\n  \"what_can_be_softened\": string,\n  \"how_to_keep_it_unique\": string,\n  \"product_option_directions\": [string, string, string, string],\n  \"design_summary\": string\n}\n\nYour job is to help image generation strongly follow the uploaded references.\nFocus on:\n- pattern repetition\n- bridal / ceremonial styling cues\n- layering\n- ornament density\n- drape and silhouette\n- motif structure\n- how to preserve the visual DNA while making the result original\n\nReturn JSON only.")
                    }
                ], uploadedUrls.map(function (url) { return ({
                    type: 'input_image',
                    image_url: url,
                }); }), true);
                return [4 /*yield*/, fetch('https://api.openai.com/v1/responses', {
                        method: 'POST',
                        headers: {
                            Authorization: "Bearer ".concat(openaiApiKey),
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: 'gpt-4.1-mini',
                            input: [
                                {
                                    role: 'user',
                                    content: inputContent,
                                },
                            ],
                        }),
                    })];
            case 10:
                analysisResponse = _b.sent();
                return [4 /*yield*/, analysisResponse.json()];
            case 11:
                analysisJson = _b.sent();
                if (!analysisResponse.ok) {
                    return [2 /*return*/, new Response(JSON.stringify({
                            error: 'OpenAI inspiration analysis failed',
                            details: analysisJson,
                        }), {
                            status: 500,
                            headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                        })];
                }
                outputText = analysisJson.output_text || '';
                parsed = safeJsonParse(outputText);
                analysisSummary = parsed
                    ? "Style family: ".concat(parsed.style_family, ". Motif language: ").concat(parsed.motif_language, ". Silhouette: ").concat(parsed.silhouette, ". Detail density: ").concat(parsed.detail_density, ". Layering behavior: ").concat(parsed.layering_behavior, ". Cultural cues: ").concat(parsed.cultural_cues, ". Materials impression: ").concat(parsed.materials_impression, ". Must preserve: ").concat(parsed.what_must_be_preserved, ". Can be softened: ").concat(parsed.what_can_be_softened, ". Keep it unique by: ").concat(parsed.how_to_keep_it_unique, ". Design summary: ").concat(parsed.design_summary, ".")
                    : outputText;
                return [2 /*return*/, new Response(JSON.stringify({
                        storageUrls: uploadedUrls,
                        analysisSummary: analysisSummary,
                        rawAnalysis: parsed || outputText,
                    }), {
                        status: 200,
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                    })];
            case 12:
                error_1 = _b.sent();
                return [2 /*return*/, new Response(JSON.stringify({
                        error: 'Unexpected analyze-inspiration error',
                        details: String(error_1),
                    }), {
                        status: 500,
                        headers: __assign(__assign({}, corsHeaders), { 'Content-Type': 'application/json' }),
                    })];
            case 13: return [2 /*return*/];
        }
    });
}); });
