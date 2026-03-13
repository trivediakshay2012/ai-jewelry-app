"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
var supabase_js_1 = require("@supabase/supabase-js");
var supabaseUrl = (_a = process.env.EXPO_PUBLIC_SUPABASE_URL) === null || _a === void 0 ? void 0 : _a.trim();
var supabaseAnonKey = (_b = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) === null || _b === void 0 ? void 0 : _b.trim();
if (!supabaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL in .env');
}
if (!supabaseAnonKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
    },
});
