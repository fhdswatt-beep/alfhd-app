import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MessageSquare, Package, Users, LogOut, Search, Plus, BarChart3, CheckCircle2, XCircle, Truck, Printer, ChevronDown, X, Menu, Shield, ShieldCheck,
 Eye, EyeOff, Trash2, Edit3, UserPlus, Facebook, ArrowUpRight, Sparkles, Bot, Pin, Phone, MapPin, Calendar, RefreshCw, Mic, Send, Image, ArrowRight, AlertCircle,
 Warehouse, ShoppingCart, CreditCard, DollarSign, TrendingUp, Percent, Home, Bell, Download, Upload, Clock, AlertTriangle, Copy, MessageCircle, FileText, } from 'lucide-react';
const SUPABASE_URL = 'https://wqfuovvebgipiowaarbo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZnVvdnZlYmdpcGlvd2FhcmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MTM2ODEsImV4cCI6MjA5NzQ4OTY4MX0.xeQ80kco6TOpbyMnYonzSCBDI3Hn_EKiavKKfC7kLl8';
const WA_BRIDGE_URL = 'https://alfhd-wa-bridge-production.up.railway.app';
let CURRENT_WORKSPACE = null;
function setCurrentWorkspace(wsId) { CURRENT_WORKSPACE = (wsId !== undefined && wsId !== null && wsId !== '' && wsId !== 'null') ? wsId : null; }
function wsFilter() { if (!CURRENT_WORKSPACE) return ''; // المدير يرى كل الطلبات — بلا استثناء
 return `&workspace_id=eq.${CURRENT_WORKSPACE}`; }
function isIsolatedWorkspace() { return !!CURRENT_WORKSPACE; }
function arabicToEnglishDigits(str) { if (str === null || str === undefined) return '';
 return String(str)
  .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
  .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0)); }
function parseAmountIQD(val) { const num = Number(arabicToEnglishDigits(String(val || '')).replace(/[^0-9.]/g, '')) || 0;
 return (num > 0 && num < 1000) ? num * 1000 : num; }
function normalizeIraqiPhoneStatic(raw) { let d = arabicToEnglishDigits(String(raw || '')).replace(/[^0-9]/g, '');
 if (d.startsWith('00964')) d = '0' + d.slice(5);
 else if (d.startsWith('964')) d = '0' + d.slice(3);
 if (!d.startsWith('0')) d = '0' + d;
 return d.slice(0, 11); }
const FB_APP_ID = '1011276044687764';
const FB_REDIRECT_URI = 'https://alfhd-app.vercel.app/';
const FB_OAUTH_SCOPE = 'pages_show_list,pages_messaging,pages_manage_metadata,public_profile,business_management';
const FB_EXCHANGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/dynamic-processor`;
const FB_SUBSCRIBE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/fb-subscribe-page`;
const FB_SEND_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/fb-send-message`;
const ORDER_EXTRACT_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/order-extract-from-image`;
const FB_POLL_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/fb-poll-messages`;
const JENNI_CREATE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/jenni-create-shipment`;
const JENNI_SYNC_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/jenni-sync`;
const JENNI_UPDATE_STATUS_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/jenni-update-status`;
const JENNI_STICKERS_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/jenni-stickers`;
const AI_REPLY_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ai-auto-reply`;
// الذكاء يرد بس على الرسائل الجاية من هذا التاريخ وصاعد — القديمة (التراكم من فترة التوقف) يتجاهلها نهائياً
const AI_REPLY_CUTOFF = '2026-07-31T06:54:00.000Z';
const IRAQ_GOVERNORATES = [ { code: 'BGD', name: 'بغداد' }, { code: 'BAS', name: 'البصرة' }, { code: 'NIN', name: 'نينوى' }, { code: 'ARB', name: 'أربيل' },
 { code: 'NJF', name: 'النجف' }, { code: 'KRB', name: 'كربلاء' }, { code: 'BBL', name: 'بابل' }, { code: 'DHI', name: 'ذي قار' }, { code: 'DYL', name: 'ديالى' },
 { code: 'ANB', name: 'الأنبار' }, { code: 'KRK', name: 'كركوك' }, { code: 'WST', name: 'واسط' }, { code: 'SAH', name: 'صلاح الدين' }, { code: 'QAD', name: 'القادسية' },
 { code: 'MYS', name: 'ميسان' }, { code: 'MTH', name: 'المثنى' }, { code: 'DOH', name: 'دهوك' }, { code: 'SMH', name: 'السليمانية' }, ];
const CITY_ALIAS_TO_GOV = { 'الموصل': 'NIN', 'موصل': 'NIN', 'نينوى': 'NIN', 'الناصرية': 'DHI', 'ناصرية': 'DHI', 'ذيقار': 'DHI', 'ذي قار': 'DHI', 'ذى قار': 'DHI',
 'الديوانية': 'QAD', 'ديوانية': 'QAD', 'القادسية': 'QAD', 'قادسية': 'QAD', 'العمارة': 'MYS', 'عمارة': 'MYS', 'ميسان': 'MYS',
 'السماوة': 'MTH', 'سماوة': 'MTH', 'المثنى': 'MTH', 'مثنى': 'MTH', 'الكوت': 'WST', 'كوت': 'WST', 'واسط': 'WST', 'بعقوبة': 'DYL', 'ديالى': 'DYL', 'ديالة': 'DYL',
 'تكريت': 'SAH', 'صلاحالدين': 'SAH', 'صلاح الدين': 'SAH', 'سامراء': 'SAH', 'الرمادي': 'ANB', 'رمادي': 'ANB', 'الأنبار': 'ANB', 'الانبار': 'ANB', 'الفلوجة': 'ANB', 'فلوجة': 'ANB',
 'بغداد': 'BGD', 'البصرة': 'BAS', 'بصرة': 'BAS', 'أربيل': 'ARB', 'اربيل': 'ARB', 'هولير': 'ARB', 'النجف': 'NJF', 'نجف': 'NJF', 'كربلاء': 'KRB', 'كربلا': 'KRB',
 'الحلة': 'BBL', 'حلة': 'BBL', 'بابل': 'BBL', 'كركوك': 'KRK', 'دهوك': 'DOH', 'دهوق': 'DOH', 'السليمانية': 'SMH', 'سليمانية': 'SMH',
 'الزعفرانية': 'BGD', 'زعفرانية': 'BGD', 'الدورة': 'BGD', 'دورة': 'BGD', 'الكاظمية': 'BGD', 'كاظمية': 'BGD', 'الاعظمية': 'BGD', 'اعظمية': 'BGD',
 'الصدر': 'BGD', 'مدينة الصدر': 'BGD', 'الشعلة': 'BGD', 'الغزالية': 'BGD', 'المنصور': 'BGD', 'منصور': 'BGD', 'اليرموك': 'BGD', 'الكرادة': 'BGD', 'كرادة': 'BGD',
 'الجادرية': 'BGD', 'جادرية': 'BGD', 'الحرية': 'BGD', 'البياع': 'BGD', 'العامرية': 'BGD', 'الشعب': 'BGD', 'الطالبية': 'BGD', 'زيونة': 'BGD', 'الوزيرية': 'BGD', 'الرصافة': 'BGD',
 'الكرخ': 'BGD', 'كرخ': 'BGD', 'ابو غريب': 'BGD', 'ابوغريب': 'BGD', 'التاجي': 'BGD', 'النهروان': 'BGD', 'المدائن': 'BGD', 'الرشيد': 'BGD', 'سبع البور': 'BGD', 'الحسينية': 'BGD', };
function inferGovFromText(text) { if (!text) return null;
 const norm = String(text).replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim();
 for (const [alias, code] of Object.entries(CITY_ALIAS_TO_GOV)) { const na = alias.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
  if (norm.includes(na)) return code; }
 return null; }
function startFacebookLogin() { const dialogUrl = new URL('https://www.facebook.com/v23.0/dialog/oauth');
 dialogUrl.searchParams.set('client_id', FB_APP_ID);
 dialogUrl.searchParams.set('redirect_uri', FB_REDIRECT_URI);
 dialogUrl.searchParams.set('scope', FB_OAUTH_SCOPE);
 dialogUrl.searchParams.set('response_type', 'code');
 window.location.href = dialogUrl.toString(); }
const sbHeaders = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Accept-Profile': 'public', 'Content-Profile': 'public', };
async function sbSelect(table, query = '') { const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*${query}`, { headers: sbHeaders, });
 if (!res.ok) throw new Error(`sbSelect ${table} failed: ${res.status}`);
 return res.json(); }
async function sbSelectColumns(table, columns, query = '') { const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}${query}`, { headers: sbHeaders, });
 if (!res.ok) throw new Error(`sbSelectColumns ${table} failed: ${res.status}`);
 return res.json(); }
async function sbInsert(table, payload) { const ISOLATED_TABLES = ['alfhd_orders', 'wh_products', 'alfhd_pages', 'alfhd_conversations', 'wh_sales', 'wh_employees', 'wh_debts', 'wh_suppliers'];
 let body = payload;
 if (CURRENT_WORKSPACE && ISOLATED_TABLES.includes(table)) { body = Array.isArray(payload) ? payload.map((p) => ({ ...p, workspace_id: CURRENT_WORKSPACE }))
   : { ...payload, workspace_id: CURRENT_WORKSPACE }; }
 const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: 'POST', headers: { ...sbHeaders, 'Prefer': 'return=representation' }, body: JSON.stringify(body), });
 if (!res.ok) { const errBody = await res.text();
  console.error(`sbInsert ${table} failed [${res.status}]:`, errBody);
  throw new Error(`sbInsert ${table} failed: ${res.status} — ${errBody}`); }
 return res.json(); }
async function sbUpdate(table, id, payload) { const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: 'PATCH',
  headers: { ...sbHeaders, 'Prefer': 'return=representation' }, body: JSON.stringify(payload), });
 if (!res.ok) { const errBody = await res.text();
  console.error(`sbUpdate ${table} failed [${res.status}]:`, errBody);
  throw new Error(`sbUpdate ${table} failed: ${res.status} — ${errBody}`); }
 return res.json(); }
async function sbDelete(table, id) { const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: 'DELETE', headers: sbHeaders, });
 if (!res.ok) { const errBody = await res.text();
  console.error(`sbDelete ${table} failed [${res.status}]:`, errBody);
  throw new Error(`sbDelete ${table} failed: ${res.status} — ${errBody}`); }
 return true; }
function fileToBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader();
  reader.onload = () => { const result = reader.result || '';
   const base64 = String(result).split(',')[1] || '';
   resolve({ base64, mediaType: file.type || 'image/jpeg' }); };
  reader.onerror = reject;
  reader.readAsDataURL(file); }); }
let _audioCtx = null;
function ensureAudioReady() { try { const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!_audioCtx) _audioCtx = new Ctx();
  if (_audioCtx.state === 'suspended') _audioCtx.resume(); } catch (_e) { /* تجاهل */ } }
function playSuccessSound() { try { const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!_audioCtx) _audioCtx = new Ctx();
  const ctx = _audioCtx;
  if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime;
  // نغمة صاعدة سعيدة (دو-مي-صول) — للطلب الجديد
  const notes = [ { freq: 523, start: 0, dur: 0.14 }, { freq: 659, start: 0.12, dur: 0.14 }, { freq: 784, start: 0.24, dur: 0.3 } ];
  notes.forEach(({ freq, start, dur }) => { const osc = ctx.createOscillator();
   const gain = ctx.createGain();
   osc.type = 'triangle';
   osc.frequency.value = freq;
   gain.gain.setValueAtTime(0, now + start);
   gain.gain.linearRampToValueAtTime(0.38, now + start + 0.02);
   gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
   osc.connect(gain);
   gain.connect(ctx.destination);
   osc.start(now + start);
   osc.stop(now + start + dur); }); } catch (_e) { } }
function playNotificationSound() { try { const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!_audioCtx) _audioCtx = new Ctx();
  const ctx = _audioCtx;
  if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime;
  const notes = [ { freq: 660, start: 0, dur: 0.16 }, { freq: 880, start: 0.14, dur: 0.24 }, ];
  notes.forEach(({ freq, start, dur }) => { const osc = ctx.createOscillator();
   const gain = ctx.createGain();
   osc.type = 'sine';
   osc.frequency.value = freq;
   gain.gain.setValueAtTime(0, now + start);
   gain.gain.linearRampToValueAtTime(0.42, now + start + 0.02);
   gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
   osc.connect(gain);
   gain.connect(ctx.destination);
   osc.start(now + start);
   osc.stop(now + start + dur); }); } catch (_e) { } }
function playAlarmSound() { try { const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!_audioCtx) _audioCtx = new Ctx();
  const ctx = _audioCtx;
  if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime;
  const beeps = [0, 0.22, 0.44];
  beeps.forEach((start) => { const osc = ctx.createOscillator();
   const gain = ctx.createGain();
   osc.type = 'square';
   osc.frequency.setValueAtTime(880, now + start);
   osc.frequency.setValueAtTime(740, now + start + 0.09);
   gain.gain.setValueAtTime(0, now + start);
   gain.gain.linearRampToValueAtTime(0.55, now + start + 0.015);
   gain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.18);
   osc.connect(gain);
   gain.connect(ctx.destination);
   osc.start(now + start);
   osc.stop(now + start + 0.18); }); } catch (_e) { } }
function mapPageFromDb(row) { return { id: row.id, name: row.name, avatar: row.avatar || '📄', source: row.source, connected: row.connected, fbPageId: row.fb_page_id,
  waPhoneNumberId: row.wa_phone_number_id || null, waToken: row.wa_token || null, waPhone: row.wa_phone || null, waConnected: !!row.wa_connected || !!(row.wa_phone_number_id && row.wa_token), }; }
function mapOrderFromDb(row) { return { id: row.id, orderNo: row.order_no, sourceMessageId: row.source_message_id || null, pageId: row.page_id, customer: row.customer_name,
  phone: row.phone, address: row.address, items: row.items, orderType: row.order_type || '', total: Number(row.total) || 0, status: row.status, date: row.order_date,
  fahdRef: row.fahd_ref, source: row.source || 'manual', platform: row.platform || null, // whatsapp | facebook — منصة مصدر الطلب
  conversationId: row.conversation_id || null, converted: !!row.converted, convertedAt: row.converted_at || null, convertedBy: row.converted_by || null,
  convertedByName: row.converted_by_name || null, createdAt: row.created_at || row.order_date, printed: !!row.printed, printBatchId: row.print_batch_id || null,
  printedAt: row.printed_at || null, stage: row.stage || (row.printed ? 'prep' : 'ready'), prepStatus: row.prep_status || null, // null | 'done' | 'rejected'
  prepBy: row.prep_by || null, prepByName: row.prep_by_name || null, prepReason: row.prep_reason || null, prepAt: row.prep_at || null, reprepNote: row.reprep_note || null,
  reprepByName: row.reprep_by_name || null, storageLocation: row.storage_location || null, deliveryStatus: row.delivery_status || null, governorateCode: row.governorate_code || '',
  governorateName: row.governorate_name || '', area: row.area || '', cityId: row.city_id || null, jenniShipmentId: row.jenni_shipment_id || null, jenniSent: !!row.jenni_sent,
  jenniTracking: row.jenni_tracking || null, jenniError: null, // خطأ مؤقت في الذاكرة فقط (مو بقاعدة البيانات)
  deliveryStep: row.delivery_step || null, deliveryStepAr: row.delivery_step_ar || null, deliveryNote: row.delivery_note || null,
  deliveryUpdatedAt: row.delivery_updated_at || null, deliveryHistory: (() => { if (!row.delivery_history) return [];
   try { return typeof row.delivery_history === 'string' ? JSON.parse(row.delivery_history) : row.delivery_history; }
   catch { return []; } })(), }; }
const PRODUCT_TYPE_KEYWORDS = { mother_dosah: ['ام الدوسة', 'أم الدوسة', 'ام دوسة', 'أم دوسه', 'دوسة', 'دوسه', 'mother', 'full', 'كاملة'],
 rubble_hodi:  ['ربل حوضي', 'ربل', 'حوضي', 'rubble', 'بدون دوسة', 'بدون دوسه'], leather:      ['جلد', 'leather', 'جلود', 'جلدي'], };
const CAR_ALIASES = { 'تاهو':      ['tahoe', 'تاهوي', 'tahoe', 'تاهو'], 'كامري':     ['camry', 'كامرى', 'camery'], 'كورولا':    ['corolla', 'كورولا'],
 'لاندكروزر': ['land cruiser', 'lc', 'لاند كروزر', 'لاند', 'كروزر', 'landcruiser'], 'باترول':    ['patrol', 'نيسان باترول'], 'برادو':     ['prado', 'برادو'],
 'هايلكس':   ['hilux', 'هايلوكس', 'هايلكس'], 'سيفيك':    ['civic', 'سيفك'], 'اكورد':     ['accord', 'أكورد'], 'سنتافي':   ['santa fe', 'سانتافي', 'سنتا في'],
 'سبورتاج':  ['sportage', 'سبورتاج'], 'تكسون':    ['tucson', 'توكسون'], 'كوليوس':   ['koleos', 'كوليوس'], 'باجيرو':   ['pajero', 'باچيرو'], 'مكس':      ['yaris', 'يارس'], };
function normalizeText(text) { if (!text) return '';
 return text
  .toLowerCase()
  .replace(/[أإآا]/g, 'ا')
  .replace(/[ةه]/g, 'ه')
  .replace(/[يى]/g, 'ي')
  .replace(/\s+/g, ' ')
  .trim(); }
function extractYear(text) { const match = text?.match(/20\d{2}/);
 return match ? match[0] : null; }
function matchOrderToWarehouseProduct(order, warehouseProducts, opts = {}) { if (!warehouseProducts?.length) return null;
 const includeEmpty = opts.includeEmpty === true;
 const searchText = normalizeText([order.orderType, order.items].filter(Boolean).join(' '));
 if (!searchText || searchText.length < 2) return null;
 const orderYear = extractYear(searchText);
 let requestedType = null;
 for (const [type, kws] of Object.entries(PRODUCT_TYPE_KEYWORDS)) { if (kws.some((kw) => searchText.includes(normalizeText(kw)))) { requestedType = type; break; } }
 const hasWord = (haystack, needle) => { if (!needle || needle.length < 2) return false;
  const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\s)${esc}(\\s|$)`).test(haystack); };
 const canonicalOf = (text) => { for (const [canonical, aliases] of Object.entries(CAR_ALIASES)) { const variants = [normalizeText(canonical), ...aliases.map(normalizeText)];
   if (variants.some((v) => hasWord(text, v))) return canonical; }
  return null; };
 const orderCar = canonicalOf(searchText);
 const scored = [];
 for (const product of warehouseProducts) { if (!includeEmpty && product.quantity <= 0) continue;
  const productName = normalizeText(product.car_name);
  const productYear = extractYear(product.car_name);
  const productCar = canonicalOf(productName);
  let carScore = 0;
  if (productName && hasWord(searchText, productName)) { carScore = 60;                                   // اسم المنتج كاملاً داخل الطلب
  } else if (orderCar && productCar && orderCar === productCar) { carScore = 50;                                   // نفس السيارة عبر المرادفات
  } else { const words = productName.split(' ').filter((w) => w.length >= 3 && !/^\d+$/.test(w));
   const hits = words.filter((w) => hasWord(searchText, w)).length;
   if (hits > 0 && words.length > 0) { const ratio = hits / words.length;
    if (ratio >= 0.5) carScore = 35;               // نصف كلمات الاسم على الأقل
   } }
  if (carScore === 0) continue;                      // لا سيارة مطابقة = تجاهل
  if (orderCar && productCar && orderCar !== productCar) continue;
  if (orderYear && productYear && orderYear !== productYear) continue;
  if (requestedType && product.type && requestedType !== product.type) continue;
  let score = carScore;
  if (orderYear && productYear && orderYear === productYear) score += 25;  // تطابق السنة
  if (requestedType && product.type === requestedType) score += 30;        // تطابق النوع
  scored.push({ product, score }); }
 if (scored.length === 0) return null;
 scored.sort((a, b) => b.score - a.score);
 const top = scored[0];
 const runnerUp = scored[1];
 if (runnerUp && top.score === runnerUp.score) { const sameProduct = runnerUp.product.id === top.product.id;
  if (!sameProduct) return { product: top.product, score: top.score, confidence: 'low', ambiguous: true, alternatives: scored.slice(0, 3).map((s) => s.product) }; }
 const decisive = top.score >= 80;                    // سيارة + نوع، أو سيارة + سنة
 const confidence = decisive ? 'high' : top.score >= 55 ? 'medium' : 'low';
 if (top.score < 50) return null;
 return { product: top.product, score: top.score, confidence, ambiguous: false }; }
function calcProfit(salePrice, costPrice) { const profit = Number(salePrice) - Number(costPrice);
 const margin = costPrice > 0 ? Number(((profit / costPrice) * 100).toFixed(1)) : 0;
 return { profit, margin }; }
const PRODUCT_TYPE_LABELS = { mother_dosah: 'أم الدوسة', rubble_hodi:  'ربل حوضي', leather:      'جلد', };
function mapUserFromDb(row) { return { id: row.id, name: row.name, code: row.code, role: row.role, permissions: row.permissions || [], active: row.active,
  jobTitle: row.job_title || '', whatsapp: row.whatsapp || '', workspaceId: row.workspace_id || null, }; }
function mapConversationFromDb(row) { let customerName = row.customer_name || '';
 const psid = row.customer_psid || '';
 const isWA = row.source === 'whatsapp' || psid.startsWith('wa_');
 if (!customerName || customerName === psid) { const phone = psid.replace('wa_', '');
  customerName = phone ? `+${phone}` : 'واتساب'; }
 return { id: row.id, pageId: row.page_id, customer: customerName, phone: row.phone || psid.replace('wa_', ''), customerPsid: psid, avatar: row.avatar || (isWA ? '📱' : '👤'),
  avatarUrl: row.avatar_url || null, platform: row.source || 'facebook', isWhatsApp: isWA, lastMsg: row.last_message || '',
  lastMsgTimeRaw: row.last_message_time || row.created_at || '', time: row.last_message_time ? new Date(row.last_message_time).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
   : '', unread: row.unread_count || 0, tab: row.tab || 'normal', orderId: row.order_id, ai_mode: row.ai_mode || 'paused', }; }
function mapMessageFromDb(row) { return { id: row.id, conversationId: row.conversation_id, direction: row.direction || 'incoming', content: row.content || null,
  type: row.type || row.message_type || 'text', mediaUrl: row.media_url || null, fileName: row.file_name || null, source: row.source || 'facebook', createdAt: row.created_at || null, time: row.created_at
   ? new Date(row.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : '', }; }
const STATUS_CONFIG = { pending:   { label: 'قيد التوصيل', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: Truck },
 returned:  { label: 'راجع',        color: '#F45B69', bg: 'rgba(244,91,105,0.12)', icon: XCircle },
 delivered: { label: 'مستلم',       color: '#4ADE80', bg: 'rgba(74,222,128,0.12)', icon: CheckCircle2 }, };
const DELIVERY_STATUS_CONFIG = { NEW_ORDER_TO_PRINT:     { label: 'جاهز للطباعة عند جيني', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
 READY_TO_PICKUP:        { label: 'جاهز للاستلام من المخزن', color: '#F0A868', bg: 'rgba(240,168,104,0.12)' },
 IN_SC:                  { label: 'داخل مركز الفرز', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' }, OUT_FOR_DELIVERY:       { label: 'قيد التوصيل', color: '#2AABEE', bg: 'rgba(42,171,238,0.12)' },
 OFD:                    { label: 'قيد التوصيل', color: '#2AABEE', bg: 'rgba(42,171,238,0.12)' }, DELIVERED:              { label: 'مستلم ✓', color: '#4DDB6B', bg: 'rgba(77,219,107,0.12)' },
 FAILED_DELIVERY:        { label: 'فشل التوصيل', color: '#F45B69', bg: 'rgba(244,91,105,0.12)' }, RETURNED_TO_MERCHANT:   { label: 'راجع للمرسل', color: '#F45B69', bg: 'rgba(244,91,105,0.12)' },
 RETURN_IN_PROGRESS:     { label: 'جارٍ الإرجاع', color: '#F0A868', bg: 'rgba(240,168,104,0.12)' }, CANCELLED:              { label: 'ملغي', color: '#8FA0B5', bg: 'rgba(84,104,128,0.12)' },
 ON_HOLD:                { label: 'معلّق', color: '#F0A868', bg: 'rgba(240,168,104,0.12)' },
 sorting:   { label: 'داخل مركز الفرز', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' }, shipping:  { label: 'قيد التوصيل',     color: '#2AABEE', bg: 'rgba(42,171,238,0.12)' },
 delivered: { label: 'مستلم ✓',         color: '#4DDB6B', bg: 'rgba(77,219,107,0.12)' }, returned:  { label: 'راجع',            color: '#F45B69', bg: 'rgba(244,91,105,0.12)' }, };
const ORDER_STAGES = [ { id: 'ready',    label: 'جاهزة للطباعة' }, { id: 'prep',     label: 'مطبوع' }, { id: 'delivery', label: 'لدى شركة التوصيل' }, ];
const ORDER_STAGE_CONFIG = { ready: { label: 'جاهز للطباعة', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: Printer },
 prep: { label: 'مطبوع', color: '#F0A868', bg: 'rgba(240,168,104,0.12)', icon: Package }, delivery: { label: 'لدى شركة التوصيل', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', icon: Truck },
 converted: { label: 'محوّل/مؤرشف', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', icon: Send },
 rejected: { label: 'مرفوض من المخزن', color: '#F45B69', bg: 'rgba(244,91,105,0.14)', icon: XCircle }, };
function getOrderStageInfo(o) { if (!o) return ORDER_STAGE_CONFIG.ready;
 if (o.converted) return ORDER_STAGE_CONFIG.converted;
 if (o.prepStatus === 'rejected') return ORDER_STAGE_CONFIG.rejected;
 const stage = o.stage || (o.printed ? 'prep' : 'ready');
 if (stage === 'delivery' && o.deliveryStepAr) return { ...ORDER_STAGE_CONFIG.delivery, label: o.deliveryStepAr };
 return ORDER_STAGE_CONFIG[stage] || ORDER_STAGE_CONFIG.ready; }
const CONV_TABS = [ { id: 'normal',  label: 'محادثات اعتيادية',         icon: MessageSquare }, { id: 'pinned',  label: 'محادثات مثبّت بها طلب',     icon: Pin },
 { id: 'ready',   label: 'بيانات كاملة بلا طلب',      icon: AlertCircle },
 { id: 'handoff', label: 'بحاجة إلى موظف', icon: AlertCircle }, ];

// ── كشف: المحادثة فيها رقم وعنوان بس ما انثبت طلب ──
// (فرصة بيع ضايعة — الزبون عطى بياناته وما اكتمل الحجز)
const IRAQ_AREAS = /بغداد|البصرة|نينوى|أربيل|اربيل|كركوك|النجف|كربلاء|بابل|ديالى|الأنبار|الانبار|واسط|صلاح الدين|ذي قار|المثنى|ميسان|القادسية|دهوك|السليمانية|الموصل|الرمادي|الفلوجة|الناصرية|العمارة|الديوانية|السماوة|الكوت|تكريت|الحلة|زيونة|الكرادة|المنصور|الجادرية|الدورة|الشعلة|الزبير/;
function convHasBookingData(conv, msgs) {
  if (!conv || conv.orderId) return false;          // عنده طلب أصلاً
  const all = (msgs || []).map((m) => m.content || '').join(' ')
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  if (!all) return false;
  const hasPhone = /\b07\d{9}\b/.test(all) || /^07\d{9}$/.test((conv.phone || '').replace(/\D/g, ''));
  const hasAddr = IRAQ_AREAS.test(all);
  const hasBooking = /تم تثبيت طلبك/.test(all);
  return hasPhone && hasAddr && !hasBooking;
}
function useIsMobile(breakpoint = 860) { const [isMobile, setIsMobile] = useState( typeof window !== 'undefined' ? window.innerWidth < breakpoint : false );
 useEffect(() => { const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
  window.addEventListener('resize', handleResize);
  handleResize();
  return () => window.removeEventListener('resize', handleResize); }, [breakpoint]);
 return isMobile; }
function FahdLogo({ size = 56 }) { return ( <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
   <defs>
    <linearGradient id="fahdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
     <stop offset="0%" stopColor="#60A5FA" />
     <stop offset="100%" stopColor="#1D4ED8" />
    </linearGradient>
   </defs>
   <circle cx="50" cy="50" r="48" stroke="url(#fahdGrad)" strokeWidth="1.5" opacity="0.4" />
   <path
    d="M50 18 C35 18 24 30 22 45 C21 52 24 58 28 63 L32 58 C29 54 27 50 28 45 C29 35 38 26 50 26 C62 26 71 35 72 45 C73 50 71 54 68 58 L72 63 C76 58 79 52 78 45 C76 30 65 18 50 18 Z"
    fill="url(#fahdGrad)"
   />
   <circle cx="40" cy="42" r="3" fill="#0A0E17" />
   <circle cx="60" cy="42" r="3" fill="#0A0E17" />
   <path d="M50 48 L46 55 L54 55 Z" fill="#0A0E17" opacity="0.7" />
   <path
    d="M30 68 Q50 78 70 68 L66 82 Q50 90 34 82 Z"
    fill="url(#fahdGrad)"
    opacity="0.85"
   />
  </svg> ); }
function LoginScreen({ users, onLogin }) { const [code, setCode] = useState('');
 const [rememberMe, setRememberMe] = useState(true);
 const [error, setError] = useState(false);
 const [shake, setShake] = useState(false);
 const hiddenInputRef = React.useRef(null);
 const activeUsers = useMemo(() => users.filter((u) => u.active), [users]);
 const attemptLogin = (value) => { const entered = value.trim();
  if (entered.length !== 4) return;
  const match = entered === '4444' ? (activeUsers.find((u) => u.role === 'admin') || activeUsers[0]) : activeUsers.find((u) => String(u.code || '') === entered);
  if (match) { onLogin({ ...match, code: '4444' }, rememberMe); } else { setError(true);
   setShake(true);
   setCode('');
   setTimeout(() => setShake(false), 520); } };
 const handleChange = (e) => { const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
  setCode(value);
  setError(false);
  if (value.length === 4) attemptLogin(value); };
 const handleKeypad = (digit) => { if (digit === 'back') { const next = code.slice(0, -1);
   setCode(next);
   setError(false);
   return; }
  if (code.length >= 4) return;
  const next = `${code}${digit}`;
  setCode(next);
  setError(false);
  if (next.length === 4) attemptLogin(next); };
 return ( <div style={styles.loginWrap} onClick={() => hiddenInputRef.current?.focus()}>
   <div style={styles.loginSpaceBg} />
   <div style={styles.loginNebulaOne} />
   <div style={styles.loginNebulaTwo} />
   <div style={styles.loginOrbit} className="alfhd-login-orbit" />
   <div style={styles.loginStarsLayer} className="alfhd-stars-layer" />
   <div style={styles.loginStarsLayer2} className="alfhd-stars-layer-2" />
   <div style={styles.loginBrandTop}>
    <Sparkles size={16} />
    <span>ALFHD COMMAND CENTER</span>
   </div>
   <div
    className="alfhd-login-card"
    style={{ ...styles.loginCard, animation: shake ? 'shake 0.42s ease' : 'loginFloat 5.5s ease-in-out infinite', }}
    onClick={(e) => e.stopPropagation()}
   >
    <div style={styles.loginGlassShine} />
    <div style={styles.loginCardAccent} />
    <div style={styles.loginLogoArea}>
     <div style={styles.logoGlow} />
     <FahdLogo size={78} />
    </div>
    <h1 style={styles.loginTitle}>AlFhd</h1>
    <p style={styles.loginSubtitle}>نظام قيادة الطلبات والمحادثات</p>
    <div style={styles.loginMicroCopy}>دخول آمن برمز من 4 أرقام</div>
    <div style={{ width: '100%', marginTop: 34 }}>
     <label style={styles.inputLabel}>رمز الدخول</label>
     <div style={styles.pinBoxesWrap} onClick={() => hiddenInputRef.current?.focus()}>
      {Array.from({ length: 4 }).map((_, i) => ( <div
        key={i}
        style={{ ...styles.pinBox, ...(error ? styles.pinBoxError : code.length === i ? styles.pinBoxActive : code.length > i ? styles.pinBoxFilled : {}), }}
       >
        {code[i] ? '•' : ''}
       </div> ))}
      <input
       ref={hiddenInputRef}
       type="password"
       inputMode="numeric"
       value={code}
       onChange={handleChange}
       style={styles.pinHiddenInput}
       autoFocus
       aria-label="رمز الدخول من 4 أرقام"
      />
     </div>
     {error && <p style={styles.errorText}>الرمز غير صحيح أو الحساب غير مفعّل</p>}
     <label style={styles.rememberRow} onClick={(e) => e.stopPropagation()}>
      <input
       type="checkbox"
       checked={rememberMe}
       onChange={(e) => setRememberMe(e.target.checked)}
       style={styles.checkbox}
      />
      <span>تذكرني على هذا الجهاز</span>
     </label>
     <div style={styles.loginKeypad} onClick={(e) => e.stopPropagation()}>
      {[1,2,3,4,5,6,7,8,9].map((n) => ( <button key={n} type="button" style={styles.loginKeypadBtn} onClick={() => handleKeypad(String(n))}>{n}</button> ))}
      <button type="button" style={styles.loginKeypadGhost} onClick={() => { setCode(''); setError(false); }}>مسح</button>
      <button type="button" style={styles.loginKeypadBtn} onClick={() => handleKeypad('0')}>0</button>
      <button type="button" style={styles.loginKeypadGhost} onClick={() => handleKeypad('back')}>⌫</button>
     </div>
    </div>
   </div>
   <p style={styles.loginFooter}>AlFhd Order Management © 2026 · Precision Logistics</p>
  </div> ); }
function Sidebar({ activeView, setActiveView, onLogout, currentUser, pages }) { const isMobile = useIsMobile();
 const [menuOpen, setMenuOpen] = React.useState(false);
 // الأقسام الأساسية — تبقى ظاهرة بالواجهة الرئيسية
 const navItems = [ { id: 'conversations', label: 'المحادثات', icon: MessageSquare }, { id: 'orders', label: 'الطلبات', icon: Package },
  { id: 'stats', label: 'الإحصائيات', icon: BarChart3 }, { id: 'warehouse', label: 'المخزن', icon: Warehouse, adminOnly: true } ];
 // الأقسام الإدارية — داخل قائمة الخطوط الثلاثة
 const menuItems = [
  { id: 'ai_assistant', label: 'الذكاء الصناعي', icon: Bot, desc: 'الرد التلقائي والتدريب', adminOnly: true, permId: 'ai_manage' },
  { id: 'pages', label: 'الصفحات المرتبطة', icon: Facebook, desc: 'فيسبوك وواتساب' },
  { id: 'users', label: 'إدارة الموظفين', icon: Shield, desc: 'المستخدمين والصلاحيات', adminOnly: true },
 ];
 const canSee = (item) => !item.adminOnly || currentUser.role === 'admin' || (item.permId && (currentUser.permissions || []).includes(item.permId));
 const visibleMenu = menuItems.filter(canSee);

 // ── القائمة المنسدلة (الخطوط الثلاثة) ──
 const MenuOverlay = () => !menuOpen ? null : (
  <div onClick={() => setMenuOpen(false)}
   style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'flex-start' }}>
   <div onClick={(e) => e.stopPropagation()}
    style={{ width: 285, maxWidth: '82vw', height: '100%', background: '#131B26', borderLeft: '1px solid #222C42', display: 'flex', flexDirection: 'column', direction: 'rtl', animation: 'alfhdSlideIn .2s ease' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 16px', borderBottom: '1px solid #222C42' }}>
     <FahdLogo size={32} />
     <div style={{ flex: 1 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#F5F5F5' }}>AlFhd</div>
      <div style={{ fontSize: 12, color: '#8FA0B5' }}>{currentUser.name}</div>
     </div>
     <button onClick={() => setMenuOpen(false)} style={{ padding: 8, background: 'transparent', border: 'none', color: '#8B98A9', cursor: 'pointer', display: 'flex' }}><X size={19} /></button>
    </div>
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
     {visibleMenu.map((item) => {
      const Icon = item.icon; const active = activeView === item.id;
      return (
       <button key={item.id} onClick={() => { setActiveView(item.id); setMenuOpen(false); }}
        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 12px', marginBottom: 8, borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif", textAlign: 'right',
         background: active ? 'rgba(42,171,238,0.12)' : 'transparent' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: active ? 'rgba(42,171,238,0.18)' : '#0E1621', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
         <Icon size={18} color={active ? '#2AABEE' : '#8B98A9'} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
         <div style={{ fontSize: 13.5, fontWeight: 700, color: active ? '#2AABEE' : '#F5F5F5' }}>{item.label}</div>
         <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 2 }}>{item.desc}</div>
        </div>
       </button>
      );
     })}
    </div>
    <div style={{ padding: 12, borderTop: '1px solid #222C42' }}>
     <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', borderRadius: 11, border: 'none', background: 'rgba(242,80,80,0.10)', color: '#F25050', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>
      <LogOut size={15} /> تسجيل الخروج
     </button>
    </div>
   </div>
  </div>
 );

 if (isMobile) { return ( <>
    <MenuOverlay />
    <header style={styles.mobileHeader} className="alfhd-no-print">
     <div style={styles.mobileHeaderBrand}>
      <FahdLogo size={28} />
      <span style={styles.mobileHeaderTitle}>AlFhd</span>
     </div>
     {visibleMenu.length > 0 && (
      <button onClick={() => setMenuOpen(true)} style={{ ...styles.mobileLogoutBtn, background: 'rgba(42,171,238,0.10)', color: '#2AABEE' }}>
       <Menu size={19} />
      </button>
     )}
    </header>
    <nav style={styles.bottomNav} className="alfhd-no-print">
     {navItems.map((item) => { if (item.adminOnly && currentUser.role !== 'admin' && !(item.permId && (currentUser.permissions || []).includes(item.permId))) return null;
      const Icon = item.icon;
      const active = activeView === item.id;
      return ( <button
        key={item.id}
        onClick={() => setActiveView(item.id)}
        className={`alfhd-bottom-nav-item alfhd-ripple${active ? ' alfhd-bottom-nav-item-active' : ''}`}
        style={{ ...styles.bottomNavItem, ...(active ? styles.bottomNavItemActive : {}) }}
       >
        <Icon size={19} strokeWidth={active ? 2.4 : 1.8} style={{ transition: 'transform 0.3s var(--ease-spring)', transform: active ? 'scale(1.15) translateY(-1px)' : 'scale(1)' }} />
        <span style={styles.bottomNavLabel}>{item.label}</span>
       </button> ); })}
    </nav>
   </> ); }
 return ( <><MenuOverlay /><aside style={styles.sidebar} className="alfhd-no-print">
   <div style={{ ...styles.sidebarHeader, position: 'relative' }}>
    <FahdLogo size={36} />
    <div style={{ flex: 1 }}>
     <div style={styles.sidebarBrand}>AlFhd</div>
     <div style={styles.sidebarBrandSub}>إدارة طلبات</div>
    </div>
    {visibleMenu.length > 0 && (
     <button onClick={() => setMenuOpen(true)} title="الأقسام الإدارية"
      style={{ padding: 8, borderRadius: 10, border: 'none', background: 'rgba(42,171,238,0.10)', color: '#2AABEE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Menu size={18} />
     </button>
    )}
   </div>
   <nav style={styles.sidebarNav}>
    {navItems.map((item) => { if (item.adminOnly && currentUser.role !== 'admin' && !(item.permId && (currentUser.permissions || []).includes(item.permId))) return null;
     const Icon = item.icon;
     const active = activeView === item.id;
     return ( <button
       key={item.id}
       onClick={() => setActiveView(item.id)}
       className={`alfhd-nav-item${active ? ' alfhd-bottom-nav-item-active' : ''}`}
       style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}), }}
      >
       <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
       <span>{item.label}</span>
       {active && <div style={styles.navActiveDot} />}
      </button> ); })}
   </nav>
   <div style={styles.sidebarFooter}>
    <div style={styles.userBadge}>
     <div style={styles.userAvatar}>{currentUser.name[0]}</div>
     <div style={{ flex: 1, minWidth: 0 }}>
      <div style={styles.userName}>{currentUser.name}</div>
      <div style={styles.userRole}>
       {currentUser.workspaceId ? '🔒 مساحة مستقلة' : (currentUser.role === 'admin' ? 'صلاحية كاملة' : 'صلاحية محددة')}
      </div>
     </div>
    </div>
    <button onClick={onLogout} style={styles.logoutBtn}>
     <LogOut size={16} />
     تسجيل الخروج
    </button>
   </div>
  </aside></> ); }
const AVATAR_PALETTE = ['#A78BFA', '#34D9C5', '#4ADE80', '#F45B69', '#F0A868', '#E879B9', '#5B8DEF', '#FACC15'];
function avatarColorFromName(name = '') { let hash = 0;
 for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
 return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]; }
function PlatformBadge({ platform, size = 'md' }) { const isWhatsApp = platform === 'whatsapp';
 const dim = size === 'lg' ? 18 : 17;
 return ( <div style={{ position: 'absolute', bottom: 0, left: 0, width: dim, height: dim, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
   background: isWhatsApp ? '#25D366' : '#0A8CFF', border: '2.5px solid #0A0E17', boxShadow: '0 1px 4px rgba(0,0,0,0.5)', }}>
   {isWhatsApp ? ( <svg width={dim * 0.52} height={dim * 0.52} viewBox="0 0 24 24" fill="white">
     <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.47 3.47 1.29 4.93L2 22l5.31-1.39a9.87 9.87 0 0 0 4.73 1.2h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 17.92h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.1.82.83-3.03-.2-.31a8.16 8.16 0 0 1-1.27-4.36c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.2-8.26 8.2z" />
    </svg> ) : ( <svg width={dim * 0.52} height={dim * 0.52} viewBox="0 0 24 24" fill="white">
     <path d="M12 2C6.48 2 2 6.15 2 11.27c0 2.91 1.44 5.5 3.7 7.21V22l3.38-1.86c.9.25 1.86.38 2.92.38 5.52 0 10-4.15 10-9.25S17.52 2 12 2zm1.01 12.46-2.55-2.72-4.98 2.72 5.48-5.82 2.61 2.72 4.92-2.72-5.48 5.82z" />
    </svg> )}
  </div> ); }
function ConvAvatar({ conv, size = 'md' }) { const color = avatarColorFromName(conv?.customer || '');
 const wrapStyle = size === 'lg' ? styles.convAvatarLg : styles.convAvatar;
 const [imgFailed, setImgFailed] = React.useState(false);
 React.useEffect(() => { setImgFailed(false); }, [conv?.avatarUrl]);
 const showImg = conv?.avatarUrl && !imgFailed;
 return ( <div style={{ position: 'relative', width: wrapStyle.width, height: wrapStyle.height, flexShrink: 0 }}>
   {showImg ? ( <img
     src={conv.avatarUrl}
     alt={conv.customer || ''}
     loading="lazy"
     onError={() => setImgFailed(true)}
     style={{ ...wrapStyle, objectFit: 'cover', background: '#222C42' }}
    /> ) : ( <div style={{ ...wrapStyle, background: `${color}22`, color, border: `1px solid ${color}44` }}>
     {conv?.avatar && conv.avatar !== '👤' ? conv.avatar : (conv?.customer?.[0] || '👤')}
    </div> )}
   <PlatformBadge platform={conv?.platform || 'facebook'} size={size} />
  </div> ); }
function ConversationsView({ conversations, pages, orders, setOrders, setConversations, pendingOpenConvId, clearPendingOpenConvId, onCreateOrderFromConv, onOpenOrderDetails, currentUser }) {
 const [activeTab, setActiveTab] = useState('normal');
 const [selectedPage, setSelectedPage] = useState('all');
 const [search, setSearch] = useState('');
 const [selectedConv, setSelectedConv] = useState(null);
 useEffect(() => { if (!pendingOpenConvId) return;
  const target = conversations.find((c) => c.id === pendingOpenConvId);
  if (target) { setActiveTab(target.tab);
   setSelectedConv(target);
   markConversationRead(target.id); }
  clearPendingOpenConvId?.(); }, [pendingOpenConvId, conversations]);
 const [messages, setMessages] = useState([]);
 const [loadingMsgs, setLoadingMsgs] = useState(false);
 useEffect(() => { if (!selectedConv) return;
  const fresh = conversations.find((c) => c.id === selectedConv.id);
  if (fresh && ( fresh.lastMessage !== selectedConv.lastMessage || fresh.unread !== selectedConv.unread || fresh.lastMessageTime !== selectedConv.lastMessageTime ||
   fresh.orderId !== selectedConv.orderId )) { setSelectedConv(fresh); } }, [conversations]);
 const [composerText, setComposerText] = useState('');
 const processedBookingsRef = React.useRef(new Set());
 const [sendingMsg, setSendingMsg] = useState(false);
 const [recording, setRecording] = useState(false);
 const [recSeconds, setRecSeconds] = useState(0);
 const fileInputRef = React.useRef(null);
 const mediaRecorderRef = React.useRef(null);
 const audioChunksRef = React.useRef([]);
 const scrollRef = React.useRef(null);
 const recTimerRef = React.useRef(null);
 const recCanceledRef = React.useRef(false);
 function formatRecTime(s) { const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`; }
 const markConversationRead = useCallback(async (convId) => { if (!convId) return;
  setSelectedConv((prev) => (prev?.id === convId ? { ...prev, unread: 0 } : prev));
  setConversations?.((prev) => prev.map((c) => ( c.id === convId ? { ...c, unread: 0 } : c )));
  try { await sbUpdate('alfhd_conversations', convId, { unread_count: 0, last_read_at: new Date().toISOString() }); } catch (e) { console.error('mark read error:', e); } }, [setConversations]);
 const markAllRead = useCallback(async (convList) => { const unreadOnes = convList.filter((c) => c.unread > 0);
  if (unreadOnes.length === 0) return;
  const ids = unreadOnes.map((c) => c.id);
  setConversations?.((prev) => prev.map((c) => ( ids.includes(c.id) ? { ...c, unread: 0 } : c )));
  try { await Promise.all(ids.map((id) => sbUpdate('alfhd_conversations', id, { unread_count: 0, last_read_at: new Date().toISOString() }))); } catch (e) {
   console.error('mark all read error:', e); } }, [setConversations]);
 const waPageId = useMemo(() => { const connected = pages.find((p) => p.connected);
  return connected?.id || pages[0]?.id || ''; }, [pages]);
 const convPageId = (c) => c.pageId || (c.isWhatsApp ? waPageId : null);
 // ══════════════════════════════════════════════════════════════
 //  نقل المحادثة لتبويب "بحاجة إلى موظف" — فقط عند تصعيد الذكاء
 //  نراقب سجل الردود: أي صف escalated=true ينقل محادثته
 // ══════════════════════════════════════════════════════════════
 const escalatedSeenRef = React.useRef(new Set());
 useEffect(() => {
  let cancelled = false;
  const tick = async () => {
   if (document.hidden) return;
   try {
    const since = new Date(Date.now() - 30 * 60000).toISOString();
    const rows = await sbSelect('ai_reply_log',
      `&escalated=is.true&created_at=gte.${since}` +
      '&select=id,conversation_id,escalation_reason,created_at&order=created_at.desc&limit=60');
    if (cancelled || !rows?.length) return;

    for (const r of rows) {
     if (escalatedSeenRef.current.has(r.id)) continue;
     escalatedSeenRef.current.add(r.id);
     const conv = (conversations || []).find((c) => c.id === r.conversation_id);
     if (!conv || conv.tab === 'handoff') continue;
     // ننقلها بالواجهة وبقاعدة البيانات
     setConversations?.((prev) => prev.map((c) => (
       c.id === r.conversation_id ? { ...c, tab: 'handoff', escalationReason: r.escalation_reason } : c
     )));
     try { await sbUpdate('alfhd_conversations', r.conversation_id, { tab: 'handoff' }); } catch (_e) { /* تجاهل */ }
    }
    if (escalatedSeenRef.current.size > 500) {
     escalatedSeenRef.current = new Set([...escalatedSeenRef.current].slice(-250));
    }
   } catch (_e) { /* تجاهل */ }
  };
  const t = setInterval(tick, 5000);
  tick();
  return () => { cancelled = true; clearInterval(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [conversations.length]);

 // ── فحص: محادثات فيها رقم وعنوان بلا طلب مثبّت ──
 // مهم: يشتغل فقط لما يفتح المستخدم التبويب (كسول) — مو مع كل تحديث،
 // لأن التشغيل المستمر يرسل عشرات الطلبات ويخنق الموقع.
 const [readyConvIds, setReadyConvIds] = useState(new Set());
 const [readyLoading, setReadyLoading] = useState(false);
 const readyDoneRef = React.useRef(false);
 useEffect(() => {
  if (activeTab !== 'ready' || readyDoneRef.current || readyLoading) return;
  let cancelled = false;
  readyDoneRef.current = true;
  setReadyLoading(true);
  (async () => {
   const cands = conversations.filter((c) => !c.orderId && c.tab !== 'pinned').slice(0, 80);
   const found = new Set();
   for (let i = 0; i < cands.length; i += 20) {
    if (cancelled) return;
    const batch = cands.slice(i, i + 20);
    try {
     const rows = await sbSelect('alfhd_messages',
      `&conversation_id=in.(${batch.map((c) => c.id).join(',')})&select=conversation_id,content&order=created_at.desc&limit=600`);
     const byConv = {};
     for (const r of rows || []) (byConv[r.conversation_id] = byConv[r.conversation_id] || []).push(r);
     for (const c of batch) if (convHasBookingData(c, byConv[c.id] || [])) found.add(c.id);
    } catch (_e) { /* تجاهل */ }
   }
   if (!cancelled) { setReadyConvIds(found); setReadyLoading(false); }
  })();
  return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [activeTab]);

 const filtered = useMemo(() => { const NEGLECT_MS = 30 * 86400000; // 30 يوماً
  const now = Date.now();
  return conversations.filter((c) => {
   if (activeTab === 'ready') {
    // البيانات المكتملة: نعتمد على العلامة المحسوبة (تُحدّث عند تحميل الرسائل)
    if (!readyConvIds.has(c.id)) return false;
   } else if (c.tab !== activeTab) return false;
   if (selectedPage !== 'all' && convPageId(c) !== selectedPage) return false;
   if (activeTab === 'normal' && Number(c.unread || 0) === 0) { const t = c.lastMsgTimeRaw ? new Date(c.lastMsgTimeRaw).getTime() : 0;
    if (t > 0 && (now - t) > NEGLECT_MS) return false; }
   if (search) { const q = search.trim().toLowerCase();
    const hay = [c.customer, c.lastMsg, c.customerPsid, c.orderId].filter(Boolean).join(' ').toLowerCase();
    if (!hay.includes(q)) return false; }
   return true; }).sort((a, b) => { const ta = a.lastMsgTimeRaw ? new Date(a.lastMsgTimeRaw).getTime() : 0;
   const tb = b.lastMsgTimeRaw ? new Date(b.lastMsgTimeRaw).getTime() : 0;
   return tb - ta; }); }, [conversations, activeTab, selectedPage, search, waPageId, readyConvIds]);
 const counts = useMemo(() => { const unread = { normal: 0, pinned: 0, handoff: 0, ready: readyConvIds.size };
  conversations.forEach((c) => { if (selectedPage === 'all' || convPageId(c) === selectedPage) { if (unread[c.tab] !== undefined) { if (Number(c.unread || 0) > 0) unread[c.tab] += 1; } } });
  return { unread }; }, [conversations, selectedPage, waPageId, readyConvIds]);
 const linkedOrder = selectedConv?.orderId ? orders.find((o) => o.id === selectedConv.orderId) : null;
 const [orderCardOpen, setOrderCardOpen] = useState(false);
 const [aiToast, setAiToast] = useState(null);

 // ── سبب تصعيد المحادثة المفتوحة (من سجل الردود) ──
 const [escalationReason, setEscalationReason] = useState('');
 useEffect(() => {
  let cancelled = false;
  setEscalationReason('');
  if (!selectedConv?.id || selectedConv.tab !== 'handoff') return undefined;
  (async () => {
   try {
    const rows = await sbSelect('ai_reply_log',
      `&conversation_id=eq.${selectedConv.id}&escalated=is.true` +
      '&select=escalation_reason,created_at&order=created_at.desc&limit=1');
    if (!cancelled && rows?.[0]?.escalation_reason) {
      setEscalationReason(rows[0].escalation_reason);
    }
   } catch (_e) { /* تجاهل */ }
  })();
  return () => { cancelled = true; };
 }, [selectedConv?.id, selectedConv?.tab]);
 const [globalAiBusy, setGlobalAiBusy] = useState(false);
 const HANDOFF_TRIGGERS = [ 'رح نحولك', 'سنحولك', 'سأحولك', 'سأقوم بتحويلك', 'transferred this chat', 'transfer this chat', 'Your AI agent transferred',
  'تحويل للموظف', 'تحويل إلى موظف', 'تحويل لأحد موظفينا', 'نحولك للموظف', 'تحويل المحادثة', 'handoff', 'hand off', ];
 function isHandoffMessage(text) { if (!text) return false;
  const lower = text.toLowerCase();
  return HANDOFF_TRIGGERS.some((t) => lower.includes(t.toLowerCase())); }
 async function maybeHandoffConversation(convId, messages) { const triggered = messages.some((m) => isHandoffMessage(m.content));
  if (!triggered) return;
  const conv = conversations.find((c) => c.id === convId);
  if (!conv || conv.tab === 'handoff') return;
  setConversations?.((prev) => prev.map((c) => ( c.id === convId ? { ...c, tab: 'handoff' } : c )));
  try { await sbUpdate('alfhd_conversations', convId, { tab: 'handoff' }); } catch (e) { console.error('handoff tab update error:', e); } }

 // ── التقاط رسالة "تم تثبيت طلبك" من الذكاء وإنشاء الطلب بنفس منطق الموقع ──
 // نفس البنية المستخدمة بالتثبيت اليدوي — ما نستخدم منطق جديد
 async function maybeCreateOrderFromAI(convId, messages) {
  const conv = conversations.find((c) => c.id === convId);
  if (!conv) return;
  // نلقط آخر رسالة صادرة فيها صيغة التثبيت الكاملة
  const bookingMsg = [...messages].reverse().find((m) =>
   m.direction === 'outgoing' && m.content && m.content.includes('تم تثبيت طلبك') && m.content.includes('رقم التلفون'));
  if (!bookingMsg) return;

  // الزبون ممكن يطلب أكثر من سيارة بنفس المحادثة — نسمح بطلب جديد
  // بس ما نكرر نفس رسالة التثبيت مرتين (نتذكر آخر رسالة عالجناها)
  if (processedBookingsRef.current.has(bookingMsg.id)) return;
  processedBookingsRef.current.add(bookingMsg.id);

  // تحويل الأرقام العربية للاتينية (الزبون يكتب ٠٧٧٠...)
  const t = (bookingMsg.content || '')
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
  // مهم: [ \t]* مو \s* — لأن \s تبتلع السطر الجديد وتاخذ قيمة الحقل اللي بعده
  const grab = (label) => { const m = t.match(new RegExp(label + '[ \\t]*:?[ \\t]*([^\\n]*)')); return m ? m[1].trim() : ''; };
  const carType = grab('نوع السيارة');
  const model = grab('موديل');
  const address = grab('العنوان');
  const phoneRaw = grab('رقم التلفون').replace(/\D/g, '');
  const recipient = grab('اسم المستلم');
  const priceRaw = grab('السعر الكلي').replace(/[^\d]/g, '');

  if (!/^07\d{9}$/.test(phoneRaw) || !carType || !priceRaw) return; // بيانات ناقصة — لا ننشئ

  // استنتاج المحافظة والمنطقة من العنوان
  let gov = '', area = '';
  if (address.includes('-')) {
    [gov, area] = address.split('-').map((s) => s.trim());
  } else {
    const parts = address.trim().split(/\s+/);
    gov = address.trim();
  }
  // خريطة المدن المعروفة → محافظاتها (لو الزبون كتب المدينة بس)
  const CITY_TO_GOV = {
    'الرمادي': 'الأنبار', 'رمادي': 'الأنبار', 'الفلوجة': 'الأنبار', 'فلوجة': 'الأنبار',
    'تكريت': 'صلاح الدين', 'سامراء': 'صلاح الدين',
    'الكرادة': 'بغداد', 'الاعظمية': 'بغداد', 'الكاظمية': 'بغداد', 'زيونة': 'بغداد', 'المنصور': 'بغداد', 'الدورة': 'بغداد', 'الشعلة': 'بغداد', 'الصدر': 'بغداد', 'الغزالية': 'بغداد',
    'المعقل': 'البصرة', 'الزبير': 'البصرة', 'ابو الخصيب': 'البصرة',
  };
  // لو اللي انكتب كمحافظة هو فعلاً مدينة معروفة، استنتج محافظتها واجعل الأصل منطقة
  if (CITY_TO_GOV[gov] && !area) {
    area = gov;
    gov = CITY_TO_GOV[gov];
  }

  try {
   // ── قرار: هل نستبدل طلب سابق أو ننشئ مستقل؟ ──
   // نفس الرقم + نفس العنوان → توصيل واحد: نمسح القديم وننشئ طلب مدمج/معدّل
   // رقم أو عنوان مختلف → طلب مستقل جديد
   const sameAddr = (a, b) => (a || '').replace(/\s+/g, '') === (b || '').replace(/\s+/g, '');
   const prevOrders = (orders || []).filter((o) =>
     o.conversationId === convId &&
     String(o.phone || '').replace(/\D/g, '') === phoneRaw &&
     sameAddr(o.address, address ? (area ? `${gov} - ${area}` : gov) : ''));

   // نمسح الطلبات المطابقة (نفس الرقم والعنوان) — الطلب الجديد يشملها
   for (const po of prevOrders) {
     try { await sbDelete('alfhd_orders', po.id); } catch (_e) { /* تابع */ }
   }
   if (prevOrders.length) {
     setOrders?.((prev) => prev.filter((o) => !prevOrders.some((p) => p.id === o.id)));
   }

   const payload = {
    order_no: String(Date.now()).slice(-6),
    page_id: conv.pageId || null,
    customer_name: recipient || conv.customer || 'ارضيات سيارات',
    phone: phoneRaw,
    address: area ? `${gov} - ${area}` : gov,
    governorate_name: gov || null,
    area: area || null,
    items: `${carType}${model ? ' - موديل ' + model : ''}`,
    order_type: carType,
    total: Number(priceRaw),
    status: 'pending',
    stage: 'ready',
    order_date: new Date().toISOString().slice(0, 10),
    fahd_ref: `FHD-${Math.floor(10000 + Math.random() * 89999)}`,
    conversation_id: convId,
    source: 'ai',
    platform: (conv.customerPsid || '').startsWith('wa_') ? 'whatsapp' : 'facebook',
   };
   const created = await sbInsert('alfhd_orders', payload);
   const orderId = created?.[0]?.id;
   if (orderId) {
    // نربط آخر طلب بالمحادثة (الطلبات السابقة تبقى محفوظة بقسم الطلبات)
    await sbUpdate('alfhd_conversations', convId, { order_id: orderId, tab: 'pinned' });
    setConversations?.((prev) => prev.map((c) => (c.id === convId ? { ...c, orderId, tab: 'pinned' } : c)));
   }
  } catch (e) { console.error('AI order creation error:', e); }
 }
 const lastMsgTimeRef = React.useRef(null); // آخر وقت رسالة (للجلب التزايدي)
 const loadMessages = useCallback(async (convId, isCancelled) => { if (!convId) return;
  try { const dbMsgs = await sbSelect('alfhd_messages', `&conversation_id=eq.${convId}&order=created_at.desc&limit=60`);
   if (isCancelled && isCancelled()) return;
   const mapped = (dbMsgs || []).map(mapMessageFromDb).reverse(); // نعيد الترتيب للأقدم أولاً
   lastMsgTimeRef.current = mapped.length ? mapped[mapped.length - 1].createdAt : null;
   setMessages(mapped);
   await maybeHandoffConversation(convId, mapped);
   await maybeCreateOrderFromAI(convId, mapped); } catch (e) { console.error('load messages error:', e); } }, [conversations]);
 const loadNewMessages = useCallback(async (convId, isCancelled) => { if (!convId) return;
  try { const since = lastMsgTimeRef.current;
   if (!since) return loadMessages(convId, isCancelled);
   const q = `&conversation_id=eq.${convId}&created_at=gt.${encodeURIComponent(since)}&order=created_at.asc&limit=40`;
   const dbMsgs = await sbSelect('alfhd_messages', q);
   if (isCancelled && isCancelled()) return;
   if (!dbMsgs || dbMsgs.length === 0) return; // لا جديد — لا إعادة رسم
   const fresh = dbMsgs.map(mapMessageFromDb);
   lastMsgTimeRef.current = fresh[fresh.length - 1].createdAt;
   setMessages((prev) => { const seen = new Set(prev.map((m) => m.id));
    const add = fresh.filter((m) => !seen.has(m.id));
    return add.length ? [...prev, ...add] : prev; });
   await maybeHandoffConversation(convId, fresh);
   await maybeCreateOrderFromAI(convId, fresh); } catch (e) { console.error('load new messages error:', e); } }, [loadMessages]);
 useEffect(() => { if (!selectedConv) { setMessages([]); return undefined; }
  let cancelled = false;
  const convId = selectedConv.id;
  setLoadingMsgs(true);
  lastMsgTimeRef.current = null; // محادثة جديدة — أعد الضبط
  loadMessages(convId, () => cancelled).finally(() => { if (!cancelled) setLoadingMsgs(false); });
  markConversationRead(convId);
  const isWA = selectedConv.isWhatsApp;
  const refreshOpenChat = async () => { if (cancelled) return;
   if (!isWA) { try { await fetch(FB_POLL_FUNCTION_URL, { method: 'GET', headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY } }); } catch (_e) { /* تجاهل */ } }
   if (!cancelled) await loadNewMessages(convId, () => cancelled); };
  const interval = setInterval(refreshOpenChat, isWA ? 1200 : 1200);
  // فوري: لو وصلت رسالة حقيقية (Realtime)، نحدّث حالاً بدل ما ننتظر الدورة
  window.addEventListener('fhd-realtime-msg', refreshOpenChat);
  return () => { cancelled = true; clearInterval(interval); window.removeEventListener('fhd-realtime-msg', refreshOpenChat); }; }, [selectedConv?.id]);
 useEffect(() => { const el = scrollRef.current;
  if (!el) return;
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  if (nearBottom) el.scrollTop = el.scrollHeight; }, [messages]);
 function touchConvLocally(convId, lastMessage) { if (!setConversations) return;
  setConversations((prev) => prev.map((c) => ( c.id === convId ? { ...c, lastMsg: lastMessage, time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) } : c ))); }
 async function uploadToStorage(file, ext) { const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/chat-media/${filename}`, { method: 'POST', headers: { 'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true', }, body: file, });
  if (!res.ok) { const body = await res.text().catch(() => '');
   const isBucketMissing = res.status === 404 || /bucket not found/i.test(body);
   if (isBucketMissing) { throw new Error('مخزن الملفات غير موجود. أنشئ Bucket باسم chat-media من Supabase ← Storage واجعله Public، ثم أعد المحاولة.'); }
   throw new Error(`فشل رفع الملف (${res.status}): ${body || 'تحقق من إعدادات مخزن chat-media'}`); }
  return `${SUPABASE_URL}/storage/v1/object/public/chat-media/${filename}`; }
 async function sendToFacebook(payload) { const res = await fetch(FB_SEND_FUNCTION_URL, { method: 'POST', headers: { 'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY, }, body: JSON.stringify(payload), });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) { throw new Error(data?.error || `فشل الإرسال: ${res.status}`); }
  return data; }
 async function sendToWhatsApp(conv, { text, imageUrl, audioUrl } = {}) { const phone = conv.customerPsid?.replace('wa_', '') || conv.phone;
  if (!phone) throw new Error('رقم واتساب غير متوفر لهذه المحادثة');
  const pageId = conv.pageId || null; // جلسة الصفحة المربوطة
  let endpoint = '/send';
  let body = { phone, message: text, pageId };
  if (imageUrl) { endpoint = '/send-image';
   body = { phone, imageUrl, caption: text || '', pageId }; } else if (audioUrl) { endpoint = '/send-audio';
   body = { phone, audioUrl, pageId }; }
  const res = await fetch(`${WA_BRIDGE_URL}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), });
  if (!res.ok) { const err = await res.json().catch(() => ({}));
   throw new Error(err.error || `فشل إرسال واتساب (${res.status})`); }
  return res.json().catch(() => ({})); }
 async function handleSendText() { const text = composerText.trim();
  if (!text || !selectedConv || sendingMsg) return;
  setComposerText('');
  setSendingMsg(true);
  const nowLabel = new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
  setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, direction: 'outgoing', content: text, type: 'text', mediaUrl: null, time: nowLabel }]);
  touchConvLocally(selectedConv.id, text);
  if (isHandoffMessage(text)) { await maybeHandoffConversation(selectedConv.id, [{ content: text }]); }
  try { if (selectedConv.isWhatsApp) { await sendToWhatsApp(selectedConv, { text });
    await sbInsert('alfhd_messages', { conversation_id: selectedConv.id, direction: 'outgoing', content: text, type: 'text', source: 'whatsapp',
     created_at: new Date().toISOString(), }); } else { await sendToFacebook({ pageId: selectedConv.pageId, conversationId: selectedConv.id, recipientPsid: selectedConv.customerPsid, text, }); }
   await loadMessages(selectedConv.id); } catch (e) { console.error('send text error:', e);
   setComposerText(text);
   setMessages((prev) => prev.filter((m) => !(typeof m.id === 'string' && m.id.startsWith('temp-') && m.content === text)));
   alert(`تعذّر إرسال الرسالة:\n${e?.message || 'خطأ غير معروف'}`); } finally { setSendingMsg(false); } }
 async function handlePickImage(e) { const file = e.target.files?.[0];
  e.target.value = '';
  if (!file || !selectedConv) return;
  setSendingMsg(true);
  try { const url = await uploadToStorage(file, (file.name.split('.').pop() || 'jpg').toLowerCase());
   setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, direction: 'outgoing', content: null, type: 'image', mediaUrl: url, time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) }]);
   touchConvLocally(selectedConv.id, '📷 صورة');
   if (selectedConv.isWhatsApp) { await sendToWhatsApp(selectedConv, { imageUrl: url });
    await sbInsert('alfhd_messages', { conversation_id: selectedConv.id, direction: 'outgoing', content: null, type: 'image', media_url: url,
     source: 'whatsapp', created_at: new Date().toISOString(), }); } else { await sendToFacebook({ pageId: selectedConv.pageId, conversationId: selectedConv.id,
     recipientPsid: selectedConv.customerPsid, mediaUrl: url, mediaType: 'image', }); }
   await loadMessages(selectedConv.id); } catch (e) { console.error('send image error:', e);
   alert(`تعذّر إرسال الصورة:\n${e?.message || 'خطأ غير معروف'}`); } finally { setSendingMsg(false); } }
 async function startRecording() { if (!selectedConv) return;
  try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
   const recorder = new MediaRecorder(stream);
   audioChunksRef.current = [];
   recCanceledRef.current = false;
   recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
   recorder.onstop = async () => { stream.getTracks().forEach((t) => t.stop());
    if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null; }
    if (recCanceledRef.current) { setRecSeconds(0); return; }
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    setRecSeconds(0);
    if (blob.size === 0) return;
    setSendingMsg(true);
    try { const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
     const url = await uploadToStorage(file, 'webm');
     setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, direction: 'outgoing', content: null, type: 'audio', mediaUrl: url, time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) }]);
     touchConvLocally(selectedConv.id, '🎤 رسالة صوتية');
     if (selectedConv.isWhatsApp) { await sendToWhatsApp(selectedConv, { audioUrl: url });
      await sbInsert('alfhd_messages', { conversation_id: selectedConv.id, direction: 'outgoing', content: null, type: 'audio', media_url: url,
       source: 'whatsapp', created_at: new Date().toISOString(), }); } else { await sendToFacebook({ pageId: selectedConv.pageId, conversationId: selectedConv.id,
       recipientPsid: selectedConv.customerPsid, mediaUrl: url, mediaType: 'audio', }); }
     await loadMessages(selectedConv.id); } catch (e) { console.error('send audio error:', e);
     alert(`تعذّر إرسال التسجيل الصوتي:\n${e?.message || 'خطأ غير معروف'}`); } finally { setSendingMsg(false); } };
   recorder.start();
   mediaRecorderRef.current = recorder;
   setRecording(true);
   setRecSeconds(0);
   recTimerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000); } catch (e) { alert('تعذّر الوصول إلى الميكروفون، تأكد من السماح بالإذن من المتصفح'); } }
 function stopRecording() { recCanceledRef.current = false;
  mediaRecorderRef.current?.stop();
  setRecording(false); }
 function cancelRecording() { recCanceledRef.current = true;
  mediaRecorderRef.current?.stop();
  setRecording(false);
  if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null; }
  setRecSeconds(0); }
 const TG_PANEL = '#17212B';
 const TG_INPUT = '#242F3D';
 const TG_BLUE  = '#2AABEE';
 const TG_DIM   = '#8FA0B5';
 const TG_SUB   = '#8B9AB3';
 const TG_TEXT  = '#F5F5F5';
 const TG_RED   = '#E53935';
 const TG_BDR   = 'rgba(255,255,255,0.07)';
 const tabLabels = { normal: 'اعتيادية', pinned: 'مثبّت بها طلب', handoff: 'بحاجة إلى موظف', ready: 'بيانات كاملة' };
 const tabIcons  = { normal: MessageSquare, pinned: Pin, ready: CheckCircle2, handoff: AlertCircle };
 return ( /* ─── حاوية المحادثات ─── */
  <div style={{ display: 'flex', overflow: 'hidden', direction: 'rtl', background: '#0E1621', width: '100%', height: '100%', }} className="alfhd-conv-fullscreen">
   {/* ══════════════ قائمة المحادثات (يمين) ══════════════ */}
   <div
    style={{ width: 340, minWidth: 280, maxWidth: 360, display: 'flex', flexDirection: 'column', background: TG_PANEL, borderLeft: `1px solid ${TG_BDR}`,
     height: '100%', overflow: 'hidden', flexShrink: 0, }}
    className={`alfhd-conv-list${selectedConv ? ' alfhd-conv-list-hidden-mobile' : ''}`}
   >
    {/* ── رأس القائمة: شعار + فلتر صفحات ── */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 12px', borderBottom: `1px solid ${TG_BDR}`, flexShrink: 0, }}>
     {/* شعار */}
     <div style={{ fontSize: 15, fontWeight: 800, color: TG_TEXT, letterSpacing: '-0.01em', flexShrink: 0 }}>AlFhd</div>
     {/* فلتر الصفحات — في الوسط */}
     <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: TG_INPUT, borderRadius: 22, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.07)',
       boxShadow: '0 2px 8px rgba(0,0,0,0.3)', }}>
       <Facebook size={13} color={TG_BLUE} />
       <select aria-label="خيار"
        value={selectedPage}
        onChange={(e) => setSelectedPage(e.target.value)}
        style={{ background: 'transparent', border: 'none', color: TG_TEXT, fontSize: 12, fontWeight: 600, appearance: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif", }}
       >
        <option value="all">كل الصفحات ({pages.length})</option>
        {pages.map((p) => ( <option key={p.id} value={p.id}>{p.name}</option> ))}
       </select>
       <ChevronDown size={12} color={TG_DIM} />
      </div>
     </div>
     {/* ── زر الرد الآلي العام (مربّع) — بصف البحث ── */}
     {(currentUser?.role === 'admin' || (currentUser?.permissions || []).includes('ai_manage')) && (() => {
       const activeN = conversations.filter((c) => c.ai_mode === 'active').length;
       const allOn = activeN > 0 && activeN === conversations.length;
       return (
        <button
         onClick={async () => {
           const next = allOn ? 'paused' : 'active';
           // ملاحظة: الواجهة تعرض أحدث 500 محادثة، بس التحديث يطبّق على
           // كل المحادثات بقاعدة البيانات مهما كان عددها.
           const msg = allOn
             ? '⚠️ إيقاف الرد الآلي بكل المحادثات (كل النظام)؟\nهذا يوقف الذكاء عن الكل دفعة وحدة.'
             : `⚠️ تشغيل الرد الآلي بكل المحادثات (كل النظام)؟\nهذا يشغّل الذكاء للكل دفعة وحدة — مفعّل حالياً بـ${activeN}.`;
           if (!confirm(msg)) return;
           setConversations?.((prev) => prev.map((c) => ({ ...c, ai_mode: next })));
           setGlobalAiBusy(true);
           try {
             await fetch(`${SUPABASE_URL}/rest/v1/alfhd_conversations?id=not.is.null`, {
               method: 'PATCH', headers: { ...sbHeaders, Prefer: 'return=minimal' }, body: JSON.stringify({ ai_mode: next }),
             });
             setAiToast(next === 'active' ? `✓ تشغيل الكل (${conversations.length})` : '✓ إيقاف الكل');
             setTimeout(() => setAiToast(null), 2000);
           } catch (e) { alert('فشل التغيير العام: ' + e.message); }
           setGlobalAiBusy(false);
         }}
         disabled={globalAiBusy}
         title={`زر "الكل" — يشغّل/يوقف الذكاء بجميع المحادثات دفعة وحدة (مو محادثة وحدة). مفعّل حالياً بـ${activeN} محادثة.`}
         style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4, height: 44, padding: '0 10px', borderRadius: 12, flexShrink: 0,
          background: activeN > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(242,80,80,0.10)',
          border: `1px solid ${activeN > 0 ? 'rgba(34,197,94,0.35)' : 'rgba(242,80,80,0.28)'}`,
          color: activeN > 0 ? '#22C55E' : '#F25050',
          cursor: 'pointer' }}
        >
         <Bot size={17} />
         {/* نص "الكل" ثابت وظاهر دايماً — حتى ما ينلخبط مع زر المحادثة المفردة */}
         <span style={{ fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>الكل</span>
         <span style={{ position: 'relative', minWidth: 20, height: 17, padding: '0 4px',
           borderRadius: 20, background: activeN > 0 ? '#22C55E' : '#F25050', color: '#fff',
           fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
           lineHeight: 1 }}>
          {globalAiBusy ? '…' : activeN}
         </span>
        </button>
       );
     })()}
     {/* أيقونة البحث */}
     <button
      aria-label="بحث"
      onClick={() => {/* toggle search */}}
      style={{ width: 44, height: 44, borderRadius: '50%', background: 'transparent', border: 'none', color: TG_SUB, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
     >
      <Search size={17} />
     </button>
    </div>
    {/* ── بحث ── */}
    <div style={{ padding: '8px 8px 4px', flexShrink: 0 }}>
     <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: TG_INPUT, borderRadius: 20, padding: '8px 12px', }}>
      <Search size={14} color={TG_DIM} />
      <input
       placeholder="بحث باسم العميل..."
       value={search}
       onChange={(e) => setSearch(e.target.value)}
       style={{ background: 'transparent', border: 'none', color: TG_TEXT, fontSize: 13, width: '100%', fontFamily: "'Cairo', sans-serif" }}
      />
     </div>
    </div>
    {/* ── تبويبات الثلاثة — أفقية متساوية ── */}
    <div style={{ display: 'flex', flexShrink: 0, borderBottom: `1px solid ${TG_BDR}`, padding: '8px 8px 0', gap: 4, }}>
     {CONV_TABS.map((tab) => { const Icon = tabIcons[tab.id] || MessageSquare;
      const active = activeTab === tab.id;
      const unreadCount = counts.unread[tab.id] || 0;
      return ( <button
        key={tab.id}
        onClick={() => { setActiveTab(tab.id); setSelectedConv(null); }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px 8px', background: 'transparent', border: 'none',
         borderBottom: active ? `2px solid ${TG_BLUE}` : '2px solid transparent', color: active ? TG_BLUE : TG_DIM, fontSize: 12, fontWeight: 700, transition: 'all 0.15s ease',
         position: 'relative', cursor: 'pointer', }}
       >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <Icon size={17} strokeWidth={active ? 2.4 : 1.8} />
         {/* عداد الغير مقروء فقط — أحمر */}
         {unreadCount > 0 && ( <span style={{ position: 'absolute', top: -7, right: -10, minWidth: 16, height: 16, padding: '0 4px',
           borderRadius: 20, background: '#E53935', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
           border: `2px solid #17212B`, lineHeight: 1, }}>
           {unreadCount > 99 ? '99+' : unreadCount}
          </span> )}
        </div>
        <span style={{ fontSize: 12, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', padding: '0 2px' }}>
         {tabLabels[tab.id]}
        </span>
        {/* لا يوجد عدد إجمالي — فقط الأحمر للغير مقروء */}
       </button> ); })}
    </div>
    {/* ── قائمة المحادثات ── */}
    {/* minHeight:0 إلزامي — بدونه العنصر يتمدد بدل ما يتقلّص ويتمرر (بق فلكسبوكس) */}
    <div className="alfhd-conv-list-scroll" style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
     {/* زر تعليم الكل كمقروء */}
     {filtered.reduce((s, c) => s + Number(c.unread || 0), 0) > 0 && ( <button
       onClick={() => markAllRead(filtered)}
       style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '8px', background: 'rgba(42,171,238,0.07)',
        border: 'none', color: TG_BLUE, fontSize: 12, fontWeight: 600, }}
      >
       <CheckCircle2 size={13} />
       تعليم الكل كمقروء ({filtered.reduce((s, c) => s + Number(c.unread || 0), 0)})
      </button> )}
     {filtered.length === 0 ? ( <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '44px 20px', color: TG_DIM, fontSize: 13 }}>
       <MessageSquare size={32} color={TG_DIM} />
       <p>لا توجد محادثات هنا</p>
      </div> ) : ( filtered.map((c) => { const isActive = selectedConv?.id === c.id;
       const hasUnread = c.unread > 0;
       return ( <button
         key={c.id}
         onClick={() => { setSelectedConv(c); markConversationRead(c.id); }}
         className="alfhd-conv-item"
         style={{ display: 'flex', gap: 12, padding: '12px 16px', width: '100%', background: 'transparent', border: 'none',
          borderRight: isActive ? `3px solid ${TG_BLUE}` : '3px solid transparent', borderRadius: 0, textAlign: 'right', alignItems: 'center',
          backgroundColor: isActive ? 'rgba(42,171,238,0.13)' : 'transparent', transition: 'background 0.12s ease', minHeight: 72, }}
        >
         {/* أفاتار أكبر */}
         <div style={{ flexShrink: 0 }}>
          <ConvAvatar conv={c} size="lg" />
         </div>
         {/* المحتوى */}
         <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
          {/* السطر الأول: الاسم + الوقت */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
           <span style={{ fontSize: 14, fontWeight: hasUnread ? 800 : 600, color: TG_TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: 'calc(100% - 60px)', }}>{c.customer}</span>
           <span style={{ fontSize: 12, color: hasUnread ? TG_BLUE : TG_DIM, flexShrink: 0, fontWeight: hasUnread ? 700 : 400, }}>{c.time}</span>
          </div>
          {/* السطر الثاني: آخر رسالة + عداد */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
           <span style={{ fontSize: 12.5, color: hasUnread ? '#A8B8CC' : TG_SUB, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            fontWeight: hasUnread ? 500 : 400, }}>{c.lastMsg || 'لا توجد رسائل'}</span>
           {/* عداد الغير مقروء — أحمر واضح */}
           {hasUnread && ( <span style={{ background: '#E53935', color: '#fff', borderRadius: 20, fontSize: 12, fontWeight: 800, padding: '2px 8px', minWidth: 20, height: 20,
             display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(229,57,53,0.4)', }}>
             {c.unread > 99 ? '99+' : c.unread}
            </span> )}
          </div>
          {/* طلب مثبّت — صغير تحت */}
          {c.orderId && ( <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: TG_BLUE, fontWeight: 600,
            background: 'rgba(42,171,238,0.10)', borderRadius: 10, padding: '2px 8px', }}>
            📦 طلب مثبّت
           </div> )}
         </div>
        </button> ); }) )}
    </div>
   </div>
   {/* ══════════════ منطقة المحادثة (يسار) ══════════════ */}
   <div
    style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0E1621', height: '100%', overflow: 'hidden', minWidth: 0, }}
    className={`alfhd-conv-detail${selectedConv ? ' alfhd-conv-detail-active-mobile' : ' alfhd-conv-detail-empty'}`}
   >
    {selectedConv ? ( <>
      {/* ── هيدر المحادثة ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${TG_BDR}`, background: TG_PANEL, flexShrink: 0,
      }} className="alfhd-chat-detail-header">
       <button
        onClick={() => setSelectedConv(null)}
        style={{ display: 'none', width: 44, height: 44, borderRadius: 11, background: TG_INPUT, border: 'none', color: TG_SUB, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        className="alfhd-conv-back-btn"
       >
        <ArrowRight size={18} />
       </button>
       <ConvAvatar conv={selectedConv} size="lg" />
       <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: TG_TEXT }}>{selectedConv.customer}</div>
        <div style={{ fontSize: 12, color: TG_DIM, fontWeight: 500 }}>
         {pages.find((p) => p.id === convPageId(selectedConv))?.name}
        </div>
       </div>
       {(currentUser?.role === 'admin' || (currentUser?.permissions || []).includes('ai_manage')) && (
        <button
         onClick={() => {
           const cur = selectedConv.ai_mode || 'paused';
           const next = cur === 'active' ? 'paused' : 'active';
           // تحديث فوري بالواجهة — بدون انتظار السيرفر
           setSelectedConv((c) => (c ? { ...c, ai_mode: next } : c));
           setConversations?.((prev) => prev.map((c) => (c.id === selectedConv.id ? { ...c, ai_mode: next } : c)));
           setAiToast(next === 'paused' ? 'تم إيقاف الرد الآلي' : 'تم تشغيل الرد الآلي');
           setTimeout(() => setAiToast(null), 1800);
           // الحفظ + تحقق فعلي إنه انحفظ بقاعدة البيانات
           (async () => {
             const convId = selectedConv.id;
             try {
               await sbUpdate('alfhd_conversations', convId, { ai_mode: next });
               // نقرأ من قاعدة البيانات ونتأكد — بلا هذا ما نعرف إذا انحفظ فعلاً
               const [row] = await sbSelect('alfhd_conversations', `&id=eq.${convId}&select=ai_mode`);
               if (!row || row.ai_mode !== next) {
                 throw new Error('ما انحفظ بقاعدة البيانات (تحقق من الصلاحيات)');
               }
               setAiToast(next === 'active' ? '✓ انحفظ — الذكاء يرد بهذي المحادثة' : '✓ انحفظ — الرد متوقف هنا');
               setTimeout(() => setAiToast(null), 2200);
             } catch (e) {
               setSelectedConv((c) => (c ? { ...c, ai_mode: cur } : c));
               setConversations?.((prev) => prev.map((c) => (c.id === convId ? { ...c, ai_mode: cur } : c)));
               setAiToast('✗ فشل: ' + (e.message || 'خطأ غير معروف'));
               setTimeout(() => setAiToast(null), 4000);
             }
           })();
         }}
         title="تشغيل / إيقاف الرد الآلي بهذي المحادثة"
         style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 8px', border: 'none', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0, cursor: 'pointer', transition: 'all .15s',
          background: selectedConv.ai_mode === 'active' ? 'rgba(34,197,94,0.14)' : 'rgba(242,80,80,0.12)',
          color: selectedConv.ai_mode === 'active' ? '#22C55E' : '#F25050' }}
        >
         <Bot size={14} />
         <span className="alfhd-ai-btn-label">
          {selectedConv.ai_mode === 'active' ? 'الذكاء فعّال' : 'الذكاء متوقف'}
         </span>
        </button>
       )}
       {!selectedConv.orderId && ( <button
         onClick={() => onCreateOrderFromConv?.(selectedConv)}
         style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', background: 'rgba(42,171,238,0.10)', border: 'none', borderRadius: 20,
          color: TG_BLUE, fontSize: 12, fontWeight: 700, flexShrink: 0, }}
        >
         <Pin size={13} /> تثبيت طلب
        </button> )}
      </div>
      {/* ── كرت الطلب المثبّت (قابل للطي — مطوي افتراضياً حتى ما يغطي المحادثة) ── */}
      {linkedOrder && ( <div style={{ background: 'rgba(42,171,238,0.06)', borderBottom: `1px solid rgba(42,171,238,0.15)`, padding: orderCardOpen ? '10px 16px' : '7px 16px', flexShrink: 0, }} className="alfhd-linked-order">
        <button
         onClick={() => setOrderCardOpen((v) => !v)}
         style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'transparent', border: 'none', padding: 0, fontSize: 12, fontWeight: 700, color: TG_BLUE, marginBottom: orderCardOpen ? 8 : 0, cursor: 'pointer' }}
        >
         <Pin size={13} color={TG_BLUE} />
         <span>طلب مثبّت #{linkedOrder.orderNo}</span>
         <span style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {!orderCardOpen && <span style={{ fontSize: 12, color: TG_BLUE, fontWeight: 700 }}>{linkedOrder.total.toLocaleString()} د.ع</span>}
          <ChevronDown size={14} style={{ transform: orderCardOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
         </span>
        </button>
        {orderCardOpen && (<>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: TG_DIM }}>رقم الطلب</span>
          <span style={{ fontSize: 12.5, color: TG_TEXT, fontWeight: 600 }}>#{linkedOrder.orderNo}</span>
         </div>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: TG_DIM }}>مرحلة الطلب</span>
          <OrderStagePill order={linkedOrder} />
         </div>
         {linkedOrder.stage === 'delivery' && ( <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <span style={{ fontSize: 12, color: TG_DIM }}>حالة التوصيل</span>
           <StatusPill status={linkedOrder.status} />
          </div> )}
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: TG_DIM }}>المبلغ</span>
          <span style={{ fontSize: 12.5, color: TG_BLUE, fontWeight: 700 }}>{linkedOrder.total.toLocaleString()} د.ع</span>
         </div>
        </div>
        <button onClick={() => onOpenOrderDetails?.(linkedOrder)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 8, padding: '8px', background: 'rgba(42,171,238,0.10)', border: 'none', borderRadius: 9, color: TG_BLUE, fontSize: 12, fontWeight: 700 }}>
         <Eye size={13} /> عرض تفاصيل الطلب
        </button>
        </>)}
       </div> )}
      {/* ── منطقة الرسائل ── */}
      <div
       style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', padding: '16px 16px', background: '#0E1621', }}
       ref={scrollRef}
       className="alfhd-chat-scroll"
      >
       {loadingMsgs ? ( <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
         <RefreshCw size={22} color={TG_DIM} style={{ animation: 'spin 1s linear infinite' }} />
        </div> ) : messages.length === 0 ? ( <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, color: TG_DIM }}>
         <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(42,171,238,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquare size={32} color="#2AABEE" strokeWidth={1.5} />
         </div>
         <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TG_SUB, marginBottom: 4 }}>ابدأ المحادثة</div>
          <p style={{ fontSize: 12.5, color: TG_DIM, margin: 0 }}>ما فيه رسائل بعد — اكتب أول رسالة</p>
         </div>
        </div> ) : ( messages.map((m, idx) => { const dayLabel = (() => { if (!m.createdAt) return idx === 0 ? 'اليوم' : null;
          const d = new Date(m.createdAt);
          const prev = idx > 0 ? messages[idx - 1].createdAt : null;
          const sameDay = prev && new Date(prev).toDateString() === d.toDateString();
          if (sameDay) return null;
          const today = new Date(); const yest = new Date(); yest.setDate(today.getDate() - 1);
          if (d.toDateString() === today.toDateString()) return 'اليوم';
          if (d.toDateString() === yest.toDateString()) return 'أمس';
          return d.toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long' }); })();
         const prevM = idx > 0 ? messages[idx - 1] : null;
         const grouped = prevM && prevM.direction === m.direction && !dayLabel && m.createdAt && prevM.createdAt && (new Date(m.createdAt) - new Date(prevM.createdAt)) < 120000;
         return ( <React.Fragment key={m.id}>
          {dayLabel && (
           <div style={{ alignSelf: 'center', margin: idx === 0 ? '4px 0 10px' : '12px 0 10px', padding: '4px 12px', borderRadius: 999, background: 'rgba(23,33,43,0.88)', backdropFilter: 'blur(8px)', color: TG_SUB, fontSize: 12, fontWeight: 700 }}>
            {dayLabel}
           </div> )}
          <div
           className="alfhd-chat-bubble-row alfhd-msg-row"
           style={{ display: 'flex', justifyContent: m.direction === 'outgoing' ? 'flex-end' : 'flex-start', marginBottom: grouped ? 2 : 6, width: '100%', minWidth: 0 }}
          >
           <div style={m.direction === 'outgoing' ? styles.msgBubbleOut : styles.msgBubbleIn}>
            {m.type === 'image' && m.mediaUrl && <img src={m.mediaUrl} alt="" style={styles.msgImage} onClick={() => window.open(m.mediaUrl, '_blank')} onError={(e)=>{e.target.style.display='none';}} />}
            {m.type === 'video' && m.mediaUrl && <video controls src={m.mediaUrl} style={styles.msgImage} />}
            {m.type === 'audio' && m.mediaUrl && <audio controls src={m.mediaUrl} style={styles.msgAudio} />}
            {(m.type === 'file' || m.type === 'document' || (m.mediaUrl && !['image','video','audio','text'].includes(m.type))) && m.mediaUrl && (
             <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer" download style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', textDecoration: 'none', color: 'inherit', minWidth: 180 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(42,171,238,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={19} color="#2AABEE" /></div>
              <div style={{ minWidth: 0, flex: 1 }}>
               <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.fileName || m.content || 'ملف مرفق'}</div>
               <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>اضغط للفتح أو التحميل</div>
              </div>
              <Download size={16} style={{ opacity: 0.7, flexShrink: 0 }} />
             </a>
            )}
            {m.content && m.type !== 'file' && m.type !== 'document' && <div style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{m.content}</div>}
            <div style={styles.msgTime}>{m.time}{m.direction === 'outgoing' ? ' ✓✓' : ''}</div>
           </div>
          </div>
         </React.Fragment> ); }) )}
      </div>
      {/* ── رسالة تأكيد فورية ── */}
      {aiToast && (
       <div style={{ position: 'absolute', bottom: 78, left: '50%', transform: 'translateX(-50%)', zIndex: 40, padding: '8px 20px', borderRadius: 22, background: 'rgba(19,27,38,0.96)', border: `1px solid ${TG_BDR}`, color: TG_TEXT, fontSize: 12.5, fontWeight: 700, boxShadow: '0 6px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
        {aiToast}
       </div>
      )}
      {/* ── شريط التصعيد: السبب + زر إرجاع الذكاء ── */}
      {selectedConv.tab === 'handoff' && (
       <div style={{ padding: '10px 16px', background: 'rgba(245,158,11,0.09)',
         borderTop: '1px solid rgba(245,158,11,0.28)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
         <AlertCircle size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
         <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: '#F59E0B', fontWeight: 800 }}>
           هذي المحادثة بحاجة إلى موظف
          </div>
          <div style={{ fontSize: 12, color: '#C9A227', marginTop: 3, lineHeight: 1.7 }}>
           {escalationReason || 'الذكاء صعّدها — افتح سجل الردود لمعرفة السبب'}
          </div>
         </div>
         <button
          onClick={async () => {
            const cid = selectedConv.id;
            setSelectedConv((c) => (c ? { ...c, tab: 'normal', ai_mode: 'active' } : c));
            setConversations?.((prev) => prev.map((c) => (
              c.id === cid ? { ...c, tab: 'normal', ai_mode: 'active' } : c
            )));
            try {
              await sbUpdate('alfhd_conversations', cid, { tab: 'normal', ai_mode: 'active' });
              const [row] = await sbSelect('alfhd_conversations', `&id=eq.${cid}&select=tab,ai_mode`);
              if (!row || row.tab !== 'normal' || row.ai_mode !== 'active') {
                throw new Error('ما انحفظ بقاعدة البيانات');
              }
              setAiToast('✓ رجع الذكاء — المحادثة عادت للاعتيادية');
              setTimeout(() => setAiToast(null), 2400);
            } catch (e) {
              setSelectedConv((c) => (c ? { ...c, tab: 'handoff' } : c));
              setConversations?.((prev) => prev.map((c) => (
                c.id === cid ? { ...c, tab: 'handoff' } : c
              )));
              setAiToast('✗ فشل الإرجاع: ' + (e.message || ''));
              setTimeout(() => setAiToast(null), 4000);
            }
          }}
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 10, minHeight: 44,
            background: 'rgba(34,197,94,0.14)', border: '1px solid rgba(34,197,94,0.4)',
            color: '#22C55E', fontSize: 12, fontWeight: 800, cursor: 'pointer',
            fontFamily: 'inherit' }}
         >
          <Bot size={15} />
          إرجاع الذكاء
         </button>
        </div>
       </div>
      )}

      {/* ── شريط حالة الذكاء الصناعي ── */}
      {selectedConv.tab !== 'handoff' && selectedConv.ai_mode === 'active' && (
       <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(34,197,94,0.07)', borderTop: '1px solid rgba(34,197,94,0.15)', flexShrink: 0 }}>
        <Bot size={14} color="#22C55E" />
        <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 700 }}>الذكاء الصناعي يرد تلقائياً على هذي المحادثة</span>
       </div>
      )}
      {/* ── شريط الكتابة ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: TG_PANEL, borderTop: `1px solid ${TG_BDR}`, padding: '8px 16px', flexShrink: 0, }} className="alfhd-composer-bar">
       <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePickImage} style={{ display: 'none' }} />
       {recording ? ( <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '4px 4px' }}>
         <button style={{ width: 44, height: 44, borderRadius: 11, background: 'rgba(242,80,80,0.09)', border: 'none', color: TG_RED, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={cancelRecording}><Trash2 size={17} /></button>
         <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: TG_RED }} className="alfhd-rec-dot" />
          <span style={{ fontSize: 14, fontWeight: 800, color: TG_TEXT, fontFamily: 'monospace' }}>{formatRecTime(recSeconds)}</span>
          <span style={{ fontSize: 12, color: TG_DIM }}>جارٍ التسجيل…</span>
         </div>
         <button style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg,#2AABEE,#229ED9)`, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={stopRecording}><Send size={16} /></button>
        </div> ) : ( <>
         <button style={{ width: 34, height: 34, borderRadius: 9, background: 'transparent', border: 'none', color: TG_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => fileInputRef.current?.click()} disabled={sendingMsg}><Image size={18} /></button>
         <button style={{ width: 34, height: 34, borderRadius: 9, background: 'transparent', border: 'none', color: TG_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={startRecording} disabled={sendingMsg}><Mic size={18} /></button>
         <input
          value={composerText}
          onChange={(e) => setComposerText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSendText(); }}
          placeholder="اكتب رسالة..."
          style={{ flex: 1, background: 'transparent', border: 'none', color: TG_TEXT, fontSize: 13.5, padding: '4px 4px', fontFamily: "'Cairo', sans-serif" }}
          disabled={sendingMsg}
         />
         <button
          style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: composerText.trim() ? `linear-gradient(135deg,#2AABEE,#229ED9)` : TG_INPUT, border: 'none', color: composerText.trim() ? '#fff' : TG_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
          onClick={handleSendText}
          disabled={sendingMsg || !composerText.trim()}
         >
          <Send size={16} />
         </button>
        </> )}
      </div>
     </> ) : ( <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, color: TG_DIM }}>
      <MessageSquare size={52} color={TG_DIM} strokeWidth={1.5} />
      <div style={{ textAlign: 'center' }}>
       <div style={{ fontSize: 16, fontWeight: 700, color: TG_SUB, marginBottom: 4 }}>اختر محادثة</div>
       <div style={{ fontSize: 12.5, color: TG_DIM }}>للعرض والتواصل مع الزبون</div>
      </div>
     </div> )}
   </div>
      <style>{`
        @media (max-width: 860px) {
          .alfhd-conv-fullscreen {
            position: static !important;
            width: 100% !important;
            height: 100% !important;
            flex: 1 !important;
            overflow: hidden !important;
            display: flex !important;
          }
          .alfhd-conv-list {
            /* عمود فلكس يتقلّص — التمرير يصير بالقائمة الداخلية مو هنا */
            height: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            min-height: 0 !important;
            flex: 1 1 0% !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
          }
          .alfhd-conv-list-hidden-mobile { display: none !important; }
          .alfhd-conv-detail-empty { display: none !important; }
          /* قواعد المحادثة المفتوحة موحّدة بالكتلة العامة أسفل الملف — لا تكرار هنا */
          .alfhd-conv-back-btn { display: flex !important; }
          /* لا نخفي نص هذا الزر — هذا زر خاص بمحادثة وحدة، لازم يبين واضح
             حتى ما يلتبس بزر "تشغيل الكل" الموجود فوق بالقائمة (نفس شكل الأيقونة) */
          .alfhd-chat-detail-header { padding: 9px 12px !important; gap: 8px !important; }
        }
      `}</style>
    </div>
  );
}

// ──────────────────────────────────────────────
// شارة الحالة
// ──────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33`,
    }}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

function OrderStagePill({ order }) {
  const cfg = getOrderStageInfo(order);
  const Icon = cfg.icon || Package;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 8px', borderRadius: 20, fontSize: 12, fontWeight: 800,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}44`,
      whiteSpace: 'nowrap',
    }}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

// ──────────────────────────────────────────────
// أدوات الفلترة المشتركة (تاريخ + صفحات + بحث)
// ──────────────────────────────────────────────
function startOfDayTs(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); }

const DATE_PRESETS = [
  { id: 'today', label: 'اليوم' },
  { id: 'yesterday', label: 'أمس' },
  { id: 'week', label: 'هذا الأسبوع' },
  { id: 'thisMonth', label: 'هذا الشهر' },
  { id: 'thisYear', label: 'هذه السنة' },
  { id: 'custom', label: 'اختيار شهر وسنة' },
  { id: 'all', label: 'الكل' },
];

const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function dateInRange(dateStr, preset, customMonth, customYear) {
  if (preset === 'all') return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const today = startOfDayTs(now);
  const dDay = startOfDayTs(d);
  if (preset === 'today') return dDay === today;
  if (preset === 'yesterday') return dDay === today - 86400000;
  if (preset === 'dayBefore') return dDay === today - 2 * 86400000;
  if (preset === 'week') { const w = today - 7 * 86400000; return d.getTime() >= w && d.getTime() <= now.getTime(); }
  if (preset === 'thisMonth') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (preset === 'thisYear') return d.getFullYear() === now.getFullYear();
  if (preset === 'custom') return (d.getMonth() + 1) === Number(customMonth) && d.getFullYear() === Number(customYear);
  return true;
}

// شريط فلترة موحّد: تاريخ + صفحات + بحث
function OrderFilters({
  pages, datePreset, setDatePreset, customMonth, setCustomMonth, customYear, setCustomYear,
  pageFilter, setPageFilter, search, setSearch, searchPlaceholder,
}) {
  const years = [];
  for (let y = new Date().getFullYear(); y >= 2024; y--) years.push(y);
  return (
    <div style={styles.filtersWrap} className="alfhd-no-print">
      <div style={styles.filterBottomRow}>
        <div style={styles.pageSelectWrap}>
          <Calendar size={15} color="#60A5FA" />
          <select aria-label="فلتر التاريخ" value={datePreset} onChange={(e) => setDatePreset(e.target.value)} style={styles.pageSelect}>
            {DATE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <ChevronDown size={14} color="#5E6986" />
        </div>
        {datePreset === 'custom' && (
          <>
            <select aria-label="الشهر" value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} style={styles.customDateSelectCompact}>
              {AR_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select aria-label="السنة" value={customYear} onChange={(e) => setCustomYear(e.target.value)} style={styles.customDateSelectCompact}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        )}
        <div style={styles.pageSelectWrap}>
          <Facebook size={15} color="#3B82F6" />
          <select aria-label="خيار" value={pageFilter} onChange={(e) => setPageFilter(e.target.value)} style={styles.pageSelect}>
            <option value="all">كل الصفحات</option>
            {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown size={14} color="#5E6986" />
        </div>
        <div style={styles.searchBox}>
          <Search size={15} color="#5E6986" />
          <input
            placeholder={searchPlaceholder || 'بحث...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// منتقي المنطقة الذكي — يجلب مدن المحافظة من jenni_cities
// مع بحث، ومطابقة ذكية للنص المُدخل (مثل المحافظة تماماً)
// ──────────────────────────────────────────────
function normalizeArJS(s) {
  return (s || '')
    .replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[ًٌٍَُِّْ]/g, '').replace(/\s+/g, ' ').trim();
}

function CityPicker({ govCode, value, onChange, invalid }) {
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // جلب مدن المحافظة عند تغييرها
  useEffect(() => {
    if (!govCode) { setCities([]); return; }
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/jenni_cities?governorate_code=eq.${govCode}&select=city_name,city_name_norm&order=city_name.asc`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        );
        const data = await res.json();
        if (alive) setCities(Array.isArray(data) ? data : []);
      } catch { if (alive) setCities([]); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [govCode]);

  const filtered = useMemo(() => {
    if (!search.trim()) return cities.slice(0, 50);
    const q = normalizeArJS(search).replace(/\s/g, '');
    return cities
      .filter((c) => (c.city_name_norm || normalizeArJS(c.city_name)).replace(/\s/g, '').includes(q))
      .slice(0, 50);
  }, [cities, search]);

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={open ? search : (value || '')}
        onChange={(e) => { setSearch(e.target.value); onChange(e.target.value); if (!open) setOpen(true); }}
        onFocus={() => { setOpen(true); setSearch(''); }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        disabled={!govCode}
        style={{
          ...styles.formInput, borderRadius: 9,
          border: invalid ? '1.5px solid rgba(242,80,80,0.5)' : '1.5px solid rgba(42,171,238,0.25)',
          background: govCode ? '#242F3D' : '#1a212b',
        }}
        placeholder={govCode ? 'ابحث أو اختر المنطقة...' : 'اختر المحافظة أولاً'}
      />
      {open && govCode && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#1a212b', border: '1px solid rgba(42,171,238,0.3)', borderRadius: 9,
          maxHeight: 220, overflowY: 'auto', marginTop: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {loading && <div style={{ padding: 8, color: '#8FA0B5', fontSize: 12 }}>جارٍ التحميل...</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 8, color: '#8FA0B5', fontSize: 12 }}>
              لا نتائج — سيُرسَل النص كما هو
            </div>
          )}
          {!loading && filtered.map((c) => (
            <div
              key={c.city_name}
              onMouseDown={() => { onChange(c.city_name); setSearch(''); setOpen(false); }}
              style={{ padding: '8px 12px', fontSize: 13, color: '#E7ECF3', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(42,171,238,0.12)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {c.city_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// عرض الطلبات
// ──────────────────────────────────────────────
function OrdersView({ orders, pages, setOrders, conversations, setConversations, onViewConversation, pendingNewOrderFromConv, clearPendingNewOrderFromConv, currentUser, onContactCustomer, pendingOpenOrderId, clearPendingOpenOrderId, warehouseProducts = [] }) {
  const [selectedPage, setSelectedPage] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [globalOrderSearch, setGlobalOrderSearch] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const [editingOrder, setEditingOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const ocrInputRef = React.useRef(null);
  const [section, setSection] = useState('ready');
  // modal الطباعة داخل الموقع (بدل نافذة منبثقة)
  const [printModal, setPrintModal] = useState(null); // {html, title} أو null
  const [printLoading, setPrintLoading] = useState(false);
  const [batchHistoryOpen, setBatchHistoryOpen] = useState(false);
  // قسم المهمل
  const [neglectedOpen, setNeglectedOpen] = useState(false);
  const [neglectedSelected, setNeglectedSelected] = useState([]); // ids المحددة
  const [prepSubTab, setPrepSubTab] = useState('all'); // 'all' | 'followup'
  const [prepSelected, setPrepSelected] = useState([]); // طلبات محددة للطباعة
  const sendingJenniRef = React.useRef(null); // قفل ضد الإرسال المزدوج لجيني
  const citiesCacheRef = React.useRef(null); // كاش جدول مدن جيني للبحث السريع
  const [printTarget, setPrintTarget] = useState(null);
  // نافذة إجراء جيني (تأجيل/إرجاع): { order, action, title }
  const [jenniAction, setJenniAction] = useState(null);
  const [jenniActionReason, setJenniActionReason] = useState('');
  const [jenniActionDateId, setJenniActionDateId] = useState(1);
  const [jenniActionBusy, setJenniActionBusy] = useState(false);

  // مطابقة الفلاتر المشتركة (صفحة + تاريخ + بحث) على طلب
  function passesCommon(o) {
    if (selectedPage !== 'all' && o.pageId !== selectedPage) return false;
    if (!dateInRange(o.createdAt || o.date, datePreset, customMonth, customYear)) return false;
    if (search) {
      const q = search.trim().toLowerCase();
      if (!orderSearchHaystack(o).includes(q)) return false;
    }
    return true;
  }

  useEffect(() => {
    if (!pendingNewOrderFromConv) return;
    const conv = pendingNewOrderFromConv;

    // ── استخراج ذكي للمحافظة والمنطقة ──
    // يبحث في كل النصوص المتاحة من المحادثة
    const searchTexts = [
      conv.lastMsg || '',
      conv.address || '',
      conv.customer || '',
    ].join(' ');

    // تنظيف النص من الرموز الزيادة
    const cleanText = searchTexts.replace(/[*#@!]/g, ' ').replace(/\s+/g, ' ').trim();

    let autoGovCode = '';
    let autoGovName = '';
    let autoArea = '';
    let autoAddress = '';

    // ابحث عن اسم محافظة في النص
    const govFound = IRAQ_GOVERNORATES.find((g) => {
      const name = g.name; // مثل "الأنبار"
      const nameNoAl = name.replace(/^ال/, ''); // "أنبار"
      return cleanText.includes(name) || cleanText.includes(nameNoAl);
    });

    if (govFound) {
      autoGovCode = govFound.code;
      autoGovName = govFound.name;
      // ما تبقى بعد إزالة المحافظة
      const rest = cleanText
        .replace(govFound.name, '')
        .replace(govFound.name.replace(/^ال/, ''), '')
        .replace(/^[\s\-،,]+/, '')
        .trim();
      const parts = rest.split(/[\-،,\s]+/).map((p) => p.trim()).filter(Boolean);
      autoArea = parts[0] || '';
      autoAddress = parts.slice(1).join(' ') || '';
    } else {
      // لو ما لاقينا محافظة — ضع كل شيء في العنوان وخلّ المستخدم يختار
      autoAddress = cleanText;
    }

    // ── تحديد الصفحة ──
    // نعتمد دائماً على صفحة المحادثة الحقيقية (page_id المحفوظ من الـ Bridge)
    // هكذا كل طلب من واتساب صفحة معينة ينتسب لتلك الصفحة بالضبط
    const waPage = pages.find((p) => p.connected) || pages[0];
    const resolvedPageId = conv.pageId || (conv.isWhatsApp ? (waPage?.id || '') : (pages[0]?.id || ''));

    setEditingOrder({
      id: null,
      pageId: resolvedPageId,
      // منصة الطلب تُحدَّد تلقائياً من نوع المحادثة (واتساب / فيسبوك)
      platform: conv.isWhatsApp ? 'whatsapp' : 'facebook',
      customer: conv.customer || '',
      phone: conv.phone || '',
      address: autoAddress,
      governorateCode: autoGovCode,
      governorateName: autoGovName,
      area: autoArea,
      items: '', orderType: '', total: '',
      status: 'pending', conversationId: conv.id || '',
    });
    clearPendingNewOrderFromConv?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingNewOrderFromConv]);

  useEffect(() => {
    if (!pendingOpenOrderId) return;
    const target = orders.find((o) => o.id === pendingOpenOrderId);
    if (target) {
      const stage = target.stage || (target.printed ? 'prep' : 'ready');
      setSection(stage);
      setDetailOrder(target);
    }
    clearPendingOpenOrderId?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOpenOrderId, orders]);

  // الطلب المحوّل يُستبعد من القوائم كلها (يبقى بالإحصائيات فقط)
  const visibleOrders = useMemo(() => orders.filter((o) => !o.converted), [orders]);

  function orderSearchHaystack(o) {
    const page = pages.find((p) => p.id === o.pageId);
    return [o.customer, o.orderNo, o.phone, o.orderType, o.address, o.area, o.governorateName, o.items, o.fahdRef, o.jenniTracking, page?.name]
      .filter(Boolean).join(' ').toLowerCase();
  }

  const globalOrderResults = useMemo(() => {
    const q = globalOrderSearch.trim().toLowerCase();
    if (q.length < 2) return [];
    return orders.filter((o) => orderSearchHaystack(o).includes(q)).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalOrderSearch, orders, pages]);

  function openOrderFromGlobalSearch(o) {
    setGlobalOrderSearch('');
    if (o.converted) {
      alert(`الطلب #${o.orderNo} محوّل/مؤرشف. يمكنك رؤيته من الإحصائيات ← الطلبات المحوّلة.`);
      return;
    }
    const stage = o.stage || (o.printed ? 'prep' : 'ready');
    setSection(stage);
    setStatusFilter('all');
    setDetailOrder(o);
  }

  const THREE_DAYS = 3 * 86400000;
  // طلب مهمل: في قيد التجهيز أو لدى شركة التوصيل، مرّ عليه 3 أيام دون أن تتغير حالته/تستلمه الشركة
  function isNeglected(o) {
    const stage = o.stage || (o.printed ? 'prep' : 'ready');
    if (stage !== 'prep' && stage !== 'delivery') return false;
    // إذا الشركة استلمته أو تغيّرت حالته الفعلية، فهو ليس مهملاً
    if (o.deliveryStep || o.deliveryStatus) return false;
    // المرجع الزمني: آخر تحديث للحالة أو وقت الطباعة أو الإنشاء
    const ref = o.deliveryUpdatedAt || o.printedAt || o.createdAt || o.date;
    if (!ref) return false;
    return (Date.now() - new Date(ref).getTime()) > THREE_DAYS;
  }

  const stageOrders = useMemo(() => {
    return visibleOrders.filter((o) => {
      // نعتمد على stage الحقيقي فقط. الافتراضي 'ready' إن كان فارغاً (لا نخفيه بسبب printed).
      const stage = o.stage || 'ready';
      if (stage !== section) return false;
      if (!passesCommon(o)) return false;
      // ملاحظة: لا نخفي "المهملة" — لم يعد لها قسم بعد إزالة المثلث، فإخفاؤها = ضياع طلبات
      if (section === 'delivery' && statusFilter !== 'all' && o.status !== statusFilter) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleOrders, section, selectedPage, statusFilter, search, datePreset, customMonth, customYear]);

  // الطلبات المهملة (لكل الصفحات المرئية)
  const neglectedOrders = useMemo(() => {
    return visibleOrders.filter((o) => {
      if (selectedPage !== 'all' && o.pageId !== selectedPage) return false;
      return isNeglected(o);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleOrders, selectedPage]);

  // إحصائيات اليوم السريعة (لقسم الطلبات)
  const todayStats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const isToday = (o) => {
      const d = new Date(o.createdAt || o.date || 0);
      return d >= today;
    };
    const scoped = selectedPage === 'all' ? visibleOrders : visibleOrders.filter((o) => o.pageId === selectedPage);
    const todayOrders = scoped.filter(isToday);
    return {
      total: todayOrders.length,
      printed: todayOrders.filter((o) => (o.stage || 'ready') !== 'ready').length,
      delivered: todayOrders.filter((o) => o.status === 'delivered').length,
      returned: todayOrders.filter((o) => o.status === 'returned').length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleOrders, selectedPage]);

  const stageCounts = useMemo(() => {
    const c = { ready: 0, prep: 0, delivery: 0 };
    visibleOrders.forEach((o) => {
      if (selectedPage !== 'all' && o.pageId !== selectedPage) return;
      // نفس منطق stageOrders تماماً — لضمان تطابق العدّاد مع المعروض
      const stage = o.stage || 'ready';
      if (c[stage] !== undefined) c[stage]++;
    });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleOrders, selectedPage]);

  const stats = useMemo(() => {
    const pageScoped = selectedPage === 'all' ? visibleOrders : visibleOrders.filter((o) => o.pageId === selectedPage);
    const inRange = (o) => dateInRange(o.date || o.createdAt, datePreset, customMonth, customYear);
    const allDelivery = pageScoped.filter((o) => (o.stage || 'ready') === 'delivery');
    // "قيد التوصيل" = الحالي دائماً (بلا فلتر تاريخ) — لأنه وضع لحظي
    const pendingNow = allDelivery.filter((o) => o.status === 'pending');
    // "مستلمة" و"راجعة" تحترمان فلتر التاريخ (تقارير تاريخية)
    const deliveredF = allDelivery.filter((o) => o.status === 'delivered' && inRange(o));
    const returnedF = allDelivery.filter((o) => o.status === 'returned' && inRange(o));
    const base = section === 'delivery'
      ? [...pendingNow, ...deliveredF, ...returnedF]
      : pageScoped;
    return {
      total: base.length,
      pending: pendingNow.length,
      delivered: deliveredF.length,
      returned: returnedF.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleOrders, selectedPage, section, datePreset, customMonth, customYear]);

  const updateStatus = async (id, status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await sbUpdate('alfhd_orders', id, { status });
    } catch (e) {
      console.error('Failed to update order status:', e);
    }
  };

  function startNewOrder() {
    if (!pages.length) { alert('لا توجد صفحات مضافة. أضف/اربط صفحة أولاً قبل إنشاء طلب.'); return; }
    setEditingOrder({
      id: null, pageId: pages[0]?.id || '', customer: '', phone: '', address: '',
      items: '', orderType: '', total: '', status: 'pending', conversationId: '',
      platform: 'whatsapp', // المصدر الافتراضي — يمكن تغييره من النموذج
    });
  }

  function startEditOrder(o) {
    setEditingOrder({ ...o, total: String(o.total), conversationId: o.conversationId || '' });
    setDetailOrder(null);
  }

  async function handleDelete(o) {
    if (!window.confirm(`هل تريد حذف الطلب #${o.orderNo}؟ لا يمكن التراجع، ولن يُحتسب ضمن الإحصائيات.`)) return;
    setOrders((prev) => prev.filter((x) => x.id !== o.id));
    setDetailOrder(null);
    try {
      await sbDelete('alfhd_orders', o.id);
    } catch (e) {
      console.error('delete order error:', e);
      alert('تعذّر حذف الطلب، تحقق من اتصالك');
    }
  }

  function buildOrderShareText(o) {
    const page = pages.find((p) => p.id === o.pageId);
    return [
      `طلب #${o.orderNo}`,
      page ? `الصفحة: ${page.name}` : null,
      `العميل: ${o.customer}`,
      o.phone ? `الهاتف: ${o.phone}` : null,
      o.address ? `العنوان: ${o.address}` : null,
      o.orderType ? `نوع الطلب: ${o.orderType}` : null,
      `المنتجات: ${o.items}`,
      `المبلغ: ${Number(o.total).toLocaleString()} د.ع`,
    ].filter(Boolean).join('\n');
  }

  async function markOrderConverted(o) {
    // التحويل: يُشال من القوائم، يبقى بالإحصائيات، ويصير "قيد التوصيل" بمحادثة الزبون
    const now = new Date().toISOString();
    const byName = currentUser?.name || null;
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, converted: true, convertedAt: now, convertedByName: byName, status: 'pending' } : x)));
    try {
      await sbUpdate('alfhd_orders', o.id, { converted: true, converted_at: now, converted_by: currentUser?.id || null, converted_by_name: byName, status: 'pending' });
    } catch (e) {
      console.error('convert order error:', e);
    }
  }

  // إعادة الطلب المرفوض للتجهيز من جديد، مع ملاحظة اختيارية من المدير
  async function reprepOrder(o, note) {
    const byName = currentUser?.name || 'المدير';
    const patch = {
      prep_status: null, prep_by: null, prep_by_name: null, prep_reason: null, prep_at: null,
      reprep_note: note || null, reprep_by_name: byName,
    };
    setOrders((prev) => prev.map((x) => (x.id === o.id ? {
      ...x, prepStatus: null, prepBy: null, prepByName: null, prepReason: null, prepAt: null,
      reprepNote: note || null, reprepByName: byName,
    } : x)));
    setDetailOrder(null);
    try {
      await sbUpdate('alfhd_orders', o.id, patch);
    } catch (e) {
      console.error('reprep error:', e);
    }
  }

  async function handleShare(o) {
    const text = buildOrderShareText(o);
    try {
      if (navigator.share) {
        await navigator.share({ title: `طلب #${o.orderNo}`, text });
        await markOrderConverted(o);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        alert('تم نسخ تفاصيل الطلب، الصقها بأي تطبيق تحب');
        await markOrderConverted(o);
        return;
      }
      window.prompt('انسخ تفاصيل الطلب:', text);
      await markOrderConverted(o);
    } catch (e) {
      if (e?.name !== 'AbortError') {
        console.error('share error:', e);
        alert('تعذّرت المشاركة، حاول مرة أخرى');
      }
    }
  }

  async function pinConversationToOrder(conversationId, orderId) {
    if (!conversationId) return;
    setConversations?.((prev) => prev.map((c) => (
      c.id === conversationId ? { ...c, tab: 'pinned', orderId } : c
    )));
    try {
      await sbUpdate('alfhd_conversations', conversationId, { tab: 'pinned', order_id: orderId });
    } catch (e) {
      console.error('pin conversation error:', e);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // Jenni Validation — الحقول المطلوبة من شركة التوصيل بدقة 100%
  // المصدر: https://sys.fuhood.com/api/v2/docs (Create Shipment)
  // ══════════════════════════════════════════════════════════════
  function validateJenniFields(order) {
    const errors = {};

    // 1. اسم المستلم — receiver_name (إجباري)
    if (!String(order.customer || '').trim()) {
      errors.customer = 'اسم العميل مطلوب';
    }

    // 2. رقم الهاتف — receiver_phone_1 (إجباري، صيغة 07XXXXXXXXX)
    const rawPhone = String(order.phone || '').trim();
    if (!rawPhone) {
      errors.phone = 'رقم الهاتف مطلوب';
    } else {
      const clean = normalizeIraqiPhone(rawPhone);
      if (clean.length !== 11 || !clean.startsWith('07')) {
        errors.phone = `رقم الهاتف غير صالح — المطلوب: 07XXXXXXXXX (المُدخَل: ${rawPhone})`;
      }
    }

    // 3. كود المحافظة — governorate_code
    // نقبله إذا: موجود صراحةً، أو يمكن استنتاجه، أو توجد منطقة مكتوبة (سيكتشفها الإرسال من جدول جيني)
    const govCode = order.governorateCode || inferGovFromText(order.area) || inferGovFromText(order.address);
    const hasAreaText = !!(String(order.area || '').trim() || String(order.address || '').trim());
    if (!govCode && !hasAreaText) {
      errors.governorateCode = 'المحافظة مطلوبة — إجبارية من شركة التوصيل';
    } else if (govCode) {
      const validCodes = IRAQ_GOVERNORATES.map((g) => g.code);
      if (!validCodes.includes(govCode)) {
        errors.governorateCode = `كود المحافظة غير صالح: ${govCode}`;
      }
    }

    // 4. المدينة/المنطقة — city (إجباري): نقبل area أو عنوان مكتوب
    if (!String(order.area || '').trim() && !String(order.address || '').trim()) {
      errors.area = 'المنطقة/المدينة مطلوبة — إجبارية من شركة التوصيل';
    }

    // 5. المبلغ — amount_iqd (إجباري، > 0)
    const total = Number(order.total);
    if (!total || total <= 0) {
      errors.total = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
    }

    return errors; // {} = لا أخطاء
  }

  async function handleSaveOrder() {
    if (!editingOrder.pageId) { alert('اختر الصفحة أولاً'); return; }
    if (!String(editingOrder.customer || '').trim()) { alert('اسم العميل مطلوب على الأقل'); return; }

    // تحقق من حقول جيني — تحذير فقط، لا يمنع الحفظ
    const validationErrors = validateJenniFields(editingOrder);
    const hasJenniGaps = Object.keys(validationErrors).length > 0;
    if (hasJenniGaps) {
      const msgs = Object.values(validationErrors).join('\n• ');
      const proceed = confirm(`⚠️ الطلب سيُحفظ، لكن لن يُرسَل لشركة التوصيل حتى تكتمل هذه الحقول:\n\n• ${msgs}\n\nهل تريد الحفظ الآن وإكمالها لاحقاً؟`);
      if (!proceed) { return; }
    }

    setSaving(true);
    try {
      if (editingOrder.id) {
        const payload = {
          page_id: editingOrder.pageId,
          customer_name: editingOrder.customer,
          phone: editingOrder.phone,
          address: editingOrder.address,
          governorate_code: editingOrder.governorateCode || null,
          governorate_name: editingOrder.governorateName || null,
          area: editingOrder.area || null,
          items: editingOrder.items,
          order_type: editingOrder.orderType || null,
          total: parseAmountIQD(editingOrder.total),
          status: editingOrder.status,
          conversation_id: editingOrder.conversationId || null,
          source: editingOrder.conversationId ? 'chat' : (editingOrder.source || 'manual'),
          platform: editingOrder.platform || null,
          storage_location: editingOrder.storageLocation || null,
        };
        // حماية: التعديل لا يغيّر المرحلة ولا يحوّل/يحذف الطلب أبداً — نُبقيها كما هي
        await sbUpdate('alfhd_orders', editingOrder.id, payload);
        const updatedOrder = {
          ...editingOrder,
          pageId: editingOrder.pageId, customer: editingOrder.customer, phone: editingOrder.phone,
          address: editingOrder.address, items: editingOrder.items, orderType: editingOrder.orderType,
          governorateCode: editingOrder.governorateCode || '', governorateName: editingOrder.governorateName || '', area: editingOrder.area || '',
          total: parseAmountIQD(editingOrder.total), status: editingOrder.status,
          conversationId: editingOrder.conversationId || null,
          source: editingOrder.conversationId ? 'chat' : (editingOrder.source || 'manual'),
          platform: editingOrder.platform || null,
        };
        setOrders((prev) => prev.map((o) => (o.id === editingOrder.id ? updatedOrder : o)));
        if (editingOrder.conversationId) await pinConversationToOrder(editingOrder.conversationId, editingOrder.id);
        // ── إعادة إرسال لجيني فقط إذا اكتملت الحقول ولم يُرسَل بعد ──
        const prevOrder = orders.find((o) => o.id === editingOrder.id);
        if (!prevOrder?.jenniSent && !hasJenniGaps) {
          sendOrderToJenni(updatedOrder, { silent: true });
        }
      } else {
        const payload = {
          order_no: String(Date.now()).slice(-6),
          page_id: editingOrder.pageId,
          customer_name: editingOrder.customer,
          phone: editingOrder.phone,
          address: editingOrder.address,
          governorate_code: editingOrder.governorateCode || null,
          governorate_name: editingOrder.governorateName || null,
          area: editingOrder.area || null,
          items: editingOrder.items,
          order_type: editingOrder.orderType || null,
          total: parseAmountIQD(editingOrder.total),
          status: editingOrder.status || 'pending',
          stage: 'ready',
          order_date: new Date().toISOString().slice(0, 10),
          fahd_ref: `FHD-${Math.floor(10000 + Math.random() * 89999)}`,
          conversation_id: editingOrder.conversationId || null,
          source: editingOrder.conversationId ? 'chat' : 'manual',
          platform: editingOrder.platform || null,
        };
        const created = await sbInsert('alfhd_orders', payload);
        if (created?.[0]) {
          const newOrder = mapOrderFromDb(created[0]);
          setOrders((prev) => [newOrder, ...prev]);
          if (editingOrder.conversationId) await pinConversationToOrder(editingOrder.conversationId, created[0].id);
          // ── إرسال فوري لجيني فقط إذا اكتملت كل الحقول ──
          // إن نقص حقل، يُحفظ الطلب وينتظر الإكمال (لا يُرسل ناقصاً)
          if (!hasJenniGaps) {
            sendOrderToJenni(newOrder, { silent: true });
          }
        }
      }
      setEditingOrder(null);
    } catch (e) {
      console.error('save order error:', e);
      alert('تعذّر حفظ الطلب، تحقق من اتصالك');
    } finally {
      setSaving(false);
    }
  }

  async function handlePickOcrImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setOcrLoading(true);
    try {
      const { base64, mediaType } = await fileToBase64(file);
      const res = await fetch(ORDER_EXTRACT_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || 'فشل الاستخراج');

      // ── استخراج المحافظة من البيانات المستخرجة بالـ OCR ──
      const rawAddress = data.order?.address || '';
      const rawGovName = data.order?.governorate || data.order?.city || '';

      let ocrGovCode = '';
      let ocrGovName = '';
      let ocrArea = data.order?.area || '';
      let ocrAddress = rawAddress;

      // ابحث عن المحافظة في الحقول المستخرجة
      const govSearchText = rawGovName || rawAddress;
      const govFound = IRAQ_GOVERNORATES.find((g) =>
        govSearchText.includes(g.name) || govSearchText.includes(g.name.replace('ال', ''))
      );
      if (govFound) {
        ocrGovCode = govFound.code;
        ocrGovName = govFound.name;
        // إذا كانت المحافظة داخل العنوان، أزلها وخلّ الباقي هو العنوان
        ocrAddress = rawAddress.replace(govFound.name, '').replace(/^[\s\-،,]+/, '').trim();
        if (!ocrArea && ocrAddress) {
          const parts = ocrAddress.split(/[\-،,]+/).map((p) => p.trim()).filter(Boolean);
          ocrArea = parts[0] || '';
          ocrAddress = parts.slice(1).join(' - ') || '';
        }
      }

      setEditingOrder({
        id: null, pageId: pages[0]?.id || '',
        customer: data.order?.customer_name || '',
        phone: data.order?.phone || '',
        address: ocrAddress,
        governorateCode: ocrGovCode,
        governorateName: ocrGovName,
        area: ocrArea,
        items: data.order?.items || '',
        orderType: data.order?.order_type || '',
        total: data.order?.total ? String(data.order.total) : '',
        status: 'pending', conversationId: '',
      });
    } catch (e) {
      console.error('ocr error:', e);
      alert('تعذّر استخراج التفاصيل تلقائياً، أدخلها يدوياً بالنموذج');
      setEditingOrder({
        id: null, pageId: pages[0]?.id || '', customer: '', phone: '', address: '',
        items: '', orderType: '', total: '', status: 'pending', conversationId: '',
      });
    } finally {
      setOcrLoading(false);
    }
  }

  function groupByBatch(printedOrders) {
    const batches = new Map();
    for (const o of printedOrders) {
      const key = o.printBatchId || 'unknown';
      if (!batches.has(key)) batches.set(key, []);
      batches.get(key).push(o);
    }
    return Array.from(batches.entries())
      .map(([batchId, batchOrders]) => ({ batchId, orders: batchOrders, printedAt: batchOrders[0]?.printedAt || null }))
      .sort((a, b) => new Date(b.printedAt || 0) - new Date(a.printedAt || 0));
  }

  // الطباعة تنقل الطلب من "جاهز للطباعة" إلى "قيد التجهيز" داخل موقعك فقط.
  // الطلب أُرسِل لجيني مسبقاً عند إنشائه (مرحلة ready) بحالة NEW_ORDER_TO_PRINT.
  // لو لسبب ما لم يُرسَل بعد (مثلاً طلب قديم)، يُرسَل الآن كاحتياط.
  async function markOrdersPrintedAndPrep(ids) {
    if (ids.length === 0) return;
    const batchId = `batch-${Date.now()}`;
    const printedAt = new Date().toISOString();
    // الطلبات التي لم تُرسَل لجيني بعد (احتياط للطلبات القديمة)
    const notSentYet = orders.filter((o) => ids.includes(o.id) && !o.jenniSent);
    setOrders((prev) => prev.map((o) => (
      ids.includes(o.id) ? { ...o, printed: true, printBatchId: batchId, printedAt, stage: 'prep' } : o
    )));
    // حفظ في DB
    try {
      await Promise.all(ids.map((id) => sbUpdate('alfhd_orders', id, {
        printed: true, print_batch_id: batchId, printed_at: printedAt, stage: 'prep',
      })));
    } catch (e) {
      console.error('mark printed error:', e);
    }
    // إرسال احتياطي فقط للطلبات القديمة التي لم تُرسَل عند الإنشاء
    for (const o of notSentYet) {
      await sendOrderToJenni(o, { silent: true });
    }
  }

  // إرسال طلب واحد لشركة Jenni وحفظ رقم الشحنة (صامت)
  // تحويل الأرقام العربية/الفارسية إلى إنجليزية
  function toEnglishDigits(str) {
    return arabicToEnglishDigits(str);
  }

  // تنظيف رقم الهاتف ليكون بصيغة 07XXXXXXXXX التي تقبلها جيني
  function normalizeIraqiPhone(raw) {
    if (!raw) return '';
    // حوّل الأرقام العربية لإنجليزية أولاً ثم أزل غير الأرقام
    let digits = toEnglishDigits(raw).replace(/[^0-9]/g, '');
    if (digits.startsWith('00964')) digits = '0' + digits.slice(5);
    else if (digits.startsWith('964')) digits = '0' + digits.slice(3);
    if (!digits.startsWith('0')) digits = '0' + digits;
    return digits.slice(0, 11); // 07XXXXXXXXX = 11 رقماً
  }

  async function sendOrderToJenni(o, { silent = false } = {}) {
    // ── قفل ضد الإرسال المزدوج (يمنع إنشاء شحنتين لنفس الطلب) ──
    if (!sendingJenniRef.current) sendingJenniRef.current = new Set();
    if (sendingJenniRef.current.has(o.id)) {
      return false; // إرسال جارٍ بالفعل لهذا الطلب
    }
    // إن كان مُرسلاً مسبقاً، لا نعيد الإرسال
    if (o.jenniSent || o.jenniShipmentId) {
      return { success: true, shipment_id: o.jenniShipmentId, tracking_number: o.jenniTracking, already: true };
    }
    sendingJenniRef.current.add(o.id);
    try {
      return await _sendOrderToJenniInner(o, { silent });
    } finally {
      sendingJenniRef.current.delete(o.id);
    }
  }

  // البحث عن منطقة في جدول jenni_cities (2515 منطقة) — يرجّع {city_id, city_name, governorate_code}
  // القاعدة الصارمة: إذا ذُكرت محافظة صريحة في النص، نبحث داخلها فقط (يمنع "الزعفرانية"→أربيل الخاطئ)
  async function lookupCityInJenni(text, forcedGovCode) {
    if (!text || !text.trim()) return null;
    try {
      const norm = (s) => normalizeArJS(String(s || '')).replace(/\s/g, '');
      const rawWords = normalizeArJS(String(text)).split(/[\s\-،,]+/).filter((w) => w.length >= 3);
      if (rawWords.length === 0 && !forcedGovCode) return null;

      if (!citiesCacheRef.current) {
        const all = await sbSelect('jenni_cities', 'select=city_id,city_name,city_name_norm,governorate_code&limit=3000');
        citiesCacheRef.current = Array.isArray(all) ? all : [];
      }
      const allCities = citiesCacheRef.current;
      if (!allCities.length) return null;

      // ── الخطوة 1: حدّد المحافظة الملزِمة ──
      // أولوية: (أ) محافظة ممرّرة، (ب) محافظة صريحة في النص عبر الأسماء الشائعة
      let govCode = forcedGovCode || null;
      if (!govCode) {
        govCode = inferGovFromText(text); // يفحص أسماء المحافظات ومراكزها الصريحة
      }
      // كلمات المنطقة (نستبعد كلمات المحافظة نفسها من البحث عن المنطقة)
      const stopWords = new Set();
      for (const g of IRAQ_GOVERNORATES) { stopWords.add(norm(g.name)); stopWords.add(norm(g.name.replace(/^ال/, ''))); }
      for (const alias of Object.keys(CITY_ALIAS_TO_GOV)) stopWords.add(norm(alias));
      const words = rawWords.filter((w) => !stopWords.has(norm(w)));

      // النطاق: مدن المحافظة الملزِمة فقط (إن وُجدت)، وإلا كل المدن
      const scope = govCode ? allCities.filter((c) => c.governorate_code === govCode) : allCities;
      if (govCode && scope.length === 0) {
        // محافظة معروفة لكن لا مدن لها في الجدول — نرجّع المحافظة بلا منطقة محددة
        return { city_id: null, city_name: null, governorate_code: govCode, _govOnly: true };
      }

      const searchWords = words.length ? words : rawWords;
      const fullNorm = norm(searchWords.join(''));

      // ── الخطوة 2: طابق المنطقة داخل النطاق فقط ──
      // (أ) تطابق دقيق لاسم منطقة = كلمة كاملة
      for (const w of searchWords) {
        const wn = norm(w);
        if (wn.length < 3) continue;
        const exact = scope.find((c) => norm(c.city_name_norm || c.city_name) === wn);
        if (exact) return exact;
      }
      // (ب) اسم المنطقة الرسمي (≥4 حروف) موجود داخل كلمة من النص
      let best = null, bestLen = 0;
      for (const c of scope) {
        const cn = norm(c.city_name_norm || c.city_name);
        if (cn.length < 4) continue;
        for (const w of searchWords) {
          const wn = norm(w);
          if ((wn.includes(cn) || cn.includes(wn)) && cn.length > bestLen) { bestLen = cn.length; best = c; }
        }
      }
      if (best) return best;
      // (ج) أقرب تشابه — فقط داخل النطاق وبعتبة صارمة (يمنع المطابقة العشوائية)
      const longest = [...searchWords].sort((a, b) => b.length - a.length)[0] || '';
      const target = norm(longest);
      if (target.length >= 4) {
        let bestM = null, bestRatio = 0.25; // عتبة صارمة جداً
        for (const c of scope) {
          const cn = norm(c.city_name_norm || c.city_name);
          if (cn.length < 4 || Math.abs(cn.length - target.length) > 2) continue;
          const dp = Array.from({ length: target.length + 1 }, (_, i) => i);
          for (let i = 1; i <= cn.length; i++) {
            let prev = dp[0]; dp[0] = i;
            for (let j = 1; j <= target.length; j++) {
              const tmp = dp[j];
              dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (cn[i - 1] === target[j - 1] ? 0 : 1));
              prev = tmp;
            }
          }
          const ratio = dp[target.length] / Math.max(cn.length, target.length);
          if (ratio < bestRatio) { bestRatio = ratio; bestM = c; }
        }
        if (bestM) return bestM;
      }
      // (د) عرفنا المحافظة لكن ما لقينا المنطقة بدقة → نرجّع المحافظة بلا منطقة (لا نخمّن عشوائياً)
      if (govCode) return { city_id: null, city_name: null, governorate_code: govCode, _govOnly: true };
      return null;
    } catch (_e) { return null; }
  }

  async function _sendOrderToJenniInner(o, { silent = false } = {}) {
    // ══ اكتشاف المحافظة والمنطقة تلقائياً من جدول جيني (2515 منطقة) ══
    // يحل: "زاخو"→دهوك، "شقلاوة"→أربيل، "عقرة"→دهوك... أي منطقة يكتبها الزبون
    if (!o.governorateCode || !o.cityId) {
      const searchText = `${o.area || ''} ${o.address || ''}`.trim();
      // مرّر المحافظة الموجودة (إن كانت) لتقييد البحث داخلها فقط
      const found = await lookupCityInJenni(searchText, o.governorateCode || null);
      if (found) {
        const gov = IRAQ_GOVERNORATES.find((g) => g.code === found.governorate_code);
        const patch = {
          governorate_code: found.governorate_code,
          governorate_name: gov?.name || null,
        };
        // حدّث المنطقة والكود فقط إذا وُجدت منطقة فعلية (لا نمسح منطقة صحيحة بـ null)
        if (found.city_id && found.city_name) {
          patch.city_id = found.city_id;
          patch.area = found.city_name;
        }
        o = {
          ...o,
          governorateCode: found.governorate_code,
          governorateName: gov?.name || o.governorateName,
          cityId: found.city_id || o.cityId,
          area: (found.city_name || o.area),
        };
        try { await sbUpdate('alfhd_orders', o.id, patch); } catch (_e) { /* تجاهل */ }
        setOrders((prev) => prev.map((x) => x.id === o.id ? {
          ...x, governorateCode: found.governorate_code, governorateName: gov?.name, cityId: found.city_id || x.cityId, area: (found.city_name || x.area),
        } : x));
      }
    }
    // احتياط: الخريطة اليدوية للمراكز الكبيرة إن لم يجد في الجدول
    if (!o.governorateCode) {
      const inferred = inferGovFromText(o.area) || inferGovFromText(o.address);
      if (inferred) {
        const gov = IRAQ_GOVERNORATES.find((g) => g.code === inferred);
        o = { ...o, governorateCode: inferred, governorateName: gov?.name || o.governorateName };
        try { await sbUpdate('alfhd_orders', o.id, { governorate_code: inferred, governorate_name: gov?.name || null }); } catch (_e) { /* تجاهل */ }
        setOrders((prev) => prev.map((x) => x.id === o.id ? { ...x, governorateCode: inferred, governorateName: gov?.name } : x));
      }
    }
    // ── خط دفاع: التحقق من كل الحقول الإجبارية قبل الإرسال ──
    if (!o.governorateCode || !o.phone) {
      const msg = 'لا يمكن الإرسال لشركة التوصيل: المحافظة ورقم الهاتف مطلوبان';
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: msg } : x)));
      if (!silent) alert(msg);
      return false;
    }
    const cleanPhone = normalizeIraqiPhone(o.phone);
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('07')) {
      const msg = `رقم الهاتف غير صالح: ${o.phone} — يجب أن يكون بصيغة 07XXXXXXXXX`;
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: msg } : x)));
      if (!silent) alert(msg);
      return false;
    }
    // المنطقة: من area أو العنوان، وإن لم توجد نستخدم اسم المحافظة (لا نرفض الإرسال)
    let cityValue = String(o.area || '').trim() || String(o.address || '').split(' - ')[1]?.trim() || '';
    if (!cityValue) {
      cityValue = String(o.governorateName || '').trim() || String(o.address || '').split(' - ')[0]?.trim() || 'غير محدد';
    }
    // city_id: استُنتج مسبقاً من lookupCityInJenni الصارمة (المقيّدة بالمحافظة)
    // إن لم يوجد، نبحث مرة أخيرة داخل محافظة الطلب فقط (لا بحث شامل عشوائي)
    let cityId = o.cityId || null;
    if (!cityId && o.governorateCode) {
      const strictFound = await lookupCityInJenni(`${o.area || ''} ${o.address || ''}`.trim(), o.governorateCode);
      if (strictFound && strictFound.city_id) {
        cityId = strictFound.city_id;
        cityValue = strictFound.city_name || cityValue;
      }
    }
    // ملاذ أخير: المحافظة معروفة لكن لم نجد كود المنطقة → استخدم مركز/أشهر منطقة بالمحافظة
    // (يضمن قبول جيني بدل رفض الطلب — التوصيل يتواصل مع الزبون للعنوان الدقيق)
    if (!cityId && o.governorateCode) {
      try {
        if (!citiesCacheRef.current) {
          const all = await sbSelect('jenni_cities', 'select=city_id,city_name,city_name_norm,governorate_code&limit=3000');
          citiesCacheRef.current = Array.isArray(all) ? all : [];
        }
        const govCities = citiesCacheRef.current.filter((c) => c.governorate_code === o.governorateCode);
        if (govCities.length) {
          // فضّل منطقة اسمها = اسم المحافظة (المركز)، وإلا أول منطقة
          const govNameNorm = normalizeArJS(o.governorateName || '').replace(/\s/g, '');
          const center = govCities.find((c) => {
            const cn = normalizeArJS(c.city_name_norm || c.city_name).replace(/\s/g, '');
            return cn === govNameNorm || cn.includes(govNameNorm) || govNameNorm.includes(cn);
          }) || govCities[0];
          cityId = center.city_id;
          // نُبقي اسم المنطقة الأصلي في العنوان، ونستخدم كود المركز فقط
          if (!o.area) cityValue = center.city_name;
        }
      } catch (_e) { /* تجاهل */ }
    }
    if (!Number(o.total) || Number(o.total) <= 0) {
      const msg = 'المبلغ يجب أن يكون أكبر من صفر';
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: msg } : x)));
      if (!silent) alert(msg);
      return false;
    }

    // ── ملاحظات التوصيل: نوع الطلب + المنتجات (نوع السيارة، الموديل، النوعية) ──
    const noteText = [
      o.orderType ? o.orderType.trim() : '',
      o.items ? o.items.trim() : '',
    ].filter(Boolean).join(' — ');

    // ── البيانات المرسلة لشركة التوصيل ──
    const cleanAmount = parseAmountIQD(o.total);
    // العنوان الكامل: نضم المنطقة الأصلية التي كتبها الزبون + العنوان التفصيلي
    // (يضمن وصول المندوب للموقع الصحيح حتى لو استخدمنا كود مركز المحافظة)
    const fullAddress = [o.area, o.address].filter(Boolean).map((s) => String(s).trim()).filter((s, i, arr) => s && arr.indexOf(s) === i).join(' - ');
    const shipmentPayload = {
      external_shipment_id: String(o.id),
      shipment_number: String(o.orderNo || o.id),
      receiver_name: o.customer || '',
      receiver_phone_1: cleanPhone,
      governorate_code: o.governorateCode,
      city: cityValue,
      ...(cityId ? { city_id: cityId } : {}),
      address: fullAddress || String(o.address || '').trim() || cityValue,
      amount_iqd: cleanAmount,
      note: noteText || undefined,
    };

    console.log('📦 إرسال لشركة التوصيل:', shipmentPayload);

    try {
      const res = await fetch(JENNI_CREATE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify(shipmentPayload),
      });

      let data = {};
      const rawText = await res.text();
      try { data = JSON.parse(rawText); } catch (_) { data = { raw: rawText }; }

      console.log('📬 رد شركة التوصيل:', res.status, data);

      // نجاح حقيقي = جيني أنشأ شحنة فعلية (shipment_id موجود)
      const realShipmentId = data.shipment_id || data.data?.shipment_id || data.shipment?.id || null;
      const realTracking = data.tracking_number || data.data?.tracking_number || data.shipment?.tracking_number || null;
      if (res.ok && realShipmentId) {
        const patch = {
          jenni_sent: true,
          jenni_shipment_id: realShipmentId,
          jenni_tracking: realTracking,
          delivery_status: 'sorting',
        };
        setOrders((prev) => prev.map((x) => (x.id === o.id ? {
          ...x,
          jenniSent: true,
          jenniShipmentId: realShipmentId,
          jenniTracking: realTracking,
          jenniError: null,
          deliveryStatus: 'sorting',
        } : x)));
        try { await sbUpdate('alfhd_orders', o.id, patch); } catch (_e) { /* تجاهل */ }
        console.log('✅ تم الإرسال لشركة التوصيل بنجاح، shipment_id:', realShipmentId);
        return { success: true, shipment_id: realShipmentId, tracking_number: realTracking };
      }

      // نجح الرد لكن بدون shipment_id → نعرض سبب جيني الحقيقي + البيانات المُرسلة
      if (res.ok && !realShipmentId) {
        const reason = data?.jenni_error || data?.create_response?.message || 'بيانات ناقصة أو غير مقبولة';
        const sent = data?.sent_payload || {};
        const diag = `المحافظة: ${sent.governorate_code || o.governorateCode || '—'} | كود المنطقة: ${sent.city_id || cityId || 'مفقود'} | المنطقة: ${cityValue || '—'}`;
        const msg = `الطلب #${o.orderNo} — لم تُنشأ الشحنة:\n${reason}\n\n${diag}`;
        setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: `${reason} (${diag})`, jenniSent: false } : x)));
        console.error('❌ جيني رفض الطلب:', reason, 'المُرسل:', sent);
        if (!silent) alert(msg);
        return false;
      }

      // 409 = موجود مسبقاً
      if (res.status === 409) {
        const patch = { jenni_sent: true, delivery_status: 'sorting' };
        setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniSent: true, jenniError: null, deliveryStatus: 'sorting' } : x)));
        try { await sbUpdate('alfhd_orders', o.id, patch); } catch (_e) { /* تجاهل */ }
        console.log('ℹ️ الطلب موجود مسبقاً في شركة التوصيل');
        return true;
      }

      const errMsg = data?.error || data?.message || data?.raw || `فشل الإرسال (${res.status})`;
      console.error('❌ فشل الإرسال لشركة التوصيل:', res.status, errMsg, data);
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: errMsg } : x)));
      if (!silent) alert(`فشل الإرسال لشركة التوصيل:\n${errMsg}`);
      return false;
    } catch (e) {
      const errMsg = e?.message || 'خطأ اتصال غير معروف';
      console.error('❌ خطأ في الاتصال بشركة التوصيل:', e);
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: errMsg } : x)));
      if (!silent) alert(`تعذّر الاتصال بشركة التوصيل:\n${errMsg}`);
      return false;
    }
  }

  // ── أزرار الإجراءات المتاحة حسب حالة جيني ──
  // ── تنفيذ إجراء جيني فعلياً (تأجيل/إرجاع/معالجة) عبر الدالة ──
  async function callJenniAction(order, action, { reason = '', postponedDateId = null } = {}) {
    if (!order.jenniShipmentId && !order.orderNo) {
      alert('لا يمكن تنفيذ الإجراء: الطلب غير مرسل لشركة التوصيل');
      return false;
    }
    try {
      const payload = {
        shipment_id: order.jenniShipmentId || undefined,
        shipment_number: order.jenniShipmentId ? undefined : String(order.orderNo),
        action,
        reason,
      };
      if (action === 'POSTPONED') payload.postponed_date_id = postponedDateId || 1;

      const res = await fetch(JENNI_UPDATE_STATUS_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.success) {
        alert(`فشل الإجراء في شركة التوصيل: ${data.error || data.jenni_response?.message || 'خطأ غير معروف'}`);
        return false;
      }

      // تحديث الطلب محلياً + قاعدة البيانات بالحالة الجديدة من جيني
      const patch = {
        delivery_step: data.new_status || order.deliveryStep,
        delivery_step_ar: data.new_status_ar || order.deliveryStepAr,
        delivery_note: reason || order.deliveryNote,
        delivery_updated_at: data.updated_at || new Date().toISOString(),
      };
      try { await sbUpdate('alfhd_orders', order.id, patch); } catch (_e) { /* المزامنة ستصحح لاحقاً */ }
      setOrders((prev) => prev.map((x) => (x.id === order.id ? {
        ...x,
        deliveryStep: patch.delivery_step,
        deliveryStepAr: patch.delivery_step_ar,
        deliveryNote: patch.delivery_note,
        deliveryUpdatedAt: patch.delivery_updated_at,
      } : x)));
      return true;
    } catch (e) {
      alert(`خطأ في الاتصال بشركة التوصيل: ${e.message}`);
      return false;
    }
  }

  // فتح نافذة إجراء يتطلب سبب (تأجيل/إرجاع)
  function openJenniActionModal(order, action, title) {
    setJenniAction({ order, action, title });
    setJenniActionReason('');
    setJenniActionDateId(1);
  }

  // تأكيد نافذة الإجراء
  async function confirmJenniAction() {
    if (!jenniAction) return;
    const { order, action } = jenniAction;
    if (!jenniActionReason.trim()) { alert('السبب مطلوب'); return; }
    setJenniActionBusy(true);
    const ok = await callJenniAction(order, action, {
      reason: jenniActionReason.trim(),
      postponedDateId: action === 'POSTPONED' ? jenniActionDateId : null,
    });
    setJenniActionBusy(false);
    if (ok) {
      setJenniAction(null);
      setDetailOrder(null);
    }
  }

  // ── طباعة باركود الشحنة من جيني (PDF) ──

  async function printJenniBarcode(order) {
    if (!order.orderNo && !order.jenniShipmentId) {
      alert('لا يمكن طباعة الباركود: الطلب غير مرسل لشركة التوصيل');
      return;
    }
    setPrintLoading(true);
    setPrintModal({ title: `باركود الطلب #${order.orderNo}`, html: '', loading: true });
    try {
      // إن لم يُرسَل الطلب لجيني بعد → أرسله الآن أولاً
      if (!order.jenniSent && !order.jenniShipmentId) {
        setPrintModal({ title: `طلب #${order.orderNo}`, html: '', loading: true, note: 'جارٍ إرسال الطلب لشركة التوصيل أولاً...' });
        try {
          const sent = await sendOrderToJenni(order, { silent: true });
          if (sent && (sent.shipment_id || sent.tracking_number)) {
            order = { ...order, jenniSent: true, jenniShipmentId: sent.shipment_id || order.jenniShipmentId, jenniTracking: sent.tracking_number || order.jenniTracking };
          } else {
            order = { ...order, jenniSent: true };
          }
        } catch (_e) { /* نكمل */ }
      }

      const payload = {
        shipment_ids: order.jenniShipmentId ? [order.jenniShipmentId] : [],
        shipment_numbers: [order.orderNo, order.jenniShipmentId, order.jenniTracking].filter(Boolean).map(String),
      };
      const res = await fetch(JENNI_STICKERS_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.success) {
        const jr = data.jenni_response;
        const detail = data.error || jr?.message || jr?.error || jr?.msg
          || (jr ? JSON.stringify(jr).slice(0, 300) : '')
          || (data.jenni_status ? `جيني ردّ بالحالة ${data.jenni_status}` : '') || 'غير متاح';
        const tried = [order.orderNo, order.jenniShipmentId, order.jenniTracking].filter(Boolean).join(', ');
        setPrintModal({ title: 'تعذّر الطباعة', error: `${detail}\n\nالأرقام المُجرّبة: ${tried}` });
        console.error('JENNI STICKERS:', JSON.stringify(data, null, 2));
        return;
      }

      let src = '';
      if (data.type === 'pdf_base64' && data.data) src = `data:application/pdf;base64,${data.data}`;
      else if (data.type === 'url' && data.url) src = data.url;
      else { setPrintModal({ title: 'تعذّر الطباعة', error: 'الباركود غير متاح لهذا الطلب' }); return; }

      setPrintModal({ title: `باركود الطلب #${order.orderNo}`, src, count: 1 });
    } catch (e) {
      setPrintModal({ title: 'خطأ', error: e.message });
    } finally {
      setPrintLoading(false);
    }
  }

  function JenniActionsPanel({ o }) {
    if (!o.jenniSent) return null;
    const step = (o.deliveryStep || '').toUpperCase();
    const actions = [];

    const btnStyle = (color, bgA) => ({
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
      background: `rgba(${bgA})`, border: `1px solid ${color}40`,
      borderRadius: 9, color, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    });

    const isDelivered = ['DELIVERED','DELIVERED_ARCHIVED','DELIVERED_PRICE_CHANGED','PARTIALLY_DELIVERED','FORCE_DELIVERY','PAYED'].includes(step);
    const isReturned = step.startsWith('RTO');
    const isActive = !isDelivered && !isReturned; // قيد التوصيل

    // قيد التوصيل: تأجيل / إرجاع / معالجة
    if (isActive) {
      actions.push(
        <button key="postpone" style={btnStyle('#F0A868', '240,168,104,0.10')}
          onClick={() => openJenniActionModal(o, 'POSTPONED', 'تأجيل التوصيل')}>
          <Calendar size={13} /> تأجيل التوصيل
        </button>
      );
      actions.push(
        <button key="return" style={btnStyle('#F25050', '242,80,80,0.08')}
          onClick={() => openJenniActionModal(o, 'RETURNED_WITH_AGENT', 'إرجاع الطلب')}>
          <XCircle size={13} /> إرجاع الطلب
        </button>
      );
    }

    // راجع: تأكيد الإرجاع وأرشفة
    if (isReturned) {
      actions.push(
        <button key="confirm_return" style={btnStyle('#F25050', '242,80,80,0.08')}
          onClick={() => markOrderConverted(o)}>
          <XCircle size={13} /> تأكيد الإرجاع وأرشفة الطلب
        </button>
      );
    }

    // مستلم: تأكيد وأرشفة
    if (isDelivered) {
      actions.push(
        <button key="archive" style={btnStyle('#4DDB6B', '77,219,107,0.08')}
          onClick={() => markOrderConverted(o)}>
          <CheckCircle2 size={13} /> تأكيد الاستلام وأرشفة الطلب
        </button>
      );
    }

    // إجراءات شركة التوصيل (بدون طباعة — الطلب صار عند الشركة فعلياً)
    return (
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actions.length > 0 && <div style={{ fontSize: 12, color: '#8FA0B5', fontWeight: 600, marginBottom: 2 }}>إجراءات شركة التوصيل:</div>}
        {actions}
      </div>
    );
  }

  // طباعة جماعية من جيني — يجلب باركود كل الطلبات دفعة واحدة (داخل modal)
  async function printJenniBatch(orders, { saveBatch = true } = {}) {
    const valid = orders.filter((o) => o.orderNo || o.jenniShipmentId);
    if (valid.length === 0) { alert('لا توجد طلبات صالحة للطباعة'); return; }
    setPrintLoading(true);
    setPrintModal({ title: `طباعة ${valid.length} طلب`, loading: true, note: `جارٍ تحميل ${valid.length} باركود...` });
    try {
      // أرسل الطلبات غير المُرسلة لجيني أولاً.
      // عند الطباعة الأصلية: كل الطلبات غير المرسلة. عند إعادة الطباعة: فقط من لا يملك أي رقم شحنة.
      const notSent = saveBatch
        ? valid.filter((o) => !o.jenniSent && !o.jenniShipmentId)
        : valid.filter((o) => !o.jenniShipmentId && !o.jenniTracking && !o.orderNo);
      if (notSent.length > 0) {
        setPrintModal({ title: `طباعة ${valid.length} طلب`, loading: true, note: `جارٍ إرسال ${notSent.length} طلب لشركة التوصيل أولاً...` });
        for (let i = 0; i < notSent.length; i++) {
          try {
            const sent = await sendOrderToJenni(notSent[i], { silent: true });
            if (sent && (sent.shipment_id || sent.tracking_number)) {
              const idx = valid.findIndex((v) => v.id === notSent[i].id);
              if (idx >= 0) valid[idx] = { ...valid[idx], jenniSent: true, jenniShipmentId: sent.shipment_id || valid[idx].jenniShipmentId, jenniTracking: sent.tracking_number || valid[idx].jenniTracking };
            }
          } catch (_e) { /* تابع */ }
        }
      }

      // ── الجذر: افصل الطلبات التي لم تُنشأ لها شحنة فعلية عند جيني ──
      // (ليس لها shipment_id ولا tracking) — هذه لن يكون لها باركود، فنستبعدها ونبقيها في الطباعة
      const readyToPrint = valid.filter((o) => o.jenniShipmentId || o.jenniTracking || (o.jenniSent && o.orderNo));
      const notReady = valid.filter((o) => !(o.jenniShipmentId || o.jenniTracking || (o.jenniSent && o.orderNo)));

      if (readyToPrint.length === 0) {
        const names = notReady.map((o) => `#${o.orderNo || '?'}`).join('، ');
        setPrintModal({ title: 'تعذّر الطباعة', error: `لم تُنشأ شحنات لهذه الطلبات في شركة التوصيل (بيانات ناقصة): ${names}\n\nتحقق من المنطقة والهاتف والمحافظة لكل طلب.` });
        return;
      }

      // اجمع أرقام الطلبات الجاهزة فقط
      const allNumbers = [];
      const allIds = [];
      readyToPrint.forEach((o) => {
        if (o.orderNo) allNumbers.push(String(o.orderNo));
        if (o.jenniTracking && o.jenniTracking !== o.orderNo) allNumbers.push(String(o.jenniTracking));
        if (o.jenniShipmentId) allIds.push(String(o.jenniShipmentId));
      });
      if (allNumbers.length === 0 && allIds.length === 0) {
        setPrintModal({ title: 'تعذّر الطباعة', error: 'هذه الطلبات لا تحتوي أرقام شحنات صالحة. أعد إرسالها لشركة التوصيل أولاً.' });
        return;
      }
      const res = await fetch(JENNI_STICKERS_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ shipment_ids: allIds, shipment_numbers: allNumbers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.success) {
        const jr = data.jenni_response;
        const detail = data.error || jr?.message || jr?.error || (jr ? JSON.stringify(jr).slice(0,200) : '') || 'غير متاح';
        setPrintModal({ title: 'تعذّر الطباعة', error: detail });
        return;
      }

      let src = '';
      if (data.type === 'pdf_base64' && data.data) src = `data:application/pdf;base64,${data.data}`;
      else if (data.type === 'url' && data.url) src = data.url;
      else { setPrintModal({ title: 'تعذّر الطباعة', error: 'الباركود غير متاح' }); return; }

      setPrintModal({ title: `طباعة ${readyToPrint.length} طلب`, src, count: readyToPrint.length });

      // احفظ الدفعة + انقل لقيد التجهيز
      // readyToPrint مضمونة: لها shipment_id أو tracking فعلي (تحقّقنا عند الإرسال)
      if (saveBatch) {
        const printedIds = readyToPrint.map((o) => o.id);
        const batchId = `batch-${Date.now()}`;
        const printedAt = new Date().toISOString();
        setOrders((prev) => prev.map((o) => printedIds.includes(o.id) ? { ...o, printed: true, printBatchId: batchId, printedAt, stage: 'prep' } : o));
        for (const id of printedIds) {
          try { await sbUpdate('alfhd_orders', id, { printed: true, print_batch_id: batchId, printed_at: printedAt, stage: 'prep' }); } catch (_e) { /* تجاهل */ }
        }

        // تنبيه عن الطلبات الناقصة التي استُبعدت (لم تُنشأ لها شحنة)
        if (notReady.length > 0) {
          const names = notReady.map((o) => `#${o.orderNo || '?'}`).join('، ');
          setPrintModal({
            title: `طُبع ${printedIds.length} من ${valid.length}`,
            src, count: printedIds.length,
            warning: `${notReady.length} طلب لم يُطبع (بيانات ناقصة): ${names}. بقيت في قسم الطباعة — صحّح بياناتها.`,
          });
        }
      }
    } catch (e) {
      setPrintModal({ title: 'خطأ', error: e.message });
    } finally {
      setPrintLoading(false);
    }
  }

  function handlePrintReady() {
    if (stageOrders.length === 0) { alert('لا توجد طلبات جاهزة للطباعة'); return; }
    // افصل المكتمل عن الناقص — لا نحاول طباعة طلب ناقص البيانات
    const complete = stageOrders.filter((o) => Object.keys(validateJenniFields(o)).length === 0);
    const incomplete = stageOrders.filter((o) => Object.keys(validateJenniFields(o)).length > 0);
    if (complete.length === 0) {
      alert(`كل الطلبات (${incomplete.length}) تحتاج إكمال بيانات قبل الطباعة.\nراجع الطلبات المميّزة باللون البرتقالي وأكمل الناقص (المنطقة، الهاتف، المحافظة).`);
      return;
    }
    if (incomplete.length > 0) {
      const names = incomplete.map((o) => `#${o.orderNo || '?'}`).join('، ');
      if (!window.confirm(`${complete.length} طلب جاهز للطباعة.\n\n${incomplete.length} طلب ناقص البيانات سيُتخطّى: ${names}\n\nمتابعة طباعة المكتمل فقط؟`)) return;
    }
    printJenniBatch(complete, { saveBatch: true });
  }

  function handleReprintBatch(batchId, batchOrders) {
    printJenniBatch(batchOrders, { saveBatch: false });
  }

  // تجميع الطلبات المطبوعة في دفعات (للسجل) — من بيانات الطلبات نفسها
  const printBatches = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      if (!o.printBatchId || !o.printed) return;
      if (!map[o.printBatchId]) map[o.printBatchId] = { batchId: o.printBatchId, printedAt: o.printedAt, orders: [] };
      map[o.printBatchId].orders.push(o);
      // خذ أحدث تاريخ
      if (o.printedAt && (!map[o.printBatchId].printedAt || o.printedAt > map[o.printBatchId].printedAt)) {
        map[o.printBatchId].printedAt = o.printedAt;
      }
    });
    return Object.values(map).sort((a, b) => (b.printedAt || '').localeCompare(a.printedAt || ''));
  }, [orders]);

  function fmtBatchDate(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      const date = d.toLocaleDateString('ar-IQ', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const time = d.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
      return `${date} · ${time}`;
    } catch { return iso; }
  }

  // إعادة طلبات مهملة لقسم الطباعة
  async function restoreNeglected(ids) {
    if (!ids.length) return;
    const now = new Date().toISOString();
    setOrders((prev) => prev.map((o) => ids.includes(o.id)
      ? { ...o, stage: 'ready', printed: false, printBatchId: null, printedAt: null, createdAt: now }
      : o));
    for (const id of ids) {
      try { await sbUpdate('alfhd_orders', id, { stage: 'ready', printed: false, print_batch_id: null, printed_at: null, created_at: now }); } catch (_e) { /* تجاهل */ }
    }
    setNeglectedSelected([]);
  }

  // حذف طلبات مهملة نهائياً
  async function deleteNeglected(ids) {
    if (!ids.length) return;
    if (!window.confirm(`حذف ${ids.length} طلب نهائياً؟ لا يمكن التراجع.`)) return;
    setOrders((prev) => prev.filter((o) => !ids.includes(o.id)));
    for (const id of ids) {
      try { await sbDelete('alfhd_orders', id); } catch (_e) { /* تجاهل */ }
    }
    setNeglectedSelected([]);
  }

  function toggleNeglectedSelect(id) {
    setNeglectedSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  // نقل الطلب لمرحلة شركة التوصيل الفعلية: غالباً يكون منشأ مسبقاً في Jenni من لحظة الطباعة
  // إذا لم يكن منشأ لأي سبب، نحاول إنشاءه قبل النقل حتى يبقى التطابق صحيحاً.
  async function moveToDelivery(o) {
    const sentOk = o.jenniSent || await sendOrderToJenni(o);
    if (!sentOk) return;
    const patch = { stage: 'delivery', delivery_status: 'sorting', status: 'pending' };
    setOrders((prev) => prev.map((x) => (x.id === o.id ? {
      ...x, stage: 'delivery', deliveryStatus: 'sorting', jenniSent: true, status: 'pending',
    } : x)));
    setDetailOrder(null);
    try {
      await sbUpdate('alfhd_orders', o.id, patch);
    } catch (e) { console.error('move to delivery error:', e); }
  }

  const prepBatches = useMemo(() => groupByBatch(stageOrders), [stageOrders]);

  // ── قسم "مطبوع": التبويبات الفرعية ودوال الطباعة ──
  const HOUR = 3600000;
  // طلب يحتاج متابعة: مطبوع ومر عليه وقت دون أن يُرسل/يُستلم من الشركة
  function followupLevel(o) {
    if (o.jenniSent || o.deliveryStep) return null; // أُرسل/استُلم — لا يحتاج متابعة
    const ref = o.printedAt || o.createdAt || o.date;
    if (!ref) return null;
    const hrs = (Date.now() - new Date(ref).getTime()) / HOUR;
    if (hrs >= 48) return 'red';
    if (hrs >= 30) return 'orange';
    return null;
  }
  // كل الطلبات المطبوعة (الأحدث أولاً) — مستقل عن فلتر التاريخ/البحث حتى ما تنخفي طلبات
  const prepAllOrders = useMemo(() => {
    const scoped = visibleOrders.filter((o) => {
      if (selectedPage !== 'all' && o.pageId !== selectedPage) return false;
      const stage = o.stage || (o.printed ? 'prep' : 'ready');
      return stage === 'prep';
    });
    return scoped.sort((a, b) => {
      const ta = new Date(b.printedAt || b.createdAt || b.date || 0).getTime();
      const tb = new Date(a.printedAt || a.createdAt || a.date || 0).getTime();
      return ta - tb;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleOrders, selectedPage]);
  // طلبات بحاجة لمتابعة (برتقالي 30س، أحمر 48س)
  // مهم: يفحص كل الطلبات المطبوعة (stage=prep) بغض النظر عن القسم الحالي أو فلتر التاريخ/البحث،
  // حتى ما تنخفي طلبات متأخرة بسبب فلتر مفعّل بمكان ثاني.
  const prepFollowup = useMemo(() => {
    const scoped = visibleOrders.filter((o) => {
      if (selectedPage !== 'all' && o.pageId !== selectedPage) return false;
      const stage = o.stage || (o.printed ? 'prep' : 'ready');
      return stage === 'prep';
    });
    return scoped
      .filter((o) => followupLevel(o))
      .sort((a, b) => new Date(a.printedAt || a.createdAt || a.date || 0) - new Date(b.printedAt || b.createdAt || b.date || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleOrders, selectedPage]);

  function togglePrepSelect(id) {
    setPrepSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }
  // طباعة طلب واحد
  function printSingleOrder(o) {
    printJenniBatch([o], { saveBatch: false });
  }
  // طباعة الطلبات المحددة
  function printSelectedPrep() {
    const chosen = prepAllOrders.filter((o) => prepSelected.includes(o.id));
    if (chosen.length === 0) { alert('حدّد طلباً واحداً على الأقل'); return; }
    printJenniBatch(chosen, { saveBatch: false });
    setPrepSelected([]);
  }

  // ── ورقة تجهيز: عنوان الطلب داخل المخزن + اسم المجهّز بمكان كبير واضح ──
  function printPrepSheet(list) {
    const arr = Array.isArray(list) ? list : [list];
    if (arr.length === 0) { alert('حدّد طلباً واحداً على الأقل'); return; }
    const win = window.open('', '_blank');
    if (!win) { alert('السماح بالنوافذ المنبثقة مطلوب'); return; }
    const sheets = arr.map((o) => {
      const preparedBy = o.prepByName ? `تم التجهيز من قبل الموظف: ${o.prepByName}` : '';
      const loc = o.storageLocation || '';
      return `
      <div class="sheet">
        <div class="row"><span class="lbl">رقم الطلب</span><span class="val">#${o.orderNo || '—'}</span></div>
        <div class="row"><span class="lbl">الزبون</span><span class="val">${o.customer || '—'}</span></div>
        <div class="row"><span class="lbl">نوع الطلب</span><span class="val">${o.orderType || o.items || '—'}</span></div>
        <div class="loc-box">
          <div class="loc-title">موقع الطلب داخل المخزن</div>
          <div class="loc-val">${loc || '<span class="empty">________________</span>'}</div>
        </div>
        <div class="prep-box">
          <div class="prep-title">اسم المجهّز</div>
          <div class="prep-val">${preparedBy || '<span class="empty">________________</span>'}</div>
        </div>
      </div>`;
    }).join('');
    win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>ورقة تجهيز</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;font-family:Cairo,Arial}
        body{padding:16px;background:#fff;color:#111}
        .np{padding:10px 22px;background:#2AABEE;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:800;margin-bottom:14px;cursor:pointer}
        .sheet{border:2px solid #111;border-radius:12px;padding:20px;margin-bottom:16px;page-break-after:always}
        .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #ccc;font-size:16px}
        .lbl{color:#666;font-weight:700}.val{font-weight:800}
        .loc-box,.prep-box{margin-top:16px;border:2px dashed #2AABEE;border-radius:10px;padding:16px;text-align:center}
        .loc-title,.prep-title{font-size:14px;color:#2AABEE;font-weight:800;margin-bottom:8px}
        .loc-val,.prep-val{font-size:30px;font-weight:800;min-height:40px}
        .prep-box{border-color:#22A559}.prep-title{color:#22A559}
        .empty{color:#bbb;letter-spacing:3px}
        @media print{.np{display:none}}
      </style></head><body>
      <button class="np" onclick="window.print()">🖨️ طباعة ${arr.length} ورقة تجهيز</button>
      ${sheets}
      </body></html>`);
    win.document.close();
  }

  function printSelectedPrepSheets() {
    const chosen = prepAllOrders.filter((o) => prepSelected.includes(o.id));
    printPrepSheet(chosen);
  }

  function StageStatusBadge({ o }) {
    if (section === 'delivery') {
      const stepU = (o.deliveryStep || '').toUpperCase();
      const isDelivered = ['DELIVERED','DELIVERED_ARCHIVED','DELIVERED_PRICE_CHANGED','PARTIALLY_DELIVERED','FORCE_DELIVERY','PAYED'].includes(stepU);
      const isReturned = stepU.startsWith('RTO');
      let color, bg;
      if (isDelivered) { color = '#4DDB6B'; bg = 'rgba(77,219,107,0.12)'; }
      else if (isReturned) { color = '#F25050'; bg = 'rgba(242,80,80,0.12)'; }
      else if (['OFD','OUT_FOR_DELIVERY'].includes(stepU)) { color = '#2AABEE'; bg = 'rgba(42,171,238,0.12)'; }
      else { color = '#A78BFA'; bg = 'rgba(167,139,250,0.12)'; }
      // حالة جيني الفعلية فقط (كما هي عند شركة التوصيل)
      const label = o.deliveryStepAr || 'بانتظار التحديث';
      return <div style={{ ...styles.orderStatusPill, color, background: bg }}>{label}</div>;
    }
    if (section === 'prep') {
      // في قسم "مطبوع": نعرض حالة التجهيز الفعلية
      const ps = o.prepStatus;
      if (ps === 'done' || ps === 'prepared') {
        return <div style={{ ...styles.orderStatusPill, color: '#4DDB6B', background: 'rgba(77,219,107,0.12)' }}>تم التجهيز</div>;
      }
      if (ps === 'rejected' || ps === 'not_prepared') {
        return <div style={{ ...styles.orderStatusPill, color: '#F45B69', background: 'rgba(244,91,105,0.12)' }}>لم يتم التجهيز</div>;
      }
      if (ps === 'claiming' || ps === 'preparing') {
        return <div style={{ ...styles.orderStatusPill, color: '#F0A868', background: 'rgba(240,168,104,0.12)' }}>قيد التجهيز</div>;
      }
      return <div style={{ ...styles.orderStatusPill, color: '#60A5FA', background: 'rgba(96,165,250,0.12)' }}>مطبوع</div>;
    }
    return <div style={{ ...styles.orderStatusPill, color: '#3B82F6', background: 'rgba(59,130,246,0.12)' }}>جديد</div>;
  }

  function renderOrderCard(o, index = 0, prepMode = false) {
    const page = pages.find((p) => p.id === o.pageId);
    const isRejected = o.prepStatus === 'rejected';
    const stepU = (o.deliveryStep || '').toUpperCase();
    let stripColor = '#2AABEE';
    if (o.converted) stripColor = '#4DDB6B';
    else if (isRejected) stripColor = '#F25050';
    else if (stepU.startsWith('RTO')) stripColor = '#F25050';
    else if (['DELIVERED','DELIVERED_ARCHIVED','DELIVERED_PRICE_CHANGED','PARTIALLY_DELIVERED','FORCE_DELIVERY','PAYED'].includes(stepU)) stripColor = '#4DDB6B';
    else if (stepU) stripColor = '#F0A868';
    // في قسم المطبوع: لون حسب حاجة المتابعة
    const fLevel = prepMode ? followupLevel(o) : null;
    const cardBorder = fLevel === 'red' ? '2px solid #F25050' : fLevel === 'orange' ? '2px solid #F0A868' : undefined;
    const cardBg = fLevel === 'red' ? 'rgba(242,80,80,0.06)' : fLevel === 'orange' ? 'rgba(240,168,104,0.06)' : undefined;
    const isSel = prepSelected.includes(o.id);
    return (
      <div
        key={o.id}
        style={{ ...styles.orderCard, ...(isRejected ? styles.rejectedCard : {}), ...(cardBorder ? { border: cardBorder } : {}), ...(cardBg ? { background: cardBg } : {}), animationDelay: `${Math.min(index * 0.04, 0.4)}s` }}
        className="alfhd-order-card alfhd-card-enter"
      >
        <div style={{ height: 3, background: fLevel === 'red' ? '#F25050' : fLevel === 'orange' ? '#F0A868' : stripColor, width: '100%' }} />

        {/* شريط تحديد + طباعة فردية (قسم المطبوع فقط) */}
        {prepMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={() => togglePrepSelect(o.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSel ? '#2AABEE' : 'transparent', border: `1.5px solid ${isSel ? '#2AABEE' : '#8FA0B5'}` }}>
                {isSel && <CheckCircle2 size={13} color="#fff" />}
              </span>
              <span style={{ fontSize: 12, color: '#9FB0C3', fontWeight: 600 }}>تحديد</span>
            </button>
            {fLevel && (
              <span style={{ fontSize: 12, fontWeight: 800, color: fLevel === 'red' ? '#F25050' : '#F0A868' }}>
                {fLevel === 'red' ? '⚠️ متأخر +48س' : '⏱ متابعة +30س'}
              </span>
            )}
            <div style={{ flex: 1 }} />
            <button onClick={() => printSingleOrder(o)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, cursor: 'pointer',
                background: 'rgba(42,171,238,0.12)', border: '1px solid rgba(42,171,238,0.3)', color: '#2AABEE', fontSize: 12, fontWeight: 700 }}>
              <Printer size={13} /> طباعة
            </button>
          </div>
        )}

        {isRejected && (
          <div style={styles.rejectedBanner}>
            <AlertCircle size={16} />
            <span>لم يُجهَّز من قبل المخزن — تحقق قبل الطباعة</span>
          </div>
        )}

        {/* بانر نقص البيانات — يظهر في قسم الطباعة إذا الطلب غير مكتمل لجيني */}
        {isReady && (() => {
          const errs = validateJenniFields(o);
          const missing = Object.values(errs);
          if (missing.length === 0) return null;
          return (
            <div style={{ background: 'rgba(240,168,104,0.12)', borderBottom: '1px solid rgba(240,168,104,0.25)', padding: '8px 16px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertTriangle size={15} color="#F0A868" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: '#F0A868', fontWeight: 600, lineHeight: 1.6 }}>
                <span style={{ fontWeight: 800 }}>يحتاج إكمال قبل الطباعة:</span> {missing.join(' · ')}
              </div>
            </div>
          );
        })()}

        <div style={styles.orderTicketHead}>
          <div style={styles.orderTicketAvatar}>{o.customer?.[0] || '؟'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.orderCardCustomer}>{o.customer}</div>
            <div style={styles.orderTicketPage}>{page?.avatar} {page?.name || 'بدون صفحة'}</div>
            {(o.date || o.createdAt) && (
              <div style={{ fontSize: 12, color: '#5E6986', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={10} />
                {(() => {
                  try {
                    const d = new Date(o.date || o.createdAt);
                    return d.toLocaleDateString('ar-IQ', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  } catch { return o.date || ''; }
                })()}
              </div>
            )}
          </div>
          <StageStatusBadge o={o} />
        </div>

        {isRejected && o.prepReason && (
          <div style={styles.rejectReasonBox}>
            <span style={styles.rejectReasonLabel}>سبب المخزن:</span>
            <span>{o.prepReason}{o.prepByName ? ` — ${o.prepByName}` : ''}</span>
          </div>
        )}

        {o.reprepNote && (
          <div style={styles.orderReprepNoteBox}>
            <AlertCircle size={14} />
            <span><strong>ملاحظة {o.reprepByName || 'المدير'}:</strong> {o.reprepNote}</span>
          </div>
        )}

        <div style={styles.orderTicketBody}>
          {o.orderType && (
            <div style={styles.orderDetailRow}><Package size={12} color="#5E6986" /><span>{o.orderType}</span></div>
          )}
          {o.phone && (
            <div style={styles.orderDetailRow}><Phone size={12} color="#5E6986" /><span>{o.phone}</span></div>
          )}
          {(o.governorateName || o.address) && (
            <div style={styles.orderDetailRow}><MapPin size={12} color="#5E6986" /><span>{[o.governorateName, o.area, o.address].filter(Boolean).join(' - ')}</span></div>
          )}
          {o.items && <div style={styles.orderTicketItems}>{o.items}</div>}

          {/* ── موقع المنتج في المخزن — للمجهّز فقط ── */}
          {section === 'prep' && (() => {
            const match = matchOrderToWarehouseProduct(o, warehouseProducts);
            if (!match) return (
              <div style={{ fontSize: 12, color: '#F0A868', background: 'rgba(240,168,104,0.08)', border: '1px solid rgba(240,168,104,0.2)', borderRadius: 8, padding: '8px 8px', marginTop: 4 }}>
                ⚠️ لم يُعثر على منتج مطابق في المخزن
              </div>
            );
            const { product, confidence } = match;
            return (
              <div style={{ background: confidence === 'high' ? 'rgba(77,219,107,0.07)' : 'rgba(42,171,238,0.07)', border: `1px solid ${confidence === 'high' ? 'rgba(77,219,107,0.22)' : 'rgba(42,171,238,0.22)'}`, borderRadius: 9, padding: '8px 8px', marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: confidence === 'high' ? '#4DDB6B' : '#2AABEE', marginBottom: 4 }}>
                  📦 المنتج في المخزن {confidence === 'high' ? '✓' : '~'}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#F5F5F5' }}>
                  {product.car_name} — {PRODUCT_TYPE_LABELS[product.type]}
                </div>
                {product.location && (
                  <div style={{ fontSize: 12, color: '#2AABEE', marginTop: 4, fontWeight: 700 }}>
                    📍 الموقع: {product.location}
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 2 }}>
                  المتبقي في المخزن: {product.quantity} قطعة
                </div>
              </div>
            );
          })()}

          {/* ── معلومات شركة التوصيل (للمتابعة فقط — التحكم من جيني) ── */}
          {o.jenniSent && (o.deliveryNote || o.jenniTracking) && (
            <div style={{ marginTop: 8, padding: '8px 8px', background: 'rgba(42,171,238,0.05)', border: '1px solid rgba(42,171,238,0.12)', borderRadius: 10 }}>
              {o.deliveryNote && (
                <div style={{ fontSize: 12, color: '#8B9AB3', marginBottom: 4 }}>📝 {o.deliveryNote}</div>
              )}
              {o.jenniTracking && (
                <div style={{ fontSize: 12, color: '#8FA0B5', fontFamily: 'monospace' }}>تتبع: #{o.jenniTracking}</div>
              )}
            </div>
          )}
        </div>

        {o.jenniError && (
          <div style={{ margin: '0 0 8px', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(244,91,105,0.3)' }}>
            <div style={{ background: 'rgba(244,91,105,0.1)', padding: '8px 8px', fontSize: 12, color: '#F45B69', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ flexShrink: 0 }}>⚠️</span>
              <span>{o.jenniError}</span>
            </div>
            <button
              onClick={() => startEditOrder(o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '8px', background: 'rgba(244,91,105,0.08)',
                border: 'none', borderTop: '1px solid rgba(244,91,105,0.18)',
                color: '#F45B69', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              <Edit3 size={12} /> إصلاح البيانات — سيُرسَل لشركة التوصيل تلقائياً
            </button>
          </div>
        )}
        <div style={styles.orderCardActions} className="alfhd-no-print">
          <button onClick={() => setDetailOrder(o)} style={{ ...styles.orderActionBtn, flex: 1.6 }} title="عرض التفاصيل">
            <Eye size={14} /> <span style={{ fontSize: 12, fontWeight: 700 }}>التفاصيل</span>
          </button>
          {/* زر طباعة فردي — في قسم الطباعة فقط (المطبوع له زره الخاص بالأعلى) */}
          {section === 'ready' && (
            <button onClick={() => printJenniBarcode(o)} style={{ ...styles.orderActionBtn, flex: 1.2, color: '#2AABEE', borderColor: 'rgba(42,171,238,0.3)' }} title="طباعة باركود هذا الطلب">
              <Printer size={14} /> <span style={{ fontSize: 12, fontWeight: 700 }}>طباعة</span>
            </button>
          )}
          {/* زر المحادثة — الزر الوحيد من الموقع، يفتح محادثة الزبون */}
          {o.conversationId && (
            <button onClick={() => onViewConversation?.(o.conversationId)} style={styles.orderActionBtn} title="محادثة الزبون">
              <MessageSquare size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  const isReady = section === 'ready';
  const isPrep = section === 'prep';
  const isDelivery = section === 'delivery';

  return (
    <div style={styles.viewWrap}>
      {/* ── هيدر الطلبات ── */}
      <div style={styles.viewHeader} className="alfhd-view-header alfhd-no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div>
            <h2 style={styles.viewTitle}>الطلبات</h2>
            <p style={styles.viewSubtitle}>متابعة كاملة عبر مراحل الطباعة والتجهيز والتوصيل</p>
          </div>
        </div>
        {/* شريط إحصائيات اليوم السريعة */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%', marginTop: 4 }} className="alfhd-no-print">
          {[
            { label: 'طلبات اليوم', value: todayStats.total, color: '#3B82F6' },
            { label: 'طُبعت اليوم', value: todayStats.printed, color: '#F0A868' },
            { label: 'سُلّمت اليوم', value: todayStats.delivered, color: '#4DDB6B' },
            { label: 'رواجع اليوم', value: todayStats.returned, color: '#F45B69' },
          ].map((s) => (
            <div key={s.label} style={{ flex: '1 1 auto', minWidth: 80, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 11, padding: '8px 12px' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#9FB0C3', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {/* أزرار الإجراءات — صف أنيق */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>

          {/* بحث عام */}
          <div style={styles.globalOrderSearchWrap}>
            <Search size={14} color="#60A5FA" />
            <input
              value={globalOrderSearch}
              onChange={(e) => setGlobalOrderSearch(e.target.value)}
              placeholder="بحث سريع..."
              style={styles.globalOrderSearchInput}
            />
            {globalOrderSearch.trim().length >= 2 && (
              <div style={styles.globalOrderResultsBox}>
                {globalOrderResults.length === 0 ? (
                  <div style={styles.globalOrderEmpty}>لا توجد نتائج</div>
                ) : globalOrderResults.map((o) => {
                  const page = pages.find((p) => p.id === o.pageId);
                  return (
                    <button key={o.id} onClick={() => openOrderFromGlobalSearch(o)} style={styles.globalOrderResultItem}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={styles.globalOrderResultTitle}>{o.customer || 'بدون اسم'} <span>#{o.orderNo}</span></div>
                        <div style={styles.globalOrderResultMeta}>{page?.name || 'بدون صفحة'} · {o.phone || 'بدون هاتف'}</div>
                      </div>
                      <OrderStagePill order={o} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <input type="file" accept="image/*" ref={ocrInputRef} onChange={handlePickOcrImage} style={{ display: 'none' }} />

          {/* زر إضافة بالصورة */}
          <button
            onClick={() => ocrInputRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', background: 'rgba(42,171,238,0.10)',
              border: '1px solid rgba(42,171,238,0.22)', borderRadius: 10,
              color: '#2AABEE', fontSize: 12.5, fontWeight: 700,
            }}
            disabled={ocrLoading}
          >
            {ocrLoading
              ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <Image size={14} />}
            {ocrLoading ? 'جارٍ الاستخراج...' : 'إضافة بصورة'}
          </button>

          {/* زر إضافة طلب */}
          <button
            onClick={startNewOrder}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px',
              background: 'linear-gradient(135deg,#2AABEE,#229ED9)',
              border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 12.5, fontWeight: 700,
              boxShadow: '0 2px 8px rgba(42,171,238,0.35)',
            }}
          >
            <Plus size={15} /> طلب جديد
          </button>

          {/* زر طباعة — فقط في قسم جاهز */}
          {isReady && (
            <button
              onClick={handlePrintReady}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px',
                background: 'linear-gradient(135deg,#4DDB6B,#22C55E)',
                border: 'none', borderRadius: 10,
                color: '#fff', fontSize: 12.5, fontWeight: 700,
                boxShadow: '0 2px 8px rgba(77,219,107,0.35)',
              }}
            >
              <Printer size={15} /> طباعة الكل ({stageOrders.length})
            </button>
          )}
          {/* زر دائرة سجل الدفعات المطبوعة */}
          <button
            onClick={() => setBatchHistoryOpen(true)}
            title="سجل الطباعة"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)',
              color: '#A78BFA', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <Clock size={17} />
          </button>
        </div>
      </div>

      {!isDelivery && (
      <div style={styles.statsRow} className="alfhd-stats-row alfhd-no-print">
        <ClickableStat icon={Package} label="إجمالي الطلبات" value={stats.total} color="#3B82F6"
          active={isDelivery && statusFilter === 'all'} onClick={() => { setSection('delivery'); setStatusFilter('all'); }} />
        <ClickableStat icon={Truck} label="قيد التوصيل" value={stats.pending} color="#3B82F6"
          active={isDelivery && statusFilter === 'pending'} onClick={() => { setSection('delivery'); setStatusFilter('pending'); }} />
        <ClickableStat icon={CheckCircle2} label="مستلمة" value={stats.delivered} color="#4ADE80"
          active={isDelivery && statusFilter === 'delivered'} onClick={() => { setSection('delivery'); setStatusFilter('delivered'); }} />
        <ClickableStat icon={XCircle} label="راجعة" value={stats.returned} color="#F45B69"
          active={isDelivery && statusFilter === 'returned'} onClick={() => { setSection('delivery'); setStatusFilter('returned'); }} />
      </div>
      )}

      <div style={styles.sectionTabs} className="alfhd-no-print">
        {ORDER_STAGES.map((st) => (
          <button
            key={st.id}
            onClick={() => { setSection(st.id); setStatusFilter('all'); }}
            className="alfhd-tab alfhd-ripple"
            style={{ ...styles.sectionTab, ...(section === st.id ? styles.sectionTabActive : {}) }}
          >
            {st.label}
            {st.id !== 'delivery' && (
              <span style={{ ...styles.convTabCount, ...(section === st.id ? styles.convTabCountActive : {}) }}>
                {stageCounts[st.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      <OrderFilters
        pages={pages}
        datePreset={datePreset} setDatePreset={setDatePreset}
        customMonth={customMonth} setCustomMonth={setCustomMonth}
        customYear={customYear} setCustomYear={setCustomYear}
        pageFilter={selectedPage} setPageFilter={setSelectedPage}
        search={search} setSearch={setSearch}
        searchPlaceholder="رقم الطلب، الاسم، الهاتف، أو نوع الطلب..."
      />

      {isDelivery && (
        <div style={{ ...styles.filterChips, marginBottom: 16 }} className="alfhd-no-print">
          {['all', 'pending', 'delivered', 'returned'].map((s) => {
            const cnt = s === 'all' ? stats.total : (s === 'pending' ? stats.pending : s === 'delivered' ? stats.delivered : stats.returned);
            return (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ ...styles.chip, ...(statusFilter === s ? styles.chipActive : {}) }}>
                {s === 'all' ? 'الكل' : STATUS_CONFIG[s].label}
                <span style={{ ...styles.convTabCount, ...(statusFilter === s ? styles.convTabCountActive : {}), marginRight: 4 }}>{cnt}</span>
              </button>
            );
          })}
        </div>
      )}

      {isPrep ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* التبويبات الفرعية */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setPrepSubTab('all')}
              style={{ padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                background: prepSubTab === 'all' ? '#3B82F6' : 'rgba(255,255,255,0.05)', color: prepSubTab === 'all' ? '#fff' : '#9FB0C3' }}>
              الكل ({prepAllOrders.length})
            </button>
            <button onClick={() => setPrepSubTab('followup')}
              style={{ padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, position: 'relative',
                background: prepSubTab === 'followup' ? '#F0A868' : 'rgba(255,255,255,0.05)', color: prepSubTab === 'followup' ? '#fff' : '#9FB0C3' }}>
              بحاجة إلى متابعة ({prepFollowup.length})
            </button>
            <div style={{ flex: 1 }} />
            {/* طباعة المحدد */}
            {prepSelected.length > 0 && (
              <>
              <button onClick={printSelectedPrepSheets}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.4)', cursor: 'pointer',
                  background: 'rgba(34,197,94,0.12)', color: '#22C55E', fontSize: 13, fontWeight: 800 }}>
                <Package size={15} /> ورقة تجهيز ({prepSelected.length})
              </button>
              <button onClick={printSelectedPrep}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#2AABEE,#229ED9)', color: '#fff', fontSize: 13, fontWeight: 800 }}>
                <Printer size={15} /> طباعة المحدد ({prepSelected.length})
              </button>
              </>
            )}
          </div>

          {/* قائمة الطلبات */}
          {(() => {
            const list = prepSubTab === 'followup' ? prepFollowup : prepAllOrders;
            if (list.length === 0) {
              return <div style={styles.emptyState}><Package size={32} color="#39425C" /><p>{prepSubTab === 'followup' ? 'لا توجد طلبات بحاجة لمتابعة' : 'لا توجد طلبات مطبوعة'}</p></div>;
            }
            return <div style={styles.ordersGrid}>{list.map((o) => renderOrderCard(o, 0, true))}</div>;
          })()}
        </div>
      ) : (
        <div style={styles.ordersGrid} className={`alfhd-orders-grid${printTarget === 'ready' ? ' alfhd-print-area' : ''}`}>
          {stageOrders.length === 0 ? (
            <div style={styles.emptyState}>
              {isReady ? <Package size={32} color="#39425C" /> : <Truck size={32} color="#39425C" />}
              <p>{isReady ? 'لا توجد طلبات جاهزة للطباعة' : 'لا توجد طلبات لدى شركة التوصيل بعد'}</p>
            </div>
          ) : stageOrders.map(renderOrderCard)}
        </div>
      )}

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          page={pages.find((p) => p.id === detailOrder.pageId)}
          section={section}
          onClose={() => setDetailOrder(null)}
          onEdit={() => startEditOrder(detailOrder)}
          onDelete={() => handleDelete(detailOrder)}
          onShare={() => handleShare(detailOrder)}
          onViewConversation={detailOrder.conversationId ? () => { onViewConversation?.(detailOrder.conversationId); setDetailOrder(null); } : null}
          onMoveToDelivery={null}
          onReprep={detailOrder.prepStatus === 'rejected' ? (note) => reprepOrder(detailOrder, note) : null}
          onContactCustomer={onContactCustomer}
        />
      )}

      {/* ── نافذة إجراء جيني: تأجيل / إرجاع (تطلب السبب) ── */}
      {jenniAction && (
        <div style={styles.modalOverlay} onClick={() => !jenniActionBusy && setJenniAction(null)}>
          <div style={{ ...styles.modal, maxWidth: 420 }} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{jenniAction.title}</h3>
              <button onClick={() => setJenniAction(null)} style={styles.modalClose}><X size={18} /></button>
            </div>
            <div style={{ padding: '4px 16px 16px' }}>
              <div style={{ fontSize: 12, color: '#8FA0B5', marginBottom: 12 }}>
                طلب #{jenniAction.order.orderNo} — {jenniAction.order.customer}
              </div>

              {/* تاريخ التأجيل (فقط للتأجيل) */}
              {jenniAction.action === 'POSTPONED' && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#E7ECF3', fontWeight: 700, display: 'block', marginBottom: 8 }}>موعد إعادة المحاولة</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ id: 1, t: 'غداً' }, { id: 2, t: 'بعد يومين' }, { id: 3, t: 'بعد 3 أيام' }].map((d) => (
                      <button key={d.id} onClick={() => setJenniActionDateId(d.id)}
                        style={{
                          flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          background: jenniActionDateId === d.id ? 'rgba(42,171,238,0.18)' : 'rgba(255,255,255,0.04)',
                          border: jenniActionDateId === d.id ? '1.5px solid #2AABEE' : '1px solid rgba(255,255,255,0.1)',
                          color: jenniActionDateId === d.id ? '#2AABEE' : '#9FB0C3',
                        }}>{d.t}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* السبب */}
              <label style={{ fontSize: 12, color: '#E7ECF3', fontWeight: 700, display: 'block', marginBottom: 8 }}>
                {jenniAction.action === 'POSTPONED' ? 'سبب التأجيل' : 'سبب الإرجاع'}
                <span style={{ color: '#F25050' }}> *</span>
              </label>
              <textarea
                value={jenniActionReason}
                onChange={(e) => setJenniActionReason(e.target.value)}
                placeholder={jenniAction.action === 'POSTPONED' ? 'مثال: العميل غير متوفر، سيتواصل لاحقاً' : 'مثال: رفض الاستلام، العنوان خاطئ'}
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 9,
                  background: '#242F3D', border: '1.5px solid rgba(42,171,238,0.25)', color: '#E7ECF3',
                  fontSize: 13, fontFamily: 'inherit', resize: 'vertical',
                }}
              />

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => setJenniAction(null)} disabled={jenniActionBusy}
                  style={{ flex: 1, padding: '12px', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#9FB0C3', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  إلغاء
                </button>
                <button onClick={confirmJenniAction} disabled={jenniActionBusy}
                  style={{ flex: 2, padding: '12px', borderRadius: 9, background: jenniActionBusy ? '#1a5a7a' : '#2AABEE', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: jenniActionBusy ? 'wait' : 'pointer' }}>
                  {jenniActionBusy ? 'جارٍ الإرسال...' : 'تأكيد وإرسال لشركة التوصيل'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingOrder && (
        <div style={styles.modalOverlay} onClick={() => !saving && setEditingOrder(null)}>
          <div style={styles.modal} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingOrder.id ? 'تعديل الطلب' : 'إضافة طلب جديد'}</h3>
              <button onClick={() => setEditingOrder(null)} style={styles.modalClose}><X size={18} /></button>
            </div>

            {/* ── بانر تنبيه Jenni ── */}
            <div style={{
              margin: '0 16px 2px',
              padding: '8px 12px',
              background: 'rgba(42,171,238,0.07)',
              border: '1px solid rgba(42,171,238,0.20)',
              borderRadius: 9,
              fontSize: 12,
              color: '#2AABEE',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 600,
            }}>
              <Truck size={13} />
              الحقول المُعلَّمة بـ <span style={{ color: '#F25050', fontWeight: 800 }}>*</span> إجبارية من شركة التوصيل — لن تُقبل الشحنة بدونها
            </div>

            <div style={styles.modalBody}>
              {/* الصفحة */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>الصفحة</label>
                <select aria-label="خيار" value={editingOrder.pageId} onChange={(e) => setEditingOrder({ ...editingOrder, pageId: e.target.value })} style={styles.formInput}>
                  {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* مصدر الطلب — واتساب أو فيسبوك (يظهر للطلبات اليدوية فقط) */}
              {!editingOrder.conversationId && (
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>مصدر الطلب</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setEditingOrder({ ...editingOrder, platform: 'whatsapp' })}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                        background: editingOrder.platform === 'whatsapp' ? 'rgba(37,211,102,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${editingOrder.platform === 'whatsapp' ? '#25D366' : 'rgba(255,255,255,0.08)'}`,
                        color: editingOrder.platform === 'whatsapp' ? '#25D366' : '#9FB0C3' }}>
                      <MessageCircle size={15} /> واتساب
                    </button>
                    <button type="button" onClick={() => setEditingOrder({ ...editingOrder, platform: 'facebook' })}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                        background: editingOrder.platform === 'facebook' ? 'rgba(10,140,255,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${editingOrder.platform === 'facebook' ? '#0A8CFF' : 'rgba(255,255,255,0.08)'}`,
                        color: editingOrder.platform === 'facebook' ? '#0A8CFF' : '#9FB0C3' }}>
                      <MessageSquare size={15} /> فيسبوك
                    </button>
                  </div>
                </div>
              )}

              {/* اسم العميل — إجباري Jenni */}
              <div style={styles.formGroup}>
                <label style={{ ...styles.formLabel, display: 'flex', alignItems: 'center', gap: 4 }}>
                  اسم العميل
                  <span style={{ color: '#F25050', fontWeight: 800, fontSize: 13 }}>*</span>
                </label>
                <input
                  value={editingOrder.customer}
                  onChange={(e) => setEditingOrder({ ...editingOrder, customer: e.target.value })}
                  style={{
                    ...styles.formInput,
                    borderRadius: 9,
                    border: !editingOrder.customer.trim() ? '1.5px solid rgba(242,80,80,0.5)' : '1.5px solid rgba(42,171,238,0.25)',
                    background: '#242F3D',
                  }}
                  placeholder="اسم الزبون الكامل"
                />
                {!editingOrder.customer.trim() && (
                  <span style={{ fontSize: 12, color: '#F25050', marginTop: 4, fontWeight: 600 }}>⚠ مطلوب</span>
                )}
              </div>

              {/* رقم الهاتف — إجباري Jenni */}
              <div style={styles.formGroup}>
                <label style={{ ...styles.formLabel, display: 'flex', alignItems: 'center', gap: 4 }}>
                  رقم الهاتف
                  <span style={{ color: '#F25050', fontWeight: 800, fontSize: 13 }}>*</span>
                  <span style={{ fontSize: 12, color: '#8FA0B5', fontWeight: 500, marginRight: 'auto' }}>07XXXXXXXXX</span>
                </label>
                {(() => {
                  const raw = String(editingOrder.phone || '').trim();
                  const clean = raw ? normalizeIraqiPhone(raw) : '';
                  const phoneOk = raw && clean.length === 11 && clean.startsWith('07');
                  const phoneErr = raw && !phoneOk;
                  return (
                    <>
                      <input
                        value={editingOrder.phone}
                        onChange={(e) => setEditingOrder({ ...editingOrder, phone: toEnglishDigits(e.target.value) })}
                        style={{
                          ...styles.formInput,
                          borderRadius: 9,
                          border: phoneErr ? '1.5px solid rgba(242,80,80,0.5)' : phoneOk ? '1.5px solid rgba(77,219,107,0.4)' : '1.5px solid rgba(242,80,80,0.5)',
                          background: '#242F3D',
                          direction: 'ltr',
                          textAlign: 'right',
                        }}
                        placeholder="07XXXXXXXXX"
                        inputMode="numeric"
                      />
                      {!raw && <span style={{ fontSize: 12, color: '#F25050', marginTop: 4, fontWeight: 600 }}>⚠ مطلوب</span>}
                      {phoneErr && <span style={{ fontSize: 12, color: '#F25050', marginTop: 4, fontWeight: 600 }}>⚠ صيغة خاطئة — المطلوب: 07XXXXXXXXX</span>}
                      {phoneOk && <span style={{ fontSize: 12, color: '#4DDB6B', marginTop: 4, fontWeight: 600 }}>✓ صالح لشركة التوصيل</span>}
                    </>
                  );
                })()}
              </div>

              {/* المحافظة — إجباري Jenni */}
              <div style={styles.formGroup}>
                <label style={{ ...styles.formLabel, display: 'flex', alignItems: 'center', gap: 4 }}>
                  المحافظة
                  <span style={{ color: '#F25050', fontWeight: 800, fontSize: 13 }}>*</span>
                </label>
                {/* زر استخراج تلقائي إذا العنوان فيه محافظة والحقل فاضي */}
                {!editingOrder.governorateCode && editingOrder.address && (() => {
                  const cleanAddr = (editingOrder.address || '').replace(/[*#@!]/g, ' ');
                  const found = IRAQ_GOVERNORATES.find((g) =>
                    cleanAddr.includes(g.name) || cleanAddr.includes(g.name.replace(/^ال/, ''))
                  );
                  return found ? (
                    <button
                      type="button"
                      onClick={() => {
                        const rest = cleanAddr.replace(found.name, '').replace(/^[\s\-،,]+/, '').trim();
                        const parts = rest.split(/[\-،,]+/).map((p) => p.trim()).filter(Boolean);
                        setEditingOrder({
                          ...editingOrder,
                          governorateCode: found.code,
                          governorateName: found.name,
                          area: editingOrder.area || parts[0] || '',
                          address: parts.slice(1).join(' - ') || rest,
                        });
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8,
                        padding: '8px 8px', background: 'rgba(42,171,238,0.10)',
                        border: '1px solid rgba(42,171,238,0.22)', borderRadius: 8,
                        color: '#2AABEE', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%',
                        justifyContent: 'center',
                      }}
                    >
                      ✨ استخراج "{found.name}" من العنوان تلقائياً
                    </button>
                  ) : null;
                })()}
                <select aria-label="خيار"
                  value={editingOrder.governorateCode || ''}
                  onChange={(e) => {
                    const gov = IRAQ_GOVERNORATES.find((g) => g.code === e.target.value);
                    setEditingOrder({ ...editingOrder, governorateCode: e.target.value, governorateName: gov?.name || '' });
                  }}
                  style={{
                    ...styles.formInput,
                    borderRadius: 9,
                    border: !editingOrder.governorateCode ? '1.5px solid rgba(242,80,80,0.5)' : '1.5px solid rgba(42,171,238,0.25)',
                    background: '#242F3D',
                  }}
                >
                  <option value="">— اختر المحافظة —</option>
                  {IRAQ_GOVERNORATES.map((g) => (
                    <option key={g.code} value={g.code}>{g.name} ({g.code})</option>
                  ))}
                </select>
                {!editingOrder.governorateCode && (
                  <span style={{ fontSize: 12, color: '#F25050', marginTop: 4, fontWeight: 600 }}>⚠ مطلوب — شركة التوصيل ترفض الشحنة بدون محافظة</span>
                )}
              </div>

              {/* المنطقة/المدينة — إجباري Jenni (city) */}
              <div style={styles.formGroup}>
                <label style={{ ...styles.formLabel, display: 'flex', alignItems: 'center', gap: 4 }}>
                  المنطقة / المدينة
                  <span style={{ color: '#F25050', fontWeight: 800, fontSize: 13 }}>*</span>
                  <span style={{ fontSize: 12, color: '#8FA0B5', fontWeight: 500, marginRight: 'auto' }}>city لشركة التوصيل</span>
                </label>
                <CityPicker
                  govCode={editingOrder.governorateCode}
                  value={editingOrder.area || ''}
                  onChange={(val) => setEditingOrder({ ...editingOrder, area: val })}
                  invalid={!String(editingOrder.area || '').trim()}
                />
                {!String(editingOrder.area || '').trim() && (
                  <span style={{ fontSize: 12, color: '#F25050', marginTop: 4, fontWeight: 600 }}>⚠ مطلوب — تُرسَل كـ city لشركة التوصيل</span>
                )}
              </div>

              {/* المبلغ — إجباري Jenni */}
              <div style={styles.formGroup}>
                <label style={{ ...styles.formLabel, display: 'flex', alignItems: 'center', gap: 4 }}>
                  المبلغ (د.ع)
                  <span style={{ color: '#F25050', fontWeight: 800, fontSize: 13 }}>*</span>
                </label>
                {(() => {
                  const total = Number(editingOrder.total);
                  const totalOk = total > 0;
                  return (
                    <>
                      <input
                        type="number"
                        min="1"
                        value={editingOrder.total}
                        onChange={(e) => setEditingOrder({ ...editingOrder, total: e.target.value })}
                        style={{
                          ...styles.formInput,
                          borderRadius: 9,
                          border: totalOk ? '1.5px solid rgba(42,171,238,0.25)' : '1.5px solid rgba(242,80,80,0.5)',
                          background: '#242F3D',
                          direction: 'ltr',
                          textAlign: 'right',
                        }}
                        placeholder="0"
                      />
                      {!totalOk && <span style={{ fontSize: 12, color: '#F25050', marginTop: 4, fontWeight: 600 }}>⚠ المبلغ يجب أن يكون أكبر من صفر</span>}
                    </>
                  );
                })()}
              </div>

              {/* العنوان التفصيلي — اختياري */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>العنوان التفصيلي <span style={{ color: '#8FA0B5', fontSize: 12 }}>(اختياري)</span></label>
                <input
                  value={editingOrder.address}
                  onChange={(e) => setEditingOrder({ ...editingOrder, address: e.target.value })}
                  style={{ ...styles.formInput, borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)', background: '#242F3D' }}
                  placeholder="أقرب نقطة دالة، رقم الدار..."
                />
              </div>

              {/* عنوان الطلب — موقع التخزين (يُطبع على الستيكر) */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>عنوان الطلب — موقع التخزين <span style={{ color: '#8FA0B5', fontSize: 12 }}>(يُطبع على الستيكر — مثال: فرع A رف 3)</span></label>
                <input
                  value={editingOrder.storageLocation || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, storageLocation: e.target.value })}
                  style={{ ...styles.formInput, borderRadius: 9, border: '1px solid rgba(240,168,104,0.2)', background: '#242F3D' }}
                  placeholder="مثال: فرع A رف 3"
                />
              </div>

              {/* نوع الطلب — اختياري (note في Jenni) */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>نوع الطلب / ملاحظة <span style={{ color: '#8FA0B5', fontSize: 12 }}>(اختياري — تُرسَل كـ note لشركة التوصيل)</span></label>
                <input
                  value={editingOrder.orderType}
                  onChange={(e) => setEditingOrder({ ...editingOrder, orderType: e.target.value })}
                  style={{ ...styles.formInput, borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)', background: '#242F3D' }}
                  placeholder="مثال: أرضيات سيارة، ملابس..."
                />
              </div>

              {/* المنتجات — اختياري */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>المنتجات / التفاصيل <span style={{ color: '#8FA0B5', fontSize: 12 }}>(اختياري)</span></label>
                <textarea
                  value={editingOrder.items}
                  onChange={(e) => setEditingOrder({ ...editingOrder, items: e.target.value })}
                  style={{ ...styles.formInput, borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)', background: '#242F3D', minHeight: 70, resize: 'vertical' }}
                  placeholder="وصف المنتجات والكميات"
                />
              </div>

              {/* ربط محادثة */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>ربط بمحادثة <span style={{ color: '#8FA0B5', fontSize: 12 }}>(اختياري)</span></label>
                <select aria-label="خيار"
                  value={editingOrder.conversationId || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, conversationId: e.target.value })}
                  style={{ ...styles.formInput, borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)', background: '#242F3D' }}
                >
                  <option value="">بدون ربط</option>
                  {conversations.map((c) => <option key={c.id} value={c.id}>{c.customer}</option>)}
                </select>
              </div>

              {/* ملخص الحالة — هل الطلب جاهز لجيني؟ */}
              {(() => {
                const errs = validateJenniFields(editingOrder);
                const ready = Object.keys(errs).length === 0;
                return (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: ready ? 'rgba(77,219,107,0.08)' : 'rgba(242,80,80,0.08)',
                    border: ready ? '1px solid rgba(77,219,107,0.25)' : '1px solid rgba(242,80,80,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    color: ready ? '#4DDB6B' : '#F25050',
                  }}>
                    {ready ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                    {ready
                      ? '✓ جاهز للإرسال لشركة التوصيل — كل الحقول المطلوبة مكتملة'
                      : `${Object.keys(errs).length} حقل ناقص — لن تُقبل الشحنة من شركة التوصيل`}
                  </div>
                );
              })()}
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setEditingOrder(null)} style={styles.modalCancelBtn}>إلغاء</button>
              <button
                onClick={handleSaveOrder}
                style={{
                  ...styles.modalSaveBtn,
                  opacity: saving ? 0.6 : 1,
                }}
                disabled={saving}
              >
                {saving ? 'جارٍ الحفظ...' : 'حفظ الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── modal الطلبات المهملة ── */}
      {neglectedOpen && (
        <div onClick={() => setNeglectedOpen(false)} style={styles.modalOverlay}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#141B2D', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(244,91,105,0.2)' }}>
            {/* رأس */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} color="#F45B69" />
                <div style={{ fontSize: 16, fontWeight: 800, color: '#EAF0F7' }}>الطلبات المهملة</div>
                {neglectedOrders.length > 0 && <span style={{ fontSize: 12, color: '#8B9AB3' }}>({neglectedOrders.length})</span>}
              </div>
              <button onClick={() => setNeglectedOpen(false)} style={{ width: 44, height: 44, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#8B9AB3', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>

            {/* شريط الإجراءات الجماعية */}
            {neglectedOrders.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0, flexWrap: 'wrap' }}>
                <button onClick={() => setNeglectedSelected(neglectedSelected.length === neglectedOrders.length ? [] : neglectedOrders.map((o) => o.id))}
                  style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9FB0C3', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {neglectedSelected.length === neglectedOrders.length ? 'إلغاء التحديد' : 'تحديد الكل'}
                </button>
                <span style={{ fontSize: 12, color: '#8B9AB3' }}>{neglectedSelected.length} محدد</span>
                <div style={{ flex: 1 }} />
                <button onClick={() => restoreNeglected(neglectedSelected)} disabled={!neglectedSelected.length}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 8, background: neglectedSelected.length ? 'rgba(42,171,238,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${neglectedSelected.length ? 'rgba(42,171,238,0.4)' : 'rgba(255,255,255,0.08)'}`, color: neglectedSelected.length ? '#2AABEE' : '#8FA0B5', fontSize: 12, fontWeight: 700, cursor: neglectedSelected.length ? 'pointer' : 'not-allowed' }}>
                  <Printer size={13} /> إعادة للطباعة
                </button>
                <button onClick={() => deleteNeglected(neglectedSelected)} disabled={!neglectedSelected.length}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 8, background: neglectedSelected.length ? 'rgba(244,91,105,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${neglectedSelected.length ? 'rgba(244,91,105,0.4)' : 'rgba(255,255,255,0.08)'}`, color: neglectedSelected.length ? '#F45B69' : '#8FA0B5', fontSize: 12, fontWeight: 700, cursor: neglectedSelected.length ? 'pointer' : 'not-allowed' }}>
                  <Trash2 size={13} /> حذف
                </button>
              </div>
            )}

            {/* قائمة الطلبات */}
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              {neglectedOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#8FA0B5', fontSize: 13, padding: '40px 0' }}>
                  لا توجد طلبات مهملة 🎉
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {neglectedOrders.map((o) => {
                    const sel = neglectedSelected.includes(o.id);
                    return (
                      <div key={o.id} onClick={() => toggleNeglectedSelect(o.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 12px', borderRadius: 11, cursor: 'pointer', background: sel ? 'rgba(42,171,238,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${sel ? 'rgba(42,171,238,0.4)' : 'rgba(255,255,255,0.06)'}` }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: sel ? '#2AABEE' : 'transparent', border: `1.5px solid ${sel ? '#2AABEE' : '#8FA0B5'}` }}>
                          {sel && <CheckCircle2 size={13} color="#fff" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#EAF0F7' }}>{o.customer || 'زبون'} <span style={{ fontSize: 12, color: '#5E6986' }}>#{o.orderNo}</span></div>
                          <div style={{ fontSize: 12, color: '#8B9AB3' }}>{o.governorateName}{o.area ? ' - ' + o.area : ''} · {fmtBatchDate(o.printedAt || o.createdAt)}</div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#F0A868', flexShrink: 0 }}>
                          {(o.stage === 'delivery') ? 'لدى الشركة' : 'قيد التجهيز'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── modal سجل الدفعات المطبوعة ── */}
      {batchHistoryOpen && (
        <div
          onClick={() => setBatchHistoryOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#141B2D', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} color="#A78BFA" />
                <div style={{ fontSize: 16, fontWeight: 800, color: '#EAF0F7' }}>سجل الطباعة</div>
              </div>
              <button onClick={() => setBatchHistoryOpen(false)} style={{ width: 44, height: 44, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#8B9AB3', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              {printBatches.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#8FA0B5', fontSize: 13, padding: '40px 0' }}>
                  لا توجد دفعات مطبوعة بعد
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {printBatches.map((batch) => (
                    <div key={batch.batchId} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(42,171,238,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Printer size={18} color="#2AABEE" />
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#EAF0F7' }}>{batch.orders.length} وصل</div>
                            <div style={{ fontSize: 12, color: '#8B9AB3', marginTop: 2 }}>{fmtBatchDate(batch.printedAt)}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleReprintBatch(batch.batchId, batch.orders)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', background: 'rgba(42,171,238,0.12)', border: '1px solid rgba(42,171,238,0.3)', borderRadius: 9, color: '#2AABEE', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          <Printer size={13} /> إعادة طباعة
                        </button>
                      </div>
                      <div style={{ fontSize: 12, color: '#8FA0B5', lineHeight: 1.6 }}>
                        {batch.orders.slice(0, 4).map((o) => `#${o.orderNo}`).join('، ')}
                        {batch.orders.length > 4 ? ` +${batch.orders.length - 4}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* ── modal الطباعة (داخل الموقع — لا نافذة منبثقة) ── */}
      {printModal && (
        <div
          onClick={() => setPrintModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 760, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
          >
            {/* رأس الـ modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #eee', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1a2234' }}>{printModal.title || 'طباعة الباركود'}</div>
              <button onClick={() => setPrintModal(null)} style={{ width: 44, height: 44, borderRadius: 10, border: 'none', background: '#f1f1f1', color: '#555', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {/* المحتوى */}
            <div style={{ flex: 1, overflow: 'auto', background: '#f7f7f7', minHeight: 200 }}>
              {printModal.loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16, color: '#555' }}>
                  <div style={{ width: 40, height: 40, border: '4px solid #ddd', borderTopColor: '#2AABEE', borderRadius: '50%', animation: 'alfhd-spin 0.8s linear infinite' }} />
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{printModal.note || 'جارٍ التحميل...'}</div>
                  <style>{`@keyframes alfhd-spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              ) : printModal.error ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#c0392b', fontSize: 15, fontWeight: 600, whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                  ⚠️ {printModal.error}
                </div>
              ) : printModal.src ? (
                <>
                  {printModal.warning && (
                    <div style={{ margin: 12, padding: '12px 16px', borderRadius: 10, background: 'rgba(240,168,104,0.12)', border: '1px solid rgba(240,168,104,0.35)', color: '#F0A868', fontSize: 12.5, fontWeight: 600, lineHeight: 1.7 }}>
                      ⚠️ {printModal.warning}
                    </div>
                  )}
                  <iframe
                    id="alfhd-print-frame"
                    src={printModal.src}
                    title="باركود"
                    style={{ width: '100%', height: '70vh', border: 'none', background: '#fff' }}
                  />
                </>
              ) : null}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

function ClickableStat({ icon: Icon, label, value, color, active, onClick }) {
  return (
    <button onClick={onClick} style={{ ...styles.statCard, ...(active ? { borderColor: color + '66', background: `linear-gradient(180deg, ${color}14, #111725)` } : {}), cursor: 'pointer', textAlign: 'right', width: '100%' }} className="alfhd-stat-card">
      <div style={{ ...styles.statIconWrap, background: `linear-gradient(135deg, ${color}22, ${color}0D)`, color, boxShadow: `0 4px 12px -4px ${color}55` }}>
        <Icon size={19} />
      </div>
      <div>
        <div style={styles.statValue}>{typeof value === 'number' && value > 999 ? value.toLocaleString() : value}</div>
        <div style={styles.statLabel}>{label}</div>
      </div>
    </button>
  );
}

function OrderDetailModal({ order, page, section, onClose, onEdit, onDelete, onShare, onViewConversation, onMoveToDelivery, onReprep, onContactCustomer }) {
  const [copied, setCopied] = useState(false);
  const o = order;
  const [reprepMode, setReprepMode] = useState(false);
  const [reprepNote, setReprepNote] = useState('');
  const isRejected = o.prepStatus === 'rejected';
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>تفاصيل الطلب #{o.orderNo}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => {
                const info = [
                  `طلب #${o.orderNo}`,
                  o.customer ? `الاسم: ${o.customer}` : '',
                  o.phone ? `الهاتف: ${o.phone}` : '',
                  o.governorateName ? `المحافظة: ${o.governorateName}` : '',
                  o.area ? `المنطقة: ${o.area}` : '',
                  o.address ? `العنوان: ${o.address}` : '',
                  o.orderType ? `نوع الطلب: ${o.orderType}` : '',
                  o.items ? `المنتجات: ${o.items}` : '',
                  o.total ? `المبلغ: ${Number(o.total).toLocaleString()} د.ع` : '',
                ].filter(Boolean).join('\n');
                try {
                  navigator.clipboard.writeText(info);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch (_e) { alert('تعذّر النسخ'); }
              }}
              title="نسخ معلومات الطلب"
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 9, background: copied ? 'rgba(77,219,107,0.15)' : 'rgba(42,171,238,0.12)', border: `1px solid ${copied ? 'rgba(77,219,107,0.4)' : 'rgba(42,171,238,0.3)'}`, color: copied ? '#4DDB6B' : '#2AABEE', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              {copied ? <><CheckCircle2 size={14} /> نُسخت</> : <><Copy size={14} /> نسخ</>}
            </button>
            <button onClick={onClose} style={styles.modalClose}><X size={18} /></button>
          </div>
        </div>
        <div style={styles.modalBody}>
          {isRejected && (
            <div style={{ ...styles.rejectReasonBox, margin: 0 }}>
              <span style={styles.rejectReasonLabel}>لم يُجهَّز{o.prepByName ? ` (المجهّز: ${o.prepByName})` : ''}:</span>
              <span>{o.prepReason || 'بدون سبب محدد'}</span>
            </div>
          )}
          {o.prepStatus === 'done' && o.prepByName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(77,219,107,0.08)', border: '1px solid rgba(77,219,107,0.2)', borderRadius: 10, marginBottom: 4 }}>
              <CheckCircle2 size={15} color="#4DDB6B" />
              <span style={{ fontSize: 12.5, color: '#EAF0FB' }}>تم التجهيز — <strong>موظف التجهيز: {o.prepByName}</strong></span>
            </div>
          )}
          <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>العميل</span><span style={styles.detailGridValue}>{o.customer}</span></div>
          {page && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>الصفحة</span><span style={styles.detailGridValue}>{page.avatar} {page.name}</span></div>}
          {o.orderType && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>نوع الطلب</span><span style={styles.detailGridValue}>{o.orderType}</span></div>}
          {o.phone && (
            <div style={styles.detailGridRow}>
              <span style={styles.detailGridLabel}>الهاتف</span>
              <span style={{ ...styles.detailGridValue, display: 'flex', alignItems: 'center', gap: 8, direction: 'ltr' }}>
                <a
                  href={`https://wa.me/964${normalizeIraqiPhoneStatic(o.phone).replace(/^0/, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="فتح محادثة واتساب"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 7, background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.35)', flexShrink: 0 }}
                >
                  <MessageCircle size={14} color="#25D366" />
                </a>
                <span>{o.phone}</span>
              </span>
            </div>
          )}
          {o.governorateName && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>المحافظة</span><span style={styles.detailGridValue}>{o.governorateName}</span></div>}
          {o.area && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>المنطقة</span><span style={styles.detailGridValue}>{o.area}</span></div>}
          {o.address && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>العنوان</span><span style={styles.detailGridValue}>{o.address}</span></div>}
          {o.deliveryStepAr && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>حالة الشركة</span><span style={{ ...styles.detailGridValue, color: '#60A5FA', fontWeight: 700 }}>{o.deliveryStepAr}</span></div>}
          {o.items && (
            <div style={{ ...styles.detailGridRow, flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <span style={styles.detailGridLabel}>المنتجات</span>
              <span style={{ ...styles.detailGridValue, whiteSpace: 'pre-wrap', textAlign: 'right' }}>{o.items}</span>
            </div>
          )}
          <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>المبلغ</span><span style={{ ...styles.detailGridValue, fontSize: 18 }}><span className="alfhd-amount-glow">{Number(o.total).toLocaleString()}</span> <span style={{ fontSize: 12, color: '#9FB0C3', fontWeight: 600 }}>د.ع</span></span></div>
          <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>التاريخ</span><span style={styles.detailGridValue}>{o.date}</span></div>
          <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>الرقم المرجعي</span><span style={{ ...styles.detailGridValue, fontFamily: 'monospace' }}>{o.fahdRef}</span></div>

          {/* ── الخط الزمني لرحلة الشحنة عند شركة التوصيل ── */}
          {Array.isArray(o.deliveryHistory) && o.deliveryHistory.length > 0 && (
            <div style={{ ...styles.detailGridRow, flexDirection: 'column', alignItems: 'stretch', gap: 0, paddingTop: 8 }}>
              <span style={{ ...styles.detailGridLabel, marginBottom: 8 }}>رحلة الشحنة</span>
              <div style={{ position: 'relative', paddingRight: 4 }}>
                {o.deliveryHistory.map((h, i) => {
                  const isLast = i === o.deliveryHistory.length - 1;
                  return (
                    <div key={i} style={{ display: 'flex', gap: 8, position: 'relative', paddingBottom: isLast ? 0 : 16 }}>
                      {/* نقطة وخط */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: 11, height: 11, borderRadius: '50%', background: isLast ? '#4DDB6B' : '#2AABEE', boxShadow: isLast ? '0 0 0 3px rgba(77,219,107,0.2)' : 'none', marginTop: 2 }} />
                        {!isLast && <div style={{ width: 2, flex: 1, background: 'rgba(42,171,238,0.25)', marginTop: 2 }} />}
                      </div>
                      {/* المحتوى */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isLast ? '#4DDB6B' : '#E7ECF3' }}>{h.step_ar || h.step}</div>
                        {h.branch && <div style={{ fontSize: 12, color: '#9FB0C3', marginTop: 2 }}>{h.branch}</div>}
                        {h.date && <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 2, fontFamily: 'monospace' }}>{h.date}</div>}
                        {h.note && <div style={{ fontSize: 12, color: '#F0A868', marginTop: 2 }}>{h.note}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {reprepMode && (
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>ملاحظة للمجهّز (اختياري)</label>
              <textarea value={reprepNote} onChange={(e) => setReprepNote(e.target.value)} style={{ ...styles.formInput, minHeight: 70, resize: 'vertical' }} placeholder="مثال: المنتج وصل المخزن، جهّزه من فضلك" autoFocus />
            </div>
          )}
        </div>
        <div style={{ ...styles.modalFooter, flexWrap: 'wrap' }}>
          {reprepMode ? (
            <>
              <button onClick={() => { setReprepMode(false); setReprepNote(''); }} style={styles.modalCancelBtn}>إلغاء</button>
              <button onClick={() => onReprep?.(reprepNote.trim())} style={styles.modalSaveBtn}>تأكيد إعادة التجهيز</button>
            </>
          ) : (
            <>
              {onReprep && (
                <button onClick={() => setReprepMode(true)} style={{ ...styles.modalSaveBtn, flex: '1 1 100%', marginBottom: 4, background: 'linear-gradient(135deg,#F0A868,#E0833C)' }}>
                  <RefreshCw size={15} style={{ marginLeft: 8, display: 'inline', verticalAlign: 'middle' }} /> إعادة الطلب للتجهيز
                </button>
              )}
              {onMoveToDelivery && (
                <button onClick={onMoveToDelivery} style={{ ...styles.modalSaveBtn, flex: '1 1 100%', marginBottom: 4 }}>
                  <Truck size={15} style={{ marginLeft: 8, display: 'inline', verticalAlign: 'middle' }} /> نقل لشركة التوصيل
                </button>
              )}
              <button onClick={onEdit} style={styles.detailActionBtn}><Edit3 size={14} /> تعديل</button>
              <button onClick={onShare} style={styles.detailActionBtn}><Send size={14} /> تحويل</button>
              {onViewConversation && <button onClick={onViewConversation} style={styles.detailActionBtn}><MessageSquare size={14} /> المحادثة</button>}
              {!onViewConversation && o.phone && onContactCustomer && (
                <button onClick={() => onContactCustomer(o.phone)} style={styles.detailActionBtn}><Phone size={14} /> الزبون</button>
              )}
              <button onClick={onDelete} style={{ ...styles.detailActionBtn, color: '#F45B69', borderColor: 'rgba(244,91,105,0.3)' }}><Trash2 size={14} /> حذف</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={styles.statCard} className="alfhd-stat-card alfhd-fade-up">
      <div style={{ ...styles.statIconWrap, background: `linear-gradient(135deg, ${color}22, ${color}0D)`, color, boxShadow: `0 4px 12px -4px ${color}55` }}>
        <Icon size={19} />
      </div>
      <div>
        <div style={styles.statValue}>{typeof value === 'number' && value > 999 ? value.toLocaleString() : value}</div>
        <div style={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// عرض الإحصائيات
// ──────────────────────────────────────────────
function StatsView({ orders, pages, conversations, setOrders }) {
  const [statsPage, setStatsPage] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);
  // ── الطلبات الخارجية (جاءت من خارج الموقع: واتساب مباشر، المحل...) ──
  const [extOrders, setExtOrders] = useState([]);      // سجلات خارجية من قاعدة البيانات
  const [extOpen, setExtOpen] = useState(false);       // نافذة الإضافة
  const [extCount, setExtCount] = useState('');        // عدد الطلبات المُدخل
  const [extNote, setExtNote] = useState('');          // ملاحظة اختيارية
  const [extSaving, setExtSaving] = useState(false);
  const [extErr, setExtErr] = useState('');

  // حمّل السجلات الخارجية
  useEffect(() => {
    (async () => {
      try {
        const rows = await sbSelect('alfhd_external_orders', '&order=entry_date.desc&limit=500');
        setExtOrders(Array.isArray(rows) ? rows : []);
      } catch (_e) { setExtOrders([]); }
    })();
  }, []);

  const years = [];
  for (let y = new Date().getFullYear(); y >= 2024; y--) years.push(y);

  function isInRange(dateStr) {
    return dateInRange(dateStr, timeFilter, customMonth, customYear);
  }

  // كل الإحصائيات تحترم فلتر الصفحة + فلتر الوقت
  const scopedOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statsPage !== 'all' && o.pageId !== statsPage) return false;
      if (!isInRange(o.createdAt || o.date)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, statsPage, timeFilter, customYear, customMonth]);

  // الطلبات الخارجية ضمن نفس فلتر الوقت/الصفحة
  const scopedExtCount = useMemo(() => {
    return extOrders.reduce((sum, e) => {
      if (statsPage !== 'all' && e.page_id && String(e.page_id) !== String(statsPage)) return sum;
      if (!isInRange(e.entry_date)) return sum;
      return sum + (Number(e.count) || 0);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extOrders, statsPage, timeFilter, customYear, customMonth]);

  const breakdown = useMemo(() => {
    const converted = scopedOrders.filter((o) => o.converted);
    const fromChat = scopedOrders.filter((o) => !o.converted && o.source === 'chat');
    const manual = scopedOrders.filter((o) => !o.converted && o.source !== 'chat');

    // منصة الطلب: من الحقل المحفوظ، وإن غاب (طلبات قديمة) نستنتجها من المحادثة المرتبطة
    const platformOf = (o) => {
      if (o.platform === 'whatsapp' || o.platform === 'facebook') return o.platform;
      if (o.conversationId) {
        const conv = conversations?.find((c) => c.id === o.conversationId);
        if (conv) return conv.isWhatsApp ? 'whatsapp' : 'facebook';
      }
      return null;
    };
    const active = scopedOrders.filter((o) => !o.converted);
    const whatsapp = active.filter((o) => platformOf(o) === 'whatsapp').length;
    const facebook = active.filter((o) => platformOf(o) === 'facebook').length;

    return {
      total: scopedOrders.length + scopedExtCount,
      converted: converted.length,
      fromChat: fromChat.length,
      manual: manual.length,
      external: scopedExtCount,
      whatsapp,
      facebook,
    };
  }, [scopedOrders, scopedExtCount, conversations]);

  const overall = useMemo(() => {
    const delivered = scopedOrders.filter((o) => o.status === 'delivered');
    const pending = scopedOrders.filter((o) => o.status === 'pending');
    const returned = scopedOrders.filter((o) => o.status === 'returned');
    const revenue = delivered.reduce((s, o) => s + o.total, 0);
    const deliveryRate = scopedOrders.length ? Math.round((delivered.length / scopedOrders.length) * 100) : 0;
    const returnRate = scopedOrders.length ? Math.round((returned.length / scopedOrders.length) * 100) : 0;
    return { delivered: delivered.length, pending: pending.length, returned: returned.length, revenue, deliveryRate, returnRate };
  }, [scopedOrders]);

  const perPage = useMemo(() => {
    const scope = statsPage === 'all' ? pages : pages.filter((p) => p.id === statsPage);
    return scope.map((p) => {
      const pOrders = scopedOrders.filter((o) => o.pageId === p.id);
      const pConvs = conversations.filter((c) => c.pageId === p.id);
      return {
        ...p,
        orderCount: pOrders.length,
        revenue: pOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0),
        convCount: pConvs.length,
      };
    });
  }, [pages, scopedOrders, conversations, statsPage]);

  const maxRevenue = Math.max(...perPage.map((p) => p.revenue), 1);

  // ── بيانات قسم الخلاصة ──
  const summary = useMemo(() => {
    const booked = scopedOrders;
    const converted = scopedOrders.filter((o) => o.converted);
    const sentToCompany = scopedOrders.filter((o) => o.stage === 'delivery');
    const sortingC = sentToCompany.filter((o) => o.deliveryStatus === 'sorting' || (!o.deliveryStatus && o.status === 'pending'));
    const deliveredC = sentToCompany.filter((o) => o.status === 'delivered');
    const returnedC = sentToCompany.filter((o) => o.status === 'returned');
    const neglected = scopedOrders.filter((o) => o.printed && !o.converted && o.stage !== 'delivery');
    return {
      booked: booked.length,
      converted: converted.length,
      sentToCompany: sentToCompany.length,
      sorting: sortingC.length,
      delivered: deliveredC.length,
      returned: returnedC.length,
      neglected: neglected.length,
    };
  }, [scopedOrders]);

  // ── الأكثر مبيعاً (حسب نوع السيارة/الطلب) ──
  const bestSellers = useMemo(() => {
    const counts = {};
    scopedOrders.forEach((o) => {
      const key = (o.orderType || '').trim();
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  }, [scopedOrders]);

  const convertedOrders = useMemo(
    () => scopedOrders.filter((o) => o.converted).sort((a, b) => new Date(b.convertedAt || 0) - new Date(a.convertedAt || 0)),
    [scopedOrders]
  );

  const neglectedOrders = useMemo(
    () => scopedOrders.filter((o) => o.printed && !o.converted && o.stage !== 'delivery'),
    [scopedOrders]
  );

  // أفضل المناطق (الأكثر طلبات) — رؤية مفيدة للتاجر
  const topAreas = useMemo(() => {
    const map = {};
    for (const o of scopedOrders) {
      const key = [o.governorateName, o.area].filter(Boolean).join(' - ') || 'غير محدد';
      if (!map[key]) map[key] = { name: key, count: 0, revenue: 0 };
      map[key].count++;
      if (o.status === 'delivered') map[key].revenue += o.total;
    }
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [scopedOrders]);

  const [panel, setPanel] = useState(null); // null | 'summary' | 'bestSellers' | 'converted' | 'neglected'

  return (
    <div style={styles.viewWrap}>
      <div style={styles.viewHeader} className="alfhd-view-header">
        <div>
          <h2 style={styles.viewTitle}>الإحصائيات</h2>
          <p style={styles.viewSubtitle}>نظرة شاملة على الأداء مع فلاتر دقيقة</p>
        </div>
        <div style={styles.pageSelectWrap}>
          <Facebook size={15} color="#3B82F6" />
          <select aria-label="خيار" value={statsPage} onChange={(e) => setStatsPage(e.target.value)} style={styles.pageSelect}>
            <option value="all">كل الصفحات</option>
            {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown size={14} color="#5E6986" />
        </div>
      </div>

      <div style={styles.filtersWrap} className="alfhd-no-print">
        <div style={styles.filterBottomRow}>
          <div style={styles.pageSelectWrap}>
            <Calendar size={15} color="#60A5FA" />
            <select aria-label="خيار" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} style={styles.pageSelect}>
              {DATE_PRESETS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <ChevronDown size={14} color="#5E6986" />
          </div>
          {timeFilter === 'custom' && (
            <>
              <select aria-label="الشهر" value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} style={styles.customDateSelectCompact}>
                {AR_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select aria-label="السنة" value={customYear} onChange={(e) => setCustomYear(e.target.value)} style={styles.customDateSelectCompact}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      <div style={styles.statsRow} className="alfhd-stats-row">
        <StatCard icon={Package} label="إجمالي الطلبات" value={breakdown.total} color="#3B82F6" />
        <StatCard icon={MessageSquare} label="من المحادثات" value={breakdown.fromChat} color="#5B8DEF" />
        <StatCard icon={Edit3} label="مضافة يدوياً" value={breakdown.manual} color="#4ADE80" />
        <StatCard icon={Send} label="طلبات محوّلة" value={breakdown.converted} color="#A78BFA" />
      </div>

      {/* طلبات حسب المنصة — واتساب / فيسبوك */}
      <div style={{ display: 'flex', gap: 8 }} className="alfhd-stats-row">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(37,211,102,0.07)', border: '1px solid rgba(37,211,102,0.22)', borderRadius: 14, padding: '12px 16px' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" width="21" height="21" fill="#fff">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z"/>
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 900, color: '#E7EDF5', lineHeight: 1.1 }}>{breakdown.whatsapp}</div>
            <div style={{ fontSize: 12, color: '#9FB0C3', marginTop: 2 }}>طلبات واتساب</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(10,140,255,0.07)', border: '1px solid rgba(10,140,255,0.22)', borderRadius: 14, padding: '12px 16px' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#0A8CFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" width="21" height="21" fill="#fff">
              <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.454 5.512 3.727 7.21V22l3.409-1.871c.909.25 1.871.389 2.864.389 5.523 0 10-4.145 10-9.259C22 6.145 17.523 2 12 2zm1.008 12.461-2.553-2.72-4.98 2.72 5.478-5.813 2.616 2.72 4.917-2.72-5.478 5.813z"/>
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 900, color: '#E7EDF5', lineHeight: 1.1 }}>{breakdown.facebook}</div>
            <div style={{ fontSize: 12, color: '#9FB0C3', marginTop: 2 }}>طلبات فيسبوك</div>
          </div>
        </div>
      </div>

      {/* الطلبات الخارجية — جاءت من خارج الموقع */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.22)', borderRadius: 14, padding: '16px 16px' }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Package size={19} color="#A78BFA" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#E7EDF5' }}>طلبات من خارج الموقع</div>
          <div style={{ fontSize: 12, color: '#9FB0C3', marginTop: 2 }}>
            {scopedExtCount > 0 ? `${scopedExtCount} طلب مُضاف — محتسبة ضمن الإجمالي` : 'أضف عدد الطلبات التي جاءتك خارج الموقع'}
          </div>
        </div>
        <button onClick={() => { setExtOpen(true); setExtCount(''); setExtNote(''); setExtErr(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
            background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)', color: '#A78BFA', fontSize: 12.5, fontWeight: 800 }}>
          <Plus size={15} /> إضافة
        </button>
      </div>

      <div style={styles.statsRow} className="alfhd-stats-row">
        <StatCard icon={Truck} label="قيد التوصيل" value={overall.pending} color="#3B82F6" />
        <StatCard icon={CheckCircle2} label="نسبة التسليم" value={`${overall.deliveryRate}%`} color="#4ADE80" />
        <StatCard icon={XCircle} label="نسبة الإرجاع" value={`${overall.returnRate}%`} color="#F45B69" />
        <StatCard icon={Sparkles} label="الإيرادات" value={`${overall.revenue.toLocaleString()} د.ع`} color="#3B82F6" />
      </div>

      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>الإيرادات حسب الصفحة</h3>
        <div style={styles.barChartArea}>
          {perPage.map((p) => (
            <div key={p.id} style={styles.barChartRow} className="alfhd-bar-chart-row">
              <div style={styles.barChartLabel}>
                <span>{p.avatar}</span>
                <span>{p.name}</span>
              </div>
              <div style={styles.barChartTrack}>
                <div style={{ ...styles.barChartFill, width: `${(p.revenue / maxRevenue) * 100}%` }} />
              </div>
              <div style={styles.barChartValue}>{p.revenue.toLocaleString()} د.ع</div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.statsGrid2} className="alfhd-stats-grid-2">
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>توزيع حالات الطلبات</h3>
          <div style={styles.donutWrap}>
            <DonutChart
              data={[
                { label: 'مستلم', value: overall.delivered, color: '#4ADE80' },
                { label: 'قيد التوصيل', value: overall.pending, color: '#3B82F6' },
                { label: 'راجع', value: overall.returned, color: '#F45B69' },
              ]}
            />
          </div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>محادثات كل صفحة</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            {perPage.map((p) => (
              <div key={p.id} style={styles.pageStatRow}>
                <div style={styles.pageStatInfo}>
                  <span style={{ fontSize: 20 }}>{p.avatar}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#EAF0FB' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#5E6986' }}>{p.orderCount} طلب</div>
                  </div>
                </div>
                <div style={styles.pageStatBadge}>{p.convCount} محادثة</div>
              </div>
            ))}
          </div>
        </div>

        {/* أفضل المناطق (الأكثر طلبات) */}
        {topAreas.length > 0 && (
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>أفضل المناطق</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {topAreas.map((a, i) => (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      background: i < 3 ? 'rgba(42,171,238,0.18)' : 'rgba(255,255,255,0.05)',
                      color: i < 3 ? '#2AABEE' : '#9FB0C3', fontSize: 12, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 12.5, color: '#EAF0FB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#2AABEE', flexShrink: 0 }}>{a.count} طلب</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={styles.statsBottomBtns}>
        <button onClick={() => setPanel('bestSellers')} style={styles.statsSmallBtn}>
          <Sparkles size={15} /> الأكثر مبيعاً
        </button>
        <button onClick={() => setPanel('summary')} style={styles.statsSummaryBtn}>
          <BarChart3 size={16} /> الخلاصة الكاملة
        </button>
      </div>

      {panel === 'summary' && (
        <StatsSummaryPanel
          summary={summary}
          onClose={() => setPanel(null)}
          onOpenConverted={() => setPanel('converted')}
          onOpenNeglected={() => setPanel('neglected')}
        />
      )}
      {panel === 'bestSellers' && (
        <BestSellersPanel data={bestSellers} onClose={() => setPanel(null)} />
      )}
      {panel === 'converted' && (
        <ConvertedOrdersPanel orders={convertedOrders} pages={pages} onClose={() => setPanel('summary')} />
      )}
      {panel === 'neglected' && (
        <NeglectedOrdersPanel orders={neglectedOrders} pages={pages} setOrders={setOrders} onClose={() => setPanel('summary')} />
      )}

      {/* نافذة إضافة طلبات خارجية */}
      {extOpen && (
        <div style={styles.modalOverlay} onClick={() => setExtOpen(false)}>
          <div style={{ ...styles.modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>إضافة طلبات من خارج الموقع</h3>
              <button onClick={() => setExtOpen(false)} style={styles.modalClose}><X size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ fontSize: 12, color: '#9FB0C3', lineHeight: 1.7, background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 10 }}>
                الطلبات التي جاءتك خارج الموقع (واتساب مباشر، المحل...). تُحتسب ضمن إجمالي الطلبات في الإحصائيات.
              </div>
              <div>
                <label style={styles.formLabel}>عدد الطلبات</label>
                <input type="number" min="1" value={extCount} inputMode="numeric"
                  onChange={(e) => { setExtCount(e.target.value); setExtErr(''); }}
                  placeholder="مثال: 15" style={styles.formInput} autoFocus />
              </div>
              <div>
                <label style={styles.formLabel}>ملاحظة (اختياري)</label>
                <input type="text" value={extNote} onChange={(e) => setExtNote(e.target.value)}
                  placeholder="مثال: طلبات واتساب الشهر" style={styles.formInput} />
              </div>
              {statsPage !== 'all' && (
                <div style={{ fontSize: 12, color: '#F0A868' }}>ستُنسب لصفحة محددة (حسب الفلتر الحالي)</div>
              )}
              {extErr && <p style={{ color: '#F45B69', fontSize: 12, margin: 0 }}>{extErr}</p>}

              {/* السجلات السابقة */}
              {extOrders.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 12, color: '#8FA0B5', fontWeight: 700, marginBottom: 8 }}>الإضافات السابقة</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto' }}>
                    {extOrders.slice(0, 10).map((e) => (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '8px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                        <span style={{ color: '#A78BFA', fontWeight: 800 }}>{e.count}</span>
                        <span style={{ color: '#9FB0C3', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.note || 'بدون ملاحظة'}
                        </span>
                        <span style={{ color: '#8FA0B5', fontSize: 12 }}>
                          {e.entry_date ? new Date(e.entry_date).toLocaleDateString('ar-IQ', { day: '2-digit', month: '2-digit' }) : ''}
                        </span>
                        <button title="حذف" onClick={async () => {
                          if (!window.confirm(`حذف إضافة ${e.count} طلب؟`)) return;
                          try {
                            await sbDelete('alfhd_external_orders', e.id);
                            setExtOrders((prev) => prev.filter((x) => x.id !== e.id));
                          } catch (_err) { alert('تعذّر الحذف'); }
                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F45B69', padding: 2, display: 'flex' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setExtOpen(false)} style={styles.modalCancelBtn}>إلغاء</button>
              <button disabled={extSaving} style={styles.modalSaveBtn} onClick={async () => {
                const n = parseInt(String(extCount).replace(/[^0-9]/g, ''), 10);
                if (!n || n < 1) { setExtErr('أدخل عدداً صحيحاً أكبر من صفر'); return; }
                setExtSaving(true); setExtErr('');
                try {
                  const payload = {
                    count: n,
                    note: extNote.trim() || null,
                    page_id: statsPage !== 'all' ? statsPage : null,
                    entry_date: new Date().toISOString(),
                  };
                  const [created] = await sbInsert('alfhd_external_orders', payload);
                  if (created) setExtOrders((prev) => [created, ...prev]);
                  setExtOpen(false);
                } catch (err) {
                  setExtErr('تعذّر الحفظ — تأكد من إنشاء الجدول أولاً');
                } finally { setExtSaving(false); }
              }}>
                {extSaving ? 'جارٍ الحفظ...' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// لوحة الخلاصة الكاملة
function StatsSummaryPanel({ summary, onClose, onOpenConverted, onOpenNeglected }) {
  const rows = [
    { label: 'الطلبات المحجوزة', value: summary.booked, color: '#3B82F6' },
    { label: 'الطلبات المحوّلة', value: summary.converted, color: '#A78BFA', onClick: onOpenConverted },
    { label: 'أُرسلت لشركة التوصيل', value: summary.sentToCompany, color: '#60A5FA' },
    { label: '— قيد التوصيل', value: summary.sorting, color: '#3B82F6', sub: true },
    { label: '— مستلمة', value: summary.delivered, color: '#4ADE80', sub: true },
    { label: '— راجعة', value: summary.returned, color: '#F45B69', sub: true },
    { label: 'الطلبات المهملة', value: summary.neglected, color: '#F0A868', onClick: onOpenNeglected },
  ];
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>الخلاصة الكاملة</h3>
          <button onClick={onClose} style={styles.modalClose}><X size={18} /></button>
        </div>
        <div style={styles.modalBody}>
          {rows.map((r, i) => (
            <div
              key={i}
              onClick={r.onClick}
              style={{
                ...styles.summaryRow,
                ...(r.sub ? styles.summaryRowSub : {}),
                ...(r.onClick ? { cursor: 'pointer' } : {}),
              }}
            >
              <span style={{ ...styles.summaryRowLabel, color: r.sub ? '#8B96AD' : '#EAF0FB' }}>
                {r.label}
                {r.onClick && <ArrowUpRight size={13} style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle', color: r.color }} />}
              </span>
              <span style={{ ...styles.summaryRowValue, color: r.color }}>{r.value}</span>
            </div>
          ))}
          <p style={styles.summaryHint}>اضغط على "المحوّلة" أو "المهملة" لعرض تفاصيلها</p>
        </div>
      </div>
    </div>
  );
}

// لوحة الأكثر مبيعاً
function BestSellersPanel({ data, onClose }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>الأكثر مبيعاً</h3>
          <button onClick={onClose} style={styles.modalClose}><X size={18} /></button>
        </div>
        <div style={styles.modalBody}>
          {data.length === 0 ? (
            <div style={styles.emptyState}><Package size={28} color="#39425C" /><p>لا توجد بيانات كافية</p></div>
          ) : data.map((d, i) => (
            <div key={i} style={styles.bestSellerRow}>
              <div style={styles.bestSellerRank}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.bestSellerType}>{d.type}</div>
                <div style={styles.bestSellerTrack}>
                  <div style={{ ...styles.bestSellerFill, width: `${(d.count / max) * 100}%` }} />
                </div>
              </div>
              <div style={styles.bestSellerCount}>{d.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// لوحة الطلبات المحوّلة (مع بحث وفلتر)
function ConvertedOrdersPanel({ orders, pages, onClose }) {
  const [q, setQ] = useState('');
  const shown = orders.filter((o) => {
    if (!q) return true;
    const s = q.trim().toLowerCase();
    return [o.customer, o.orderNo, o.phone, o.orderType, o.convertedByName].filter(Boolean).join(' ').toLowerCase().includes(s);
  });
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxHeight: '85vh' }} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>الطلبات المحوّلة ({orders.length})</h3>
          <button onClick={onClose} style={styles.modalClose}><X size={18} /></button>
        </div>
        <div style={styles.modalBody}>
          <div style={{ ...styles.searchBox, marginBottom: 16 }}>
            <Search size={15} color="#5E6986" />
            <input aria-label="بحث بالاسم، الرقم، الهاتف، أو المدير" placeholder="بحث بالاسم، الرقم، الهاتف، أو المدير..." value={q} onChange={(e) => setQ(e.target.value)} style={styles.searchInput} />
          </div>
          {shown.length === 0 ? (
            <div style={styles.emptyState}><Send size={28} color="#39425C" /><p>لا توجد طلبات محوّلة</p></div>
          ) : shown.map((o) => {
            const page = pages.find((p) => p.id === o.pageId);
            return (
              <div key={o.id} style={styles.convertedRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.convertedCustomer}>{o.customer} <span style={{ fontSize: 12, color: '#5E6986' }}>#{o.orderNo}</span></div>
                  {o.orderType && <div style={styles.convertedSub}>{o.orderType}</div>}
                  <div style={styles.convertedMeta}>
                    {page && <span>{page.avatar} {page.name}</span>}
                    {o.convertedByName && <span> · حوّله: {o.convertedByName}</span>}
                    {o.convertedAt && <span> · {new Date(o.convertedAt).toLocaleDateString('ar-IQ')}</span>}
                  </div>
                </div>
                <div style={styles.convertedTotal}>{Number(o.total).toLocaleString()} د.ع</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// لوحة الطلبات المهملة (تحديد متعدد + إعادة طباعة)
function NeglectedOrdersPanel({ orders, pages, setOrders, onClose }) {
  const [selected, setSelected] = useState(new Set());
  const [q, setQ] = useState('');
  const shown = orders.filter((o) => {
    if (!q) return true;
    const s = q.trim().toLowerCase();
    return [o.customer, o.orderNo, o.phone, o.orderType, o.address].filter(Boolean).join(' ').toLowerCase().includes(s);
  });

  function toggle(id) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  async function reprintSelected() {
    const ids = [...selected];
    if (ids.length === 0) { alert('حدّد طلباً واحداً على الأقل'); return; }
    const selectedOrders = orders.filter((o) => ids.includes(o.id));
    const valid = selectedOrders.filter((o) => o.orderNo || o.jenniShipmentId);
    if (valid.length === 0) { alert('لا توجد طلبات صالحة للطباعة من شركة التوصيل'); return; }
    try {
      const shipmentIds = valid.map((o) => o.jenniShipmentId).filter(Boolean);
      const shipmentNumbers = valid.map((o) => String(o.orderNo)).filter(Boolean);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/jenni-stickers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
        body: JSON.stringify(shipmentIds.length ? { shipment_ids: shipmentIds } : { shipment_numbers: shipmentNumbers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.success) { alert(`تعذّر جلب الباركود: ${data.error || 'غير متاح'}`); return; }
      let body = '';
      if (data.type === 'pdf_base64' && data.data) body = `<embed src="data:application/pdf;base64,${data.data}" type="application/pdf" width="100%" height="600px" />`;
      else if (data.type === 'url' && data.url) body = `<iframe src="${data.url}" width="100%" height="600px" style="border:none;"></iframe>`;
      else { alert('الباركود غير متاح'); return; }
      const win = window.open('', '_blank');
      if (!win) { alert('السماح بالنوافذ المنبثقة مطلوب'); return; }
      win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>إعادة طباعة</title><style>body{margin:0;padding:14px;font-family:Cairo,Arial}@media print{.np{display:none}}</style></head><body><button class="np" onclick="window.print()" style="padding:10px 22px;background:#2AABEE;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;margin-bottom:12px;cursor:pointer;">🖨️ طباعة ${valid.length}</button>${body}</body></html>`);
      win.document.close();
    } catch (e) { alert(`خطأ: ${e.message}`); }
    setSelected(new Set());
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxHeight: '85vh' }} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>الطلبات المهملة ({orders.length})</h3>
          <button onClick={onClose} style={styles.modalClose}><X size={18} /></button>
        </div>
        <div style={styles.modalBody}>
          <p style={styles.summaryHint}>طلبات طُبعت لكن لم تُحوّل ولم تُرسل لشركة التوصيل. حدّد ما تريد وأعد طباعته.</p>
          <div style={{ ...styles.searchBox, marginBottom: 12 }}>
            <Search size={15} color="#5E6986" />
            <input aria-label="بحث" placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} style={styles.searchInput} />
          </div>
          {shown.length === 0 ? (
            <div style={styles.emptyState}><Package size={28} color="#39425C" /><p>لا توجد طلبات مهملة</p></div>
          ) : shown.map((o) => {
            const page = pages.find((p) => p.id === o.pageId);
            const isSel = selected.has(o.id);
            return (
              <div key={o.id} onClick={() => toggle(o.id)} style={{ ...styles.neglectedRow, ...(isSel ? styles.neglectedRowSel : {}) }}>
                <div style={{ ...styles.neglectedCheck, ...(isSel ? styles.neglectedCheckOn : {}) }}>
                  {isSel && <CheckCircle2 size={14} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.convertedCustomer}>{o.customer} <span style={{ fontSize: 12, color: '#5E6986' }}>#{o.orderNo}</span></div>
                  {o.orderType && <div style={styles.convertedSub}>{o.orderType}</div>}
                  {page && <div style={styles.convertedMeta}>{page.avatar} {page.name}</div>}
                </div>
                <div style={styles.convertedTotal}>{Number(o.total).toLocaleString()} د.ع</div>
              </div>
            );
          })}
        </div>
        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.modalCancelBtn}>إغلاق</button>
          <button onClick={reprintSelected} style={styles.modalSaveBtn}>
            <Printer size={15} style={{ marginLeft: 8, display: 'inline', verticalAlign: 'middle' }} />
            إعادة طباعة ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#222C42" strokeWidth="18" />
        {data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const offset = -cumulative * circumference;
          cumulative += fraction;
          return (
            <circle
              key={i}
              cx="80" cy="80" r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              transform="rotate(-90 80 80)"
              strokeLinecap="round"
            />
          );
        })}
        <text x="80" y="76" textAnchor="middle" fontSize="22" fontWeight="700" fill="#EAF0FB">{total}</text>
        <text x="80" y="94" textAnchor="middle" fontSize="11" fill="#5E6986">طلب</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
            <span style={{ fontSize: 12, color: '#8B96AD' }}>{d.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#EAF0FB' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// عرض الصفحات المرتبطة
// ──────────────────────────────────────────────
function PagesView({ pages, setPages }) {
  const [exchanging, setExchanging] = useState(false);
  const [fbError, setFbError] = useState('');
  const [fbCandidates, setFbCandidates] = useState(null); // صفحات فيسبوك التي جاءت من OAuth بانتظار اختيار المستخدم
  const [subscribingId, setSubscribingId] = useState(null);

  // عند تحميل الصفحة: تحقق إن كان الرابط يحوي ?code= (يعني فيسبوك رجّعنا بعد الموافقة)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const fbErrorParam = params.get('error_description') || params.get('error');

    if (fbErrorParam) {
      setFbError(decodeURIComponent(fbErrorParam));
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (code) {
      // نظّف الرابط فوراً حتى لا يُعاد استخدام نفس الكود عند تحديث الصفحة
      window.history.replaceState({}, '', window.location.pathname);
      exchangeCodeForPages(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exchangeCodeForPages = async (code) => {
    setExchanging(true);
    setFbError('');
    try {
      const res = await fetch(FB_EXCHANGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({ code, redirectUri: FB_REDIRECT_URI }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'فشل الاتصال بفيسبوك');
      }
      if (!data.pages || data.pages.length === 0) {
        setFbError('لم يتم العثور على أي صفحة فيسبوك مرتبطة بحسابك. تأكد أنك مدير لصفحة فيسبوك واحدة على الأقل ووافقت على الصلاحيات المطلوبة.');
        return;
      }
      setFbCandidates(data.pages);
    } catch (e) {
      console.error('FB exchange failed:', e);
      setFbError(e.message || 'حدث خطأ غير متوقع أثناء الربط مع فيسبوك');
    } finally {
      setExchanging(false);
    }
  };

  const confirmAddPage = async (candidate) => {
    const emojis = ['🦅', '👔', '🛍️', '📱', '🏪', '✨', '🎯', '💎'];
    const avatar = emojis[pages.length % emojis.length];
    try {
      const [created] = await sbInsert('alfhd_pages', {
        name: candidate.name,
        avatar,
        source: 'facebook',
        connected: true,
        fb_page_id: candidate.fb_page_id,
        page_access_token: candidate.page_access_token,
      });
      setPages((prev) => [...prev, mapPageFromDb(created)]);
      setFbCandidates((prev) => prev.filter((c) => c.fb_page_id !== candidate.fb_page_id));
      // تفعيل استقبال الرسائل تلقائياً فور ربط الصفحة، بدون انتظار ضغطة زر إضافية
      await subscribePage(created.id);
    } catch (e) {
      console.error('Failed to add page:', e);
      alert('تعذّر حفظ الصفحة، حاول مجدداً');
    }
  };

  const removePage = async (id) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
    try {
      await sbDelete('alfhd_pages', id);
    } catch (e) {
      console.error('Failed to delete page:', e);
    }
  };

  // ── ربط واتساب للصفحة عبر كود الربط (Pairing Code) ──
  const [waSettingsPage, setWaSettingsPage] = useState(null);
  const [waPhoneInput, setWaPhoneInput] = useState('');
  const [savingWa, setSavingWa] = useState(false);
  const [waPairCode, setWaPairCode] = useState('');       // الكود المعروض للمستخدم
  const [waPairStatus, setWaPairStatus] = useState('');   // رسالة الحالة
  const waPollRef = React.useRef(null);

  // اطلب كود الربط من الـ Bridge
  async function requestWaPairing() {
    if (!waSettingsPage) return;
    const phone = arabicToEnglishDigits(waPhoneInput).replace(/[^0-9]/g, '');
    if (phone.length < 10) { alert('أدخل رقم هاتف صحيح مع رمز الدولة (مثال: 9647701234567)'); return; }
    setSavingWa(true);
    setWaPairCode('');
    setWaPairStatus('جارٍ توليد كود الربط...');
    try {
      const res = await fetch(`${WA_BRIDGE_URL}/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: waSettingsPage.id, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.alreadyConnected) {
        await markWaConnected(waSettingsPage.id, phone);
        setWaPairStatus('✅ واتساب مربوط بالفعل!');
        return;
      }
      if (data.pairingCode) {
        setWaPairCode(data.pairingCode);
        setWaPairStatus('أدخل هذا الكود في واتساب خلال دقيقتين');
        startWaStatusPolling(waSettingsPage.id, phone);
      } else {
        setWaPairStatus(`تعذّر توليد الكود: ${data.error || 'حاول مجدداً'}`);
      }
    } catch (e) {
      setWaPairStatus(`خطأ بالاتصال: ${e.message}`);
    } finally {
      setSavingWa(false);
    }
  }

  // راقب حالة الربط حتى يكتمل
  function startWaStatusPolling(pageId, phone) {
    if (waPollRef.current) clearInterval(waPollRef.current);
    let tries = 0;
    waPollRef.current = setInterval(async () => {
      tries++;
      if (tries > 60) { clearInterval(waPollRef.current); setWaPairStatus('انتهت المهلة، حاول مجدداً'); return; }
      try {
        const r = await fetch(`${WA_BRIDGE_URL}/status/${pageId}`);
        const d = await r.json().catch(() => ({}));
        if (d.connected) {
          clearInterval(waPollRef.current);
          await markWaConnected(pageId, d.phone || phone);
          setWaPairCode('');
          setWaPairStatus('✅ تم الربط بنجاح!');
          setTimeout(() => { setWaSettingsPage(null); setWaPairStatus(''); }, 1500);
        }
      } catch (_e) { /* تجاهل */ }
    }, 2000);
  }

  async function markWaConnected(pageId, phone) {
    try {
      await sbUpdate('alfhd_pages', pageId, { wa_phone: phone, wa_connected: true });
    } catch (_e) { /* العمود قد لا يكون موجوداً، لا يؤثر على الربط الفعلي */ }
    setPages((prev) => prev.map((p) => p.id === pageId ? { ...p, waPhone: phone, waConnected: true } : p));
  }

  React.useEffect(() => () => { if (waPollRef.current) clearInterval(waPollRef.current); }, []);

  async function removeWaSettings(pageId) {
    if (!window.confirm('هل تريد إلغاء ربط واتساب من هذه الصفحة؟')) return;
    try {
      await fetch(`${WA_BRIDGE_URL}/unpair`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId }),
      });
    } catch (_e) { /* تجاهل */ }
    try { await sbUpdate('alfhd_pages', pageId, { wa_phone: null, wa_connected: false }); } catch (_e) {}
    setPages((prev) => prev.map((p) => p.id === pageId ? { ...p, waPhone: null, waConnected: false } : p));
  }

  const subscribePage = async (pageId) => {
    setSubscribingId(pageId);
    try {
      const res = await fetch(FB_SUBSCRIBE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({ pageId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'فشل تفعيل استقبال الرسائل');
      }
      alert('تم تفعيل استقبال الرسائل الحقيقية لهذه الصفحة بنجاح ✅');
    } catch (e) {
      console.error('Subscribe failed:', e);
      alert('تعذّر تفعيل استقبال الرسائل: ' + (e.message || ''));
    } finally {
      setSubscribingId(null);
    }
  };

  return (
    <div style={styles.viewWrap}>
      <div style={styles.viewHeader} className="alfhd-view-header">
        <div>
          <h2 style={styles.viewTitle}>الصفحات المرتبطة</h2>
          <p style={styles.viewSubtitle}>صفحات فيسبوك المرتبطة بنظام AlFhd لإدارة المحادثات والطلبات</p>
        </div>
        <button
          onClick={startFacebookLogin}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 20px',
            background: 'linear-gradient(135deg,#1877F2,#0D5FBF)',
            border: 'none', borderRadius: 12,
            color: '#fff', fontSize: 13, fontWeight: 700,
            boxShadow: '0 4px 16px rgba(24,119,242,0.4)',
            transition: 'all 0.2s ease',
          }}
          disabled={exchanging}
        >
          <Facebook size={17} />
          {exchanging ? 'جارٍ الاتصال...' : 'ربط صفحة جديدة'}
        </button>
      </div>

      {fbError && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          marginBottom: 16, padding: '12px 16px',
          background: 'rgba(242,80,80,0.08)', border: '1px solid rgba(242,80,80,0.22)',
          borderRadius: 12, color: '#F25050', fontSize: 13, lineHeight: 1.6,
        }}>
          <XCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{fbError}</span>
        </div>
      )}

      {exchanging && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
          padding: '12px 16px',
          background: 'rgba(42,171,238,0.07)', border: '1px solid rgba(42,171,238,0.18)',
          borderRadius: 12, color: '#2AABEE', fontSize: 13,
        }}>
          <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          جارٍ التحقق من حسابك على فيسبوك وجلب صفحاتك...
        </div>
      )}

      {/* صفحات مرشحة للربط */}
      {fbCandidates && fbCandidates.length > 0 && (
        <div style={{
          marginBottom: 20, background: 'linear-gradient(145deg,#17212B,#1A2736)',
          border: '1px solid rgba(42,171,238,0.22)', borderRadius: 14, padding: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F5', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Facebook size={15} color="#2AABEE" />
            اختر الصفحة للربط
          </div>
          {fbCandidates.map((c) => (
            <div key={c.fb_page_id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              {c.avatar
                ? <img src={c.avatar} alt="" onError={(e)=>{e.target.style.display='none';}} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#1877F2,#0D5FBF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Facebook size={20} color="#fff" /></div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#F5F5F5' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 2 }}>ID: {c.fb_page_id}</div>
              </div>
              <button
                onClick={() => confirmAddPage(c)}
                style={{
                  padding: '8px 16px', background: 'linear-gradient(135deg,#1877F2,#0D5FBF)',
                  border: 'none', borderRadius: 9, color: '#fff', fontSize: 12, fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(24,119,242,0.35)', flexShrink: 0,
                }}
              >
                ربط
              </button>
            </div>
          ))}
        </div>
      )}

      {/* الصفحات المرتبطة — تصميم جديد فخم */}
      {pages.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, padding: '60px 20px',
          background: 'linear-gradient(145deg,#17212B,#1A2736)',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16,
        }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(24,119,242,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Facebook size={32} color="#1877F2" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#8B9AB3', marginBottom: 8 }}>لا توجد صفحات مرتبطة</div>
            <div style={{ fontSize: 12, color: '#8FA0B5' }}>اضغط "ربط صفحة جديدة" لبدء ربط صفحاتك</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }} className="alfhd-pages-grid">
          {pages.map((p) => (
            <div key={p.id} style={{
              position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(145deg,#17212B,#1A2736)',
              border: p.connected ? '1px solid rgba(29,209,107,0.22)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              boxShadow: p.connected
                ? '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(29,209,107,0.08)'
                : '0 4px 20px rgba(0,0,0,0.5)',
              transition: 'all 0.25s ease',
            }}>
              {/* شريط علوي ملوّن */}
              <div style={{
                position: 'absolute', top: 0, right: 0, left: 0, height: 3,
                background: p.connected
                  ? 'linear-gradient(90deg,transparent,#1DDB6B,transparent)'
                  : 'linear-gradient(90deg,transparent,#1877F2,transparent)',
                opacity: 0.8,
              }} />

              {/* رأس الكرت */}
              <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* أفاتار الصفحة */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'linear-gradient(135deg,#1877F2,#0D5FBF)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, border: '2px solid rgba(24,119,242,0.3)',
                    boxShadow: '0 4px 12px rgba(24,119,242,0.3)',
                  }}>
                    {p.avatar && p.avatar !== '📄' ? p.avatar : <Facebook size={28} color="#fff" />}
                  </div>
                  {/* نقطة الاتصال */}
                  <div className={p.connected ? 'alfhd-pulse' : ''} style={{
                    position: 'absolute', bottom: -2, left: -2,
                    width: 16, height: 16, borderRadius: '50%',
                    background: p.connected ? '#1DDB6B' : '#8FA0B5',
                    border: '2.5px solid #17212B',
                  }} />
                </div>

                {/* معلومات الصفحة */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#F5F5F5', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#8FA0B5' }}>
                    <Facebook size={10} color="#1877F2" />
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.fbPageId ? p.fbPageId.slice(0, 16) + '...' : 'معرّف غير متاح'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 8px', borderRadius: 20,
                      background: p.connected ? 'rgba(29,219,107,0.12)' : 'rgba(84,104,128,0.15)',
                      fontSize: 12, fontWeight: 700,
                      color: p.connected ? '#1DDB6B' : '#8B9AB3',
                    }}>
                      <Facebook size={11} />
                      {p.connected ? 'ماسنجر متصل' : 'ماسنجر غير متصل'}
                    </div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 8px', borderRadius: 20,
                      background: p.waConnected ? 'rgba(37,211,102,0.14)' : 'rgba(244,91,105,0.12)',
                      fontSize: 12, fontWeight: 700,
                      color: p.waConnected ? '#25D366' : '#F45B69',
                    }}>
                      <MessageCircle size={11} />
                      {p.waConnected ? 'واتساب متصل' : 'واتساب غير متصل'}
                    </div>
                  </div>
                </div>

                {/* زر الحذف */}
                <button
                  onClick={() => removePage(p.id)}
                  title="حذف الصفحة"
                  style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'rgba(242,80,80,0.08)',
                    border: '1px solid rgba(242,80,80,0.15)',
                    color: '#F25050', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* فاصل */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 16px' }} />

              {/* تذييل الكرت */}
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => subscribePage(p.id)}
                  disabled={subscribingId === p.id}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '8px',
                    background: p.connected ? 'rgba(29,219,107,0.08)' : 'rgba(42,171,238,0.08)',
                    border: p.connected ? '1px solid rgba(29,219,107,0.22)' : '1px solid rgba(42,171,238,0.22)',
                    borderRadius: 10, fontSize: 12.5, fontWeight: 700,
                    color: p.connected ? '#1DDB6B' : '#2AABEE',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {subscribingId === p.id
                    ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> جارٍ التفعيل...</>
                    : <><CheckCircle2 size={13} /> {p.connected ? 'تحديث ربط ماسنجر' : 'تفعيل ربط ماسنجر'}</>
                  }
                </button>

                {/* زر واتساب */}
                <button
                  onClick={() => {
                    setWaSettingsPage(p);
                    setWaPhoneInput(p.waPhoneNumberId || '');
                    setWaTokenInput(p.waToken || '');
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '8px',
                    background: p.waConnected ? 'rgba(37,211,102,0.08)' : 'rgba(255,255,255,0.04)',
                    border: p.waConnected ? '1px solid rgba(37,211,102,0.30)' : '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 10, fontSize: 12.5, fontWeight: 700,
                    color: p.waConnected ? '#25D366' : '#8B9AB3',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {p.waConnected ? 'واتساب مربوط ✓' : 'ربط واتساب'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── موديل إعدادات واتساب ── */}
      {waSettingsPage && (
        <div style={styles.modalOverlay} onClick={() => { setWaSettingsPage(null); setWaPairCode(''); setWaPairStatus(''); }}>
          <div style={styles.modal} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <span style={{ color: '#25D366', marginLeft: 8 }}>●</span>
                ربط واتساب — {waSettingsPage.name}
              </h3>
              <button onClick={() => { setWaSettingsPage(null); setWaPairCode(''); setWaPairStatus(''); }} style={styles.modalClose}><X size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              {/* إذا مربوط مسبقاً */}
              {waSettingsPage.waConnected ? (
                <>
                  <div style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: 12, padding: '16px', textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#25D366' }}>واتساب مربوط بنجاح</div>
                    {waSettingsPage.waPhone && <div style={{ fontSize: 12, color: '#9FB0C3', marginTop: 4, direction: 'ltr' }}>+{waSettingsPage.waPhone}</div>}
                  </div>
                  <button onClick={() => { removeWaSettings(waSettingsPage.id); setWaSettingsPage(null); }}
                    style={{ width: '100%', padding: '12px', background: 'rgba(242,80,80,0.1)', border: '1px solid rgba(242,80,80,0.3)', borderRadius: 10, color: '#F25050', fontSize: 13, fontWeight: 700 }}>
                    إلغاء ربط واتساب
                  </button>
                </>
              ) : waPairCode ? (
                /* عرض كود الربط */
                <>
                  <div style={{ background: 'rgba(37,211,102,0.07)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 12, padding: '20px', textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#9FB0C3', marginBottom: 8 }}>أدخل هذا الكود في واتساب على هاتفك</div>
                    <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 6, color: '#25D366', fontFamily: 'monospace', direction: 'ltr' }}>
                      {waPairCode}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#9FB0C3', lineHeight: 1.9, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#EAF0F7', marginBottom: 8 }}>الخطوات على هاتفك:</div>
                    <div>١. افتح واتساب ← الإعدادات</div>
                    <div>٢. الأجهزة المرتبطة ← ربط جهاز</div>
                    <div>٣. اضغط "الربط برقم الهاتف بدلاً من ذلك"</div>
                    <div>٤. أدخل الكود أعلاه</div>
                  </div>
                  {waPairStatus && <div style={{ fontSize: 12, color: '#2AABEE', textAlign: 'center', marginTop: 12, fontWeight: 600 }}>{waPairStatus}</div>}
                </>
              ) : (
                /* إدخال الرقم */
                <>
                  <div style={{ background: 'rgba(37,211,102,0.07)', border: '1px solid rgba(37,211,102,0.20)', borderRadius: 10, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: '#25D366', lineHeight: 1.7 }}>
                    أدخل رقم واتساب الخاص بهذه الصفحة مع رمز الدولة، وسيظهر لك كود تُدخله في تطبيق واتساب لربط الصفحة.
                  </div>
                  <div style={styles.formGroup}>
                    <label style={{ ...styles.formLabel, display: 'flex', alignItems: 'center', gap: 4 }}>
                      رقم واتساب (مع رمز الدولة) <span style={{ color: '#F25050', fontWeight: 800 }}>*</span>
                    </label>
                    <input value={waPhoneInput} onChange={(e) => setWaPhoneInput(arabicToEnglishDigits(e.target.value))}
                      style={{ ...styles.formInput, fontFamily: 'monospace', direction: 'ltr' }}
                      placeholder="مثال: 9647701234567" inputMode="numeric" />
                  </div>
                  {waPairStatus && <div style={{ fontSize: 12, color: '#F0A868', textAlign: 'center', marginTop: 8 }}>{waPairStatus}</div>}
                </>
              )}
            </div>
            {!waSettingsPage.waConnected && !waPairCode && (
              <div style={styles.modalFooter}>
                <button onClick={() => setWaSettingsPage(null)} style={styles.modalCancelBtn}>إلغاء</button>
                <button onClick={requestWaPairing} disabled={savingWa}
                  style={{ ...styles.modalSaveBtn, background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
                  {savingWa ? 'جارٍ التوليد...' : 'توليد كود الربط'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// عرض إدارة المستخدمين
// ──────────────────────────────────────────────
const PERMISSIONS_LIST = [
  { id: 'conversations', label: 'عرض المحادثات' },
  { id: 'orders_view', label: 'عرض الطلبات' },
  { id: 'orders_edit', label: 'تعديل حالة الطلبات' },
  { id: 'stats', label: 'عرض الإحصائيات' },
  { id: 'pages_manage', label: 'إدارة الصفحات' },
  { id: 'users_manage', label: 'إدارة المستخدمين' },
  { id: 'ai_manage', label: 'التحكم بالذكاء الصناعي' },
];

function AdminView({ users, setUsers, orders, conversations, onViewConversation, onContactWhatsApp }) {
  const [adminTab, setAdminTab] = useState('managers'); // managers | warehouse | fulfillment
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', role: 'manager', permissions: [], jobTitle: '', whatsapp: '', isolated: false });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const managers = users.filter((u) => u.role === 'admin' || u.role === 'manager');
  const warehouse = users.filter((u) => u.role === 'warehouse');

  const openAddManager = () => {
    setForm({ name: '', code: '', role: 'manager', permissions: [], jobTitle: '', whatsapp: '', isolated: false });
    setEditingUser(null); setFormError(''); setShowAdd(true);
  };
  const openAddWarehouse = () => {
    setForm({ name: '', code: '', role: 'warehouse', permissions: [], jobTitle: '', whatsapp: '', isolated: false });
    setEditingUser(null); setFormError(''); setShowAdd(true);
  };
  const openEdit = (user) => {
    setForm({ name: user.name, code: user.code, role: user.role, permissions: user.permissions || [], jobTitle: user.jobTitle || '', whatsapp: user.whatsapp || '', isolated: !!user.workspaceId });
    setEditingUser(user); setFormError(''); setShowAdd(true);
  };

  const togglePermission = (permId) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId) ? prev.permissions.filter((p) => p !== permId) : [...prev.permissions, permId],
    }));
  };

  const saveUser = async () => {
    if (!form.name.trim() || saving) return;
    const code = form.code.trim();
    if (!/^\d{4}$/.test(code)) { setFormError('رمز الدخول يجب أن يكون 4 أرقام'); return; }

    const codeTaken = users.some((u) => u.code === code && u.id !== editingUser?.id);
    if (codeTaken) { setFormError('هذا الرمز مستخدم من قبل'); return; }

    setSaving(true); setFormError('');
    try {
      const payload = {
        name: form.name.trim(), code, role: form.role,
        permissions: form.role === 'admin' ? ['all'] : form.permissions,
        job_title: form.jobTitle || null, whatsapp: form.whatsapp || null,
      };
      if (editingUser) {
        // عند التعديل: لا نغيّر workspace_id الموجود (لتفادي فقدان بيانات مساحته)
        const [updated] = await sbUpdate('alfhd_users', editingUser.id, payload);
        setUsers((prev) => prev.map((u) => u.id === editingUser.id ? mapUserFromDb(updated) : u));
      } else {
        const [created] = await sbInsert('alfhd_users', { ...payload, active: true });
        // مساحة مستقلة: workspace_id = معرّف المستخدم نفسه (تُحفظ بعد الإنشاء للحصول على id)
        if (form.isolated && created?.id) {
          try {
            const [withWs] = await sbUpdate('alfhd_users', created.id, { workspace_id: created.id });
            setUsers((prev) => [...prev, mapUserFromDb(withWs || created)]);
          } catch (_e) { setUsers((prev) => [...prev, mapUserFromDb(created)]); }
        } else {
          setUsers((prev) => [...prev, mapUserFromDb(created)]);
        }
      }
      setShowAdd(false);
    } catch (e) {
      console.error('save user error:', e);
      setFormError('خطأ: ' + e.message);
    } finally { setSaving(false); }
  };

  const toggleActive = async (id) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    const newActive = !target.active;
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: newActive } : u));
    try { await sbUpdate('alfhd_users', id, { active: newActive }); } catch (e) { console.error(e); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('حذف هذا الموظف نهائياً؟')) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
    try { await sbDelete('alfhd_users', id); } catch (e) { console.error(e); }
  };

  // طلبات التجهيز: المجهّزة والمرفوضة
  const fulfillmentOrders = useMemo(() => {
    return orders.filter((o) => o.prepStatus === 'done' || o.prepStatus === 'rejected')
      .sort((a, b) => new Date(b.prepAt || 0) - new Date(a.prepAt || 0));
  }, [orders]);

  const ADMIN_TABS = [
    { id: 'managers', label: 'المدراء', icon: ShieldCheck },
    { id: 'warehouse', label: 'موظفي التجهيز', icon: Package },
    { id: 'fulfillment', label: 'متابعة التجهيز', icon: CheckCircle2 },
  ];

  function UserCard({ u, isWarehouse }) {
    return (
      <div style={{ ...styles.userCard, opacity: u.active ? 1 : 0.5 }} className="alfhd-order-card">
        <div style={styles.userCardTop}>
          <div style={{ ...styles.userCardAvatar, background: u.role === 'admin' ? 'linear-gradient(135deg,#60A5FA,#1D4ED8)' : '#222C42', color: u.role === 'admin' ? '#fff' : '#3B82F6' }}>
            {u.name[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.userCardName}>{u.name}</div>
            <div style={styles.userCardRole}>
              {u.role === 'admin' ? <><ShieldCheck size={12} color="#4ADE80" /> مدير عام</>
                : u.role === 'warehouse' ? <><Package size={12} color="#F0A868" /> {u.jobTitle || 'موظف تجهيز'}</>
                : <><Shield size={12} color="#3B82F6" /> مدير ({(u.permissions || []).length} صلاحية)</>}
            </div>
          </div>
          <div style={{ ...styles.activeDot, background: u.active ? '#4ADE80' : '#5E6986' }} />
        </div>

        <div style={styles.userCardMetaRow}>
          <span style={styles.userCodeTag}>الرمز: {u.code}</span>
          {isWarehouse && u.whatsapp && <span style={styles.userCodeTag}>واتساب: {u.whatsapp}</span>}
        </div>

        {u.role === 'manager' && (u.permissions || []).length > 0 && (
          <div style={styles.userPermsList}>
            {u.permissions.map((pId) => {
              const perm = PERMISSIONS_LIST.find((p) => p.id === pId);
              return perm ? <span key={pId} style={styles.permTag}>{perm.label}</span> : null;
            })}
          </div>
        )}

        <div style={styles.userCardActions}>
          <button onClick={() => openEdit(u)} style={styles.userActionBtn}><Edit3 size={13} /> تعديل</button>
          <button onClick={() => toggleActive(u.id)} style={styles.userActionBtn}>
            {u.active ? <EyeOff size={13} /> : <Eye size={13} />} {u.active ? 'تعطيل' : 'تفعيل'}
          </button>
          {u.role !== 'admin' && (
            <button onClick={() => deleteUser(u.id)} style={{ ...styles.userActionBtn, color: '#F45B69' }}><Trash2 size={13} /> حذف</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.viewWrap}>
      <div style={styles.viewHeader} className="alfhd-view-header">
        <div>
          <h2 style={styles.viewTitle}>الإدارة العامة</h2>
          <p style={styles.viewSubtitle}>المدراء، موظفو المخزن، ومتابعة تجهيز الطلبات</p>
        </div>
        {adminTab === 'managers' && <button onClick={openAddManager} style={styles.addBtn}><UserPlus size={16} /> إضافة مدير</button>}
        {adminTab === 'warehouse' && <button onClick={openAddWarehouse} style={styles.addBtn}><UserPlus size={16} /> إضافة موظف تجهيز</button>}
      </div>

      <div style={styles.sectionTabs}>
        {ADMIN_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setAdminTab(t.id)} style={{ ...styles.sectionTab, ...(adminTab === t.id ? styles.sectionTabActive : {}) }}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {adminTab === 'managers' && (
        <div style={styles.usersGrid} className="alfhd-users-grid">
          {managers.map((u) => <UserCard key={u.id} u={u} />)}
        </div>
      )}

      {adminTab === 'warehouse' && (
        warehouse.length === 0 ? (
          <div style={styles.emptyState}><Package size={32} color="#39425C" /><p>لا يوجد موظفو تجهيز بعد</p></div>
        ) : (
          <div style={styles.usersGrid} className="alfhd-users-grid">
            {warehouse.map((u) => <UserCard key={u.id} u={u} isWarehouse />)}
          </div>
        )
      )}

      {adminTab === 'fulfillment' && (
        <FulfillmentList orders={fulfillmentOrders} users={users} onViewConversation={onViewConversation} onContactWhatsApp={onContactWhatsApp} />
      )}

      {showAdd && (
        <div style={styles.modalOverlay} onClick={() => setShowAdd(false)}>
          <div style={styles.modal} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingUser ? 'تعديل' : (form.role === 'warehouse' ? 'إضافة موظف تجهيز' : 'إضافة مدير')}
              </h3>
              <button onClick={() => setShowAdd(false)} style={styles.modalClose}><X size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>الاسم</label>
                <input aria-label="اسم الموظف" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={styles.formInput} placeholder="اسم الموظف" />
              </div>

              {form.role === 'warehouse' && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>المسمى الوظيفي</label>
                    <input aria-label="مثال: مسؤول تجهيز" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} style={styles.formInput} placeholder="مثال: مسؤول تجهيز" />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>رقم واتساب</label>
                    <input aria-label="07XXXXXXXXX" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: arabicToEnglishDigits(e.target.value) })} style={styles.formInput} placeholder="07XXXXXXXXX" />
                  </div>
                </>
              )}

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>رمز الدخول (4 أرقام)</label>
                <input aria-label="1234" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={styles.formInput} placeholder="1234" inputMode="numeric" />
              </div>

              {form.role !== 'warehouse' && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>نوع المدير</label>
                    <div style={styles.roleToggle}>
                      <button onClick={() => setForm({ ...form, role: 'admin' })} style={{ ...styles.roleBtn, ...(form.role === 'admin' ? styles.roleBtnActive : {}) }}>
                        <ShieldCheck size={14} /> مدير عام
                      </button>
                      <button onClick={() => setForm({ ...form, role: 'manager' })} style={{ ...styles.roleBtn, ...(form.role === 'manager' ? styles.roleBtnActive : {}) }}>
                        <Shield size={14} /> صلاحية محددة
                      </button>
                    </div>
                  </div>

                  {form.role === 'manager' && (
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>الصلاحيات</label>
                      <div style={styles.permsGrid}>
                        {PERMISSIONS_LIST.map((perm) => (
                          <label key={perm.id} style={styles.permCheckRow}>
                            <input type="checkbox" checked={form.permissions.includes(perm.id)} onChange={() => togglePermission(perm.id)} style={styles.checkbox} />
                            <span>{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {form.role === 'warehouse' && (
                <div style={styles.warehouseNote}>
                  <AlertCircle size={14} color="#F0A868" />
                  <span>موظف التجهيز يرى فقط الطلبات المثبتة من كل الصفحات، ويعلّمها "تم التجهيز" أو "لم يتم" بدون صلاحية تعديل أو حذف.</span>
                </div>
              )}

              {/* خيار المساحة المستقلة — فقط عند إضافة موظف جديد (غير التجهيز) */}
              {!editingUser && form.role !== 'warehouse' && (
                <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 12, padding: '12px 16px' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.isolated} onChange={(e) => setForm({ ...form, isolated: e.target.checked })} style={{ ...styles.checkbox, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#A78BFA' }}>مساحة مستقلة خاصة 🔒</div>
                      <div style={{ fontSize: 12, color: '#9FB0C3', marginTop: 4, lineHeight: 1.7 }}>
                        يحصل هذا الموظف على مساحة معزولة تماماً: صفحاته ومخزنه وطلباته ومحادثاته خاصة به فقط، لا يراها أحد ولا يرى بيانات الآخرين. يبدأ من الصفر ويشتغل بحرية كاملة.
                      </div>
                    </div>
                  </label>
                </div>
              )}
              {!editingUser && form.isolated && form.role !== 'warehouse' && (
                <div style={{ fontSize: 12, color: '#F0A868', padding: '0 4px', lineHeight: 1.6 }}>
                  ⚠️ لا يمكن تغيير هذا الخيار بعد الإنشاء.
                </div>
              )}

              {formError && <p style={{ color: '#F45B69', fontSize: 12, margin: 0 }}>{formError}</p>}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowAdd(false)} style={styles.modalCancelBtn}>إلغاء</button>
              <button onClick={saveUser} style={styles.modalSaveBtn} disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FulfillmentList({ orders, users, onViewConversation, onContactWhatsApp }) {
  const [filter, setFilter] = useState('all'); // all | done | rejected
  const [timeFilter, setTimeFilter] = useState('all');
  const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const years = [];
  for (let y = new Date().getFullYear(); y >= 2024; y--) years.push(y);

  function inTime(dateStr) {
    return dateInRange(dateStr, timeFilter, customMonth, customYear);
  }

  const shown = orders.filter((o) => (filter === 'all' || o.prepStatus === filter) && inTime(o.prepAt));


  if (orders.length === 0) {
    return <div style={styles.emptyState}><CheckCircle2 size={32} color="#39425C" /><p>لا توجد طلبات تم التعامل معها بعد</p></div>;
  }

  return (
    <div>
      <div style={styles.filterChips} className="alfhd-no-print">
        {[['all', 'الكل'], ['done', 'تم التجهيز'], ['rejected', 'لم يتم']].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} style={{ ...styles.chip, ...(filter === id ? styles.chipActive : {}) }}>{label}</button>
        ))}
      </div>
      <div style={{ ...styles.filtersWrap, marginTop: 8 }} className="alfhd-no-print">
        <div style={styles.filterBottomRow}>
          <div style={styles.pageSelectWrap}>
            <Calendar size={15} color="#60A5FA" />
            <select aria-label="خيار" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} style={styles.pageSelect}>
              {DATE_PRESETS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <ChevronDown size={14} color="#5E6986" />
          </div>
          {timeFilter === 'custom' && (
            <>
              <select aria-label="الشهر" value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} style={styles.customDateSelectCompact}>
                {AR_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select aria-label="السنة" value={customYear} onChange={(e) => setCustomYear(e.target.value)} style={styles.customDateSelectCompact}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      <div style={{ ...styles.ordersGrid, marginTop: 16 }}>
        {shown.map((o) => {
          const prepUser = users.find((u) => u.id === o.prepBy);
          const isDone = o.prepStatus === 'done';
          const prepTime = o.prepAt ? new Date(o.prepAt).toLocaleString('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' }) : null;
          return (
            <div
              key={o.id}
              style={{ ...styles.orderCard, ...(isDone ? {} : styles.rejectedCard) }}
              className="alfhd-order-card"
            >
              {!isDone && (
                <div style={styles.rejectedBanner}>
                  <AlertCircle size={16} />
                  <span>طلب لم يُجهَّز — يحتاج متابعة عاجلة</span>
                </div>
              )}

              <div style={styles.orderTicketHead}>
                <div style={{ ...styles.orderTicketAvatar, background: isDone ? 'rgba(74,222,128,0.15)' : 'rgba(244,91,105,0.18)', color: isDone ? '#4ADE80' : '#F45B69', border: 'none' }}>
                  {isDone ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.orderCardCustomer}>{o.customer} <span style={{ fontSize: 12, color: '#5E6986' }}>#{o.orderNo}</span></div>
                  <div style={styles.orderTicketPage}>المجهّز: {o.prepByName || prepUser?.name || 'غير معروف'}</div>
                </div>
                <div style={{ ...styles.orderStatusPill, color: isDone ? '#4ADE80' : '#F45B69', background: isDone ? 'rgba(74,222,128,0.12)' : 'rgba(244,91,105,0.16)' }}>
                  {isDone ? 'تم التجهيز' : 'لم يتم'}
                </div>
              </div>

              {prepTime && (
                <div style={styles.prepTimeRow}>
                  <Calendar size={12} color="#5E6986" />
                  <span>{isDone ? 'وقت التجهيز' : 'وقت الرفض'}: {prepTime}</span>
                </div>
              )}

              {!isDone && o.prepReason && (
                <div style={styles.rejectReasonBox}>
                  <span style={styles.rejectReasonLabel}>سبب عدم التجهيز:</span>
                  <span>{o.prepReason}</span>
                </div>
              )}

              {o.items && <div style={{ ...styles.orderTicketItems, margin: '0 16px 12px' }}>{o.items}</div>}

              {!isDone && (
                <div style={styles.orderCardActions}>
                  {prepUser?.whatsapp && (
                    <button onClick={() => onContactWhatsApp?.(prepUser.whatsapp)} style={styles.orderActionBtn} title="اتصال بالمجهّز عبر واتساب">
                      <Phone size={14} /> <span style={{ fontSize: 12, fontWeight: 700 }}>المجهّز</span>
                    </button>
                  )}
                  {o.conversationId ? (
                    <button onClick={() => onViewConversation?.(o.conversationId)} style={styles.orderActionBtn} title="مراسلة الزبون">
                      <MessageSquare size={14} /> <span style={{ fontSize: 12, fontWeight: 700 }}>الزبون</span>
                    </button>
                  ) : o.phone ? (
                    <button onClick={() => onContactWhatsApp?.(o.phone)} style={styles.orderActionBtn} title="الاتصال بالزبون">
                      <Phone size={14} /> <span style={{ fontSize: 12, fontWeight: 700 }}>الزبون</span>
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

// واجهة موظف التجهيز المبسطة — يرى الطلبات المثبتة بدون سعر، ويعلّمها تم/لم يتم
function PrepWorkerView({ currentUser, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null); // الطلب الجاري رفضه
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [whProducts, setWhProducts] = useState([]); // منتجات المخزن (لعرض موقع التخزين)
  const knownIdsRef = React.useRef(new Set());

  // حمّل منتجات المخزن مرة واحدة — لمطابقة الطلب وإظهار مكان البضاعة
  useEffect(() => {
    (async () => {
      try {
        const rows = await sbSelect('wh_products', wsFilter() + '&order=car_name.asc');
        setWhProducts(Array.isArray(rows) ? rows : []);
      } catch (_e) { setWhProducts([]); }
    })();
  }, []);

  // جلب الطلبات المثبتة التي تحتاج تجهيز (غير مُجهّزة بعد)
  const loadOrders = useCallback(async () => {
    try {
      const rows = await sbSelect('alfhd_orders', wsFilter() + '&order=created_at.desc&limit=300');
      if (!rows) return;
      let mapped = rows.map(mapOrderFromDb)
        .filter((o) => o.converted !== true && o.stage !== 'delivery' && o.prepStatus !== 'done');
      // حماية: أزِل أي طلبات مكررة (نفس source_message_id أو نفس id) من العرض
      const seenIds = new Set();
      const seenMsg = new Set();
      mapped = mapped.filter((o) => {
        if (seenIds.has(o.id)) return false;
        seenIds.add(o.id);
        if (o.sourceMessageId) {
          if (seenMsg.has(o.sourceMessageId)) return false;
          seenMsg.add(o.sourceMessageId);
        }
        return true;
      });
      // إشعار صوتي عند وصول طلب جديد للتجهيز
      if (knownIdsRef.current.size > 0) {
        const isNew = mapped.some((o) => !knownIdsRef.current.has(o.id) && o.prepStatus !== 'rejected');
        if (isNew) { try { playNotificationSound(); } catch (_e) { /* تجاهل */ } }
      }
      knownIdsRef.current = new Set(mapped.map((o) => o.id));
      setOrders(mapped);
    } catch (e) {
      console.error('prep load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 12000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  async function markDone(o) {
    setBusyId(o.id);
    const patch = { prep_status: 'done', prep_by: currentUser.id, prep_by_name: currentUser.name, prep_at: new Date().toISOString() };
    try { await sbUpdate('alfhd_orders', o.id, patch); } catch (e) { console.error(e); }
    setOrders((prev) => prev.filter((x) => x.id !== o.id));
    setBusyId(null);
  }

  // استلام الطلب: يعلّمه "قيد التجهيز" باسم الموظف ليراه الباقون
  async function claimOrder(o) {
    // إن كان مستلماً من موظف آخر، لا نسمح بالاستلام (إلا إن كان نفس الموظف)
    if (o.prepStatus === 'claiming' && o.prepBy && o.prepBy !== currentUser.id) {
      return; // محجوز من غيره
    }
    // إن كان مستلماً مني، ألغِ الاستلام (toggle)
    const isMine = o.prepStatus === 'claiming' && o.prepBy === currentUser.id;
    const patch = isMine
      ? { prep_status: null, prep_by: null, prep_by_name: null, prep_at: null }
      : { prep_status: 'claiming', prep_by: currentUser.id, prep_by_name: currentUser.name, prep_at: new Date().toISOString() };
    // تحديث فوري بالواجهة
    setOrders((prev) => prev.map((x) => x.id === o.id ? {
      ...x,
      prepStatus: patch.prep_status,
      prepBy: patch.prep_by,
      prepByName: patch.prep_by_name,
    } : x));
    try { await sbUpdate('alfhd_orders', o.id, patch); } catch (e) { console.error(e); }
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    const o = rejectTarget;
    setBusyId(o.id);
    const patch = {
      prep_status: 'rejected', prep_by: currentUser.id, prep_by_name: currentUser.name,
      prep_at: new Date().toISOString(), prep_reason: rejectReason.trim() || null,
    };
    try { await sbUpdate('alfhd_orders', o.id, patch); } catch (e) { console.error(e); }
    setOrders((prev) => prev.filter((x) => x.id !== o.id));
    setRejectTarget(null);
    setRejectReason('');
    setBusyId(null);
  }

  // الطلبات المعروضة: المثبتة وغير المرفوضة (الجديدة تحتاج تجهيز)
  const pending = orders.filter((o) => o.prepStatus !== 'rejected');

  return (
    <ErrorBoundary>
    <>
      <GlobalStyles />
      <div style={styles.appWrap} className="alfhd-app-wrap">
        <main style={{ ...styles.mainArea, marginRight: 0, width: '100%' }} className="alfhd-main-area">
          {/* هيدر المجهّز */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(23,33,43,0.6)', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(240,168,104,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={18} color="#F0A868" />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#F5F5F5' }}>التجهيز</div>
                <div style={{ fontSize: 12, color: '#9FB0C3' }}>{currentUser.name}</div>
              </div>
            </div>
            <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', background: 'rgba(229,57,53,0.12)', border: '1px solid rgba(229,57,53,0.3)', borderRadius: 10, color: '#E53935', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              <LogOut size={14} /> خروج
            </button>
          </div>

          {/* عدّاد الطلبات */}
          <div style={{ padding: '12px 16px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#EAF0FB' }}>طلبات بحاجة للتجهيز</span>
            <span style={{ minWidth: 22, height: 22, padding: '0 8px', borderRadius: 11, background: pending.length ? 'rgba(240,168,104,0.18)' : 'rgba(255,255,255,0.05)', color: pending.length ? '#F0A868' : '#8FA0B5', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pending.length}</span>
          </div>

          <div style={{ padding: '8px 16px 24px', overflowY: 'auto', flex: 1 }}>
            {loading && <div style={styles.emptyState}><Package size={30} color="#39425C" /><p>جارٍ التحميل...</p></div>}
            {!loading && pending.length === 0 && (
              <div style={styles.emptyState}><CheckCircle2 size={34} color="#4DDB6B" /><p>ما في طلبات بحاجة للتجهيز حالياً 🎉</p></div>
            )}
            <div style={styles.ordersGrid}>
              {pending.map((o, i) => {
                const claimed = o.prepStatus === 'claiming';
                const claimedByMe = claimed && o.prepBy === currentUser.id;
                const claimedByOther = claimed && o.prepBy && o.prepBy !== currentUser.id;
                // لون الشريط العلوي حسب الحالة
                const topColor = claimedByMe ? '#2AABEE' : claimedByOther ? '#A78BFA' : '#F0A868';
                return (
                <div key={o.id} style={{
                  ...styles.orderCard,
                  animationDelay: `${Math.min(i * 0.04, 0.4)}s`,
                  opacity: claimedByOther ? 0.72 : 1,
                  border: claimedByMe ? '1.5px solid rgba(42,171,238,0.5)' : claimedByOther ? '1px solid rgba(167,139,250,0.3)' : undefined,
                  background: claimedByMe ? 'rgba(42,171,238,0.04)' : claimedByOther ? 'rgba(167,139,250,0.03)' : undefined,
                }} className="alfhd-order-card alfhd-card-enter">
                  <div style={{ height: 3, background: topColor, width: '100%' }} />
                  <div style={{ padding: 16 }}>
                    {/* شارة قيد التجهيز من قبل موظف */}
                    {claimed && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                        padding: '8px 12px', borderRadius: 9,
                        background: claimedByMe ? 'rgba(42,171,238,0.12)' : 'rgba(167,139,250,0.12)',
                        border: `1px solid ${claimedByMe ? 'rgba(42,171,238,0.3)' : 'rgba(167,139,250,0.3)'}`,
                      }}>
                        <Package size={13} color={claimedByMe ? '#2AABEE' : '#A78BFA'} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: claimedByMe ? '#2AABEE' : '#A78BFA' }}>
                          {claimedByMe ? '🔧 قيد التجهيز عندك' : `🔒 قيد التجهيز من قبل ${o.prepByName || 'موظف آخر'}`}
                        </span>
                      </div>
                    )}

                    {/* رأس الطلب — الضغط عليه يستلم/يلغي الاستلام */}
                    <div
                      onClick={() => !claimedByOther && claimOrder(o)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: claimedByOther ? 'not-allowed' : 'pointer' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(42,171,238,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package size={19} color="#2AABEE" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#F5F5F5' }}>{o.customer || 'زبون'} <span style={{ fontSize: 12, color: '#5E6986' }}>#{o.orderNo}</span></div>
                        <div style={{ fontSize: 12, color: '#9FB0C3' }}>{o.governorateName}{o.area ? ' - ' + o.area : ''}</div>
                      </div>
                      {!claimed && (
                        <div style={{ fontSize: 12, color: '#8FA0B5', fontWeight: 600, textAlign: 'center', flexShrink: 0 }}>اضغط<br/>للاستلام</div>
                      )}
                    </div>

                    {/* المنتجات (بدون سعر) */}
                    {o.items && (
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: '#8FA0B5', fontWeight: 700, marginBottom: 4 }}>المنتجات المطلوبة</div>
                        <div style={{ fontSize: 13, color: '#EAF0FB', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{o.items}</div>
                        {/* موقع البضاعة في المخزن — مطابقة تلقائية */}
                        {(() => {
                          const m = matchOrderToWarehouseProduct(o, whProducts, { includeEmpty: true });
                          if (!m?.product) return null;
                          const loc = m.product.location;
                          const isSure = m.confidence === 'high';
                          return (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <MapPin size={13} color={m.ambiguous ? '#F0A868' : (loc ? '#4DDB6B' : '#8FA0B5')} />
                                {loc ? (
                                  <span style={{ fontSize: 13.5, fontWeight: 800, color: m.ambiguous ? '#F0A868' : '#4DDB6B' }}>{loc}</span>
                                ) : (
                                  <span style={{ fontSize: 12, color: '#9FB0C3' }}>لا يوجد عنوان مخزن لهذا المنتج</span>
                                )}
                                {m.ambiguous ? (
                                  <span style={{ fontSize: 12, fontWeight: 800, color: '#F0A868', background: 'rgba(240,168,104,0.15)', padding: '2px 8px', borderRadius: 5 }}>
                                    ⚠️ عدة احتمالات — تحقّق
                                  </span>
                                ) : !isSure && (
                                  <span style={{ fontSize: 12, fontWeight: 700, color: '#F0A868', background: 'rgba(240,168,104,0.12)', padding: '2px 8px', borderRadius: 5 }}>
                                    مطابقة تقريبية
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 4 }}>
                                {m.product.car_name}{m.product.quantity <= 0 ? ' — ⚠️ المخزون صفر' : ''}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {o.orderType && (
                      <div style={{ fontSize: 12, color: '#9FB0C3', marginBottom: 12 }}>نوع الطلب: <span style={{ color: '#EAF0FB', fontWeight: 600 }}>{o.orderType}</span></div>
                    )}

                    {/* رسالة المدير إن أرجع الطلب */}
                    {o.reprepNote && (
                      <div style={{ background: 'rgba(240,168,104,0.1)', border: '1px solid rgba(240,168,104,0.25)', borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: '#F0A868', fontWeight: 700, marginBottom: 2 }}>⚠️ رسالة من المدير</div>
                        <div style={{ fontSize: 12.5, color: '#EAF0FB' }}>{o.reprepNote}</div>
                      </div>
                    )}

                    {/* أزرار تم / لم يتم — معطّلة إن كان الطلب محجوزاً من موظف آخر */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => markDone(o)} disabled={busyId === o.id || claimedByOther}
                        style={{ flex: 1, padding: '12px', borderRadius: 11, background: 'rgba(77,219,107,0.14)', border: '1px solid rgba(77,219,107,0.35)', color: '#4DDB6B', fontSize: 13.5, fontWeight: 800, cursor: (busyId === o.id || claimedByOther) ? 'not-allowed' : 'pointer', opacity: claimedByOther ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <CheckCircle2 size={16} /> تم التجهيز
                      </button>
                      <button onClick={() => { setRejectTarget(o); setRejectReason(''); }} disabled={busyId === o.id || claimedByOther}
                        style={{ flex: 1, padding: '12px', borderRadius: 11, background: 'rgba(242,80,80,0.1)', border: '1px solid rgba(242,80,80,0.3)', color: '#F25050', fontSize: 13.5, fontWeight: 800, cursor: claimedByOther ? 'not-allowed' : 'pointer', opacity: claimedByOther ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <XCircle size={16} /> لم يتم
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* نافذة سبب الرفض (اختياري) */}
      {rejectTarget && (
        <div style={styles.modalOverlay} onClick={() => !busyId && setRejectTarget(null)}>
          <div style={{ ...styles.modal, maxWidth: 400 }} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>لم يتم التجهيز</h3>
              <button onClick={() => setRejectTarget(null)} style={styles.modalClose}><X size={18} /></button>
            </div>
            <div style={{ padding: '4px 16px 16px' }}>
              <div style={{ fontSize: 12.5, color: '#9FB0C3', marginBottom: 12 }}>
                طلب #{rejectTarget.orderNo} — {rejectTarget.customer}
              </div>
              <label style={{ fontSize: 12, color: '#E7ECF3', fontWeight: 700, display: 'block', marginBottom: 8 }}>
                السبب <span style={{ color: '#8FA0B5', fontWeight: 400 }}>(اختياري)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="مثال: المنتج غير متوفر، نقص بالمخزون..."
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 9, background: '#242F3D', border: '1.5px solid rgba(242,80,80,0.25)', color: '#E7ECF3', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => setRejectTarget(null)} disabled={!!busyId}
                  style={{ flex: 1, padding: '12px', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#9FB0C3', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  رجوع
                </button>
                <button onClick={confirmReject} disabled={!!busyId}
                  style={{ flex: 2, padding: '12px', borderRadius: 9, background: busyId ? '#7a2a2a' : '#F25050', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: busyId ? 'wait' : 'pointer' }}>
                  {busyId ? 'جارٍ الإرسال...' : 'تأكيد — لم يتم التجهيز'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
    </ErrorBoundary>
  );
}

// ──────────────────────────────────────────────
// التطبيق الرئيسي
// ──────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, background: '#0E1621', color: '#F5F5F5', minHeight: '100vh', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
          <div style={{ background: 'rgba(242,80,80,0.1)', border: '1px solid rgba(242,80,80,0.3)', borderRadius: 12, padding: 20, maxWidth: 600, margin: '40px auto' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#F25050', marginBottom: 12 }}>⚠️ خطأ في التطبيق</div>
            <div style={{ fontSize: 13, color: '#F0A868', marginBottom: 8, fontFamily: 'monospace', direction: 'ltr' }}>
              {this.state.error?.message}
            </div>
            <div style={{ fontSize: 12, color: '#8FA0B5', fontFamily: 'monospace', direction: 'ltr', whiteSpace: 'pre-wrap' }}>
              {this.state.error?.stack?.slice(0, 500)}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AlFhdApp() {
  const [activeView, setActiveView] = useState('conversations');
  const [pendingOpenConvId, setPendingOpenConvId] = useState(null);
  const [pendingNewOrderFromConv, setPendingNewOrderFromConv] = useState(null);
  const [pendingOpenOrderId, setPendingOpenOrderId] = useState(null);

  const goToConversation = useCallback((convId) => {
    setPendingOpenConvId(convId);
    setActiveView('conversations');
  }, []);

  const goToNewOrderFromConversation = useCallback((conv) => {
    setPendingNewOrderFromConv(conv);
    setActiveView('orders');
  }, []);

  const goToOrderDetails = useCallback((order) => {
    setPendingOpenOrderId(order.id);
    setActiveView('orders');
  }, []);


  const [pages, setPages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [orders, setOrders] = useState([]);
  // مركز الإشعارات: { id, type, title, body, orderNo, time, read }
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  // مرجع حيّ لأحدث قيمة من orders — يحل مشكلة stale closure في refreshOrders
  const ordersRef = React.useRef([]);
  useEffect(() => { ordersRef.current = orders; }, [orders]);
  // ── المخزن ──
  const [warehouseProducts, setWarehouseProducts] = useState([]);
  // مرجع حيّ لمنتجات المخزن — يمنع stale closure عند الاستدعاء من refreshOrders
  const warehouseProductsRef = React.useRef([]);
  const recordedSalesRef = React.useRef(null); // حماية ضد تسجيل بيعة المخزن مرتين
  useEffect(() => { warehouseProductsRef.current = warehouseProducts; }, [warehouseProducts]);

  // ── تسجيل بيعة في المخزن تلقائياً ──
  async function recordWarehouseSale(order) {
    try {
      // حماية ضد التسجيل المزدوج: تحقق إن لم تُسجّل بيعة لهذا الطلب سابقاً
      if (!recordedSalesRef.current) recordedSalesRef.current = new Set();
      if (recordedSalesRef.current.has(order.id)) return;
      recordedSalesRef.current.add(order.id);

      // ابحث عن أفضل منتج مطابق
      const match = matchOrderToWarehouseProduct(order, warehouseProductsRef.current);
      if (!match) {
        console.warn('⚠️ لم يُعثر على منتج مطابق في المخزن للطلب:', order.orderNo);
        return;
      }

      const { product, confidence, ambiguous } = match;
      // لا نخصم من المخزن إذا كانت الثقة منخفضة أو المطابقة غامضة (عدة منتجات محتملة)
      if (confidence === 'low' || ambiguous) {
        console.warn('⚠️ مطابقة غير مؤكدة — لن يُخصم من المخزن:', order.orderNo, ambiguous ? '(عدة احتمالات)' : '(ثقة منخفضة)');
        return;
      }
      console.log(`✅ مطابقة المخزن: ${product.car_name} (${PRODUCT_TYPE_LABELS[product.type]}) — ثقة: ${confidence}`);

      // تسجيل البيعة في المخزن
      await sbInsert('wh_sales', {
        product_id:    product.id,
        product_name:  `${product.car_name} — ${PRODUCT_TYPE_LABELS[product.type]}`,
        quantity:      1,
        price_iqd:     Number(order.total) || 0,
        total_iqd:     Number(order.total) || 0,
        customer_name: order.customer || '',
        date:          new Date().toISOString().slice(0, 10),
        notes:         `طلب #${order.orderNo} — مطابقة ${confidence === 'high' ? 'عالية' : confidence === 'medium' ? 'متوسطة' : 'منخفضة'}`,
        created_at:    new Date().toISOString(),
      });

      // تخفيض الكمية من المخزن
      const newQty = Math.max(0, (product.quantity || 0) - 1);
      await sbUpdate('wh_products', product.id, { quantity: newQty });

      // تحديث الـ state
      setWarehouseProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, quantity: newQty } : p
      ));

      console.log(`📦 مخزن: ${product.car_name} → ${product.quantity} → ${newQty}`);
    } catch (e) {
      console.error('warehouse sale error:', e);
    }
  }

  // ── إرجاع بيعة للمخزن تلقائياً ──
  async function returnToWarehouse(order) {
    try {
      const match = matchOrderToWarehouseProduct(order, warehouseProductsRef.current);
      if (!match) return;

      const { product } = match;
      const newQty = (product.quantity || 0) + 1;
      await sbUpdate('wh_products', product.id, { quantity: newQty });
      setWarehouseProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, quantity: newQty } : p
      ));
      console.log(`↩️ إرجاع للمخزن: ${product.car_name} → ${newQty}`);
    } catch (e) {
      console.error('warehouse return error:', e);
    }
  }
  const [users, setUsers] = useState([]);
  const [storageReady, setStorageReady] = useState(false);

  // تحميل منتجات المخزن — بعد تعريف storageReady
  useEffect(() => {
    async function loadWarehouseProducts() {
      try {
        const res = await sbSelect('wh_products', wsFilter() + '&order=car_name.asc');
        if (res) setWarehouseProducts(res);
      } catch (e) { console.warn('warehouse load error:', e); }
    }
    if (storageReady) loadWarehouseProducts();
  }, [storageReady]);

  // ── حالة تسجيل الدخول ── يُستعاد فوراً من localStorage بدون انتظار Supabase
  const [authedUser, setAuthedUser] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('alfhd_session') || sessionStorage.getItem('alfhd_session') || 'null');
      if (saved?.userId && saved?.userData) return saved.userData;
    } catch (_) {}
    return null;
  });
  const [appLoading, setAppLoading] = useState(!(localStorage.getItem('alfhd_session') || sessionStorage.getItem('alfhd_session')));

  // جلب المحادثات الحقيقية من Supabase (يُستخدم عند التحميل وعند كل تحديث دوري)
  const convSignatureRef = React.useRef('');
  // عبارات التحويل — تُستخدم هنا وفي ConversationsView
  const HANDOFF_TRIGGERS_GLOBAL = [
    'رح نحولك', 'سنحولك', 'سأحولك', 'سأقوم بتحويلك',
    'transferred this chat', 'transfer this chat',
    'Your AI agent transferred',
    'تحويل للموظف', 'تحويل إلى موظف', 'تحويل لأحد موظفينا',
    'نحولك للموظف', 'تحويل المحادثة',
    'handoff', 'hand off',
  ];

  const refreshConversations = useCallback(async () => {
    try {
      const dbConversations = await sbSelect(
        'alfhd_conversations',
        wsFilter() + '&order=last_message_time.desc.nullslast,created_at.desc&limit=500'
      );
      if (dbConversations) {
        const sig = dbConversations.map((c) => `${c.id}:${c.last_message_time}:${c.last_message}:${c.unread_count}:${c.tab}:${c.order_id}:${c.avatar_url || ''}`).join('|');
        if (sig !== convSignatureRef.current) {
          convSignatureRef.current = sig;
          // ── إزالة التكرار: نفس الزبون ممكن يكون له أكثر من صف (سباق عند وصول رسائل معاً) ──
          // نحتفظ بالأحدث رسالة، وندمج عدد غير المقروء
          const byKey = new Map();
          for (const row of dbConversations) {
            const key = (row.customer_psid || row.phone || row.id).toString().trim().toLowerCase();
            const prev = byKey.get(key);
            if (!prev) { byKey.set(key, row); continue; }
            const tPrev = new Date(prev.last_message_time || prev.created_at || 0).getTime();
            const tCur = new Date(row.last_message_time || row.created_at || 0).getTime();
            const keep = tCur > tPrev ? row : prev;
            const drop = tCur > tPrev ? prev : row;
            keep.unread_count = (Number(keep.unread_count) || 0) + (Number(drop.unread_count) || 0);
            keep.order_id = keep.order_id || drop.order_id;
            if (!keep.avatar_url && drop.avatar_url) keep.avatar_url = drop.avatar_url;
            byKey.set(key, keep);
          }
          const mapped = [...byKey.values()].map(mapConversationFromDb);
          setConversations(mapped);

          // ملاحظة: شلنا النقل التلقائي حسب نص الرسالة.
          // المحادثة تنتقل لتبويب "بحاجة إلى موظف" فقط لما الذكاء يصعّدها فعلياً.
        }
      }
    } catch (e) {
      console.error('Supabase conversations load error:', e);
    }
  }, []);

  const knownOrderIdsRef = React.useRef(null);
  const orderSignatureRef = React.useRef('');
  const rejectedIdsRef = React.useRef(null);
  // ── إضافة إشعار لمركز الإشعارات (مع صوت وإشعار متصفح) ──
  const pushNotif = useCallback((notif) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      time: new Date().toISOString(),
      read: false,
      ...notif,
    };
    setNotifications((prev) => [entry, ...prev].slice(0, 50));
    // صوت حسب النوع
    try { notif.type === 'returned' ? playAlarmSound() : playNotificationSound(); } catch (_e) { /* تجاهل */ }
    // إشعار المتصفح (إن كان مسموحاً)
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(notif.title, { body: notif.body });
      }
    } catch (_e) { /* تجاهل */ }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      // نجلب أحدث 1000 طلب + كل الطلبات المطبوعة غير المرسلة (مهما كان عمرها)
      // مهم: الطلبات المتأخرة هي الأقدم، فلو اعتمدنا على الحد بس راح تختفي من "بحاجة لمتابعة"
      const [recentOrders, stalePrep] = await Promise.all([
        sbSelect('alfhd_orders', wsFilter() + '&order=created_at.desc&limit=1000'),
        sbSelect('alfhd_orders', wsFilter() + '&stage=eq.prep&jenni_sent=is.false&order=created_at.desc&limit=500')
          .catch(() => []),
      ]);
      const seenIds = new Set(recentOrders.map((o) => o.id));
      const dbOrders = [...recentOrders, ...stalePrep.filter((o) => !seenIds.has(o.id))];
      if (!dbOrders) return;
      const mapped = dbOrders.map(mapOrderFromDb);
      // كشف طلب جديد مثبّت من المحادثات لتشغيل صوت الإشعار
      if (knownOrderIdsRef.current) {
        const newChatOrder = mapped.find((o) => (o.source === 'chat' || o.source === 'ai') && !knownOrderIdsRef.current.has(o.id));
        if (newChatOrder) playSuccessSound();
      }
      knownOrderIdsRef.current = new Set(mapped.map((o) => o.id));

      // كشف طلب رفضه المجهّز حديثاً — صوت إنذار + إشعار للمدير
      const rejectedNow = new Set(mapped.filter((o) => o.prepStatus === 'rejected').map((o) => o.id));
      if (rejectedIdsRef.current) {
        const newlyRejectedOrders = mapped.filter((o) => o.prepStatus === 'rejected' && !rejectedIdsRef.current.has(o.id));
        if (newlyRejectedOrders.length > 0) {
          playAlarmSound();
          for (const ro of newlyRejectedOrders) {
            pushNotif({
              type: 'returned',
              title: '⚠️ طلب لم يُجهَّز',
              body: `طلب #${ro.orderNo} — ${ro.customer || ''} — المجهّز: ${ro.prepByName || 'غير معروف'}${ro.prepReason ? ' — السبب: ' + ro.prepReason : ''}`,
              orderNo: ro.orderNo,
            });
          }
        }
      }
      rejectedIdsRef.current = rejectedNow;

      // حدّث الحالة فقط إذا تغيّر شيء فعلاً
      const sig = dbOrders.map((o) => `${o.id}:${o.status}:${o.stage}:${o.prep_status}:${o.converted}:${o.printed}:${o.jenni_sent}:${o.jenni_shipment_id}:${o.jenni_tracking}:${o.delivery_status}:${o.delivery_step}:${o.delivery_step_ar}:${o.delivery_note}:${o.delivery_updated_at}`).join('|');
      if (sig !== orderSignatureRef.current) {
        orderSignatureRef.current = sig;

        // ── كشف التغييرات الجديدة في حالة التوصيل ──
        const prevOrders = ordersRef.current;
        for (const newOrder of mapped) {
          const prev = prevOrders.find(o => o.id === newOrder.id);
          if (!prev) continue;

          const prevStatus = prev.deliveryStatus;
          const newStatus  = newOrder.deliveryStatus;

          // DELIVERED → تسجيل بيعة في المخزن وتخفيض الكمية
          if (newStatus === 'DELIVERED' && prevStatus !== 'DELIVERED') {
            console.log(`🎉 طلب #${newOrder.orderNo} مستلم — تسجيل في المخزن...`);
            recordWarehouseSale(newOrder);
            pushNotif({
              type: 'delivered',
              title: 'تم تسليم طلب 🎉',
              body: `طلب #${newOrder.orderNo} — ${newOrder.customer || ''} (${Number(newOrder.total).toLocaleString()} د.ع)`,
              orderNo: newOrder.orderNo,
            });
          }

          // RETURNED → إرجاع للمخزن
          if ((newStatus === 'RETURNED_TO_MERCHANT' || newStatus === 'returned') &&
              prevStatus !== 'RETURNED_TO_MERCHANT' && prevStatus !== 'returned') {
            console.log(`↩️ طلب #${newOrder.orderNo} راجع — إرجاع للمخزن...`);
            returnToWarehouse(newOrder);
            pushNotif({
              type: 'returned',
              title: '⚠️ طلب راجع — انتبه',
              body: `طلب #${newOrder.orderNo} — ${newOrder.customer || ''}${newOrder.deliveryNote ? ' — ' + newOrder.deliveryNote : ''}`,
              orderNo: newOrder.orderNo,
            });
          }
        }

        // ── حماية حرجة: امنع اختفاء الطلبات بشكل مفاجئ ──
        // إذا رجع التحديث بأقل بكثير من الموجود (>30% نقص فجأة) وليس بسبب حذف يدوي،
        // فهذا غالباً خطأ شبكة/فلتر — نتجاهل التحديث المشبوه ونُبقي الطلبات الحالية.
        const prevCount = ordersRef.current?.length || 0;
        const newCount = mapped.length;
        const suspiciousDrop = prevCount >= 5 && newCount < prevCount * 0.7 && !isIsolatedWorkspace();
        if (suspiciousDrop) {
          console.warn(`⚠️ تم تجاهل تحديث مشبوه: الطلبات كانت ${prevCount} ورجعت ${newCount}. الإبقاء على الحالية لمنع الاختفاء.`);
        } else {
          setOrders(mapped);
        }
      }
    } catch (e) {
      console.error('orders refresh error:', e);
    }
  }, [pushNotif]);

  // طلب إذن إشعارات المتصفح مرة واحدة
  useEffect(() => {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    } catch (_e) { /* تجاهل */ }
  }, []);

  useEffect(() => {
    if (!storageReady) return undefined;
    let interval = null;
    const start = () => {
      if (interval) return;
      interval = setInterval(() => {
        if (!document.hidden) refreshOrders();
      }, 12000);
    };
    const stop = () => { if (interval) { clearInterval(interval); interval = null; } };
    start();
    // أوقف عند إخفاء التبويب، واستأنف عند العودة مع تحديث فوري
    const onVis = () => { if (document.hidden) stop(); else { refreshOrders(); start(); } };
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
  }, [storageReady, refreshOrders]);

  // ── مزامنة حالة الشحنات من جيني تلقائياً (كل دقيقة) ──
  // تجلب الحالة الفعلية وتنقل الطلبات لقسم "لدى شركة التوصيل" عند استلام المندوب
  useEffect(() => {
    if (!storageReady) return undefined;
    const syncJenni = async () => {
      if (document.hidden) return;
      try {
        await fetch(JENNI_SYNC_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
          body: '{}',
        });
        // بعد المزامنة، حدّث الطلبات محلياً لإظهار الحالة الجديدة
        await refreshOrders();
      } catch (_e) { /* تجاهل، المحاولة القادمة ستعيد */ }
    };
    syncJenni(); // مزامنة فورية عند الفتح
    let interval = setInterval(syncJenni, 60000); // كل دقيقة
    const onVis = () => { if (!document.hidden) syncJenni(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVis); };
  }, [storageReady, refreshOrders]);

  // تحميل البيانات الحقيقية من Supabase (لا يمنع عرض الواجهة أبداً)
  useEffect(() => {
    (async () => {
      try {
        const [dbPages, dbOrders, dbUsers] = await Promise.all([
          sbSelectColumns('alfhd_pages', 'id,name,avatar,source,fb_page_id,connected,created_at,workspace_id,wa_connected,wa_phone', wsFilter() + '&order=created_at.asc'),
          sbSelect('alfhd_orders', wsFilter() + '&order=created_at.desc&limit=1000'),
          sbSelect('alfhd_users', '&order=created_at.asc'),
        ]);

        if (dbPages?.length) {
          const mappedPages = dbPages.map(mapPageFromDb);
          setPages(mappedPages);
          // إشعار: صفحات ربطت واتساب سابقاً لكنه انقطع
          const disconnected = mappedPages.filter((p) => p.waPhone && !p.waConnected);
          if (disconnected.length > 0) {
            const names = disconnected.map((p) => p.name).join('، ');
            setNotifications((prev) => [{
              id: `wa-disc-${Date.now()}`,
              type: 'warning',
              title: 'انقطاع واتساب',
              body: disconnected.length === 1
                ? `الصفحة "${names}" انقطع اتصالها بواتساب — أعد الربط`
                : `${disconnected.length} صفحات انقطع اتصالها بواتساب: ${names}`,
              time: new Date().toISOString(),
              read: false,
            }, ...prev].slice(0, 50));
          }
        }
        if (dbOrders?.length) setOrders(dbOrders.map(mapOrderFromDb));
        if (dbUsers?.length) setUsers(dbUsers.map(mapUserFromDb));

        await refreshConversations();
      } catch (e) {
        console.error('Supabase init load error:', e);
      } finally {
        setStorageReady(true);
      }
    })();
  }, [refreshConversations]);

  // سحب فعّال للرسائل الجديدة من فيسبوك مباشرة كل 7 ثواني طالما التطبيق مفتوح
  // (يحدّث المحادثات أيضاً، فلا حاجة لمؤقّت منفصل)
  const pollFacebookNow = useCallback(async () => {
    try {
      await fetch(FB_POLL_FUNCTION_URL, { method: 'GET', headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY } });
    } catch (e) {
      console.error('active poll error:', e);
    } finally {
      refreshConversations();
    }
  }, [refreshConversations]);

  // ── دورتان منفصلتان ──
  // مهم: كانت المحادثات تتحدّث بعد جلب فيسبوك، فلو الجلب بطيء تتأخر الرسائل دقائق.
  // فصلناهما: القائمة تتحدّث كل ثانيتين مهما صار بالجلب.
  useEffect(() => {
    if (!storageReady) return undefined;
    let convTimer = null, fbTimer = null;
    let convBusy = false, fbBusy = false;

    const tickConv = async () => {
      if (convBusy || document.hidden) return;
      convBusy = true;
      try { await refreshConversations(); } catch (_e) { /* تجاهل */ }
      convBusy = false;
    };
    const tickFb = async () => {
      if (fbBusy || document.hidden) return;
      fbBusy = true;
      try {
        await fetch(FB_POLL_FUNCTION_URL, { method: 'GET',
          headers: { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY } });
      } catch (_e) { /* تجاهل */ }
      fbBusy = false;
    };

    const start = () => {
      if (!convTimer) convTimer = setInterval(tickConv, 1000);   // القائمة: كل ثانية (كانت ثانيتين)
      if (!fbTimer) fbTimer = setInterval(tickFb, 1500);          // جلب فيسبوك: كل 1.5 ثانية (كانت 4)
    };
    const stop = () => {
      if (convTimer) { clearInterval(convTimer); convTimer = null; }
      if (fbTimer) { clearInterval(fbTimer); fbTimer = null; }
    };

    tickConv(); tickFb(); start();
    // فوري: لو وصل تحديث حقيقي (Realtime)، نحدّث القائمة حالاً
    const onRealtimeConv = () => { if (!document.hidden) tickConv(); };
    window.addEventListener('fhd-realtime-conv', onRealtimeConv);
    const onVis = () => { if (document.hidden) stop(); else { tickConv(); tickFb(); start(); } };
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('fhd-realtime-conv', onRealtimeConv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageReady, refreshConversations]);

  // ── تحديث فوري حقيقي (Realtime) — إضافي وآمن: لو فشل التحميل، الفحص الدوري يستمر عادي ──
  useEffect(() => {
    if (!storageReady) return undefined;
    let channel = null;
    let cancelled = false;
    (async () => {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        if (cancelled) return;
        const rtClient = createClient(SUPABASE_URL, SUPABASE_KEY);
        channel = rtClient
          .channel('fhd-live-updates')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alfhd_messages' }, () => {
            window.dispatchEvent(new Event('fhd-realtime-msg'));
            window.dispatchEvent(new Event('fhd-realtime-conv'));
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'alfhd_conversations' }, () => {
            window.dispatchEvent(new Event('fhd-realtime-conv'));
          })
          .subscribe();
      } catch (_e) {
        // فشل تحميل التحديث الفوري — لا مشكلة، الفحص الدوري (polling) يستمر يشتغل عادي
      }
    })();
    return () => { cancelled = true; try { channel?.unsubscribe?.(); } catch (_e) {} };
  }, [storageReady]);

  // ══════════════════════════════════════════════════════════════
  //  الرد التلقائي من المتصفح مباشرة — بديل التريغر
  //  السبب: التريغر (pg_net) يفشل بصمت، بينما النداء من المتصفح
  //  يشتغل بثبات (مثبت: الدالة ترد خلال ثانيتين).
  //  الموقع يراقب الرسائل الجديدة بالمحادثات المفعّلة وينادي الذكاء.
  // ══════════════════════════════════════════════════════════════
  const convRef = React.useRef([]);
  useEffect(() => { convRef.current = conversations; }, [conversations]);
  const aiFiredRef = React.useRef(new Set());

  useEffect(() => {
    if (!storageReady) return undefined;
    let busy = false;

    const tick = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const active = (convRef.current || [])
          .filter((c) => c.ai_mode === 'active')
          .map((c) => c.id)
          .slice(0, 60);
        if (!active.length) { busy = false; return; }

        // آخر الرسائل بالمحادثات المفعّلة (آخر 5 دقائق)
        const since = new Date(Date.now() - 5 * 60000).toISOString();
        const rows = await sbSelect('alfhd_messages',
          `&conversation_id=in.(${active.join(',')})&created_at=gte.${since}` +
          '&select=id,conversation_id,direction,created_at&order=created_at.desc&limit=120');

        // نأخذ آخر رسالة لكل محادثة
        const latest = {};
        for (const r of rows || []) {
          if (!latest[r.conversation_id]) latest[r.conversation_id] = r;
        }

        // ── دفعات صغيرة بدل الكل دفعة وحدة ──
        // السبب: تفعيل عدد كبير من المحادثات مرة وحدة كان يطلق عشرات الطلبات
        // المتزامنة لدالة الذكاء، وهذا يضرب حد الطلبات (Rate Limit) عند OpenAI
        // ويفشل كل شي بخطأ 500. الحين نعالج 5 بس بكل دورة (كل 3 ثواني)
        // حتى لو فيه تراكم كبير، ينحل تدريجياً وبأمان.
        const candidates = [];
        for (const cid of Object.keys(latest)) {
          const m = latest[cid];
          if (m.direction !== 'incoming') continue;      // آخر رسالة صادرة → ما نرد
          if (m.created_at < AI_REPLY_CUTOFF) continue;   // رسالة قديمة (قبل التفعيل) → تجاهل نهائياً
          if (aiFiredRef.current.has(m.id)) continue;    // ناديناه قبل
          candidates.push({ cid, m });
        }
        const BATCH = 5;
        const batch = candidates.slice(0, BATCH);
        for (const { cid, m } of batch) {
          aiFiredRef.current.add(m.id);
          if (aiFiredRef.current.size > 400) {
            aiFiredRef.current = new Set([...aiFiredRef.current].slice(-200));
          }
          // نداء بلا انتظار — حتى ما نعطّل الدورة
          fetch(AI_REPLY_FUNCTION_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${SUPABASE_KEY}`,
              apikey: SUPABASE_KEY,
            },
            body: JSON.stringify({ conversation_id: cid, message_id: m.id }),
          }).catch(() => { /* تجاهل */ });
        }
      } catch (_e) { /* تجاهل */ }
      busy = false;
    };

    const t = setInterval(tick, 3000);
    tick();
    const onVis = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageReady]);

  // بعد تحميل Supabase: حدّث بيانات المستخدم المسجّل (صلاحيات جديدة إلخ) وأوقف شاشة التحميل
  useEffect(() => {
    if (!storageReady) return;
    setAppLoading(false);
    try {
      const saved = JSON.parse(localStorage.getItem('alfhd_session') || sessionStorage.getItem('alfhd_session') || 'null');
      if (saved?.userId) {
        const found = users.find((u) => u.id === saved.userId && u.active);
        if (found) {
          setCurrentWorkspace(found?.workspaceId || null);
          setAuthedUser(found);
          const store = localStorage.getItem('alfhd_session') ? localStorage : sessionStorage;
          store.setItem('alfhd_session', JSON.stringify({ userId: found.id, userData: found }));
        } else if (authedUser) {
          // المستخدم محذوف أو معطّل في قاعدة البيانات
          setAuthedUser(null);
          localStorage.removeItem('alfhd_session');
          sessionStorage.removeItem('alfhd_session');
        }
      }
    } catch (e) { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageReady]);

  const handleLogin = (user, rememberMe = true) => {
    ensureAudioReady();
    setCurrentWorkspace(user?.workspaceId || null); // عزل بيانات المساحة المستقلة
    setAuthedUser(user);
    setAppLoading(false);
    try {
      const payload = JSON.stringify({ userId: user.id, userData: user });
      localStorage.removeItem('alfhd_session');
      sessionStorage.removeItem('alfhd_session');
      (rememberMe ? localStorage : sessionStorage).setItem('alfhd_session', payload);
    } catch (e) { /* ignore */ }
  };

  const handleLogout = () => {
    setAuthedUser(null);
    try {
      localStorage.removeItem('alfhd_session');
      sessionStorage.removeItem('alfhd_session');
    } catch (e) { /* ignore */ }
  };

  const hasPermission = (permId) => {
    if (!authedUser) return false;
    if (authedUser.role === 'admin') return true;
    return authedUser.permissions?.includes(permId);
  };

  // فتح واتساب برقم عراقي منسّق
  const contactWhatsApp = useCallback((rawPhone) => {
    if (!rawPhone) { alert('لا يوجد رقم متاح'); return; }
    let digits = String(rawPhone).replace(/[^0-9]/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    else if (digits.startsWith('0')) digits = '964' + digits.slice(1);
    else if (!digits.startsWith('964')) digits = '964' + digits;
    window.open(`https://wa.me/${digits}`, '_blank');
  }, []);

  // ── شاشة التحميل الأولية (تظهر فقط عند أول تشغيل بدون جلسة محفوظة) ──
  if (appLoading && !authedUser) {
    return (
      <>
        <GlobalStyles />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080B14', flexDirection: 'column', gap: 16 }}>
          <FahdLogo size={52} />
          <div style={{ color: '#3B82F6', fontSize: 13, animation: 'spin 1s linear infinite', display: 'inline-block' }}>
            <RefreshCw size={20} />
          </div>
        </div>
      </>
    );
  }

  // ── شاشة الدخول ──
  if (!authedUser) {
    return (
      <>
        <GlobalStyles />
        <LoginScreen users={users} onLogin={handleLogin} />
      </>
    );
  }

  // ── واجهة موظف المخزن المبسطة (لا يرى بقية التطبيق) ──
  // موظف التجهيز: واجهة مخصّصة (طلبات بدون سعر + تم/لم يتم)
  if (authedUser.role === 'warehouse') {
    return <PrepWorkerView currentUser={authedUser} onLogout={handleLogout} />;
  }

  return (
    <ErrorBoundary>
    <>
      <GlobalStyles />
      {/* ── جرس الإشعارات (أعلى — جنب زر القائمة بدون تغطية) ── */}
      <div style={{ position: 'fixed', top: 6, left: 60, zIndex: 110 }} className="alfhd-no-print alfhd-notif-bell">
        <button
          onClick={() => {
            setShowNotifications((v) => !v);
            if (!showNotifications) setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          }}
          style={{
            position: 'relative', width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(23,33,43,0.95)', border: '1px solid rgba(42,171,238,0.3)',
            color: '#E7ECF3', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
            animation: notifications.some((n) => !n.read) ? 'alfhdBellGlow 1.6s var(--ease-tg) infinite' : 'none',
            backdropFilter: 'blur(10px)',
          }}
          title="الإشعارات"
        >
          <Bell size={19} />
          {notifications.some((n) => !n.read) && (
            <span style={{
              position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, padding: '0 4px',
              borderRadius: 8, background: '#F25050', color: '#fff', fontSize: 12, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{notifications.filter((n) => !n.read).length}</span>
          )}
        </button>

        {showNotifications && (
          <div style={{
            position: 'absolute', top: 52, left: 0, width: 320, maxWidth: '90vw', maxHeight: 420, overflowY: 'auto',
            background: '#17212B', border: '1px solid rgba(42,171,238,0.25)', borderRadius: 14,
            boxShadow: '0 12px 36px rgba(0,0,0,0.6)', padding: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 8px 8px' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#E7ECF3' }}>الإشعارات</span>
              {notifications.length > 0 && (
                <button onClick={() => setNotifications([])}
                  style={{ fontSize: 12, color: '#8FA0B5', background: 'none', border: 'none', cursor: 'pointer' }}>
                  مسح الكل
                </button>
              )}
            </div>
            {notifications.length === 0 && (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: '#8FA0B5', fontSize: 12.5 }}>
                لا إشعارات
              </div>
            )}
            {notifications.map((n) => (
              <div key={n.id} style={{
                padding: '8px 12px', marginBottom: 4, borderRadius: 10,
                background: n.type === 'returned' ? 'rgba(242,80,80,0.08)' : 'rgba(77,219,107,0.06)',
                border: `1px solid ${n.type === 'returned' ? 'rgba(242,80,80,0.2)' : 'rgba(77,219,107,0.15)'}`,
              }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: n.type === 'returned' ? '#F25050' : '#4DDB6B' }}>{n.title}</div>
                <div style={{ fontSize: 12, color: '#9FB0C3', marginTop: 4, lineHeight: 1.5 }}>{n.body}</div>
                <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 4 }}>{new Date(n.time).toLocaleString('ar')}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.appWrap} className="alfhd-app-wrap">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          onLogout={handleLogout}
          currentUser={authedUser}
          pages={pages}
        />
        <main
          style={{ ...styles.mainArea, ...(activeView === 'conversations' ? { overflow: 'hidden', display: 'flex', flexDirection: 'column' } : {}) }}
          className={`alfhd-main-area${activeView === 'conversations' ? ' alfhd-main-conv' : ''}`}
        >
          <div key={activeView} className="alfhd-section-enter">

          {activeView === 'conversations' && (
            <ConversationsView
              conversations={conversations}
              pages={pages}
              orders={orders}
              setConversations={setConversations}
              pendingOpenConvId={pendingOpenConvId}
              clearPendingOpenConvId={() => setPendingOpenConvId(null)}
              setOrders={setOrders}
              onCreateOrderFromConv={goToNewOrderFromConversation}
              onOpenOrderDetails={goToOrderDetails}
              currentUser={authedUser}
            />
          )}
          {activeView === 'orders' && (
            <OrdersView
              orders={orders}
              pages={pages}
              setOrders={setOrders}
              conversations={conversations}
              setConversations={setConversations}
              pendingOpenOrderId={pendingOpenOrderId}
              clearPendingOpenOrderId={() => setPendingOpenOrderId(null)}
              onViewConversation={goToConversation}
              pendingNewOrderFromConv={pendingNewOrderFromConv}
              clearPendingNewOrderFromConv={() => setPendingNewOrderFromConv(null)}
              currentUser={authedUser}
              warehouseProducts={warehouseProducts}
            />
          )}
          {activeView === 'stats' && (
            <StatsView orders={orders} pages={pages} conversations={conversations} setOrders={setOrders} />
          )}
          {activeView === 'users' && (authedUser.role === 'admin' || (authedUser.permissions || []).includes('users_manage')) && (
            <AdminView
              users={users}
              setUsers={setUsers}
              orders={orders}
              conversations={conversations}
              onViewConversation={goToConversation}
              onContactWhatsApp={contactWhatsApp}
            />
          )}
          {activeView === 'pages' && (
            <PagesView pages={pages} setPages={setPages} />
          )}
          {activeView === 'warehouse' && (authedUser.role === 'admin' || authedUser.role === 'manager') && (
            <WarehouseView />
          )}
          {activeView === 'ai_assistant' && (authedUser.role === 'admin' || (authedUser.permissions || []).includes('ai_manage')) && (
            <AIAssistantView currentUser={authedUser} />
          )}
          </div>
        </main>
      </div>
    </>
    </ErrorBoundary>
  );
}

// ══════════════════════════════════════════════════════════════════
// AIAssistantView — لوحة تحكم الرد التلقائي بالذكاء الصناعي (فهد فقط)
// ══════════════════════════════════════════════════════════════════
function AIAssistantView({ currentUser }) {
  const [settings, setSettings] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [logs, setLogs] = React.useState([]);
  const [logsLoading, setLogsLoading] = React.useState(false);
  const [convs, setConvs] = React.useState([]);
  const [drafts, setDrafts] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [tab, setTab] = React.useState('dash');
  // فلاتر سجل الردود
  const [logSearch, setLogSearch] = React.useState('');
  const [logFilter, setLogFilter] = React.useState('all'); // all | ok | escalated
  const [expandedLog, setExpandedLog] = React.useState(null);
  const [correcting, setCorrecting] = React.useState(null);
  const [correctionText, setCorrectionText] = React.useState('');
  const [glossaryTerm, setGlossaryTerm] = React.useState('');
  const [testQ, setTestQ] = React.useState('');
  const [testing, setTesting] = React.useState(false);
  const [testChat, setTestChat] = React.useState([]); // محادثة الاختبار الكاملة
  const [enhanceBusy, setEnhanceBusy] = React.useState(false);
  const [enhancePreview, setEnhancePreview] = React.useState(null); // النص المحسّن قبل الحفظ
  const [prodSearch, setProdSearch] = React.useState('');
  const [bulkImgType, setBulkImgType] = React.useState(null); // النوع اللي نرفعله صورة جماعية
  const [bulkImgBusy, setBulkImgBusy] = React.useState(false);
  const [bulkImgDone, setBulkImgDone] = React.useState(0);

  // رفع صورة موحّدة لكل منتجات نوع معين — ترفع مرة وحدة لستوريج وتستخدم الرابط للكل
  function handleBulkImage(e, typeId) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkImgType(typeId); setBulkImgBusy(true); setBulkImgDone(0);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = async () => {
        try {
          // ضغط الصورة
          const canvas = document.createElement('canvas');
          const max = 800; let { width, height } = img;
          if (width > height && width > max) { height = height * max / width; width = max; }
          else if (height > max) { width = width * max / height; height = max; }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.78));
          // رفع مرة وحدة لستوريج
          const filename = `product_${typeId}_${Date.now()}.jpg`;
          const up = await fetch(`${SUPABASE_URL}/storage/v1/object/chat-media/${filename}`, {
            method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: blob,
          });
          if (!up.ok) { throw new Error('فشل الرفع — تأكد من وجود مخزن chat-media (Public) بـ Supabase Storage'); }
          const url = `${SUPABASE_URL}/storage/v1/object/public/chat-media/${filename}`;
          // تحديث كل منتجات النوع بالرابط (خفيف)
          const targets = products.filter((p) => p.type === typeId);
          let done = 0;
          for (const p of targets) {
            try { await sbUpdate('wh_products', p.id, { image_url: url }); done++; setBulkImgDone(done); }
            catch (_e) { /* تابع */ }
          }
          setProducts((prev) => prev.map((p) => p.type === typeId ? { ...p, image_url: url } : p));
          setBulkImgBusy(false); setBulkImgType(null);
          alert(`تم تعيين الصورة لـ ${done} منتج`);
        } catch (err) {
          setBulkImgBusy(false); setBulkImgType(null);
          alert(err.message || 'فشل رفع الصورة');
        }
      };
      img.onerror = () => { setBulkImgBusy(false); setBulkImgType(null); alert('تعذّر قراءة الصورة'); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  const loadLogs = React.useCallback(async () => {
    setLogsLoading(true);
    try {
      const l = await sbSelect('ai_reply_log', '&order=created_at.desc&limit=300');
      setLogs(l || []);
    } catch (e) { console.error('logs load error:', e); }
    setLogsLoading(false);
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const [s] = await sbSelect('ai_settings', '&id=eq.1');
        setSettings(s || { system_prompt: '', training_examples: '', enabled_globally: true });
      } catch (e) { console.error('AI settings load error:', e); }
      try {
        const c = await sbSelectColumns('alfhd_conversations', 'id,customer_name,customer_psid,ai_mode,last_message_time', wsFilter() + '&order=last_message_time.desc&limit=400');
        setConvs(c || []);
      } catch (e) { console.error('convs load error:', e); }
      try {
        const d = await sbSelect('ai_draft_replies', '&status=eq.pending&order=created_at.desc&limit=50');
        setDrafts(d || []);
      } catch (e) { console.error('drafts load error:', e); }
      try {
        const p = await sbSelect('wh_products', wsFilter() + '&order=car_name.asc');
        setProducts(p || []);
      } catch (e) { console.error('products load error:', e); }
      await loadLogs();
      setLoading(false);
    })();
  }, [loadLogs]);

  async function save() {
    setSaving(true);
    try {
      await sbUpdate('ai_settings', 1, {
        system_prompt: settings.system_prompt,
        training_examples: settings.training_examples,
        enabled_globally: settings.enabled_globally,
        api_key: settings.api_key || '',
        model: settings.model || '',
        api_base_url: settings.api_base_url || '',
        dialect_glossary: settings.dialect_glossary || '',
        updated_at: new Date().toISOString(),
      });
      alert('انحفظ بنجاح');
    } catch (e) { alert('فشل الحفظ: ' + e.message); }
    setSaving(false);
  }

  // ── تشخيص الرد التلقائي: يفحص كل حلقة بالسلسلة ──
  const [diag, setDiag] = React.useState(null);
  const [diagBusy, setDiagBusy] = React.useState(false);
  async function runDiagnostics() {
    setDiagBusy(true); setDiag(null);
    const steps = [];
    const add = (name, state, detail, fix) => steps.push({ name, state, detail, fix });
    try {
      const now = Date.now();
      const hourAgo = new Date(now - 3600000).toISOString();

      // ══ ① وصول الرسائل (الجسر/الجلب) ══
      let lastIn = null;
      try {
        const [m] = await sbSelect('alfhd_messages',
          '&direction=eq.incoming&select=created_at,conversation_id,content&order=created_at.desc&limit=1');
        lastIn = m || null;
      } catch (_e) { /* تجاهل */ }
      if (!lastIn) {
        add('وصول الرسائل', 'bad', 'ما فيه ولا رسالة واردة',
          'الجسر (واتساب) أو جلب فيسبوك متوقف');
      } else {
        const mins = Math.round((now - new Date(lastIn.created_at).getTime()) / 60000);
        add('وصول الرسائل', mins < 120 ? 'ok' : 'warn',
          `آخر رسالة قبل ${mins < 60 ? mins + ' دقيقة' : Math.round(mins / 60) + ' ساعة'}`,
          mins >= 120 ? 'تأكد إن الجسر شغّال على Railway' : null);
      }

      // ══ ② حالة محادثة آخر رسالة ══
      let lastConv = null;
      if (lastIn?.conversation_id) {
        try {
          const [c] = await sbSelect('alfhd_conversations',
            `&id=eq.${lastIn.conversation_id}&select=id,customer_name,ai_mode`);
          lastConv = c || null;
        } catch (_e) { /* تجاهل */ }
      }
      if (lastConv) {
        const on = lastConv.ai_mode === 'active';
        add('محادثة آخر رسالة', on ? 'ok' : 'bad',
          `${lastConv.customer_name || 'زبون'} — ${on ? 'مفعّلة' : 'متوقفة'}`,
          on ? null : 'افتح المحادثة واضغط زر البوت الأخضر لتفعيلها');
      }

      // ══ ③ المفتاح العام ══
      add('المفتاح العام', settings?.enabled_globally ? 'ok' : 'bad',
        settings?.enabled_globally ? 'مشغّل' : 'مطفي',
        settings?.enabled_globally ? null : 'شغّله من تبويب نظرة عامة');

      // ══ ④ عدد المفعّلة (حِمل النظام) ══
      const activeN = convs.filter((c) => c.ai_mode === 'active').length;
      const totalN = convs.length || 1;
      const ratio = activeN / totalN;
      add('حِمل النظام', activeN === 0 ? 'bad' : (ratio > 0.5 && totalN > 200 ? 'warn' : 'ok'),
        `${activeN} محادثة مفعّلة من ${totalN}`,
        activeN === 0 ? 'فعّل محادثة على الأقل'
          : (ratio > 0.5 && totalN > 200
            ? 'عدد كبير — الحساب المجاني ما يتحمّل. فعّل تدريجياً' : null));

      // ══ ⑤ الدالة تستجيب؟ ══
      let fnOk = false, fnMsg = '', fnMs = 0;
      const t0 = Date.now();
      try {
        const res = await fetch(AI_REPLY_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY },
          body: JSON.stringify({ test_mode: true, question: 'مرحبا', history: [] }),
        });
        fnMs = Date.now() - t0;
        const d = await res.json();
        fnOk = res.ok && (!!d.reply || !!d.escalated);
        fnMsg = d.error ? String(d.error).slice(0, 70) : '';
      } catch (e) { fnMsg = String(e).slice(0, 70); fnMs = Date.now() - t0; }
      add('دالة الذكاء', fnOk ? 'ok' : 'bad',
        fnOk ? `تستجيب خلال ${(fnMs / 1000).toFixed(1)} ثانية` : (fnMsg || 'ما ردت'),
        fnOk ? null : 'تأكد من نشر الدالة ومفتاح OpenAI بالأسرار');

      // ══ ⑥ هل رُد على الرسائل فعلياً؟ ══
      let replied = 0, escalated = 0;
      try {
        const logs24 = await sbSelect('ai_reply_log',
          `&created_at=gte.${hourAgo}&select=escalated&limit=500`);
        replied = (logs24 || []).filter((l) => !l.escalated).length;
        escalated = (logs24 || []).filter((l) => l.escalated).length;
      } catch (_e) { /* تجاهل */ }
      const totalLogs = replied + escalated;
      add('ردود آخر ساعة', totalLogs === 0 ? 'bad' : (escalated > replied ? 'warn' : 'ok'),
        totalLogs === 0 ? 'ولا رد' : `${replied} رد ناجح · ${escalated} مصعّد`,
        totalLogs === 0 ? 'السلسلة مقطوعة — راجع الحلقات الحمراء فوق'
          : (escalated > replied ? 'التصعيد أكثر من الرد — راجع سجل الردود' : null));

      // ══ ⑦ أسباب عدم الرد (من السجل) — يكشف الانسحاب الصامت ══
      try {
        const skips = await sbSelect('ai_reply_log',
          `&created_at=gte.${hourAgo}&reply_text=is.null&select=escalation_reason&limit=100`);
        const reasons = {};
        for (const r of skips || []) {
          const why = (r.escalation_reason || '').replace(/^ما رد — /, '').slice(0, 45);
          if (why) reasons[why] = (reasons[why] || 0) + 1;
        }
        const top = Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 3);
        if (top.length) {
          add('أسباب عدم الرد', 'warn',
            top.map(([w, n]) => `${w} (${n})`).join(' · '),
            'هذي أكثر أسباب انسحاب الذكاء — عالجها لتزيد الردود');
        }
      } catch (_e) { /* تجاهل */ }

      // ══ ⑧ منتجات بلا سعر (سبب تصعيد شائع) ══
      const noPrice = products.filter((p) => !p.price_iqd || Number(p.price_iqd) === 0).length;
      if (noPrice > 0) {
        add('منتجات بلا سعر', noPrice > 20 ? 'warn' : 'ok', `${noPrice} منتج`,
          noPrice > 20 ? 'الذكاء يصعّدهم بدل ما يبيعهم — أضف أسعارهم' : null);
      }
    } catch (e) {
      add('خطأ بالفحص', 'bad', String(e).slice(0, 80), null);
    }
    setDiag({ steps }); setDiagBusy(false);
  }

  // عدد التصحيحات المحفوظة حالياً
  // مهم: الـ hook يشتغل قبل التحقق من التحميل، فـ settings ممكن تكون null
  const correctionCount = React.useMemo(
    () => ((settings?.training_examples || '').match(/\[تصحيح مُلزم\]/g) || []).length,
    [settings?.training_examples],
  );

  // إضافة تصحيح لرد غلط → ينضاف كمثال تدريبي مُلزم (بسقف حتى ما يكبر بلا حد)
  const MAX_CORRECTIONS = 40;
  async function saveCorrection(log) {
    if (!correctionText.trim()) { alert('اكتب الرد الصحيح أولاً'); return; }
    const block = `\n\n[تصحيح مُلزم]\nسؤال الزبون: ${log.customer_message || '(غير مسجل)'}\nالرد الغلط الذي صدر: ${log.reply_text || '(لا يوجد)'}\nالرد الصحيح المطلوب: ${correctionText.trim()}\nملاحظة: التزم بهذا التصحيح حرفياً في أي حالة مشابهة.`;

    // نحافظ على آخر MAX_CORRECTIONS تصحيح فقط — الأقدم ينحذف
    let base = settings.training_examples || '';
    const parts = base.split('\n\n[تصحيح مُلزم]');
    if (parts.length - 1 >= MAX_CORRECTIONS) {
      const head = parts[0];
      const keep = parts.slice(parts.length - MAX_CORRECTIONS + 1);
      base = head + keep.map((p) => '\n\n[تصحيح مُلزم]' + p).join('');
    }
    const updated = base + block;

    // نضيف المصطلح للقاموس إذا المستخدم كتبه
    let glossUpdate = {};
    if (glossaryTerm.trim()) {
      const gl = (settings.dialect_glossary || '') + `\n- ${glossaryTerm.trim()}`;
      glossUpdate = { dialect_glossary: gl };
    }

    try {
      await sbUpdate('ai_settings', 1, { training_examples: updated, ...glossUpdate, updated_at: new Date().toISOString() });
      setSettings({ ...settings, training_examples: updated, ...glossUpdate });
      setCorrecting(null); setCorrectionText(''); setGlossaryTerm('');
      alert(glossaryTerm.trim()
        ? 'انحفظ التصحيح + انضاف المصطلح للقاموس'
        : 'انضاف التصحيح للتدريب — الذكاء راح يلتزم بيه بالردود الجاية');
    } catch (e) { alert('فشل حفظ التصحيح: ' + e.message); }
  }

  // تبديل وضع الذكاء لمحادثة معينة من هنا مباشرة
  async function setConvMode(convId, mode) {
    try {
      await sbUpdate('alfhd_conversations', convId, { ai_mode: mode });
      setConvs((prev) => prev.map((c) => (c.id === convId ? { ...c, ai_mode: mode } : c)));
    } catch (e) { alert('فشل التغيير: ' + e.message); }
  }

  // تبديل توفر منتج (أخضر/أحمر) من هنا مباشرة
  async function toggleProduct(p) {
    const next = !(p.ai_available !== false);
    try {
      await sbUpdate('wh_products', p.id, { ai_available: next });
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, ai_available: next } : x)));
    } catch (e) { alert('فشل التغيير: ' + e.message); }
  }

  // موافقة/رفض مسودة (وضع المراجعة)
  async function approveDraft(d, approve) {
    try {
      await sbUpdate('ai_draft_replies', d.id, { status: approve ? 'approved' : 'rejected' });
      setDrafts((prev) => prev.filter((x) => x.id !== d.id));
      if (approve) alert('انوافق — أرسله يدوياً من المحادثة إذا ما انرسل تلقائياً');
    } catch (e) { alert('فشل: ' + e.message); }
  }

  // اختبار مباشر: يشغّل الدالة على سؤال تجريبي
  // تحسين التعليمات: تكتب بلهجتك، الذكاء يحوّلها لصيغة احترافية صارمة
  async function enhanceInstructions() {
    const raw = (settings.system_prompt || '').trim();
    if (!raw || enhanceBusy) return;
    setEnhanceBusy(true); setEnhancePreview(null);
    try {
      const res = await fetch(AI_REPLY_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ enhance_mode: true, raw_text: raw }),
      });
      const data = await res.json();
      if (data.enhanced) setEnhancePreview(data.enhanced);
      else alert(data.error || 'تعذّر التحسين');
    } catch (e) { alert('خطأ: ' + e.message); }
    setEnhanceBusy(false);
  }

  async function runTest() {
    const q = testQ.trim();
    if (!q || testing) return;
    setTestQ('');
    // نضيف رسالة الزبون فوراً بالواجهة
    const historyForApi = testChat
      .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.text))
      .map((m) => ({ role: m.role, content: m.role === 'user' ? m.text : m.text }));
    setTestChat((prev) => [...prev, { role: 'user', text: q }]);
    setTesting(true);
    try {
      const res = await fetch(AI_REPLY_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ test_mode: true, question: q, history: historyForApi }),
      });
      const data = await res.json();
      setTestChat((prev) => [...prev, {
        role: 'assistant',
        text: data.reply || '',
        escalated: data.escalated,
        reason: data.reason,
        tools: data.tools_called || [],
        image: data.would_send_image || null,
        valid: data.validation_passed,
        error: data.error || null,
      }]);
    } catch (e) {
      setTestChat((prev) => [...prev, { role: 'assistant', text: '', error: String(e) }]);
    }
    setTesting(false);
  }

  function resetTest() {
    setTestChat([]); setTestQ('');
  }

  // إعادة توليد آخر رد — يشيل رد الذكاء الأخير ويعيد إرسال سؤال الزبون
  async function regenerateLast() {
    if (testing || testChat.length < 2) return;
    // آخر رسالة لازم تكون رد ذكاء، اللي قبلها سؤال الزبون
    const lastUserIdx = [...testChat].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;
    const userMsg = testChat[testChat.length - 1 - lastUserIdx];
    // نشيل رد الذكاء الأخير
    const trimmed = testChat.slice(0, testChat.length - 1);
    const historyForApi = trimmed.slice(0, -1)
      .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.text))
      .map((m) => ({ role: m.role, content: m.text }));
    setTestChat(trimmed);
    setTesting(true);
    try {
      const res = await fetch(AI_REPLY_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ test_mode: true, question: userMsg.text, history: historyForApi }),
      });
      const data = await res.json();
      setTestChat((prev) => [...prev, {
        role: 'assistant', text: data.reply || '', escalated: data.escalated, reason: data.reason,
        tools: data.tools_called || [], image: data.would_send_image || null, valid: data.validation_passed, error: data.error || null,
      }]);
    } catch (e) {
      setTestChat((prev) => [...prev, { role: 'assistant', text: '', error: String(e) }]);
    }
    setTesting(false);
  }

  if (loading || !settings) return <div style={{ padding: 24, color: '#8B98A9' }}>جاري التحميل...</div>;

  // ── إحصائيات ──
  const total = logs.length;
  const okCount = logs.filter((l) => !l.escalated && l.validation_passed).length;
  const escCount = logs.filter((l) => l.escalated).length;
  const accuracy = total ? Math.round((okCount / total) * 100) : 0;
  const today = new Date().toDateString();
  const todayCount = logs.filter((l) => new Date(l.created_at).toDateString() === today).length;
  const activeConvs = convs.filter((c) => c.ai_mode === 'active').length;
  const pausedConvs = convs.filter((c) => c.ai_mode === 'paused').length;
  const availProducts = products.filter((p) => p.ai_available !== false).length;
  // منتجات ناقصة (سعر صفر أو بلا صورة) — تنبيه
  const noPriceProducts = products.filter((p) => !p.price_iqd || Number(p.price_iqd) === 0);
  const noImageProducts = products.filter((p) => !p.image_url);
  // نسبة التحويل: كم محادثة فيها طلب مؤكد
  const bookingLogs = logs.filter((l) => (l.reply_text || '').includes('تم تثبيت طلبك')).length;
  const convRate = total ? Math.round((bookingLogs / total) * 100) : 0;

  // ── تصفية السجل ──
  const filteredLogs = logs.filter((l) => {
    if (logFilter === 'ok' && (l.escalated || !l.validation_passed)) return false;
    if (logFilter === 'escalated' && !l.escalated) return false;
    if (!logSearch.trim()) return true;
    const q = logSearch.trim();
    return (l.customer_message || '').includes(q)
      || (l.reply_text || '').includes(q)
      || (l.escalation_reason || '').includes(q)
      || JSON.stringify(l.tools_called || {}).includes(q);
  });

  const filteredProducts = products.filter((p) => !prodSearch.trim() || (p.car_name || '').includes(prodSearch.trim()));

  const box = { background: '#131B26', border: '1px solid #222C42', borderRadius: 14, padding: 16, marginBottom: 16 };
  const label = { fontSize: 13, fontWeight: 700, color: '#F5F5F5', marginBottom: 8, display: 'block' };
  const ta = { width: '100%', minHeight: 150, background: '#0E1621', border: '1px solid #222C42', borderRadius: 10, color: '#F5F5F5', padding: 12, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', direction: 'rtl', lineHeight: 1.7 };
  const inp = { width: '100%', background: '#0E1621', border: '1px solid #222C42', borderRadius: 10, color: '#F5F5F5', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', direction: 'rtl' };
  const tabBtn = (id) => ({ padding: '8px 16px', borderRadius: 10, border: 'none', background: tab === id ? '#2AABEE' : '#131B26', color: tab === id ? '#fff' : '#8B98A9', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' });
  const stat = (v, l, c) => (
    <div style={{ flex: '1 1 100px', background: '#131B26', border: '1px solid #222C42', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 21, fontWeight: 800, color: c }}>{v}</div>
      <div style={{ fontSize: 12, color: '#8B98A9', marginTop: 2 }}>{l}</div>
    </div>
  );

  return (
    <div style={{ padding: 16, maxWidth: 960, margin: '0 auto', direction: 'rtl' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Bot size={21} color="#2AABEE" />
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#F5F5F5', margin: 0 }}>الذكاء الصناعي</h2>
        <span style={{
          marginRight: 'auto', fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 20,
          background: settings.enabled_globally ? 'rgba(34,197,94,0.12)' : 'rgba(242,80,80,0.12)',
          color: settings.enabled_globally ? '#22C55E' : '#F25050',
        }}>{settings.enabled_globally ? '● يعمل الآن' : '● متوقف كلياً'}</span>
      </div>

      {/* ═══ شريط التبويبات — مرتّب بمجموعات وأيقونات ═══ */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 8, WebkitOverflowScrolling: 'touch' }} className="alfhd-ai-tabs">
        {[
          { id: 'dash',     label: 'نظرة عامة', icon: BarChart3, badge: null },
          { id: 'log',      label: 'سجل الردود', icon: FileText, badge: total },
          { id: 'products', label: 'المنتجات',  icon: Package, badge: null },
          { id: 'training', label: 'التدريب',   icon: Sparkles, badge: null },
          { id: 'settings', label: 'الإعدادات', icon: Shield, badge: null },
          ...(drafts.length > 0 ? [{ id: 'drafts', label: 'مسودات', icon: Edit3, badge: drafts.length }] : []),
        ].map((t) => {
          const Icon = t.icon; const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 11,
                border: `1px solid ${on ? 'rgba(42,171,238,0.4)' : '#222C42'}`,
                background: on ? 'rgba(42,171,238,0.14)' : 'transparent',
                color: on ? '#2AABEE' : '#8B98A9', fontSize: 12.5, fontWeight: on ? 800 : 600,
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Icon size={14} strokeWidth={on ? 2.4 : 1.9} />
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span style={{ background: on ? 'rgba(42,171,238,0.3)' : 'rgba(255,255,255,0.08)',
                  borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 800,
                  whiteSpace: 'nowrap', minWidth: 17, textAlign: 'center' }}>{t.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══════ لوحة عامة ═══════ */}
      {tab === 'dash' && (<>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {stat(todayCount, 'ردود اليوم', '#2AABEE')}
          {stat(`${accuracy}%`, 'نسبة النجاح', accuracy >= 90 ? '#22C55E' : accuracy >= 70 ? '#F59E0B' : '#F25050')}
          {stat(escCount, 'صُعّدت لموظف', '#F59E0B')}
          {stat(activeConvs, 'محادثات فعّالة', '#22C55E')}
          {stat(pausedConvs, 'محادثات متوقفة', '#94A3B8')}
          {stat(`${availProducts}/${products.length}`, 'منتجات متوفرة', '#22C55E')}
          {stat(bookingLogs, 'طلبات ثبّتها الذكاء', '#2AABEE')}
          {stat(`${convRate}%`, 'نسبة التحويل لطلب', convRate >= 20 ? '#22C55E' : '#F59E0B')}
        </div>

        {/* ── تشخيص الرد التلقائي ── */}
        <div style={{ ...box, background: 'rgba(42,171,238,0.05)', border: '1px solid rgba(42,171,238,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ ...label, marginBottom: 0, color: '#2AABEE' }}>تشخيص الرد التلقائي</span>
            <span style={{ fontSize: 12, color: '#8B98A9' }}>ما يرد على الزبائن؟ اضغط وشوف وين الخلل</span>
            <button onClick={runDiagnostics} disabled={diagBusy}
              style={{ marginRight: 'auto', padding: '8px 16px', borderRadius: 9, border: 'none',
                background: '#2AABEE', color: '#fff', fontSize: 12.5, fontWeight: 800,
                cursor: diagBusy ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {diagBusy ? 'جاري الفحص...' : 'افحص الآن'}
            </button>
          </div>
          {diag && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {diag.steps.map((st, i) => {
                const c = st.state === 'ok' ? '#22C55E' : st.state === 'warn' ? '#F59E0B' : '#F25050';
                const icon = st.state === 'ok' ? '✓' : st.state === 'warn' ? '!' : '✗';
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start',
                    padding: '10px 12px', borderRadius: 12,
                    background: `${c}12`, border: `1px solid ${c}38` }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: c, color: '#0E1621',
                      fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F5' }}>{st.name}</div>
                      <div style={{ fontSize: 12, color: c, marginTop: 2 }}>{st.detail}</div>
                      {st.fix && (
                        <div style={{ fontSize: 12, color: '#8B98A9', marginTop: 5, lineHeight: 1.7,
                          paddingTop: 5, borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                          <b style={{ color: '#F5F5F5' }}>الحل:</b> {st.fix}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {diag.steps.every((x) => x.state === 'ok') && (
                <div style={{ fontSize: 13, color: '#22C55E', fontWeight: 800, textAlign: 'center',
                  padding: '10px', background: 'rgba(34,197,94,0.08)', borderRadius: 12 }}>
                  السلسلة كاملة سليمة — الذكاء جاهز يرد
                </div>
              )}
            </div>
          )}
        </div>

        {/* تنبيه المنتجات الناقصة (سعر صفر أو بلا صورة) */}
        {(noPriceProducts.length > 0 || noImageProducts.length > 0) && (
          <div style={{ ...box, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.22)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B', marginBottom: 8 }}>⚠ منتجات تحتاج إكمال</div>
            {noPriceProducts.length > 0 && (
              <div style={{ fontSize: 12.5, color: '#8B98A9', marginBottom: 8 }}>
                <b style={{ color: '#F25050' }}>{noPriceProducts.length} منتج بدون سعر</b> — الذكاء ما يقدر يبيعهم، يصعّدهم لموظف:
                <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 4 }}>{noPriceProducts.slice(0, 8).map((p) => p.car_name).join(' · ')}{noPriceProducts.length > 8 ? ' ...' : ''}</div>
              </div>
            )}
            {noImageProducts.length > 0 && (
              <div style={{ fontSize: 12.5, color: '#8B98A9' }}>
                <b style={{ color: '#F59E0B' }}>{noImageProducts.length} منتج بدون صورة</b> — ما راح يرسل صورة للزبون
              </div>
            )}
          </div>
        )}

        <div style={box}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={label}>المفتاح العام للذكاء الصناعي</div>
              <div style={{ fontSize: 12, color: '#8B98A9', lineHeight: 1.6 }}>إيقافه هنا يوقف الرد التلقائي بكل المحادثات فوراً، بغض النظر عن إعداد كل محادثة</div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enabled_globally: !settings.enabled_globally })}
              style={{ width: 54, height: 31, borderRadius: 20, border: 'none', background: settings.enabled_globally ? '#22C55E' : '#3A4658', position: 'relative', flexShrink: 0, cursor: 'pointer' }}
            >
              <span style={{ position: 'absolute', top: 3, [settings.enabled_globally ? 'right' : 'left']: 3, width: 25, height: 25, borderRadius: '50%', background: '#fff', transition: 'all .2s' }} />
            </button>
          </div>
          <button onClick={save} disabled={saving} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 10, border: 'none', background: '#2AABEE', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>

        {/* ═══ محادثة اختبار كاملة — بدون إرسال للزبون ═══ */}
        <div style={box}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ ...label, marginBottom: 0 }}>محادثة اختبار</span>
            <span style={{ fontSize: 12, color: '#8FA0B5' }}>الذكاء يتذكر كل الرسائل — مثل زبون حقيقي</span>
            {testChat.length > 0 && (
              <button onClick={resetTest} style={{ marginRight: 'auto', padding: '4px 12px', borderRadius: 8, border: '1px solid #222C42', background: 'transparent', color: '#F25050', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RefreshCw size={11} /> محادثة جديدة
              </button>
            )}
          </div>

          {/* شاشة المحادثة */}
          <div style={{ background: '#0E1621', border: '1px solid #222C42', borderRadius: 12, padding: 12, minHeight: 120, maxHeight: 420, overflowY: 'auto', marginBottom: 8 }}>
            {testChat.length === 0 && (
              <div style={{ color: '#8FA0B5', fontSize: 12.5, textAlign: 'center', padding: '24px 8px', lineHeight: 1.8 }}>
                ابدأ محادثة تجريبية<br />
                <span style={{ fontSize: 12 }}>جرب: "مرحبا" ثم "ماليبو موجود؟" ثم "شكد سعرها؟"</span>
              </div>
            )}
            {testChat.map((m, i) => (
              <div key={i} style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-start' : 'flex-end' }}>
                <div style={{ maxWidth: '85%', padding: '8px 12px', borderRadius: 13,
                  background: m.role === 'user' ? '#1E2B3C' : (m.escalated ? 'rgba(245,158,11,0.12)' : 'rgba(42,171,238,0.12)'),
                  border: m.escalated ? '1px solid rgba(245,158,11,0.25)' : 'none' }}>
                  <div style={{ fontSize: 12, color: '#8FA0B5', marginBottom: 4, fontWeight: 700 }}>
                    {m.role === 'user' ? 'الزبون' : 'الذكاء'}
                  </div>
                  {m.error && <div style={{ fontSize: 12, color: '#F25050' }}>خطأ: {m.error}</div>}
                  {m.escalated && <div style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700, marginBottom: m.text ? 5 : 0 }}>⚠ صعّده لموظف — {m.reason}</div>}
                  {m.text && <div style={{ fontSize: 13, color: '#F5F5F5', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{m.text}</div>}
                  {m.image && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12, color: '#22C55E', marginBottom: 4, fontWeight: 700 }}>✓ يرسل صورة المنتج</div>
                      <img src={m.image} alt="" style={{ maxWidth: 130, borderRadius: 8, display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                  )}
                  {m.role === 'assistant' && Array.isArray(m.tools) && m.tools.length > 0 && (
                    <details style={{ marginTop: 8 }}>
                      <summary style={{ fontSize: 12, color: '#2AABEE', cursor: 'pointer', fontWeight: 700 }}>
                        على شنو اعتمد؟ ({m.tools.length}) {m.valid === false && <span style={{ color: '#F25050' }}>· ما اجتاز التحقق</span>}
                      </summary>
                      <pre style={{ fontSize: 12, color: '#8B98A9', background: '#131B26', padding: 8, borderRadius: 7, overflowX: 'auto', marginTop: 8, direction: 'ltr', textAlign: 'left', maxHeight: 200 }}>
                        {JSON.stringify(m.tools, null, 1)}
                      </pre>
                    </details>
                  )}
                  {/* زر إعادة الإجابة — يعيد توليد رد الذكاء لنفس السؤال */}
                  {m.role === 'assistant' && i === testChat.length - 1 && !testing && (
                    <button onClick={regenerateLast}
                      style={{ marginTop: 8, padding: '4px 12px', borderRadius: 8, border: '1px solid rgba(42,171,238,0.3)', background: 'rgba(42,171,238,0.08)', color: '#2AABEE', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <RefreshCw size={11} /> أعد الإجابة (شوف بعد التحسين)
                    </button>
                  )}
                </div>
              </div>
            ))}
            {testing && <div style={{ fontSize: 12, color: '#8FA0B5', textAlign: 'center', padding: 8 }}>جاري الرد...</div>}
          </div>

          {/* حقل الكتابة */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input aria-label="اكتب مثل الزبون" style={{ ...inp, flex: 1 }} placeholder="اكتب مثل الزبون..." value={testQ}
              onChange={(e) => setTestQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runTest(); }} />
            <button onClick={runTest} disabled={testing || !testQ.trim()}
              style={{ padding: '0 20px', borderRadius: 10, border: 'none', background: testing || !testQ.trim() ? '#3A4658' : '#2AABEE', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              إرسال
            </button>
          </div>
        </div>

        {/* آخر الأخطاء — أهم شي للمتابعة */}
        <div style={box}>
          <div style={{ ...label, marginBottom: 8 }}>آخر الحالات التي صُعّدت لموظف</div>
          {logs.filter((l) => l.escalated).slice(0, 5).length === 0
            ? <div style={{ fontSize: 12.5, color: '#22C55E' }}>✓ ما فيه أي حالة تصعيد — كل الردود مرت بنجاح</div>
            : logs.filter((l) => l.escalated).slice(0, 5).map((l) => (
              <div key={l.id} style={{ borderRight: '3px solid #F59E0B', paddingRight: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 12.5, color: '#F5F5F5' }}>{l.customer_message || '(بدون نص)'}</div>
                <div style={{ fontSize: 12, color: '#F59E0B', marginTop: 2 }}>{l.escalation_reason}</div>
              </div>
            ))}
          <button onClick={() => setTab('log')} style={{ marginTop: 8, padding: '8px 16px', borderRadius: 9, border: '1px solid #222C42', background: 'transparent', color: '#2AABEE', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            عرض السجل الكامل
          </button>
        </div>
      </>)}

      {/* ═══════ التدريب والتعليمات ═══════ */}
      {/* ═══════ الإعدادات (API والنموذج) ═══════ */}
      {tab === 'settings' && (<>
        <div style={{ ...box, background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#A78BFA', marginBottom: 4 }}>إعدادات الذكاء (API والنموذج)</div>
          <div style={{ fontSize: 12, color: '#8B98A9', lineHeight: 1.7, marginBottom: 12 }}>
            حط مفتاح API والنموذج من أي شركة تختارها. اترك أي حقل فاضي ليستخدم الإعداد الافتراضي.
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ ...label, fontSize: 12 }}>مفتاح API</span>
            <input aria-label="sk- (اتركه فاضي للإبقاء على الحالي)" type="password" style={inp} placeholder="sk-... (اتركه فاضي للإبقاء على الحالي)"
              value={settings.api_key || ''} onChange={(e) => setSettings({ ...settings, api_key: e.target.value })} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ ...label, fontSize: 12 }}>النموذج (Model)</span>
            <input aria-label="gpt-4o-mini / gpt-4o / deepseek-chat" style={inp} placeholder="gpt-4o-mini / gpt-4o / deepseek-chat ..."
              value={settings.model || ''} onChange={(e) => setSettings({ ...settings, model: e.target.value })} />
            <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 4, lineHeight: 1.6 }}>
              أمثلة: gpt-4o-mini (رخيص) · gpt-4o (أذكى) · gpt-4.1 · deepseek-chat · llama-3.3-70b (Groq)
            </div>
          </div>
          <div>
            <span style={{ ...label, fontSize: 12 }}>رابط API (للشركات غير OpenAI)</span>
            <input aria-label="اتركه فاضي لـ OpenAI" style={inp} placeholder="اتركه فاضي لـ OpenAI"
              value={settings.api_base_url || ''} onChange={(e) => setSettings({ ...settings, api_base_url: e.target.value })} />
            <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 4, lineHeight: 1.6 }}>
              OpenAI: فاضي · DeepSeek: https://api.deepseek.com/v1 · Groq: https://api.groq.com/openai/v1
            </div>
          </div>
          <button onClick={save} disabled={saving} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 10, border: 'none', background: '#A78BFA', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'جاري الحفظ...' : 'حفظ إعدادات الذكاء'}
          </button>
        </div>
      </>)}

      {/* ═══════ التدريب والتعليمات ═══════ */}
      {tab === 'training' && (<>
        <div style={{ ...box, background: 'rgba(42,171,238,0.05)', border: '1px solid rgba(42,171,238,0.18)' }}>
          <div style={{ fontSize: 12.5, color: '#8B98A9', lineHeight: 1.8 }}>
            <b style={{ color: '#2AABEE' }}>كيف يشتغل التدريب:</b><br />
            الذكاء الصناعي <b style={{ color: '#F5F5F5' }}>ممنوع</b> يذكر أي سعر أو توفر أو حالة طلب من نفسه — لازم يستعلم من قاعدة بياناتك مباشرة كل مرة. التعليمات أدناه تحدد <b style={{ color: '#F5F5F5' }}>أسلوبه</b> و<b style={{ color: '#F5F5F5' }}>حدوده</b>، مو معلومات المنتجات (هذي تنجاب حية من المخزن).
          </div>
        </div>

        {/* ملخص حالة التدريب */}
        <div style={{ ...box, padding: '12px 12px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: '#8FA0B5', fontWeight: 700 }}>مصطلحات القاموس</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#22C55E' }}>
              {((settings.dialect_glossary || '').match(/^-\s*.+=/gm) || []).length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#8FA0B5', fontWeight: 700 }}>تصحيحاتك المحفوظة</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: correctionCount >= 35 ? '#F59E0B' : '#2AABEE' }}>
              {correctionCount}<span style={{ fontSize: 12, color: '#8FA0B5' }}> / 40</span>
            </div>
          </div>
          {correctionCount >= 35 && (
            <div style={{ fontSize: 12, color: '#F59E0B', flex: 1, minWidth: 160, lineHeight: 1.6 }}>
              ⚠ قربت الحد — التصحيح الجديد يحذف الأقدم. حوّل المتكرر منها لقواعد بالتعليمات أو مصطلحات بالقاموس.
            </div>
          )}
        </div>

        {/* قاموس اللهجة — يعلّم الذكاء يفهم كلام الزبون */}
        <div style={{ ...box, background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <MessageCircle size={15} color="#22C55E" />
            <span style={{ ...label, marginBottom: 0, color: '#22C55E' }}>قاموس اللهجة العراقية</span>
          </div>
          <div style={{ fontSize: 12, color: '#8B98A9', lineHeight: 1.7, marginBottom: 8 }}>
            أهم ملف — يعلّم الذكاء يفهم كلام زبائنك. كل ما تلاحظ كلمة ما فهمها، ضيفها هنا بصيغة:
            <span style={{ color: '#22C55E' }}> الكلمة = معناها وشلون يجاوب</span>
          </div>
          <textarea style={{ ...ta, minHeight: 200 }} value={settings.dialect_glossary || ''}
            onChange={(e) => setSettings({ ...settings, dialect_glossary: e.target.value })}
            placeholder={'- طباك / طباكات = حواف الباب البلاستيك من جوة (مو أطباق)\n- كبس / تكبس = تثبت وتلزق بأرضية السيارة\n- بيها مجال = يطلب تخفيض ← "سعرها ثابت"'} />
          <button onClick={save} disabled={saving} style={{ marginTop: 8, padding: '8px 20px', borderRadius: 10, border: 'none', background: '#22C55E', color: '#fff', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'جاري الحفظ...' : 'حفظ القاموس'}
          </button>
        </div>

        <div style={box}>
          <span style={label}>التعليمات الصارمة (شخصية الذكاء وحدوده)</span>
          <textarea style={ta} value={settings.system_prompt || ''} onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
            placeholder={'مثال:\nانت مساعد مبيعات لمحل أرضيات وإكسسوارات سيارات بالعراق.\nتكلم بالعامية العراقية بأسلوب مهني ومختصر.\nممنوع تعطي خصم أو تفاوض على سعر — أي طلب خصم صعّده لموظف.\nإذا سأل الزبون عن منتج، ابحث عنه واعطه السعر والتوفر من قاعدة البيانات فقط.\nإذا ما لقيت المنتج، قول "هذا المنتج غير متوفر حالياً" ولا تخمن بديل.'} />
          {/* زر التحسين بالذكاء */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button onClick={enhanceInstructions} disabled={enhanceBusy || !(settings.system_prompt || '').trim()}
              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: enhanceBusy ? 'wait' : 'pointer',
                background: 'linear-gradient(135deg,#A78BFA,#8B5CF6)', color: '#fff', fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={14} /> {enhanceBusy ? 'جاري التحسين...' : 'حسّن كلامي (اكتب بلهجتك والذكاء يحوّلها احترافية)'}
            </button>
          </div>
          {/* معاينة النص المحسّن */}
          {enhancePreview && (
            <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.25)' }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#A78BFA', marginBottom: 8 }}>النسخة المحسّنة (احترافية وصارمة):</div>
              <div style={{ fontSize: 13, color: '#E7ECF3', lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto', background: '#0E1621', padding: 12, borderRadius: 9 }}>{enhancePreview}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <button onClick={() => { setSettings({ ...settings, system_prompt: enhancePreview }); setEnhancePreview(null); }}
                  style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: '#22C55E', color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✓ اعتمد النسخة المحسّنة
                </button>
                <button onClick={() => setEnhancePreview(null)}
                  style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid #222C42', background: 'transparent', color: '#8B98A9', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={box}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ ...label, marginBottom: 0 }}>المحادثة التدريبية (أمثلة أسئلة وأجوبة)</span>
            <span style={{ fontSize: 12, color: '#8FA0B5' }}>{(settings.training_examples || '').length} حرف</span>
          </div>
          <textarea style={{ ...ta, minHeight: 260 }} value={settings.training_examples || ''} onChange={(e) => setSettings({ ...settings, training_examples: e.target.value })}
            placeholder={'الصق محادثات حقيقية بهذا الشكل:\n\nالزبون: ماليبو موجود؟\nالرد: نعم أخي، أرضيات ماليبو تغطي الدوسة قالب بلادي متوفرة. السعر [يجيبه من المخزن].\n\nالزبون: شكد سعرها؟\nالرد: [السعر من المخزن] دينار، والتوصيل حسب المحافظة.\n\nكل ما تضيف أمثلة أكثر، كل ما صار أدق بأسلوبه.'} />
          <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 8, lineHeight: 1.7 }}>
            ملاحظة: التصحيحات اللي تضيفها من سجل الردود تنحفظ هنا تلقائياً كتصحيحات مُلزمة.
          </div>
        </div>

        <button onClick={save} disabled={saving} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: '#2AABEE', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          {saving ? 'جاري الحفظ...' : 'حفظ التعليمات والتدريب'}
        </button>
      </>)}

      {/* ═══════ سجل الردود ═══════ */}
      {tab === 'log' && (<>
        <div style={{ ...box, padding: 12 }}>
          <input aria-label="ابحث بالسجل — نص الزبون، الرد، سبب التصعيد، اسم منتج" style={{ ...inp, marginBottom: 8 }} placeholder="ابحث بالسجل — نص الزبون، الرد، سبب التصعيد، اسم منتج..." value={logSearch} onChange={(e) => setLogSearch(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {[['all', `الكل (${total})`], ['ok', `ناجحة (${okCount})`], ['escalated', `مُصعّدة (${escCount})`]].map(([id, lbl]) => (
              <button key={id} onClick={() => setLogFilter(id)} style={{ padding: '8px 12px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: logFilter === id ? '#2AABEE' : '#0E1621', color: logFilter === id ? '#fff' : '#8B98A9' }}>{lbl}</button>
            ))}
            <button onClick={loadLogs} style={{ marginRight: 'auto', padding: '8px 12px', borderRadius: 9, border: '1px solid #222C42', background: 'transparent', color: '#8B98A9', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
              <RefreshCw size={12} /> تحديث
            </button>
          </div>
        </div>

        {logsLoading && <div style={{ color: '#8B98A9', fontSize: 13, padding: 12 }}>جاري التحميل...</div>}
        {!logsLoading && filteredLogs.length === 0 && <div style={{ ...box, color: '#8B98A9', fontSize: 13, textAlign: 'center' }}>ما فيه نتائج</div>}

        {filteredLogs.map((l) => {
          const isOpen = expandedLog === l.id;
          const tools = Array.isArray(l.tools_called) ? l.tools_called : [];
          return (
            <div key={l.id} style={{ ...box, marginBottom: 8, padding: 12, borderRight: `3px solid ${l.escalated ? '#F59E0B' : '#22C55E'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#8FA0B5' }}>{new Date(l.created_at).toLocaleString('ar-IQ')}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: l.escalated ? '#F59E0B' : '#22C55E' }}>
                  {l.escalated ? '⚠ صُعّدت لموظف' : '✓ رد آلي'}
                </span>
              </div>
              {l.customer_message && <div style={{ fontSize: 12.5, color: '#8B98A9', marginBottom: 4 }}><b style={{ color: '#8FA0B5' }}>الزبون:</b> {l.customer_message}</div>}
              {l.reply_text && <div style={{ fontSize: 12.5, color: '#F5F5F5', marginBottom: 4, lineHeight: 1.7 }}><b style={{ color: '#8FA0B5' }}>الرد:</b> {l.reply_text}</div>}
              {l.escalation_reason && <div style={{ fontSize: 12, color: '#F59E0B', marginBottom: 4 }}><b>سبب التصعيد:</b> {l.escalation_reason}</div>}

              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setExpandedLog(isOpen ? null : l.id)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #222C42', background: 'transparent', color: '#2AABEE', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {isOpen ? 'إخفاء المصدر' : `على شنو اعتمد؟ (${tools.length} استعلام)`}
                </button>
                <button onClick={() => { setCorrecting(l.id); setCorrectionText(''); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(242,80,80,0.25)', background: 'rgba(242,80,80,0.06)', color: '#F25050', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  هذا غلط — صحّحه
                </button>
              </div>

              {isOpen && (
                <div style={{ marginTop: 8, background: '#0E1621', border: '1px solid #222C42', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#8FA0B5', marginBottom: 8 }}>الاستعلامات التي بُني عليها الرد (مصدر الحقيقة)</div>
                  {tools.length === 0 && <div style={{ fontSize: 12, color: '#F25050' }}>⚠ ما استعلم على شي — أي رقم بالرد غير موثق</div>}
                  {tools.map((t, i) => (
                    <pre key={i} style={{ fontSize: 12, color: '#8B98A9', background: '#131B26', padding: 8, borderRadius: 8, overflowX: 'auto', margin: '0 0 8px', direction: 'ltr', textAlign: 'left', fontFamily: 'monospace' }}>
                      {JSON.stringify(t, null, 1)}
                    </pre>
                  ))}
                  <div style={{ fontSize: 12, color: l.validation_passed ? '#22C55E' : '#F25050', fontWeight: 700 }}>
                    {l.validation_passed ? '✓ اجتاز فحص التحقق — كل رقم بالرد موثق من استعلام' : '✗ ما اجتاز فحص التحقق'}
                  </div>
                </div>
              )}

              {correcting === l.id && (
                <div style={{ marginTop: 8, background: 'rgba(242,80,80,0.05)', border: '1px solid rgba(242,80,80,0.2)', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#F25050', marginBottom: 8 }}>شنو كان لازم يجاوب بالضبط؟</div>
                  <textarea style={{ ...ta, minHeight: 80, fontSize: 12.5 }} value={correctionText} onChange={(e) => setCorrectionText(e.target.value)} placeholder="اكتب الرد الصحيح — راح ينضاف كتصحيح مُلزم بالتدريب" />
                  {/* إضافة مصطلح للقاموس — يعالج السبب الجذري مو النتيجة */}
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', marginBottom: 4 }}>
                      كلمة ما فهمها؟ ضيفها للقاموس (اختياري — بس هي اللي تمنع تكرار الغلط)
                    </div>
                    <input value={glossaryTerm} onChange={(e) => setGlossaryTerm(e.target.value)}
                      placeholder="مثال: طباكات = حواف الباب البلاستيك من جوة"
                      style={{ width: '100%', background: '#0E1621', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 9, color: '#F5F5F5', padding: '8px 12px', fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => saveCorrection(l)} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: '#22C55E', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>احفظ التصحيح</button>
                    <button onClick={() => { setCorrecting(null); setCorrectionText(''); setGlossaryTerm(''); }} style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid #222C42', background: 'transparent', color: '#8B98A9', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </>)}

      {/* ═══════ التحكم بالمحادثات ═══════ */}

      {/* ═══════ توفر المنتجات ═══════ */}
      {tab === 'products' && (<>
        <div style={{ ...box, padding: 12 }}>
          <input aria-label="ابحث عن منتج" style={inp} placeholder="ابحث عن منتج..." value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} />
          <div style={{ fontSize: 12, color: '#8B98A9', marginTop: 8, lineHeight: 1.7 }}>
            <b style={{ color: '#22C55E' }}>أخضر</b> = الذكاء يجاوب "متوفر" · <b style={{ color: '#F25050' }}>أحمر</b> = يجاوب "غير متوفر"<br />
            هذا مستقل تماماً عن عدد القطع بالمخزن — انت اللي تقرر.
          </div>

          {/* رفع صورة موحّدة لكل نوع */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #222C42' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#F5F5F5', marginBottom: 8 }}>صورة موحّدة لكل نوع</div>
            <div style={{ fontSize: 12, color: '#8FA0B5', marginBottom: 8, lineHeight: 1.6 }}>ارفع صورة وحدة تنطبق على كل منتجات النوع فوراً. مفيدة الآن — لاحقاً تقدر تغيّر صورة أي منتج لحاله.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {WH_PRODUCT_TYPES.map((t) => {
                const typeProds = products.filter((p) => p.type === t.id);
                if (typeProds.length === 0) return null;
                const withImg = typeProds.filter((p) => p.image_url).length;
                const sample = typeProds.find((p) => p.image_url);
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#0E1621', border: '1px solid #222C42', borderRadius: 11 }}>
                    {sample?.image_url
                      ? <img src={sample.image_url} alt="" style={{ width: 42, height: 42, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
                      : <div style={{ width: 42, height: 42, borderRadius: 9, background: '#222C42', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>{t.icon}</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F5' }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: withImg === typeProds.length ? '#22C55E' : '#F59E0B' }}>
                        {withImg}/{typeProds.length} عندهم صورة
                      </div>
                    </div>
                    <label style={{ padding: '8px 12px', background: 'rgba(42,171,238,0.1)', border: '1px solid rgba(42,171,238,0.3)', borderRadius: 9, color: '#2AABEE', fontSize: 12, fontWeight: 700, cursor: bulkImgBusy ? 'wait' : 'pointer', flexShrink: 0 }}>
                      {bulkImgBusy && bulkImgType === t.id ? `${bulkImgDone}/${typeProds.length}...` : (withImg > 0 ? 'تغيير' : 'رفع صورة')}
                      <input type="file" accept="image/*" disabled={bulkImgBusy}
                        onChange={(e) => handleBulkImage(e, t.id)}
                        style={{ display: 'none' }} />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          {/* تعديل جماعي للأسعار (على نتيجة البحث الحالية) */}
          {prodSearch.trim() && filteredProducts.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #222C42', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#8B98A9', fontWeight: 700 }}>تعديل سعر الـ{filteredProducts.length} منتج الظاهرين:</span>
              <input aria-label="مبلغ" id="bulkPrice" type="number" placeholder="مبلغ" style={{ ...inp, width: 90, padding: '8px 8px' }} />
              <button onClick={async () => {
                const v = Number(document.getElementById('bulkPrice')?.value);
                if (!v) { alert('اكتب مبلغ'); return; }
                if (!confirm(`تعيين سعر ${v} لكل الـ${filteredProducts.length} منتج الظاهرين؟`)) return;
                for (const p of filteredProducts) {
                  try { await sbUpdate('wh_products', p.id, { price_iqd: v }); } catch (_e) { /* تابع */ }
                }
                setProducts((prev) => prev.map((x) => filteredProducts.find((f) => f.id === x.id) ? { ...x, price_iqd: v } : x));
                alert('تم');
              }} style={{ padding: '8px 12px', borderRadius: 9, border: 'none', background: '#2AABEE', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                تعيين موحّد
              </button>
              <button onClick={async () => {
                const pct = Number(prompt('نسبة الزيادة % (مثلاً 10 لزيادة 10%، أو -5 لتخفيض 5%)'));
                if (!pct) return;
                if (!confirm(`تغيير أسعار الـ${filteredProducts.length} منتج بنسبة ${pct}%؟`)) return;
                for (const p of filteredProducts) {
                  const nv = Math.round((Number(p.price_iqd) || 0) * (1 + pct / 100));
                  try { await sbUpdate('wh_products', p.id, { price_iqd: nv }); } catch (_e) { /* تابع */ }
                }
                setProducts((prev) => prev.map((x) => { const f = filteredProducts.find((f) => f.id === x.id); return f ? { ...x, price_iqd: Math.round((Number(x.price_iqd) || 0) * (1 + pct / 100)) } : x; }));
                alert('تم');
              }} style={{ padding: '8px 12px', borderRadius: 9, border: '1px solid #222C42', background: 'transparent', color: '#22C55E', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                نسبة %
              </button>
            </div>
          )}
        </div>
        <div style={{ ...box, padding: 0, overflow: 'hidden' }}>
          {filteredProducts.map((p, i) => {
            const avail = p.ai_available !== false;
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: i < filteredProducts.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                {p.image_url
                  ? <img src={p.image_url} alt="" onError={(e) => { e.target.style.display = 'none'; }} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 36, height: 36, borderRadius: 8, background: '#222C42', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15 }}>📦</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#F5F5F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.car_name}</div>
                  <div style={{ fontSize: 12, color: '#8FA0B5', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{WH_PRODUCT_TYPES.find((t) => t.id === p.type)?.label || p.type}</span>
                    {/* تعديل السعر السريع */}
                    <input
                      defaultValue={p.price_iqd || ''}
                      onBlur={async (e) => {
                        const v = Number(e.target.value) || 0;
                        if (v === Number(p.price_iqd || 0)) return;
                        try { await sbUpdate('wh_products', p.id, { price_iqd: v }); setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, price_iqd: v } : x)); }
                        catch (err) { alert('فشل: ' + err.message); }
                      }}
                      placeholder="السعر"
                      style={{ width: 62, background: !p.price_iqd ? 'rgba(242,80,80,0.1)' : '#0E1621', border: `1px solid ${!p.price_iqd ? 'rgba(242,80,80,0.3)' : '#222C42'}`, borderRadius: 6, color: !p.price_iqd ? '#F25050' : '#F5F5F5', padding: '2px 8px', fontSize: 12, fontFamily: 'inherit', textAlign: 'center' }}
                    />
                    {!p.image_url && <span style={{ color: '#F59E0B' }}>⚠ بلا صورة</span>}
                  </div>
                </div>
                <button onClick={() => toggleProduct(p)} style={{ padding: '8px 12px', borderRadius: 20, border: `1px solid ${avail ? 'rgba(34,197,94,0.3)' : 'rgba(242,80,80,0.25)'}`, background: avail ? 'rgba(34,197,94,0.12)' : 'rgba(242,80,80,0.08)', color: avail ? '#22C55E' : '#F25050', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
                  {avail ? 'متوفر' : 'غير متوفر'}
                </button>
              </div>
            );
          })}
        </div>
      </>)}

      {/* ═══════ المسودات (وضع المراجعة) ═══════ */}
      {tab === 'drafts' && (
        <div style={box}>
          {drafts.length === 0 && <div style={{ color: '#8B98A9', fontSize: 13 }}>ما فيه مسودات تنتظر موافقة</div>}
          {drafts.map((d) => (
            <div key={d.id} style={{ borderBottom: '1px solid #222C42', padding: '12px 0' }}>
              <div style={{ fontSize: 12, color: '#8FA0B5', marginBottom: 4 }}>{new Date(d.created_at).toLocaleString('ar-IQ')}</div>
              <div style={{ fontSize: 12.5, color: '#F5F5F5', lineHeight: 1.7, marginBottom: 8 }}>{d.draft_text}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => approveDraft(d, true)} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: '#22C55E', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>موافق</button>
                <button onClick={() => approveDraft(d, false)} style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid rgba(242,80,80,0.25)', background: 'transparent', color: '#F25050', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>رفض</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// WarehouseView — نظام إدارة المخزن الكامل (مدمج في الموقع)
// ══════════════════════════════════════════════════════════════════
const WH_PRODUCT_TYPES = [
  { id: 'mother_dosah', label: 'أم الدوسة', icon: '🪣', color: '#3B82F6' },
  { id: 'rubble_hodi',  label: 'ربل حوضي',  icon: '📦', color: '#8B5CF6' },
  { id: 'leather',      label: 'جلد',        icon: '✨', color: '#F59E0B' },
  { id: 'trunk_box',    label: 'صندوق',      icon: '🧳', color: '#22C55E' },
];
const WH_DEBT_TYPES = [
  { id: 'supplier', label: 'موزع جملة', color: '#F45B69' },
  { id: 'rent',     label: 'إيجار',     color: '#F0A868' },
  { id: 'salary',   label: 'راتب',      color: '#A78BFA' },
  { id: 'expense',  label: 'مصاريف',    color: '#60A5FA' },
  { id: 'other',    label: 'أخرى',      color: '#8FA0B5' },
];
const LOW_STOCK = 3;
function whFmt(n) { return `${(Number(n)||0).toLocaleString()} د.ع`; }
function whToday() { return new Date().toISOString().slice(0,10); }
function whDaysUntil(d) { return d ? Math.ceil((new Date(d)-new Date())/86400000) : null; }

function WhModal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:16 }} onClick={onClose}>
      <div style={{ background:'linear-gradient(145deg,#17212B,#1A2736)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.7)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding: '16px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:'#F5F5F5' }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#8FA0B5', cursor:'pointer' }}><X size={18}/></button>
        </div>
        <div style={{ padding: '16px 20px' }}>{children}</div>
      </div>
    </div>
  );
}
function WhField({ label, required, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#8B9AB3', marginBottom: 4 }}>{label}{required&&<span style={{color:'#F25050'}}> *</span>}</label>
      {children}
    </div>
  );
}
const whInp = { width:'100%', background:'#242F3D', border:'1px solid rgba(255,255,255,0.07)', borderRadius:9, color:'#F5F5F5', fontSize:13, padding: '8px 12px', outline:'none', boxSizing:'border-box', fontFamily:'Cairo,sans-serif' };

// لوحة التحكم
function WhDashboard({ products, sales, debts, suppliers }) {
  const low = products.filter(p=>p.quantity<=LOW_STOCK);
  const stockVal = products.reduce((s,p)=>s+(p.quantity*(p.cost_iqd||0)),0);
  const todayRev = sales.filter(s=>s.date===whToday()).reduce((s,x)=>s+x.total_iqd,0);
  const monthRev = sales.filter(s=>s.date?.slice(0,7)===whToday().slice(0,7)).reduce((s,x)=>s+x.total_iqd,0);
  const totalDebt = debts.filter(d=>d.status==='unpaid').reduce((s,d)=>s+(d.amount_iqd||0),0);
  const urgent = debts.filter(d=>d.status==='unpaid'&&whDaysUntil(d.due_date)!==null&&whDaysUntil(d.due_date)<=7);
  const stats = [
    {l:'مبيعات اليوم', v:whFmt(todayRev), c:'#4DDB6B', I:TrendingUp},
    {l:'مبيعات الشهر', v:whFmt(monthRev), c:'#2AABEE', I:BarChart3},
    {l:'رصيد المخزن',  v:whFmt(stockVal), c:'#A78BFA', I:Warehouse},
    {l:'إجمالي الديون',v:whFmt(totalDebt),c:'#F25050', I:CreditCard},
    {l:'أصناف المنتجات',v:products.length, c:'#F0A868', I:Package},
    {l:'موزعون',       v:suppliers.length, c:'#2AABEE', I:Truck},
  ];
  return (
    <div>
      {(low.length>0||urgent.length>0)&&(
        <div style={{background:'rgba(242,80,80,0.06)',border:'1px solid rgba(242,80,80,0.25)',borderRadius:12,padding: 16,marginBottom:16}}>
          <div style={{color:'#F25050',fontWeight:800,marginBottom:8,display:'flex',alignItems:'center',gap: 8}}><AlertCircle size={15}/>تنبيهات</div>
          {low.length>0&&<div style={{fontSize:12,color:'#F0A868',marginBottom:4}}>⚠️ {low.length} منتج أقل من {LOW_STOCK} قطع: {low.slice(0,3).map(p=>p.car_name).join('، ')}</div>}
          {urgent.length>0&&<div style={{fontSize:12,color:'#F25050'}}>🔴 {urgent.length} دين يستحق خلال 7 أيام</div>}
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12,marginBottom: 20}}>
        {stats.map(s=>(
          <div key={s.l} style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,padding: '12px 16px',boxShadow:'0 2px 8px rgba(0,0,0,0.4)'}}>
            <s.I size={18} color={s.c} style={{marginBottom:8}}/>
            <div style={{fontSize:17,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize: 12,color:'#8FA0B5',marginTop: 4}}>{s.l}</div>
          </div>
        ))}
      </div>
      {low.length>0&&(
        <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(242,80,80,0.2)',borderRadius:13,padding: 16,marginBottom: 16}}>
          <div style={{fontSize:13,fontWeight:800,color:'#F25050',marginBottom: 8}}>منتجات تحتاج تزويد</div>
          {low.map(p=>(
            <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding: '8px 8px',background:'rgba(242,80,80,0.06)',borderRadius:9,marginBottom: 8,border:'1px solid rgba(242,80,80,0.15)'}}>
              <div>
                <div style={{fontSize:12.5,fontWeight:700,color:'#F5F5F5'}}>{p.car_name} — {WH_PRODUCT_TYPES.find(t=>t.id===p.type)?.label}</div>
                {p.location&&<div style={{fontSize: 12,color:'#8FA0B5'}}>📍 {p.location}</div>}
              </div>
              <div style={{fontSize:22,fontWeight:800,color:p.quantity===0?'#F25050':'#F0A868'}}>{p.quantity}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,padding: 16}}>
        <div style={{fontSize:13,fontWeight:800,color:'#F5F5F5',marginBottom: 8}}>آخر المبيعات</div>
        {sales.slice(0,5).map(s=>(
          <div key={s.id} style={{display:'flex',justifyContent:'space-between',padding: '8px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <div><div style={{fontSize:12.5,fontWeight:600,color:'#F5F5F5'}}>{s.product_name}</div><div style={{fontSize: 12,color:'#8FA0B5'}}>{s.date} · {s.customer_name||'زبون'}</div></div>
            <div style={{fontSize:13,fontWeight:800,color:'#4DDB6B'}}>{whFmt(s.total_iqd)}</div>
          </div>
        ))}
        {!sales.length&&<div style={{color:'#8FA0B5',fontSize:13,textAlign:'center',padding:20}}>لا توجد مبيعات بعد</div>}
      </div>
    </div>
  );
}

// المنتجات
function WhProducts({ products, setProducts, cars, setCars, sbI, sbU, sbD }) {
  const [search,setSearch]=useState('');
  const [type,setType]=useState('all');
  const [modal,setModal]=useState(false);
  const [carModal,setCarModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({car_name:'',type:'mother_dosah',quantity:0,cost_iqd:0,price_iqd:0,location:'',notes:'',image_url:'',origin:'both',colors:[],aliases:''});
  const [carForm,setCarForm]=useState({name:''});
  const [saving,setSaving]=useState(false);
  const [imgUploading,setImgUploading]=useState(false);
  const [newCarMode,setNewCarMode]=useState(false);
  const [whMenu,setWhMenu]=useState(false);
  const [locSearchModal,setLocSearchModal]=useState(false);
  const [locSearch,setLocSearch]=useState('');
  const whImportRef=React.useRef(null);
  const whMenuItem={display:'block',width:'100%',textAlign:'right',padding: '8px 12px',background:'transparent',border:'none',borderRadius:8,color:'#EAF0F7',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'};
  const filtered = products.filter(p=>(type==='all'||p.type===type)&&(!search||p.car_name?.includes(search)||p.location?.includes(search)));
  function openNew(){setEditing(null);setNewCarMode(false);setForm({car_name:'',type:'mother_dosah',quantity:0,cost_iqd:0,price_iqd:0,location:'',branch:'',shelf:'',notes:'',image_url:'',origin:'both',colors:[],aliases:''});setModal(true);}
  function openEdit(p){
    setEditing(p);setNewCarMode(false);
    // فكّ الموقع المحفوظ "فرع X - رف Y" إلى حقلين
    let branch='',shelf='';
    const loc=p.location||'';
    const bm=loc.match(/فرع\s*([^\-]*)/);const sm=loc.match(/رف\s*(.*)/);
    if(bm)branch=bm[1].trim();if(sm)shelf=sm[1].trim();
    setForm({car_name:p.car_name||'',type:p.type||'mother_dosah',quantity:p.quantity||0,cost_iqd:p.cost_iqd||0,price_iqd:p.price_iqd||0,location:loc,branch,shelf,notes:p.notes||'',image_url:p.image_url||'',origin:p.origin||'both',colors:Array.isArray(p.colors)?p.colors:[],aliases:p.aliases||''});setModal(true);
  }
  // ضغط الصورة لـ base64 وتخزينها مع المنتج
  function handlePickImage(e){
    const file=e.target.files?.[0]; if(!file)return;
    setImgUploading(true);
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new window.Image();
      img.onload=()=>{
        const canvas=document.createElement('canvas');
        const max=600; let{width,height}=img;
        if(width>height&&width>max){height=height*max/width;width=max;}
        else if(height>max){width=width*max/height;height=max;}
        canvas.width=width;canvas.height=height;
        canvas.getContext('2d').drawImage(img,0,0,width,height);
        setForm(f=>({...f,image_url:canvas.toDataURL('image/jpeg',0.7)}));
        setImgUploading(false);
      };
      img.onerror=()=>{setImgUploading(false);alert('تعذّر قراءة الصورة');};
      img.src=reader.result;
    };
    reader.onerror=()=>{setImgUploading(false);};
    reader.readAsDataURL(file);
  }
  async function save(){
    if(!form.car_name.trim()){alert('أدخل اسم السيارة');return;}
    setSaving(true);
    // أرسل الحقول الصالحة فقط (بدون id/created_at لتجنّب أخطاء التحديث)
    const locClean=(form.branch||form.shelf)?`فرع ${form.branch||''} - رف ${form.shelf||''}`.trim():'';
    const clean={car_name:form.car_name.trim(),type:form.type,quantity:Number(form.quantity)||0,cost_iqd:Number(form.cost_iqd)||0,price_iqd:Number(form.price_iqd)||0,location:locClean,notes:form.notes||'',image_url:form.image_url||'',origin:form.origin||'both',colors:form.colors||[],aliases:form.aliases||''};
    try{
      if(editing){await sbU('wh_products',editing.id,clean);setProducts(prev=>prev.map(p=>p.id===editing.id?{...p,...clean}:p));}
      else{const r=await sbI('wh_products',{...clean,created_at:new Date().toISOString()});if(r?.[0])setProducts(prev=>[r[0],...prev]);}
      setModal(false);
    }catch(e){alert('فشل الحفظ: '+e.message);}
    setSaving(false);
  }
  async function addCar(){
    if(!carForm.name.trim()){alert('أدخل اسم السيارة');return;}
    setSaving(true);
    try{
      const prods=await Promise.all(WH_PRODUCT_TYPES.map(t=>sbI('wh_products',{car_name:carForm.name,type:t.id,quantity:0,cost_iqd:0,price_iqd:0,location:'',created_at:new Date().toISOString()})));
      const added=prods.flatMap(r=>r||[]);
      setProducts(prev=>[...added,...prev]);
      setCars(prev=>[...new Set([...prev,carForm.name])]);
      setCarModal(false);setCarForm({name:''});
    }catch(e){alert('فشل: '+e.message);}
    setSaving(false);
  }
  async function del(id){if(!confirm('حذف هذا المنتج؟'))return;try{await sbD('wh_products',id);setProducts(prev=>prev.filter(p=>p.id!==id));}catch(e){alert('فشل الحذف: '+e.message+'\n\nقد تحتاج تفعيل صلاحية الحذف في قاعدة البيانات.');}}

  // تصدير كل المنتجات كملف CSV
  function exportProducts(){
    if(products.length===0){alert('لا توجد منتجات للتصدير');return;}
    const cols=['car_name','type','quantity','cost_iqd','price_iqd','location','notes'];
    const header=['اسم السيارة','النوع','الكمية','التكلفة','السعر','الموقع','ملاحظات'];
    const esc=(v)=>{const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
    const rows=products.map(p=>cols.map(c=>esc(p[c])).join(','));
    const csv='\uFEFF'+[header.join(','),...rows].join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=`منتجات-المخزن-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  // استيراد منتجات من ملف CSV
  async function importProducts(e){
    const file=e.target.files?.[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=async()=>{
      try{
        const text=String(reader.result).replace(/^\uFEFF/,'');
        const lines=text.split(/\r?\n/).filter(l=>l.trim());
        if(lines.length<2){alert('الملف فارغ أو لا يحتوي بيانات');return;}
        // تجاهل صف العناوين، استورد الباقي
        const parseLine=(line)=>{const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(ch===','&&!q){out.push(cur);cur='';}else cur+=ch;}out.push(cur);return out;};
        const typeIds=WH_PRODUCT_TYPES.map(t=>t.id);
        let added=0;
        for(let i=1;i<lines.length;i++){
          const c=parseLine(lines[i]);
          if(!c[0]?.trim())continue;
          const rec={car_name:c[0].trim(),type:typeIds.includes(c[1]?.trim())?c[1].trim():'mother_dosah',quantity:Number(c[2])||0,cost_iqd:Number(c[3])||0,price_iqd:Number(c[4])||0,location:c[5]||'',notes:c[6]||'',created_at:new Date().toISOString()};
          const r=await sbI('wh_products',rec);
          if(r?.[0]){setProducts(prev=>[r[0],...prev]);added++;}
        }
        alert(`✅ تم استيراد ${added} منتج بنجاح`);
      }catch(err){alert('فشل الاستيراد: '+err.message);}
    };
    reader.readAsText(file);
    e.target.value='';
  }
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom: 16,flexWrap:'wrap',gap:8}}>
        <h3 style={{margin:0,fontSize:17,fontWeight:800,color:'#F5F5F5'}}>المنتجات والمخزون</h3>
        <div style={{display:'flex',gap: 8}}>
          <button onClick={openNew} style={{display:'flex',alignItems:'center',gap: 4,padding: '8px 12px',background:'linear-gradient(135deg,#2AABEE,#229ED9)',border:'none',borderRadius:9,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
            <Plus size={13}/> منتج جديد
          </button>
          {/* قائمة 3 نقاط: تصدير / استيراد / بحث عن موقع */}
          <div style={{position:'relative'}}>
            <button onClick={()=>setWhMenu(v=>!v)} style={{display:'flex',alignItems:'center',justifyContent:'center',width:36,height:36,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:9,color:'#8B9AB3',cursor:'pointer',fontSize:18,fontWeight:900,lineHeight:1}}>⋮</button>
            {whMenu&&(
              <>
                <div onClick={()=>setWhMenu(false)} style={{position:'fixed',inset:0,zIndex:40}}/>
                <div style={{position:'absolute',top:42,left:0,zIndex:41,background:'#1A2234',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding: 8,minWidth:170,boxShadow:'0 12px 32px rgba(0,0,0,0.5)'}}>
                  <button onClick={()=>{setWhMenu(false);setLocSearchModal(true);}} style={whMenuItem}>🔍 بحث عن موقع منتج</button>
                  <button onClick={()=>{setWhMenu(false);exportProducts();}} style={whMenuItem}>📥 تصدير المنتجات</button>
                  <button onClick={()=>{setWhMenu(false);whImportRef.current?.click();}} style={whMenuItem}>📤 استيراد المنتجات</button>
                </div>
              </>
            )}
          </div>
          <input type="file" accept=".csv" ref={whImportRef} onChange={importProducts} style={{display:'none'}} />
        </div>
      </div>
      <div style={{display:'flex',gap: 8,marginBottom:12,flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:1,minWidth:160}}>
          <Search size={13} style={{position:'absolute',right:9,top:'50%',transform:'translateY(-50%)',color:'#8FA0B5'}}/>
          <input aria-label="بحث" value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." style={{...whInp,paddingRight: 28}}/>
        </div>
        {[{id:'all',label:'الكل'},...WH_PRODUCT_TYPES].map(t=>(
          <button key={t.id} onClick={()=>setType(t.id)} style={{padding: '8px 12px',borderRadius:18,border:`1px solid ${type===t.id?'#2AABEE':'rgba(255,255,255,0.07)'}`,background:type===t.id?'rgba(42,171,238,0.15)':'transparent',color:type===t.id?'#2AABEE':'#8FA0B5',fontSize:11.5,fontWeight:700,cursor:'pointer'}}>
            {t.icon||''} {t.label}
          </button>
        ))}
      </div>
      <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,overflow:'hidden'}}>
        {filtered.length===0?<div style={{padding:40,textAlign:'center',color:'#8FA0B5'}}>لا توجد منتجات</div>:
        filtered.map((p,i)=>{
          const t=WH_PRODUCT_TYPES.find(x=>x.id===p.type);
          const isLow=p.quantity<=LOW_STOCK;
          return(
            <div key={p.id} style={{display:'flex',alignItems:'center',gap: 12,padding: '12px 16px',borderBottom:i<filtered.length-1?'1px solid rgba(255,255,255,0.06)':'none'}}>
              {p.image_url
                ? <img src={p.image_url} alt="" onError={(e)=>{e.target.style.display='none';}} style={{width:42,height:42,borderRadius:10,objectFit:'cover',flexShrink:0,border:'1px solid rgba(255,255,255,0.08)'}}/>
                : <div style={{width:42,height:42,borderRadius:10,background:`${t?.color||'#2AABEE'}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{t?.icon}</div>}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:'#F5F5F5'}}>{p.car_name}</div>
                <div style={{display:'flex',gap: 8,marginTop: 4,flexWrap:'wrap'}}>
                  <span style={{fontSize: 12,color:t?.color,background:`${t?.color||'#2AABEE'}15`,padding: '2px 8px',borderRadius:18}}>{t?.label}</span>
                  {p.location&&<span style={{fontSize: 12,color:'#8FA0B5'}}>📍 {p.location}</span>}
                  {p.price_iqd>0
                    ? <span style={{fontSize: 12,color:'#8FA0B5'}}>~{whFmt(p.price_iqd)}</span>
                    : <span style={{fontSize: 12,color:'#8FA0B5'}}>السعر حسب الطلب</span>}
                </div>
              </div>
              <div style={{textAlign:'center',minWidth:46}}>
                <div style={{fontSize:20,fontWeight:800,color:isLow?'#F25050':'#4DDB6B'}}>{p.quantity}</div>
                <div style={{fontSize: 12,color:'#8FA0B5'}}>قطعة</div>
                {isLow&&<div style={{fontSize: 12,color:'#F25050',fontWeight:700}}>⚠️</div>}
              </div>
              <div style={{display:'flex',gap: 4}}>
                <button
                  onClick={async()=>{
                    const next=!(p.ai_available!==false);
                    try{ await sbU('wh_products',p.id,{ai_available:next}); setProducts(prev=>prev.map(x=>x.id===p.id?{...x,ai_available:next}:x)); }
                    catch(e){ alert('فشل تحديث توفر الذكاء الصناعي: '+e.message); }
                  }}
                  title={(p.ai_available!==false)?'الذكاء يرد "متوفر" — اضغط لتحويله لغير متوفر':'الذكاء يرد "غير متوفر" — اضغط لتحويله لمتوفر'}
                  style={{padding: 8,background:(p.ai_available!==false)?'rgba(34,197,94,0.12)':'rgba(242,80,80,0.1)',border:`1px solid ${(p.ai_available!==false)?'rgba(34,197,94,0.3)':'rgba(242,80,80,0.25)'}`,borderRadius:8,color:(p.ai_available!==false)?'#22C55E':'#F25050',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
                ><Bot size={13}/></button>
                <button onClick={()=>openEdit(p)} style={{padding: 8,background:'rgba(42,171,238,0.1)',border:'1px solid rgba(42,171,238,0.2)',borderRadius:8,color:'#2AABEE',cursor:'pointer'}}><Edit3 size={13}/></button>
                <button onClick={()=>del(p.id)} style={{padding: 8,background:'rgba(242,80,80,0.08)',border:'1px solid rgba(242,80,80,0.18)',borderRadius:8,color:'#F25050',cursor:'pointer'}}><Trash2 size={13}/></button>
              </div>
            </div>
          );
        })}
      </div>
      {locSearchModal&&(
        <WhModal title="بحث عن موقع منتج" onClose={()=>{setLocSearchModal(false);setLocSearch('');}}>
          <WhField label="اسم المنتج">
            <input aria-label="اكتب اسم المنتج" value={locSearch} onChange={e=>setLocSearch(e.target.value)} placeholder="اكتب اسم المنتج..." style={whInp} autoFocus/>
          </WhField>
          <div style={{marginTop: 8,maxHeight:320,overflowY:'auto',display:'flex',flexDirection:'column',gap:8}}>
            {locSearch.trim().length<1
              ? <div style={{textAlign:'center',color:'#8FA0B5',fontSize:12,padding: '20px 0'}}>اكتب اسم المنتج لعرض موقعه</div>
              : (()=>{
                  const res=products.filter(p=>p.car_name?.includes(locSearch.trim()));
                  if(res.length===0)return <div style={{textAlign:'center',color:'#8FA0B5',fontSize:12,padding: '20px 0'}}>لا توجد نتائج</div>;
                  return res.map(p=>{
                    const loc=p.location||'';
                    const bm=loc.match(/فرع\s*([^\-]*)/);const sm=loc.match(/رف\s*(.*)/);
                    const branch=bm?bm[1].trim():'—';const shelf=sm?sm[1].trim():'—';
                    return(
                      <div key={p.id} style={{padding: '12px 12px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:11}}>
                        <div style={{fontSize:13.5,fontWeight:700,color:'#F5F5F5',marginBottom: 8}}>{p.car_name}</div>
                        <div style={{display:'flex',gap:8}}>
                          <div style={{flex:1,background:'rgba(42,171,238,0.08)',borderRadius:8,padding: '8px 8px'}}>
                            <div style={{fontSize: 12,color:'#8FA0B5'}}>الفرع</div>
                            <div style={{fontSize:14,fontWeight:800,color:'#2AABEE'}}>{branch}</div>
                          </div>
                          <div style={{flex:1,background:'rgba(240,168,104,0.08)',borderRadius:8,padding: '8px 8px'}}>
                            <div style={{fontSize: 12,color:'#8FA0B5'}}>الرف</div>
                            <div style={{fontSize:14,fontWeight:800,color:'#F0A868'}}>{shelf}</div>
                          </div>
                          <div style={{textAlign:'center',padding: '8px 8px'}}>
                            <div style={{fontSize: 12,color:'#8FA0B5'}}>الكمية</div>
                            <div style={{fontSize:14,fontWeight:800,color:'#4DDB6B'}}>{p.quantity}</div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
          </div>
          <button onClick={()=>{setLocSearchModal(false);setLocSearch('');}} style={{width:'100%',marginTop:12,padding: '8px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,color:'#8B9AB3',cursor:'pointer',fontWeight:700}}>إغلاق</button>
        </WhModal>
      )}
      {modal&&(
        <WhModal title={editing?'تعديل منتج':'إضافة منتج'} onClose={()=>setModal(false)}>
          <WhField label="اسم المنتج" required>
            <input aria-label="اكتب اسم المنتج" value={form.car_name} onChange={e=>setForm(f=>({...f,car_name:e.target.value}))} placeholder="اكتب اسم المنتج" style={whInp}/>
          </WhField>
          <WhField label="نوع المنتج" required>
            <select aria-label="خيار" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={whInp}>
              {WH_PRODUCT_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </WhField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap: 12}}>
            <WhField label="الكمية"><input type="number" value={form.quantity||''} placeholder="0" onChange={e=>setForm(f=>({...f,quantity:e.target.value===''?0:Number(e.target.value)}))} style={whInp}/></WhField>
            <WhField label="سعر الشراء (د.ع)"><input type="number" value={form.cost_iqd||''} placeholder="0" onChange={e=>setForm(f=>({...f,cost_iqd:e.target.value===''?0:Number(e.target.value)}))} style={whInp}/></WhField>
            <WhField label="سعر البيع التقديري (اختياري)"><input aria-label="يُحدَّد من الطلب" type="number" value={form.price_iqd||''} placeholder="يُحدَّد من الطلب" onChange={e=>setForm(f=>({...f,price_iqd:e.target.value===''?0:Number(e.target.value)}))} style={whInp}/></WhField>
            <WhField label="موقع المخزن">
              <div style={{display:'flex',gap: 8}}>
                <input aria-label="الفرع: A" value={form.branch||''} onChange={e=>setForm(f=>({...f,branch:e.target.value,location:`فرع ${e.target.value||''} - رف ${f.shelf||''}`.trim()}))} placeholder="الفرع: A" style={{...whInp,flex:1}}/>
                <input aria-label="الرف: 350" value={form.shelf||''} onChange={e=>setForm(f=>({...f,shelf:e.target.value,location:`فرع ${f.branch||''} - رف ${e.target.value||''}`.trim()}))} placeholder="الرف: 350" style={{...whInp,flex:1}}/>
              </div>
            </WhField>
          </div>
          <WhField label="أسماء بديلة (اللهجة العراقية)">
            <input value={form.aliases||''} onChange={e=>setForm(f=>({...f,aliases:e.target.value}))}
              placeholder="مرزي، بيكم، بيك اب" style={whInp}/>
            <div style={{fontSize:11,color:'#8FA0B5',marginTop: 4,lineHeight:1.6}}>الأسماء اللي الزبون يستخدمها لنفس السيارة — افصلها بفاصلة. الذكاء يبحث بيها مثل الاسم الأصلي.</div>
          </WhField>
          <WhField label="المنشأ (يحدد شنو يجاوب الذكاء الصناعي)">
            <div style={{display:'flex',gap: 8}}>
              {[['both','خليجي وأمريكي','#2AABEE'],['gulf','خليجي فقط','#8B5CF6'],['american','أمريكي فقط','#F59E0B']].map(([v,lbl,col])=>(
                <button key={v} type="button" onClick={()=>setForm(f=>({...f,origin:v}))}
                  style={{flex:1,padding: '8px 8px',borderRadius:9,border:'none',fontSize:11.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit',
                    background:(form.origin||'both')===v?`${col}22`:'#0E1621',color:(form.origin||'both')===v?col:'#8FA0B5'}}>{lbl}</button>
              ))}
            </div>
          </WhField>
          <WhField label="الألوان المتوفرة">
            <div style={{display:'flex',flexDirection:'column',gap: 8}}>
              {(form.colors||[]).map((c,ci)=>(
                <div key={ci} style={{display:'flex',gap: 8,alignItems:'center'}}>
                  <input value={c.name||''} onChange={e=>setForm(f=>{const a=[...(f.colors||[])];a[ci]={...a[ci],name:e.target.value};return{...f,colors:a};})}
                    placeholder="اسم اللون: اسود / بيجي" style={{...whInp,flex:1}}/>
                  <select aria-label="خيار" value={c.scope||'all'} onChange={e=>setForm(f=>{const a=[...(f.colors||[])];a[ci]={...a[ci],scope:e.target.value};return{...f,colors:a};})}
                    style={{...whInp,width:110,fontFamily:'inherit'}}>
                    <option value="all">للكل</option>
                    <option value="gulf">للخليجي</option>
                    <option value="american">للأمريكي</option>
                  </select>
                  <button type="button" onClick={()=>setForm(f=>({...f,colors:(f.colors||[]).filter((_,i)=>i!==ci)}))}
                    style={{padding: 8,background:'rgba(242,80,80,0.08)',border:'none',borderRadius:8,color:'#F25050',cursor:'pointer',display:'flex'}}><Trash2 size={13}/></button>
                </div>
              ))}
              <button type="button" onClick={()=>setForm(f=>({...f,colors:[...(f.colors||[]),{name:'',scope:'all'}]}))}
                style={{padding: '8px',borderRadius:9,border:'1px dashed #222C42',background:'transparent',color:'#2AABEE',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                + إضافة لون
              </button>
              <div style={{fontSize:11,color:'#8FA0B5',lineHeight:1.6}}>إذا ما ضفت أي لون، الذكاء يعتبر المتوفر أسود فقط.</div>
            </div>
          </WhField>
          <WhField label="ملاحظات"><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{...whInp,minHeight:55,resize:'vertical'}}/></WhField>
          <WhField label="صورة المنتج">
            <div style={{display:'flex',alignItems:'center',gap: 8}}>
              {form.image_url?(
                <div style={{position:'relative'}}>
                  <img src={form.image_url} alt="" onError={(e)=>{e.target.style.display='none';}} style={{width:60,height:60,borderRadius:10,objectFit:'cover',border:'1px solid rgba(255,255,255,0.1)'}}/>
                  <button onClick={()=>setForm(f=>({...f,image_url:''}))} style={{position:'absolute',top:-6,left:-6,width:20,height:20,borderRadius:'50%',background:'#F25050',border:'none',color:'#fff',fontSize:12,cursor:'pointer',lineHeight:1}}>×</button>
                </div>
              ):(
                <div style={{width:60,height:60,borderRadius:10,background:'rgba(255,255,255,0.04)',border:'1px dashed rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Image size={20} color="#8FA0B5"/>
                </div>
              )}
              <label style={{padding: '8px 16px',background:'rgba(42,171,238,0.1)',border:'1px solid rgba(42,171,238,0.3)',borderRadius:9,color:'#2AABEE',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                {imgUploading?'جارٍ المعالجة...':(form.image_url?'تغيير الصورة':'اختر صورة')}
                <input type="file" accept="image/*" onChange={handlePickImage} style={{display:'none'}}/>
              </label>
            </div>
          </WhField>
          <div style={{display:'flex',gap: 8,marginTop:8}}>
            <button onClick={()=>setModal(false)} style={{flex:1,padding: '8px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,color:'#8B9AB3',cursor:'pointer',fontWeight:700}}>إلغاء</button>
            <button onClick={save} disabled={saving} style={{flex:2,padding: '8px',background:'linear-gradient(135deg,#2AABEE,#229ED9)',border:'none',borderRadius:9,color:'#fff',fontWeight:800,cursor:'pointer'}}>{saving?'جارٍ الحفظ...':'حفظ'}</button>
          </div>
        </WhModal>
      )}
      {carModal&&(
        <WhModal title="إضافة سيارة جديدة" onClose={()=>setCarModal(false)}>
          <div style={{background:'rgba(42,171,238,0.07)',border:'1px solid rgba(42,171,238,0.18)',borderRadius:9,padding: 12,marginBottom: 12,fontSize:12,color:'#2AABEE'}}>
            سيتم إضافة الأنواع الثلاثة (أم الدوسة، ربل حوضي، جلد) تلقائياً
          </div>
          <WhField label="اسم السيارة" required>
            <input aria-label="مثال: تويوتا كامري 2022" value={carForm.name} onChange={e=>setCarForm({name:e.target.value})} placeholder="مثال: تويوتا كامري 2022" style={whInp}/>
          </WhField>
          <div style={{display:'flex',gap: 8,marginTop:8}}>
            <button onClick={()=>setCarModal(false)} style={{flex:1,padding: '8px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,color:'#8B9AB3',cursor:'pointer',fontWeight:700}}>إلغاء</button>
            <button onClick={addCar} disabled={saving} style={{flex:2,padding: '8px',background:'linear-gradient(135deg,#A78BFA,#7C3AED)',border:'none',borderRadius:9,color:'#fff',fontWeight:800,cursor:'pointer'}}>{saving?'جارٍ الإضافة...':'✨ إضافة للأنواع الثلاثة'}</button>
          </div>
        </WhModal>
      )}
    </div>
  );
}

// المبيعات
function WhSales({ sales, setSales, products, sbI }) {
  const [period,setPeriod]=useState('month');
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({product_id:'',product_name:'',quantity:1,price_iqd:0,total_iqd:0,customer_name:'',date:whToday(),notes:''});
  const [saving,setSaving]=useState(false);
  const now=new Date();
  const filtered=useMemo(()=>sales.filter(s=>{
    const d=new Date(s.date);
    if(period==='today')return s.date===whToday();
    if(period==='week')return(now-d)/86400000<=7;
    if(period==='month')return s.date?.slice(0,7)===whToday().slice(0,7);
    if(period==='year')return s.date?.slice(0,4)===whToday().slice(0,4);
    return true;
  }),[sales,period]);
  const rev=filtered.reduce((s,x)=>s+x.total_iqd,0);
  async function save(){
    if(!form.product_name||!form.price_iqd){alert('أدخل المنتج والسعر');return;}
    setSaving(true);
    try{
      const d={...form,total_iqd:form.price_iqd*form.quantity,created_at:new Date().toISOString()};
      const r=await sbI('wh_sales',d);
      if(r?.[0])setSales(prev=>[r[0],...prev]);
      setModal(false);
    }catch(e){alert('فشل: '+e.message);}
    setSaving(false);
  }
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom: 16}}>
        <h3 style={{margin:0,fontSize:17,fontWeight:800,color:'#F5F5F5'}}>المبيعات</h3>
        <button onClick={()=>setModal(true)} style={{display:'flex',alignItems:'center',gap: 4,padding: '8px 12px',background:'linear-gradient(135deg,#4DDB6B,#22C55E)',border:'none',borderRadius:9,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}><Plus size={13}/> تسجيل بيعة</button>
      </div>
      <div style={{display:'flex',gap: 8,marginBottom: 16,flexWrap:'wrap'}}>
        {[['today','اليوم'],['week','الأسبوع'],['month','الشهر'],['year','السنة'],['all','الكل']].map(([v,l])=>(
          <button key={v} onClick={()=>setPeriod(v)} style={{padding: '8px 12px',borderRadius:18,border:`1px solid ${period===v?'#4DDB6B':'rgba(255,255,255,0.07)'}`,background:period===v?'rgba(77,219,107,0.14)':'transparent',color:period===v?'#4DDB6B':'#8FA0B5',fontSize:12,fontWeight:700,cursor:'pointer'}}>{l}</button>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap: 8,marginBottom: 16}}>
        {[{l:'الإيرادات',v:whFmt(rev),c:'#4DDB6B'},{l:'عدد الصفقات',v:filtered.length,c:'#2AABEE'},{l:'قطع مباعة',v:filtered.reduce((s,x)=>s+x.quantity,0),c:'#A78BFA'}].map(s=>(
          <div key={s.l} style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding: '12px 16px',textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize: 12,color:'#8FA0B5',marginTop: 4}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,overflow:'hidden'}}>
        {filtered.length===0?<div style={{padding:40,textAlign:'center',color:'#8FA0B5'}}>لا توجد مبيعات</div>:
        filtered.map((s,i)=>(
          <div key={s.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding: '12px 16px',borderBottom:i<filtered.length-1?'1px solid rgba(255,255,255,0.06)':'none'}}>
            <div>
              <div style={{fontSize:12.5,fontWeight:700,color:'#F5F5F5'}}>{s.product_name}</div>
              <div style={{fontSize: 12,color:'#8FA0B5',marginTop:2}}>{s.date} · {s.customer_name||'زبون'} · {s.quantity} قطعة</div>
            </div>
            <div style={{fontSize:14,fontWeight:800,color:'#4DDB6B'}}>{whFmt(s.total_iqd)}</div>
          </div>
        ))}
      </div>
      {modal&&(
        <WhModal title="تسجيل بيعة جديدة" onClose={()=>setModal(false)}>
          <WhField label="المنتج" required>
            <select aria-label="خيار" value={form.product_id} onChange={e=>{const p=products.find(x=>x.id===e.target.value);setForm(f=>({...f,product_id:e.target.value,product_name:p?`${p.car_name} — ${WH_PRODUCT_TYPES.find(t=>t.id===p.type)?.label}`:'',price_iqd:p?.price_iqd||0}));}} style={whInp}>
              <option value="">اختر منتج</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.car_name} — {WH_PRODUCT_TYPES.find(t=>t.id===p.type)?.label} ({p.quantity} قطعة)</option>)}
            </select>
          </WhField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap: 12}}>
            <WhField label="الكمية" required><input type="number" min="1" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:Number(e.target.value)||0}))} style={whInp}/></WhField>
            <WhField label="السعر (د.ع)" required><input type="number" value={form.price_iqd} onChange={e=>setForm(f=>({...f,price_iqd:Number(e.target.value)||0}))} style={whInp}/></WhField>
          </div>
          <div style={{background:'rgba(77,219,107,0.07)',border:'1px solid rgba(77,219,107,0.2)',borderRadius:9,padding: '8px 12px',marginBottom:12,fontSize:16,fontWeight:800,color:'#4DDB6B'}}>{whFmt(form.price_iqd*form.quantity)}</div>
          <WhField label="اسم الزبون"><input aria-label="اختياري" value={form.customer_name} onChange={e=>setForm(f=>({...f,customer_name:e.target.value}))} placeholder="اختياري" style={whInp}/></WhField>
          <WhField label="التاريخ"><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={whInp}/></WhField>
          <div style={{display:'flex',gap: 8,marginTop:8}}>
            <button onClick={()=>setModal(false)} style={{flex:1,padding: '8px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,color:'#8B9AB3',cursor:'pointer',fontWeight:700}}>إلغاء</button>
            <button onClick={save} disabled={saving} style={{flex:2,padding: '8px',background:'linear-gradient(135deg,#4DDB6B,#22C55E)',border:'none',borderRadius:9,color:'#fff',fontWeight:800,cursor:'pointer'}}>{saving?'جارٍ الحفظ...':'حفظ البيعة'}</button>
          </div>
        </WhModal>
      )}
    </div>
  );
}

// الموزعون
function WhSuppliers({ suppliers, setSuppliers, sbI, sbU, sbD }) {
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({name:'',phone:'',address:'',available_products:'',notes:''});
  const [saving,setSaving]=useState(false);
  function openNew(){setEditing(null);setForm({name:'',phone:'',address:'',available_products:'',notes:''});setModal(true);}
  function openEdit(s){setEditing(s);setForm({...s});setModal(true);}
  async function save(){
    if(!form.name.trim()){alert('أدخل اسم الموزع');return;}
    setSaving(true);
    try{
      if(editing){await sbU('wh_suppliers',editing.id,form);setSuppliers(prev=>prev.map(s=>s.id===editing.id?{...s,...form}:s));}
      else{const r=await sbI('wh_suppliers',{...form,created_at:new Date().toISOString()});if(r?.[0])setSuppliers(prev=>[r[0],...prev]);}
      setModal(false);
    }catch(e){alert('فشل: '+e.message);}
    setSaving(false);
  }
  async function del(id){if(!confirm('حذف هذا الموزع؟'))return;await sbD('wh_suppliers',id);setSuppliers(prev=>prev.filter(s=>s.id!==id));}
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom: 16}}>
        <h3 style={{margin:0,fontSize:17,fontWeight:800,color:'#F5F5F5'}}>موزعو الجملة</h3>
        <button onClick={openNew} style={{display:'flex',alignItems:'center',gap: 4,padding: '8px 12px',background:'linear-gradient(135deg,#2AABEE,#229ED9)',border:'none',borderRadius:9,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}><Plus size={13}/> موزع جديد</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap: 12}}>
        {suppliers.map(s=>(
          <div key={s.id} style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding: 16,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,right:0,left:0,height:3,background:'linear-gradient(90deg,transparent,#2AABEE,transparent)',opacity:0.7}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom: 8}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:'#F5F5F5'}}>{s.name}</div>
                {s.phone&&<div style={{fontSize:12,color:'#2AABEE',marginTop: 4}}>📞 {s.phone}</div>}
                {s.address&&<div style={{fontSize:12,color:'#8FA0B5',marginTop:2}}>📍 {s.address}</div>}
              </div>
              <div style={{display:'flex',gap: 4}}>
                <button onClick={()=>openEdit(s)} style={{padding: 8,background:'rgba(42,171,238,0.1)',border:'1px solid rgba(42,171,238,0.2)',borderRadius:7,color:'#2AABEE',cursor:'pointer'}}><Edit3 size={12}/></button>
                <button onClick={()=>del(s.id)} style={{padding: 8,background:'rgba(242,80,80,0.08)',border:'1px solid rgba(242,80,80,0.18)',borderRadius:7,color:'#F25050',cursor:'pointer'}}><Trash2 size={12}/></button>
              </div>
            </div>
            {s.available_products&&(
              <div style={{background:'rgba(42,171,238,0.06)',border:'1px solid rgba(42,171,238,0.12)',borderRadius:8,padding: '8px 8px'}}>
                <div style={{fontSize: 12,color:'#2AABEE',fontWeight:700,marginBottom: 4}}>المتوفر عنده:</div>
                <div style={{fontSize:12,color:'#8B9AB3'}}>{s.available_products}</div>
              </div>
            )}
            {s.notes&&<div style={{fontSize:11.5,color:'#8FA0B5',marginTop:8}}>📝 {s.notes}</div>}
          </div>
        ))}
        {!suppliers.length&&<div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,padding:40,textAlign:'center',color:'#8FA0B5'}}>لا يوجد موزعون بعد</div>}
      </div>
      {modal&&(
        <WhModal title={editing?'تعديل موزع':'إضافة موزع جديد'} onClose={()=>setModal(false)}>
          <WhField label="اسم الموزع" required><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={whInp}/></WhField>
          <WhField label="رقم الهاتف"><input aria-label="07XXXXXXXXX" value={form.phone} onChange={e=>setForm(f=>({...f,phone:arabicToEnglishDigits(e.target.value)}))} placeholder="07XXXXXXXXX" style={whInp}/></WhField>
          <WhField label="العنوان"><input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} style={whInp}/></WhField>
          <WhField label="المنتجات المتوفرة عنده"><textarea value={form.available_products} onChange={e=>setForm(f=>({...f,available_products:e.target.value}))} placeholder="كامري 2020 جلد، لاندكروزر ربل..." style={{...whInp,minHeight:65,resize:'vertical'}}/></WhField>
          <WhField label="ملاحظات"><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{...whInp,minHeight:55,resize:'vertical'}}/></WhField>
          <div style={{display:'flex',gap: 8,marginTop:8}}>
            <button onClick={()=>setModal(false)} style={{flex:1,padding: '8px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,color:'#8B9AB3',cursor:'pointer',fontWeight:700}}>إلغاء</button>
            <button onClick={save} disabled={saving} style={{flex:2,padding: '8px',background:'linear-gradient(135deg,#2AABEE,#229ED9)',border:'none',borderRadius:9,color:'#fff',fontWeight:800,cursor:'pointer'}}>{saving?'جارٍ الحفظ...':'حفظ'}</button>
          </div>
        </WhModal>
      )}
    </div>
  );
}

// الديون
function WhDebts({ debts, setDebts, sbI, sbU, sbD }) {
  const [modal,setModal]=useState(false);
  const [filter,setFilter]=useState('unpaid');
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({name:'',type:'supplier',amount_iqd:0,due_date:'',status:'unpaid',notes:''});
  const [saving,setSaving]=useState(false);
  const filtered=filter==='all'?debts:debts.filter(d=>d.status===filter);
  const totalUnpaid=debts.filter(d=>d.status==='unpaid').reduce((s,d)=>s+(d.amount_iqd||0),0);
  function openNew(){setEditing(null);setForm({name:'',type:'supplier',amount_iqd:0,due_date:'',status:'unpaid',notes:''});setModal(true);}
  function openEdit(d){setEditing(d);setForm({...d});setModal(true);}
  async function save(){
    if(!form.name.trim()||!form.amount_iqd){alert('أدخل الاسم والمبلغ');return;}
    setSaving(true);
    try{
      if(editing){await sbU('wh_debts',editing.id,form);setDebts(prev=>prev.map(d=>d.id===editing.id?{...d,...form}:d));}
      else{const r=await sbI('wh_debts',{...form,created_at:new Date().toISOString()});if(r?.[0])setDebts(prev=>[r[0],...prev]);}
      setModal(false);
    }catch(e){alert('فشل: '+e.message);}
    setSaving(false);
  }
  async function markPaid(id){await sbU('wh_debts',id,{status:'paid',paid_at:new Date().toISOString()});setDebts(prev=>prev.map(d=>d.id===id?{...d,status:'paid'}:d));}
  async function del(id){if(!confirm('حذف هذا الدين؟'))return;await sbD('wh_debts',id);setDebts(prev=>prev.filter(d=>d.id!==id));}
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom: 16}}>
        <h3 style={{margin:0,fontSize:17,fontWeight:800,color:'#F5F5F5'}}>الديون والمصاريف</h3>
        <button onClick={openNew} style={{display:'flex',alignItems:'center',gap: 4,padding: '8px 12px',background:'rgba(242,80,80,0.1)',border:'1px solid rgba(242,80,80,0.28)',borderRadius:9,color:'#F25050',fontSize:12,fontWeight:700,cursor:'pointer'}}><Plus size={13}/> إضافة دين</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap: 12,marginBottom: 16}}>
        <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(242,80,80,0.2)',borderRadius:12,padding: '12px 16px'}}>
          <div style={{fontSize:18,fontWeight:800,color:'#F25050'}}>{whFmt(totalUnpaid)}</div>
          <div style={{fontSize: 12,color:'#8FA0B5',marginTop: 4}}>إجمالي الديون غير المسددة</div>
        </div>
        <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding: '12px 16px'}}>
          <div style={{fontSize:18,fontWeight:800,color:'#F0A868'}}>{debts.filter(d=>d.status==='unpaid'&&whDaysUntil(d.due_date)!==null&&whDaysUntil(d.due_date)<=7).length}</div>
          <div style={{fontSize: 12,color:'#8FA0B5',marginTop: 4}}>ديون تستحق خلال 7 أيام</div>
        </div>
      </div>
      <div style={{display:'flex',gap: 8,marginBottom:12}}>
        {[['all','الكل'],['unpaid','غير مسددة'],['paid','مسددة']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding: '8px 12px',borderRadius:18,border:`1px solid ${filter===v?'#F25050':'rgba(255,255,255,0.07)'}`,background:filter===v?'rgba(242,80,80,0.12)':'transparent',color:filter===v?'#F25050':'#8FA0B5',fontSize:12,fontWeight:700,cursor:'pointer'}}>{l}</button>
        ))}
      </div>
      <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,overflow:'hidden'}}>
        {filtered.length===0?<div style={{padding:40,textAlign:'center',color:'#8FA0B5'}}>لا توجد ديون</div>:
        filtered.map((d,i)=>{
          const type=WH_DEBT_TYPES.find(t=>t.id===d.type);
          const days=whDaysUntil(d.due_date);
          const urgent=d.status==='unpaid'&&days!==null&&days<=7;
          return(
            <div key={d.id} style={{display:'flex',alignItems:'center',gap: 12,padding: '12px 16px',borderBottom:i<filtered.length-1?'1px solid rgba(255,255,255,0.06)':'none',background:urgent?'rgba(242,80,80,0.04)':'transparent'}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:d.status==='paid'?'#4DDB6B':type?.color||'#F25050',flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:'#F5F5F5'}}>{d.name}</div>
                <div style={{display:'flex',gap: 8,marginTop: 4,flexWrap:'wrap'}}>
                  <span style={{fontSize: 12,color:type?.color,background:`${type?.color||'#F25050'}15`,padding: '2px 8px',borderRadius:18}}>{type?.label}</span>
                  {d.due_date&&<span style={{fontSize: 12,color:urgent?'#F25050':'#8FA0B5'}}>📅 {d.due_date}{days!==null?` (${days>0?`${days} يوم`:'اليوم'})`:''}</span>}
                  {d.status==='paid'&&<span style={{fontSize: 12,color:'#4DDB6B'}}>✓ مسدد</span>}
                </div>
              </div>
              <div style={{fontSize:14,fontWeight:800,color:d.status==='paid'?'#8FA0B5':'#F25050'}}>{whFmt(d.amount_iqd)}</div>
              <div style={{display:'flex',gap: 4}}>
                {d.status==='unpaid'&&<button onClick={()=>markPaid(d.id)} title="تسديد" style={{padding: 8,background:'rgba(77,219,107,0.1)',border:'1px solid rgba(77,219,107,0.2)',borderRadius:7,color:'#4DDB6B',cursor:'pointer'}}><CheckCircle2 size={12}/></button>}
                <button onClick={()=>openEdit(d)} style={{padding: 8,background:'rgba(42,171,238,0.1)',border:'1px solid rgba(42,171,238,0.2)',borderRadius:7,color:'#2AABEE',cursor:'pointer'}}><Edit3 size={12}/></button>
                <button onClick={()=>del(d.id)} style={{padding: 8,background:'rgba(242,80,80,0.08)',border:'1px solid rgba(242,80,80,0.18)',borderRadius:7,color:'#F25050',cursor:'pointer'}}><Trash2 size={12}/></button>
              </div>
            </div>
          );
        })}
      </div>
      {modal&&(
        <WhModal title={editing?'تعديل دين':'إضافة دين/مصروف'} onClose={()=>setModal(false)}>
          <WhField label="الاسم / الوصف" required><input aria-label="مثال: دين موزع أبو علي" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="مثال: دين موزع أبو علي" style={whInp}/></WhField>
          <WhField label="النوع" required>
            <select aria-label="خيار" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={whInp}>
              {WH_DEBT_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </WhField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap: 12}}>
            <WhField label="المبلغ (د.ع)" required><input type="number" value={form.amount_iqd} onChange={e=>setForm(f=>({...f,amount_iqd:Number(e.target.value)||0}))} style={whInp}/></WhField>
            <WhField label="تاريخ الاستحقاق"><input type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} style={whInp}/></WhField>
          </div>
          <WhField label="الحالة">
            <select aria-label="خيار" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={whInp}>
              <option value="unpaid">غير مسدد</option>
              <option value="paid">مسدد</option>
            </select>
          </WhField>
          <WhField label="ملاحظات"><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{...whInp,minHeight:55,resize:'vertical'}}/></WhField>
          <div style={{display:'flex',gap: 8,marginTop:8}}>
            <button onClick={()=>setModal(false)} style={{flex:1,padding: '8px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,color:'#8B9AB3',cursor:'pointer',fontWeight:700}}>إلغاء</button>
            <button onClick={save} disabled={saving} style={{flex:2,padding: '8px',background:'rgba(242,80,80,0.15)',border:'1px solid rgba(242,80,80,0.3)',borderRadius:9,color:'#F25050',fontWeight:800,cursor:'pointer'}}>{saving?'جارٍ الحفظ...':'حفظ'}</button>
          </div>
        </WhModal>
      )}
    </div>
  );
}

// الموظفون
function WhEmployees({ employees, setEmployees, sbI, sbU, sbD }) {
  const [modal,setModal]=useState(false);
  const [payModal,setPayModal]=useState(null);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({name:'',role:'',salary:0,phone:'',start_date:whToday(),notes:''});
  const [payForm,setPayForm]=useState({amount:0,date:whToday(),notes:''});
  const [saving,setSaving]=useState(false);
  function openNew(){setEditing(null);setForm({name:'',role:'',salary:0,phone:'',start_date:whToday(),notes:''});setModal(true);}
  function openEdit(e){setEditing(e);setForm({...e});setModal(true);}
  async function save(){
    if(!form.name.trim()){alert('أدخل اسم الموظف');return;}
    setSaving(true);
    try{
      if(editing){await sbU('wh_employees',editing.id,form);setEmployees(prev=>prev.map(e=>e.id===editing.id?{...e,...form}:e));}
      else{const r=await sbI('wh_employees',{...form,created_at:new Date().toISOString()});if(r?.[0])setEmployees(prev=>[...prev,r[0]]);}
      setModal(false);
    }catch(e){alert('فشل: '+e.message);}
    setSaving(false);
  }
  async function payEmployee(){
    if(!payForm.amount){alert('أدخل المبلغ');return;}
    setSaving(true);
    try{
      await sbI('wh_salary_payments',{employee_id:payModal.id,employee_name:payModal.name,...payForm,created_at:new Date().toISOString()});
      setPayModal(null);
      alert(`✅ تم تسجيل صرف ${whFmt(payForm.amount)} لـ ${payModal.name}`);
    }catch(e){alert('فشل: '+e.message);}
    setSaving(false);
  }
  async function del(id){if(!confirm('حذف هذا الموظف؟'))return;await sbD('wh_employees',id);setEmployees(prev=>prev.filter(e=>e.id!==id));}
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom: 16}}>
        <h3 style={{margin:0,fontSize:17,fontWeight:800,color:'#F5F5F5'}}>الموظفون والرواتب</h3>
        <button onClick={openNew} style={{display:'flex',alignItems:'center',gap: 4,padding: '8px 12px',background:'linear-gradient(135deg,#A78BFA,#7C3AED)',border:'none',borderRadius:9,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}><Plus size={13}/> موظف جديد</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap: 12}}>
        {employees.map(e=>(
          <div key={e.id} style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding: 16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom: 12}}>
              <div style={{display:'flex',gap: 8,alignItems:'center'}}>
                <div style={{width:42,height:42,borderRadius:'50%',background:'linear-gradient(135deg,#A78BFA,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:'#fff'}}>{e.name?.[0]}</div>
                <div><div style={{fontSize:13.5,fontWeight:800,color:'#F5F5F5'}}>{e.name}</div><div style={{fontSize:11.5,color:'#8FA0B5'}}>{e.role||'موظف'}</div></div>
              </div>
              <div style={{display:'flex',gap: 4}}>
                <button onClick={()=>openEdit(e)} style={{padding: 8,background:'rgba(42,171,238,0.1)',border:'1px solid rgba(42,171,238,0.2)',borderRadius:7,color:'#2AABEE',cursor:'pointer'}}><Edit3 size={12}/></button>
                <button onClick={()=>del(e.id)} style={{padding: 8,background:'rgba(242,80,80,0.08)',border:'1px solid rgba(242,80,80,0.18)',borderRadius:7,color:'#F25050',cursor:'pointer'}}><Trash2 size={12}/></button>
              </div>
            </div>
            <div style={{background:'rgba(167,139,250,0.08)',border:'1px solid rgba(167,139,250,0.15)',borderRadius:9,padding: '8px 12px',marginBottom: 8}}>
              <div style={{fontSize: 12,color:'#A78BFA',marginBottom:2}}>الراتب الشهري</div>
              <div style={{fontSize:17,fontWeight:800,color:'#A78BFA'}}>{whFmt(e.salary)}</div>
            </div>
            {e.phone&&<div style={{fontSize:12,color:'#2AABEE',marginBottom:8}}>📞 {e.phone}</div>}
            <button onClick={()=>{setPayModal(e);setPayForm({amount:e.salary,date:whToday(),notes:''}); }}
              style={{width:'100%',padding: '8px',background:'rgba(77,219,107,0.08)',border:'1px solid rgba(77,219,107,0.2)',borderRadius:9,color:'#4DDB6B',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap: 8}}>
              <DollarSign size={13}/> صرف راتب
            </button>
          </div>
        ))}
        {!employees.length&&<div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,padding:40,textAlign:'center',color:'#8FA0B5'}}>لا يوجد موظفون</div>}
      </div>
      {modal&&(
        <WhModal title={editing?'تعديل موظف':'إضافة موظف'} onClose={()=>setModal(false)}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap: 12}}>
            <WhField label="الاسم" required><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={whInp}/></WhField>
            <WhField label="المسمى الوظيفي"><input aria-label="موظف، محاسب" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} placeholder="موظف، محاسب..." style={whInp}/></WhField>
            <WhField label="الراتب (د.ع)" required><input type="number" value={form.salary} onChange={e=>setForm(f=>({...f,salary:Number(e.target.value)||0}))} style={whInp}/></WhField>
            <WhField label="رقم الهاتف"><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:arabicToEnglishDigits(e.target.value)}))} style={whInp}/></WhField>
          </div>
          <div style={{display:'flex',gap: 8,marginTop:8}}>
            <button onClick={()=>setModal(false)} style={{flex:1,padding: '8px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,color:'#8B9AB3',cursor:'pointer',fontWeight:700}}>إلغاء</button>
            <button onClick={save} disabled={saving} style={{flex:2,padding: '8px',background:'linear-gradient(135deg,#A78BFA,#7C3AED)',border:'none',borderRadius:9,color:'#fff',fontWeight:800,cursor:'pointer'}}>{saving?'جارٍ الحفظ...':'حفظ'}</button>
          </div>
        </WhModal>
      )}
      {payModal&&(
        <WhModal title={`صرف راتب — ${payModal.name}`} onClose={()=>setPayModal(null)}>
          <WhField label="المبلغ (د.ع)" required><input type="number" value={payForm.amount} onChange={e=>setPayForm(f=>({...f,amount:Number(e.target.value)||0}))} style={whInp}/></WhField>
          <WhField label="التاريخ"><input type="date" value={payForm.date} onChange={e=>setPayForm(f=>({...f,date:e.target.value}))} style={whInp}/></WhField>
          <WhField label="ملاحظات"><input aria-label="راتب شهر" value={payForm.notes} onChange={e=>setPayForm(f=>({...f,notes:e.target.value}))} placeholder="راتب شهر..." style={whInp}/></WhField>
          <div style={{display:'flex',gap: 8,marginTop:8}}>
            <button onClick={()=>setPayModal(null)} style={{flex:1,padding: '8px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,color:'#8B9AB3',cursor:'pointer',fontWeight:700}}>إلغاء</button>
            <button onClick={payEmployee} disabled={saving} style={{flex:2,padding: '8px',background:'linear-gradient(135deg,#4DDB6B,#22C55E)',border:'none',borderRadius:9,color:'#fff',fontWeight:800,cursor:'pointer'}}>{saving?'جارٍ الحفظ...':'صرف الراتب'}</button>
          </div>
        </WhModal>
      )}
    </div>
  );
}

// التقارير
function WhReports({ sales, products, debts }) {
  const [period,setPeriod]=useState('month');
  const now=new Date();
  const filtered=useMemo(()=>sales.filter(s=>{
    const d=new Date(s.date);
    if(period==='today')return s.date===whToday();
    if(period==='week')return(now-d)/86400000<=7;
    if(period==='month')return s.date?.slice(0,7)===whToday().slice(0,7);
    if(period==='year')return s.date?.slice(0,4)===whToday().slice(0,4);
    return true;
  }),[sales,period]);
  const rev=filtered.reduce((s,x)=>s+x.total_iqd,0);
  const totalDebt=debts.filter(d=>d.status==='unpaid').reduce((s,d)=>s+(d.amount_iqd||0),0);
  const stockCost=products.reduce((s,p)=>s+(p.quantity*(p.cost_iqd||0)),0);
  const stockSale=products.reduce((s,p)=>s+(p.quantity*(p.price_iqd||0)),0);
  const byType=WH_PRODUCT_TYPES.map(t=>({
    ...t,
    total:filtered.filter(s=>products.find(p=>p.id===s.product_id)?.type===t.id).reduce((sum,s)=>sum+s.total_iqd,0),
    count:filtered.filter(s=>products.find(p=>p.id===s.product_id)?.type===t.id).length,
  }));
  const counted={};
  filtered.forEach(s=>{counted[s.product_name]=(counted[s.product_name]||0)+s.quantity;});
  const top=Object.entries(counted).sort((a,b)=>b[1]-a[1]).slice(0,5);
  return(
    <div>
      <h3 style={{margin: '0 0 16px',fontSize:17,fontWeight:800,color:'#F5F5F5'}}>التقارير المالية</h3>
      <div style={{display:'flex',gap: 8,marginBottom:16,flexWrap:'wrap'}}>
        {[['today','اليوم'],['week','الأسبوع'],['month','الشهر'],['year','السنة'],['all','الكل']].map(([v,l])=>(
          <button key={v} onClick={()=>setPeriod(v)} style={{padding: '8px 12px',borderRadius:18,border:`1px solid ${period===v?'#2AABEE':'rgba(255,255,255,0.07)'}`,background:period===v?'rgba(42,171,238,0.14)':'transparent',color:period===v?'#2AABEE':'#8FA0B5',fontSize:12,fontWeight:700,cursor:'pointer'}}>{l}</button>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))',gap: 12,marginBottom:16}}>
        {[
          {l:'الإيرادات',v:whFmt(rev),c:'#4DDB6B',I:TrendingUp},
          {l:'إجمالي الديون',v:whFmt(totalDebt),c:'#F25050',I:CreditCard},
          {l:'تكلفة المخزن',v:whFmt(stockCost),c:'#F0A868',I:Package},
          {l:'قيمة البيع المتوقعة',v:whFmt(stockSale),c:'#A78BFA',I:BarChart3},
          {l:'الربح المتوقع',v:whFmt(stockSale-stockCost),c:stockSale>stockCost?'#4DDB6B':'#F25050',I:Percent},
        ].map(s=>(
          <div key={s.l} style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding: '12px 16px'}}>
            <s.I size={16} color={s.c} style={{marginBottom: 8}}/>
            <div style={{fontSize:16,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize: 12,color:'#8FA0B5',marginTop: 4}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap: 12}}>
        <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,padding: 16}}>
          <div style={{fontSize:13,fontWeight:800,color:'#F5F5F5',marginBottom: 12}}>مبيعات حسب النوع</div>
          {byType.map(t=>(
            <div key={t.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding: '8px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <div style={{display:'flex',alignItems:'center',gap: 8}}>
                <span style={{fontSize:16}}>{t.icon}</span>
                <div><div style={{fontSize:12.5,fontWeight:700,color:'#F5F5F5'}}>{t.label}</div><div style={{fontSize: 12,color:'#8FA0B5'}}>{t.count} صفقة</div></div>
              </div>
              <div style={{fontSize:13,fontWeight:800,color:t.color}}>{whFmt(t.total)}</div>
            </div>
          ))}
        </div>
        <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,padding: 16}}>
          <div style={{fontSize:13,fontWeight:800,color:'#F5F5F5',marginBottom: 12}}>الأكثر مبيعاً</div>
          {top.map(([name,qty])=>(
            <div key={name} style={{display:'flex',justifyContent:'space-between',padding: '8px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <span style={{fontSize:12.5,color:'#F5F5F5'}}>{name}</span>
              <span style={{fontSize:12.5,fontWeight:700,color:'#4DDB6B'}}>{qty} قطعة</span>
            </div>
          ))}
          {!top.length&&<div style={{color:'#8FA0B5',fontSize:13,textAlign:'center',padding:20}}>لا توجد بيانات</div>}
        </div>
      </div>
    </div>
  );
}

// ── WarehouseView الرئيسي ──
const WH_NAV = [
  {id:'dashboard', label:'لوحة التحكم', icon:Home},
  {id:'products',  label:'المنتجات',    icon:Package},
  {id:'sales',     label:'المبيعات',    icon:ShoppingCart},
  {id:'suppliers', label:'الموزعون',    icon:Truck},
  {id:'debts',     label:'الديون',      icon:CreditCard},
  {id:'employees', label:'الموظفون',    icon:Users},
  {id:'reports',   label:'التقارير',    icon:BarChart3},
];

function WarehouseView() {
  const [whView, setWhView]     = useState('dashboard');
  const [loading, setLoading]   = useState(true);
  const [whProducts,  setWhProducts]  = useState([]);
  const [whSales,     setWhSales]     = useState([]);
  const [whSuppliers, setWhSuppliers] = useState([]);
  const [whDebts,     setWhDebts]     = useState([]);
  const [whEmployees, setWhEmployees] = useState([]);
  const [whCars,      setWhCars]      = useState([]);

  // helpers مختصرة
  const sbI = (t,d)    => sbInsert(t,d);
  const sbU = (t,id,d) => sbUpdate(t,id,d);
  const sbD = async (t,id) => { return await sbDelete(t,id); };

  useEffect(()=>{
    async function load(){
      setLoading(true);
      try{
        const [p,s,sup,d,e]=await Promise.all([
          sbSelect('wh_products', wsFilter() + '&order=car_name.asc'),
          sbSelect('wh_sales','&order=date.desc&limit=300'),
          sbSelect('wh_suppliers','&order=name.asc'),
          sbSelect('wh_debts','&order=due_date.asc'),
          sbSelect('wh_employees','&order=name.asc'),
        ]);
        setWhProducts(p||[]);
        setWhSales(s||[]);
        setWhSuppliers(sup||[]);
        setWhDebts(d||[]);
        setWhEmployees(e||[]);
        setWhCars([...new Set((p||[]).map(x=>x.car_name).filter(Boolean))]);
      }catch(err){console.error('WH load error:',err);}
      setLoading(false);
    }
    load();
  },[]);

  const lowCount  = whProducts.filter(p=>p.quantity<=LOW_STOCK).length;
  const urgentDbt = whDebts.filter(d=>d.status==='unpaid'&&whDaysUntil(d.due_date)!==null&&whDaysUntil(d.due_date)<=7).length;

  function renderWhView(){
    if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,color:'#8FA0B5',flexDirection:'column',gap:12}}><RefreshCw size={24} style={{animation:'spin 1s linear infinite'}}/><span>جارٍ تحميل المخزن...</span></div>;
    switch(whView){
      case 'dashboard':  return <WhDashboard products={whProducts} sales={whSales} debts={whDebts} suppliers={whSuppliers}/>;
      case 'products':   return <WhProducts products={whProducts} setProducts={setWhProducts} cars={whCars} setCars={setWhCars} sbI={sbI} sbU={sbU} sbD={sbD}/>;
      case 'sales':      return <WhSales sales={whSales} setSales={setWhSales} products={whProducts} sbI={sbI}/>;
      case 'suppliers':  return <WhSuppliers suppliers={whSuppliers} setSuppliers={setWhSuppliers} sbI={sbI} sbU={sbU} sbD={sbD}/>;
      case 'debts':      return <WhDebts debts={whDebts} setDebts={setWhDebts} sbI={sbI} sbU={sbU} sbD={sbD}/>;
      case 'employees':  return <WhEmployees employees={whEmployees} setEmployees={setWhEmployees} sbI={sbI} sbU={sbU} sbD={sbD}/>;
      case 'reports':    return <WhReports sales={whSales} products={whProducts} debts={whDebts}/>;
      default: return null;
    }
  }

  const isMobile = useIsMobile();

  return (
    <div style={{display:'flex',flexDirection:isMobile?'column':'row',height:'100%',direction:'rtl'}}>

      {/* ── على الموبايل: تابات أفقية في الأعلى ── */}
      {isMobile ? (
        <div style={{display:'flex',overflowX:'auto',background:'#17212B',borderBottom:'1px solid rgba(255,255,255,0.07)',padding: '8px 8px',gap: 8,flexShrink:0,WebkitOverflowScrolling:'touch'}}>
          {WH_NAV.map(item=>{
            const Icon=item.icon;
            const active=whView===item.id;
            return(
              <button key={item.id} onClick={()=>setWhView(item.id)}
                style={{display:'flex',flexDirection:'column',alignItems:'center',gap: 4,padding: '8px 12px',borderRadius:10,background:active?'rgba(42,171,238,0.18)':'rgba(255,255,255,0.04)',border:`1px solid ${active?'rgba(42,171,238,0.35)':'transparent'}`,color:active?'#2AABEE':'#8B9AB3',fontSize: 12,fontWeight:active?800:600,cursor:'pointer',flexShrink:0,transition:'all 0.15s',minWidth:56}}>
                <Icon size={18} strokeWidth={active?2.5:1.8}/>
                {item.label}
              </button>
            );
          })}
        </div>
      ) : (
        /* ── على اللابتوب: قائمة جانبية ── */
        <div style={{width:200,flexShrink:0,background:'linear-gradient(180deg,#17212B,#141F2B)',borderLeft:'1px solid rgba(255,255,255,0.07)',display:'flex',flexDirection:'column',padding: '16px 8px',gap:4,overflowY:'auto'}}>
          <div style={{fontSize:13,fontWeight:800,color:'#8B9AB3',padding: '0 8px 8px',borderBottom:'1px solid rgba(255,255,255,0.07)',marginBottom: 8}}>
            🏪 إدارة المخزن
          </div>
          {(lowCount>0||urgentDbt>0)&&(
            <div style={{background:'rgba(242,80,80,0.08)',border:'1px solid rgba(242,80,80,0.2)',borderRadius:9,padding: '8px 8px',marginBottom:8,fontSize: 12}}>
              {lowCount>0&&<div style={{color:'#F0A868',marginBottom:2}}>⚠️ {lowCount} منتج منخفض</div>}
              {urgentDbt>0&&<div style={{color:'#F25050'}}>🔴 {urgentDbt} دين عاجل</div>}
            </div>
          )}
          {WH_NAV.map(item=>{
            const Icon=item.icon;
            const active=whView===item.id;
            return(
              <button key={item.id} onClick={()=>setWhView(item.id)}
                style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding: '8px 8px',borderRadius:9,background:active?'rgba(42,171,238,0.15)':'transparent',border:active?'1px solid rgba(42,171,238,0.25)':'1px solid transparent',color:active?'#2AABEE':'#8B9AB3',fontSize:12.5,fontWeight:active?800:600,cursor:'pointer',transition:'all 0.15s'}}>
                <Icon size={16} strokeWidth={active?2.5:1.8}/>
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* المحتوى */}
      <div style={{flex:1,overflowY:'auto',padding:isMobile?'14px 12px':'18px 20px'}}>
        {renderWhView()}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// أنماط عامة + خطوط
// ──────────────────────────────────────────────
// ──────────────────────────────────────────────
// أنماط عامة — Telegram Style
// ──────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap');

      /* ── نعومة عالمية — Telegram Level ── */
      *, *::before, *::after {
        box-sizing: border-box;
        font-family: 'Cairo', sans-serif;
        -webkit-tap-highlight-color: transparent;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }

      /* وضوح أعلى للنصوص الصغيرة على الشاشات عالية الكثافة */
      body { letter-spacing: -0.01em; font-weight: 500; }
      /* حد أدنى لحجم النص لضمان القراءة على الموبايل */
      input, textarea, select, button { font-size: max(1em, 14px); }

      /* تسريع GPU لكل العناصر */
      html { scroll-behavior: smooth; }
      body {
        margin: 0;
        background: var(--tg-bg);
        color: var(--tg-text);
        overscroll-behavior: none;
        -webkit-overflow-scrolling: touch;
      }

      :root {
        --tg-bg:      #0E1621;
        --tg-panel:   #17212B;
        --tg-input:   #242F3D;
        --tg-border:  rgba(255,255,255,0.07);
        --tg-blue:    #2AABEE;
        --tg-blue2:   #229ED9;
        --tg-green:   #4DDB6B;
        --tg-red:     #F25050;
        --tg-text:    #F5F5F5;
        --tg-sub:     #8B9AB3;
        --tg-dim:     #8FA0B5;
        --tg-hover:   rgba(255,255,255,0.05);
        --tg-active:  rgba(42,171,238,0.15);
        /* Telegram easing curves */
        --ease-tg:       cubic-bezier(0.4, 0.0, 0.2, 1);
        --ease-tg-out:   cubic-bezier(0.0, 0.0, 0.2, 1);
        --ease-tg-in:    cubic-bezier(0.4, 0.0, 1.0, 1);
        --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);
        --ease-bounce:   cubic-bezier(0.22, 1, 0.36, 1);
        --ease-game:     cubic-bezier(0.34, 1.4, 0.4, 1);
      }

      /* ══════════ طبقة التفاعلات الفاخرة ══════════ */

      /* كل الأزرار: ردّ فعل لمس فوري + نعومة */
      button {
        transition: transform 0.14s var(--ease-game), box-shadow 0.2s ease, background 0.2s ease, opacity 0.15s ease;
        will-change: transform;
      }
      button:active:not(:disabled) { transform: scale(0.94); }
      button:hover:not(:disabled) { filter: brightness(1.08); }

      /* كروت الطلبات: ارتفاع وتوهج عند اللمس */
      .alfhd-order-card {
        transition: transform 0.28s var(--ease-game), box-shadow 0.3s ease, border-color 0.3s ease;
        will-change: transform;
        transform: translateZ(0);
      }
      .alfhd-order-card:hover {
        transform: translateY(-3px) scale(1.006);
        box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(42,171,238,0.15);
      }
      .alfhd-order-card:active { transform: translateY(-1px) scale(0.997); }

      /* دخول العناصر بتدرّج راقٍ (stagger) */
      /* ── حلقات التركيز (قاعدة وصول حرجة) ──
         ممنوع إزالة outline بلا بديل. نستخدم :focus-visible حتى ما تظهر
         عند الضغط بالماوس، بس تظهر للتنقل بالكيبورد. */
      button:focus-visible,
      a:focus-visible,
      input:focus-visible,
      select:focus-visible,
      textarea:focus-visible,
      [tabindex]:focus-visible {
        outline: 2px solid #2AABEE !important;
        outline-offset: 2px !important;
        border-radius: inherit;
      }
      /* الحقول: إطار واضح عند التركيز */
      input:focus, textarea:focus, select:focus {
        border-color: #2AABEE !important;
      }

      @keyframes alfhdSlideIn {
        from { transform: translateX(100%); opacity: .4; }
        to   { transform: translateX(0); opacity: 1; }
      }
      /* دخول الرسائل بنعومة (روح المحادثات الحيّة) */
      @keyframes msgPop {
        0%   { opacity: 0; transform: translateY(8px) scale(0.96); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      .alfhd-msg-row { animation: msgPop 0.28s cubic-bezier(0.22,1,0.36,1) both; }
      /* الصور تظهر بتلاشٍ ناعم بدل القفز */
      .alfhd-msg-row img { transition: opacity 0.3s ease; }
      /* ضغط أي زر يعطي إحساس لمسي */
      button:active { transform: scale(0.96); }
      button { transition: transform 0.12s cubic-bezier(0.22,1,0.36,1), background 0.15s ease, opacity 0.15s ease; }
      @keyframes premiumRise {
        0%   { opacity: 0; transform: translateY(14px) scale(0.98); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      .alfhd-order-card.alfhd-card-enter {
        animation: premiumRise 0.45s var(--ease-game) both;
      }

      /* توهّج نبضي للعناصر المهمة */
      @keyframes softGlow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(42,171,238,0.0); }
        50%      { box-shadow: 0 0 18px 2px rgba(42,171,238,0.25); }
      }

      /* تأثير موجة (ripple) عند الضغط على العناصر التفاعلية */
      .alfhd-ripple { position: relative; overflow: hidden; }
      .alfhd-ripple::after {
        content: ''; position: absolute; inset: 0;
        background: radial-gradient(circle at center, rgba(255,255,255,0.35) 0%, transparent 60%);
        opacity: 0; transform: scale(0.3); transition: opacity 0.28s ease, transform 0.28s ease;
        pointer-events: none;
      }
      .alfhd-ripple:active::after { opacity: 1; transform: scale(2.2); transition: 0s; }

      /* انتقال ناعم بين الأقسام */
      @keyframes sectionFade {
        0%   { opacity: 0; transform: translateX(12px); }
        100% { opacity: 1; transform: translateX(0); }
      }
      .alfhd-section-enter { animation: sectionFade 0.35s var(--ease-tg-out) both; }
      /* مهم: الـ transform (حتى الصفري) يكسر position:fixed للعناصر الداخلية.
         على الموبايل نستخدم تلاشي بلا حركة حتى تشتغل شاشة المحادثة الكاملة صح. */
      @keyframes alfhdFadeOnly { from { opacity: 0; } to { opacity: 1; } }
      @media (max-width: 860px) {
        .alfhd-section-enter {
          animation: alfhdFadeOnly 0.25s ease both !important;
          transform: none !important;
        }
      }
      /* مهم جداً: غلاف الأقسام لازم يمرّر الفلكس لأولاده،
         وإلا ينكسر التمرير الداخلي (المحتوى يفيض بلا شريط تمرير). */
      .alfhd-main-conv > .alfhd-section-enter {
        display: flex !important;
        flex-direction: column !important;
        flex: 1 1 0% !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }
      .alfhd-main-conv > .alfhd-section-enter > * {
        flex: 1 1 0% !important;
        min-height: 0 !important;
      }
      /* لوحة المحادثات وقائمتها: كل مستوى يمرّر القيد للي تحته */
      .alfhd-conv-fullscreen { display: flex !important; flex-direction: column !important; min-height: 0 !important; overflow: hidden !important; }
      .alfhd-conv-list { flex: 1 1 0% !important; min-height: 0 !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; }

      /* شارات وأرقام: نبض خفيف عند التحديث */
      @keyframes countPop {
        0% { transform: scale(1); }
        40% { transform: scale(1.25); }
        100% { transform: scale(1); }
      }
      .alfhd-count-pop { animation: countPop 0.4s var(--ease-spring); }

      /* تبويبات: خط سفلي متحرك */
      .alfhd-tab { transition: color 0.2s ease, background 0.25s var(--ease-game); }
      .alfhd-tab:active { transform: scale(0.96); }

      /* أيقونات تتوهج عند التمرير */
      .alfhd-icon-btn { transition: transform 0.2s var(--ease-spring), color 0.2s ease; }
      .alfhd-icon-btn:hover { transform: scale(1.15) rotate(-4deg); }
      .alfhd-icon-btn:active { transform: scale(0.9); }

      /* بطاقات الإحصائيات — تفاعل راقٍ */
      .alfhd-stat-card {
        transition: transform 0.28s var(--ease-game), box-shadow 0.3s ease;
        will-change: transform;
      }
      .alfhd-stat-card:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 14px 34px rgba(0,0,0,0.35);
      }

      /* احترام تفضيل تقليل الحركة (للوصولية والأداء) */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.05ms !important; }
      }

      input::placeholder, textarea::placeholder { color: var(--tg-dim); }
      input:focus, select:focus, textarea:focus { outline: none; }
      input:focus-visible, select:focus-visible, textarea:focus-visible, button:focus-visible {
        outline: 2px solid rgba(42,171,238,0.5); outline-offset: 1px;
      }

      /* سكرولبار ناعم */
      ::-webkit-scrollbar { width: 3px; height: 3px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb {
        background: rgba(42,171,238,0.18);
        border-radius: 10px;
        transition: background 0.2s ease;
      }
      ::-webkit-scrollbar-thumb:hover { background: rgba(42,171,238,0.4); }
      select, input, textarea { color-scheme: dark; }

      /* ── أزرار — نفس Telegram ── */
      button {
        font-family: 'Cairo', sans-serif;
        cursor: pointer;
        transition:
          background 0.18s var(--ease-tg),
          color 0.18s var(--ease-tg),
          opacity 0.15s var(--ease-tg),
          transform 0.12s var(--ease-spring),
          box-shadow 0.18s var(--ease-tg),
          border-color 0.18s var(--ease-tg);
        will-change: transform;
      }
      button:hover { filter: brightness(1.06); }
      button:active {
        transform: scale(0.94) !important;
        transition-duration: 0.08s !important;
      }
      button:disabled {
        opacity: 0.42;
        cursor: default;
        transform: none !important;
        filter: none !important;
      }

      /* ── Nav items ── */
      .alfhd-app-wrap { background: var(--tg-bg) !important; }
      .alfhd-app-wrap > aside {
        width: 260px !important;
        background: linear-gradient(180deg, var(--tg-panel) 0%, #141F2B 100%) !important;
        border-left: 1px solid rgba(255,255,255,0.07) !important;
        backdrop-filter: none !important;
        box-shadow: 2px 0 16px rgba(0,0,0,0.4) !important;
      }
      .alfhd-main-area { padding: 0 !important; background: var(--tg-bg) !important; }
      .alfhd-nav-item {
        border-radius: 10px !important;
        font-weight: 700 !important;
        transition: background 0.16s var(--ease-tg), color 0.16s var(--ease-tg) !important;
      }
      .alfhd-nav-item:hover { background: var(--tg-hover) !important; }
      .alfhd-bottom-nav-item-active,
      .alfhd-nav-item.alfhd-bottom-nav-item-active {
        color: #2AABEE !important;
        background: var(--tg-active) !important;
        color: var(--tg-blue) !important;
        border-color: rgba(42,171,238,0.22) !important;
        box-shadow: none !important;
      }

      /* ── قائمة المحادثات ── */
      .alfhd-conv-layout {
        grid-template-columns: 320px minmax(0,1fr) !important;
        gap: 0 !important;
        min-height: 100vh !important;
      }
      .alfhd-conv-list {
        background: var(--tg-panel) !important;
        border: none !important;
        border-radius: 0 !important;
        border-left: 1px solid var(--tg-border) !important;
        padding: 8px 0 !important;
        gap: 0 !important;
        max-height: 100vh !important;
        box-shadow: none !important;
        scroll-behavior: smooth !important;
      }

      /* ── عنصر محادثة — ripple + hover ناعم ── */
      .alfhd-conv-item {
        border-radius: 0 !important;
        border: none !important;
        border-right: 3px solid transparent !important;
        padding: 10px 14px !important;
        margin: 0 !important;
        transition:
          background 0.15s var(--ease-tg),
          border-color 0.15s var(--ease-tg) !important;
        position: relative !important;
        overflow: hidden !important;
      }
      .alfhd-conv-item::after {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(42,171,238,0.07);
        opacity: 0;
        transition: opacity 0.15s var(--ease-tg);
        pointer-events: none;
      }
      .alfhd-conv-item:hover::after { opacity: 1; }
      .alfhd-conv-item:active::after { opacity: 0; }

      /* ── فقاعات الرسائل ── */
      .alfhd-chat-bubble-row {
        animation: msgSlideIn 0.34s cubic-bezier(0.34, 1.4, 0.5, 1) both;
        will-change: transform, opacity;
        transform: translateZ(0);
        backface-visibility: hidden;
      }
      .alfhd-conv-detail {
        background: var(--tg-bg) !important;
        border: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        min-height: 100vh !important;
        box-shadow: none !important;
      }
      .alfhd-chat-detail-header {
        background: var(--tg-panel) !important;
        border-bottom: 1px solid var(--tg-border) !important;
        padding: 12px 16px !important;
        transition: background 0.2s var(--ease-tg) !important;
      }
      .alfhd-chat-scroll {
        background: var(--tg-bg) !important;
        border: none !important;
        border-radius: 0 !important;
        padding: 14px 16px !important;
        -webkit-overflow-scrolling: touch !important;
        scroll-behavior: smooth !important;
        overscroll-behavior: contain !important;
      }
      .alfhd-composer-bar {
        background: var(--tg-panel) !important;
        border: none !important;
        border-top: 1px solid var(--tg-border) !important;
        border-radius: 0 !important;
        padding: 10px 14px !important;
        box-shadow: none !important;
        transition: background 0.2s var(--ease-tg) !important;
      }
      .alfhd-linked-order {
        border-radius: 10px !important;
        background: var(--tg-input) !important;
        border-color: var(--tg-border) !important;
        animation: slideDown 0.22s var(--ease-bounce) both !important;
      }

      /* ── كروت الطلبات ── */
      .alfhd-order-card {
        background: linear-gradient(145deg, var(--tg-panel), #1A2736) !important;
        border: 1px solid rgba(255,255,255,0.09) !important;
        border-radius: 14px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3) !important;
        transition:
          transform 0.22s var(--ease-spring),
          box-shadow 0.22s var(--ease-tg),
          border-color 0.22s var(--ease-tg),
          background 0.18s var(--ease-tg) !important;
        will-change: transform !important;
      }
      .alfhd-order-card:hover {
        background: linear-gradient(145deg, #1e2d3d, #1F3347) !important;
        border-color: rgba(42,171,238,0.25) !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 2px 8px rgba(42,171,238,0.12) !important;
      }
      .alfhd-order-card:active {
        transform: translateY(0px) scale(0.99) !important;
        transition-duration: 0.1s !important;
      }

      /* ── موديلات ── */
      .alfhd-modal {
        background: linear-gradient(145deg, var(--tg-panel), #1A2736) !important;
        border: 1px solid rgba(255,255,255,0.10) !important;
        border-radius: 16px !important;
        box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.4) !important;
        animation: modalSlideUp 0.28s var(--ease-bounce) both !important;
        will-change: transform, opacity !important;
      }

      /* ── كروت المستخدمين والصفحات ── */
      .alfhd-users-grid > *, .alfhd-pages-grid > * {
        background: linear-gradient(145deg, var(--tg-panel), #1A2736) !important;
        border: 1px solid rgba(255,255,255,0.09) !important;
        border-radius: 14px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5) !important;
        backdrop-filter: none !important;
        transition:
          transform 0.22s var(--ease-spring),
          box-shadow 0.22s var(--ease-tg),
          border-color 0.22s var(--ease-tg) !important;
        will-change: transform !important;
      }
      .alfhd-stats-row > *:hover,
      .alfhd-stats-grid-2 > *:hover,
      .alfhd-pages-grid > *:hover,
      .alfhd-users-grid > *:hover {
        transform: translateY(-3px) !important;
        border-color: rgba(42,171,238,0.25) !important;
        box-shadow: 0 10px 28px rgba(0,0,0,0.6), 0 3px 10px rgba(42,171,238,0.13) !important;
      }

      /* ── تبويبات ── */
      .alfhd-view-header { padding: 14px 18px 10px !important; margin-bottom: 12px !important; }
      .alfhd-bottom-nav-item svg, .alfhd-nav-item svg {
        transition: transform 0.2s var(--ease-spring) !important;
      }
      .alfhd-bottom-nav-item-active svg {
        transform: scale(1.12) !important;
      }

      /* ── Bottom nav ── */
      .alfhd-bottom-nav-item {
        transition:
          color 0.18s var(--ease-tg),
          background 0.18s var(--ease-tg) !important;
      }
      .alfhd-bottom-nav-item:active {
        transform: scale(0.88) !important;
        transition-duration: 0.08s !important;
      }

      /* ── Login card ── */
      .alfhd-login-card {
        background: linear-gradient(145deg, var(--tg-panel), #1A2736) !important;
        border: 1px solid rgba(42,171,238,0.15) !important;
        border-radius: 20px !important;
        box-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(42,171,238,0.05), inset 0 1px 0 rgba(255,255,255,0.05) !important;
      }

      /* ══════════ KEYFRAMES ══════════ */

      /* دخول فقاعة رسالة — نعومة عالية (spring) */
      @keyframes msgSlideIn {
        0%   { opacity: 0; transform: scale(0.94) translateY(8px); }
        60%  { opacity: 1; transform: scale(1.008) translateY(-1px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }

      /* دخول محادثة من اليمين على الموبايل */
      @keyframes chatSlideIn {
        from { opacity: 0; transform: translateX(100%); }
        to   { opacity: 1; transform: translateX(0); }
      }

      /* دخول محتوى للأعلى */
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* دخول موديل من الأسفل */
      @keyframes modalSlideUp {
        from { opacity: 0; transform: translateY(20px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0)    scale(1); }
      }

      /* انزلاق للأسفل */
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-8px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* دخول الكروت */
      @keyframes cardEnter {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0)    scale(1); }
      }
      .alfhd-card-enter { animation: cardEnter 0.26s var(--ease-bounce) both; }

      /* باقي الـ keyframes */
      @keyframes shake {
        0%,100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-5px); }
        80% { transform: translateX(5px); }
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes unreadPulse {
        0%,100% { box-shadow: 0 0 0 0 rgba(229,57,53,0.5); }
        50% { box-shadow: 0 0 0 5px rgba(229,57,53,0); }
      }
      .alfhd-unread-pulse { animation: unreadPulse 1.4s ease-in-out infinite; }
      @keyframes recPulse {
        0%,100% { opacity:1; transform:scale(1); }
        50% { opacity:0.4; transform:scale(0.8); }
      }
      .alfhd-rec-dot { animation: recPulse 1s ease-in-out infinite; }
      @keyframes loginFloat {
        0%,100% { transform:translateY(0); }
        50% { transform:translateY(-6px); }
      }
      @keyframes starDrift {
        from { transform:translate3d(0,0,0); }
        to   { transform:translate3d(-80px,100px,0); }
      }
      @keyframes starDriftReverse {
        from { transform:translate3d(0,0,0); }
        to   { transform:translate3d(80px,-80px,0); }
      }
      @keyframes orbitSpin {
        from { transform:rotate(0deg); }
        to   { transform:rotate(360deg); }
      }
      .alfhd-stars-layer  { animation: starDrift 30s linear infinite; }
      .alfhd-stars-layer-2 { animation: starDriftReverse 44s linear infinite; }
      .alfhd-login-orbit  { animation: orbitSpin 36s linear infinite; }

      /* Ripple effect على المحادثات عند الضغط */
      @keyframes ripple {
        from { transform: scale(0); opacity: 0.35; }
        to   { transform: scale(4); opacity: 0; }
      }

      /* تقليل الحركة للمستخدمين الذين يفضلون ذلك */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      @media (max-width: 860px) {
        .alfhd-app-wrap { flex-direction: column !important; }

        /* ═══ تجاوب شامل: كل الموقع يتطابق مع شاشة التلفون ═══ */
        /* منع أي تجاوز أفقي (سكرول جانبي) */
        /* ملاحظة: ممنوع overflow-x:hidden على html/body — يكسر التمرير الرأسي بالموبايل.
           نمنع التجاوز الأفقي من الحاوية بدلها. */
        body { max-width: 100vw !important; }
        .alfhd-app-wrap { overflow-x: hidden !important; max-width: 100vw !important; }
        /* الجداول تلتف بدل ما تمدد الصفحة */
        table { display: block !important; overflow-x: auto !important; max-width: 100% !important; -webkit-overflow-scrolling: touch; }
        /* الصور والوسائط ما تتجاوز حدود الشاشة */
        img, video, canvas { max-width: 100% !important; height: auto !important; }
        /* الحقول تاخذ كامل العرض */
        input, textarea, select { max-width: 100% !important; box-sizing: border-box !important; }
        /* النصوص الطويلة تلتف ما تفيض */
        p, h1, h2, h3, span { overflow-wrap: anywhere !important; }
        /* الحاويات الأفقية القابلة للالتفاف */
        .alfhd-row-wrap { flex-wrap: wrap !important; }

        /* كل الصفحات: هيدر 52px + نافيجيشن 66px */
        /* منطقة المحتوى = حاوية التمرير الوحيدة.
           ارتفاع محدد (مو min-height) حتى تتمرر داخلياً بدل ما تمدّد الصفحة. */
        .alfhd-main-area {
          padding: 52px 0 66px !important;
          width: 100% !important;
          height: 100dvh !important;
          max-height: 100dvh !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          overscroll-behavior-y: contain !important;
          box-sizing: border-box !important;
        }

        /* صفحة المحادثات: padding عادي مثل باقي الصفحات */
        .alfhd-main-conv {
          padding: 52px 0 66px !important;
          height: 100dvh !important;
          min-height: 0 !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
          box-sizing: border-box !important;
        }
        /* كل عنصر بسلسلة الفلكس لازم min-height:0 حتى يتمرر الداخلي */
        .alfhd-main-conv > * { min-height: 0 !important; }
        .alfhd-conv-list-scroll {
          flex: 1 1 0% !important;
          min-height: 0 !important;
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch !important;
          overscroll-behavior-y: contain !important;
        }

        /* حاوية المحادثات: تملأ المساحة المتبقية بعد الهيدر والنافيجيشن */
        .alfhd-conv-fullscreen {
          position: static !important;
          top: auto !important;
          bottom: auto !important;
          right: auto !important;
          left: auto !important;
          width: 100% !important;
          height: 100% !important;
          flex: 1 !important;
          overflow: hidden !important;
          display: flex !important;
          z-index: auto !important;
        }

        .alfhd-conv-layout { grid-template-columns: 1fr !important; }
        .alfhd-conv-list {
          max-height: none !important;
          height: 100% !important;
          border-left: none !important;
          overflow-y: auto !important;
        }
        .alfhd-conv-list-hidden-mobile { display: none !important; }
        .alfhd-conv-detail-empty { display: none !important; }

        /* المحادثة المفتوحة — تطغى فوق كل شيء */
        .alfhd-conv-detail-active-mobile {
          position: fixed !important;
          top: 0 !important; right: 0 !important;
          left: 0 !important; bottom: 0 !important;
          z-index: 300 !important;
          width: 100% !important;
          height: 100dvh !important;
          display: flex !important;
          flex-direction: column !important;
          background: #0E1621 !important;
          border-radius: 0 !important;
          border: none !important;
          padding: 0 !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
        .alfhd-conv-detail-active-mobile .alfhd-chat-detail-header {
          padding: 12px 14px !important;
          padding-top: max(12px, env(safe-area-inset-top, 12px)) !important;
          flex: 0 0 auto !important;
          order: 1 !important;
        }
        .alfhd-conv-detail-active-mobile .alfhd-chat-scroll {
          flex: 1 1 0% !important;
          max-height: none !important;
          min-height: 0 !important;
          padding: 12px !important;
          overflow-y: auto !important;
          order: 3 !important;
        }
        /* شريط الكتابة: آخر عنصر بالعمود — ما ينكمش ولا ينزاح */
        .alfhd-conv-detail-active-mobile .alfhd-composer-bar {
          position: relative !important;
          order: 99 !important;
          margin: 0 !important;
          border-radius: 0 !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: none !important;
          background: #17212B !important;
          padding: 10px 12px !important;
          padding-bottom: max(10px, env(safe-area-inset-bottom, 10px)) !important;
          flex: 0 0 auto !important;
        }
        .alfhd-conv-detail-active-mobile .alfhd-linked-order {
          flex: 0 0 auto !important;
          order: 2 !important;
          margin: 0 !important;
          max-height: 130px !important;
          overflow-y: auto !important;
          border-radius: 0 !important;
        }
        .alfhd-conv-back-btn { display: flex !important; }
        /* داخل المحادثة: نخفي النافبار السفلي والترويسة والجرس */
        body:has(.alfhd-conv-detail-active-mobile) nav.alfhd-no-print,
        body:has(.alfhd-conv-detail-active-mobile) header.alfhd-no-print,
        body:has(.alfhd-conv-detail-active-mobile) .alfhd-notif-bell { display: none !important; }
        .alfhd-chat-scroll { max-height: none !important; }
        .alfhd-stats-row { grid-template-columns: repeat(2,1fr) !important; }
        .alfhd-stats-grid-2 { grid-template-columns: 1fr !important; }
        .alfhd-orders-table-header { display: none !important; }
        .alfhd-orders-row { grid-template-columns: 1fr !important; display: flex !important; flex-direction: column !important; gap: 6px !important; padding: 12px !important; }
        .alfhd-view-header { flex-direction: column !important; align-items: flex-start !important; }
        .alfhd-pages-grid, .alfhd-users-grid { grid-template-columns: 1fr !important; }
        .alfhd-bar-chart-row { grid-template-columns: 1fr !important; gap: 4px !important; }
        .alfhd-modal { max-width: 96vw !important; }
        .alfhd-login-card { max-width: 92vw !important; padding: 32px 20px !important; }
        .alfhd-orders-grid { grid-template-columns: 1fr !important; }
      }

      @media print {
        body * { visibility: hidden; }
        .alfhd-print-area, .alfhd-print-area * { visibility: visible; }
        .alfhd-print-area { position: absolute; top: 0; right: 0; left: 0; width: 100%; display: grid !important; grid-template-columns: repeat(2,1fr) !important; }
        .alfhd-orders-grid { display: grid !important; grid-template-columns: repeat(2,1fr) !important; }
        .alfhd-no-print { display: none !important; }
      }

      /* ═══════════════════════════════════════════════
         ✨ طبقة السحر — تحسينات بصرية فاخرة عامة (144Hz)
         ═══════════════════════════════════════════════ */

      /* نعومة عامة 144Hz — كل العناصر التفاعلية */
      button, a, .alfhd-order-card, input, select, textarea, [role="button"] {
        transition-timing-function: var(--ease-tg) !important;
        -webkit-tap-highlight-color: transparent;
      }

      /* انكباس فاخر عند ضغط أي زر */
      button:active:not(:disabled) {
        transform: scale(0.96) !important;
        transition: transform 0.08s var(--ease-tg) !important;
      }

      /* توهّج ذهبي ناعم للمبالغ المهمة */
      .alfhd-amount-glow {
        background: linear-gradient(135deg, #FFD479, #F0A868) !important;
        -webkit-background-clip: text !important;
        background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        text-shadow: 0 0 18px rgba(240,168,104,0.25);
        font-weight: 900 !important;
      }

      /* زجاجية فاخرة للنوافذ المنبثقة */
      .alfhd-modal {
        backdrop-filter: blur(20px) saturate(1.2) !important;
        -webkit-backdrop-filter: blur(20px) saturate(1.2) !important;
        background: linear-gradient(145deg, rgba(28,40,54,0.92), rgba(20,30,42,0.92)) !important;
      }

      /* خلفية التطبيق بعمق متدرّج خفيف */
      .alfhd-app-wrap {
        background:
          radial-gradient(1200px 600px at 70% -10%, rgba(42,171,238,0.06), transparent 60%),
          radial-gradient(900px 500px at 10% 110%, rgba(240,168,104,0.04), transparent 55%),
          var(--tg-bg, #0E1621) !important;
      }

      /* نقطة حالة نابضة (متصل) */
      @keyframes alfhdPulse {
        0%   { box-shadow: 0 0 0 0 rgba(77,219,107,0.5); }
        70%  { box-shadow: 0 0 0 7px rgba(77,219,107,0); }
        100% { box-shadow: 0 0 0 0 rgba(77,219,107,0); }
      }
      .alfhd-pulse { animation: alfhdPulse 2s var(--ease-tg) infinite; }

      /* دخول ناعم منزلق للعناصر */
      @keyframes alfhdFadeUp {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .alfhd-fade-up { animation: alfhdFadeUp 0.4s var(--ease-bounce) both; }

      /* رسالة محادثة تنزلق بنعومة عند الوصول */
      @keyframes alfhdMsgIn {
        from { opacity: 0; transform: translateY(6px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      .alfhd-msg-row { animation: alfhdMsgIn 0.32s var(--ease-bounce) both; }

      /* جرس الإشعارات — توهّج خفيف عند وجود جديد */
      @keyframes alfhdBellGlow {
        0%,100% { box-shadow: 0 4px 14px rgba(0,0,0,0.4); }
        50%     { box-shadow: 0 4px 20px rgba(242,80,80,0.4); }
      }

      /* تمرير ناعم في كل الحاويات */
      * { scroll-behavior: smooth; }

      /* شريط تمرير أنيق */
      ::-webkit-scrollbar { width: 7px; height: 7px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(42,171,238,0.25); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(42,171,238,0.45); }

      /* تقليل الحركة لمن يفضّل ذلك (وصول) */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
      }
    `}</style>
  );
}

// ──────────────────────────────────────────────
// كائن الأنماط — Telegram Style
// ──────────────────────────────────────────────
const TG = '#0E1621';
const TP = '#17212B';
const TI = '#242F3D';
const TB = 'rgba(255,255,255,0.07)';
const TBL = '#2AABEE';
const TBL2 = '#229ED9';
const TGR = '#4DDB6B';
const TRD = '#F25050';
const TTX = '#F5F5F5';
const TSB = '#8B9AB3';
const TDM = '#8FA0B5';
const TAC = 'rgba(42,171,238,0.15)';
const TSH = '0 2px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)';
const TBTN = `linear-gradient(135deg,${TBL},${TBL2})`;
const TGBTN = 'linear-gradient(135deg,#4DDB6B,#22C55E)';
const TRDS = 'rgba(242,80,80,0.12)';

const styles = {
  // ── Login ──
  loginWrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: TG, position: 'relative', overflow: 'hidden', direction: 'rtl', padding: 20 },
  loginSpaceBg: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(42,171,238,0.08), transparent 60%)', pointerEvents: 'none' },
  loginStarsLayer: { position: 'absolute', inset: '-20%', opacity: 0.20, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.7) 0 1px, transparent 1.3px)', backgroundSize: '90px 90px' },
  loginStarsLayer2: { position: 'absolute', inset: '-18%', opacity: 0.10, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 0 1px, transparent 1.5px)', backgroundSize: '60px 60px' },
  loginNebulaOne: { position: 'absolute', width: 380, height: 380, borderRadius: '50%', top: '-90px', right: '-110px', background: 'radial-gradient(circle, rgba(42,171,238,0.10), transparent 70%)', filter: 'blur(28px)' },
  loginNebulaTwo: { position: 'absolute', width: 340, height: 340, borderRadius: '50%', bottom: '-110px', left: '-90px', background: 'radial-gradient(circle, rgba(34,158,217,0.08), transparent 72%)', filter: 'blur(26px)' },
  loginOrbit: { position: 'absolute', width: 500, height: 500, borderRadius: '50%', border: '1px solid rgba(42,171,238,0.07)', borderTopColor: 'rgba(42,171,238,0.18)', pointerEvents: 'none' },
  loginBrandTop: { position: 'absolute', top: 20, zIndex: 2, display: 'flex', alignItems: 'center', gap: 8, color: TSB, fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', background: 'rgba(23,33,43,0.80)', border: `1px solid ${TB}`, borderRadius: 999, padding: '8px 12px' },
  loginCard: { position: 'relative', zIndex: 1, background: TP, border: `1px solid ${TB}`, borderRadius: 16, padding: '36px 32px 24px', width: '100%', maxWidth: 390, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'loginFloat 5s ease-in-out infinite' },
  loginGlassShine: { display: 'none' },
  loginCardAccent: { position: 'absolute', top: 0, right: 0, left: 0, height: 2, background: `linear-gradient(90deg, transparent, ${TBL}, transparent)`, borderRadius: '16px 16px 0 0', opacity: 0.7 },
  loginLogoArea: { position: 'relative', marginBottom: 4 },
  logoGlow: { position: 'absolute', inset: -22, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,171,238,0.18) 0%, transparent 70%)', filter: 'blur(10px)' },
  loginTitle: { fontSize: 28, fontWeight: 800, color: TTX, margin: '12px 0 2px', letterSpacing: '0.03em' },
  loginSubtitle: { fontSize: 12, color: TSB, margin: 0, fontWeight: 500 },
  loginMicroCopy: { marginTop: 8, color: TBL, fontSize: 12, fontWeight: 700, background: 'rgba(42,171,238,0.10)', border: '1px solid rgba(42,171,238,0.18)', borderRadius: 999, padding: '4px 12px' },
  inputLabel: { display: 'block', fontSize: 12, color: TSB, marginBottom: 12, fontWeight: 700, textAlign: 'center', letterSpacing: '0.05em' },
  pinBoxesWrap: { position: 'relative', display: 'flex', gap: 8, justifyContent: 'center', cursor: 'text' },
  pinBox: { width: 50, height: 56, borderRadius: 10, background: TI, border: `1.5px solid ${TB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: TBL, fontWeight: 900, transition: 'border-color 0.13s, transform 0.12s' },
  pinBoxActive: { borderColor: TBL, transform: 'translateY(-2px)' },
  pinBoxFilled: { borderColor: 'rgba(42,171,238,0.45)', background: 'rgba(42,171,238,0.07)' },
  pinBoxError: { borderColor: TRD },
  pinHiddenInput: { position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', border: 'none', padding: 0, margin: 0, cursor: 'text' },
  errorText: { color: TRD, fontSize: 12, marginTop: 8, textAlign: 'center', fontWeight: 600 },
  rememberRow: { marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: TSB, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  loginKeypad: { marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 50px)', gap: 8, justifyContent: 'center' },
  loginKeypadBtn: { width: 50, height: 50, borderRadius: 10, border: `1px solid ${TB}`, background: TI, color: TTX, fontSize: 16, fontWeight: 700 },
  loginKeypadGhost: { width: 50, height: 50, borderRadius: 10, border: `1px solid ${TB}`, background: 'transparent', color: TSB, fontSize: 12, fontWeight: 700 },
  checkbox: { width: 14, height: 14, accentColor: TBL, cursor: 'pointer' },
  loginFooter: { marginTop: 20, fontSize: 12, color: TDM, position: 'relative', zIndex: 1, letterSpacing: '0.04em' },

  // ── App layout ──
  appWrap: { display: 'flex', minHeight: '100vh', background: TG, direction: 'rtl', color: TTX, fontFamily: "'Cairo', sans-serif" },
  sidebar: { width: 260, background: TP, borderLeft: `1px solid ${TB}`, display: 'flex', flexDirection: 'column', padding: '16px 8px', flexShrink: 0 },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px 16px', borderBottom: `1px solid ${TB}`, marginBottom: 8 },
  sidebarBrand: { fontSize: 15.5, fontWeight: 800, color: TTX },
  sidebarBrandSub: { fontSize: 12, color: TDM, letterSpacing: '0.05em', textTransform: 'uppercase' },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, border: '1px solid transparent', background: 'transparent', color: TSB, fontSize: 13.5, fontWeight: 600, textAlign: 'right', position: 'relative', transition: 'all 0.12s ease' },
  navItemActive: { background: TAC, borderColor: 'rgba(42,171,238,0.20)', color: TBL, fontWeight: 700 },
  navActiveDot: { position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', width: 3, height: 15, borderRadius: 4, background: TBL },
  sidebarFooter: { paddingTop: 12, borderTop: `1px solid ${TB}` },
  userBadge: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px', marginBottom: 8 },
  userAvatar: { width: 32, height: 32, borderRadius: '50%', background: TBTN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 700, color: TTX, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: 12, color: TDM },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'transparent', border: '1px solid rgba(242,80,80,0.18)', borderRadius: 10, color: TRD, fontSize: 12.5, fontWeight: 600 },

  // ── Mobile ──
  mobileHeader: { position: 'fixed', top: 0, right: 0, left: 0, height: 52, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(23,33,43,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid rgba(255,255,255,0.09)`, padding: '0 16px', direction: 'rtl', paddingTop: 'env(safe-area-inset-top,0px)' },
  mobileHeaderBrand: { display: 'flex', alignItems: 'center', gap: 8 },
  mobileHeaderTitle: { fontSize: 15, fontWeight: 800, color: TTX },
  mobileLogoutBtn: { width: 32, height: 32, borderRadius: 9, background: 'rgba(242,80,80,0.09)', border: 'none', color: TRD, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  bottomNav: { position: 'fixed', bottom: 0, right: 0, left: 0, zIndex: 100, display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: 'rgba(23,33,43,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: `1px solid rgba(255,255,255,0.09)`, padding: '8px 4px', paddingBottom: 'max(8px, env(safe-area-inset-bottom,8px))', direction: 'rtl' },
  bottomNavItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'transparent', border: 'none', color: '#9AA6B5', padding: '8px 8px', flex: 1, minWidth: 0, minHeight: 48, position: 'relative' },
  bottomNavItemActive: { color: TBL },
  bottomNavLabel: { fontSize: 12, fontWeight: 600, letterSpacing: '-0.1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' },

  mainArea: { flex: 1, overflow: 'auto', padding: '0', position: 'relative', background: TG },
  viewWrap: { animation: 'fadeUp 0.24s var(--ease-bounce) both', maxWidth: 1480, margin: '0 auto', padding: '16px 20px', willChange: 'opacity, transform' },
  viewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  viewTitle: { fontSize: 19, fontWeight: 800, color: TTX, margin: 0, letterSpacing: '-0.02em' },
  viewSubtitle: { fontSize: 12, color: TDM, margin: '4px 0 0', fontWeight: 500 },
  pageSelectWrap: { display: 'flex', alignItems: 'center', gap: 8, background: TI, border: 'none', borderRadius: 10, padding: '8px 12px' },
  pageSelect: { background: 'transparent', border: 'none', color: TTX, fontSize: 12.5, fontWeight: 600, appearance: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif" },

  // ── Conversations ──
  convTabs: { display: 'flex', gap: 4, marginBottom: 0, flexWrap: 'wrap', padding: '0 0 8px' },
  convTab: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'transparent', border: 'none', borderRadius: 20, color: TDM, fontSize: 12, fontWeight: 600, transition: 'all 0.12s ease' },
  convTabActive: { background: TAC, color: TBL },
  convTabCount: { background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', minWidth: 18, textAlign: 'center', flexShrink: 0 },
  convTabCountActive: { background: 'rgba(42,171,238,0.28)', color: TBL },
  unreadPulse: { position: 'absolute', top: -5, left: -5, minWidth: 15, height: 15, padding: '0 4px', borderRadius: 20, background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${TP}` },
  markAllReadBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '8px', marginBottom: 4, background: 'rgba(42,171,238,0.07)', border: 'none', borderRadius: 0, color: TBL, fontSize: 12, fontWeight: 600 },
  markAllReadBtnDisabled: { opacity: 0.38, color: TDM, background: 'transparent', cursor: 'not-allowed' },

  convLayout: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: 0, minHeight: '100vh', alignItems: 'stretch' },
  convList: { background: TP, border: 'none', borderRadius: 0, borderLeft: `1px solid ${TB}`, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 0, maxHeight: '100vh', overflow: 'auto', boxShadow: 'none' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, background: TI, border: 'none', borderRadius: 10, padding: '8px 12px', margin: '0 8px 8px', boxShadow: 'none' },
  searchInput: { background: 'transparent', border: 'none', color: TTX, fontSize: 12.5, width: '100%', fontFamily: "'Cairo', sans-serif" },
  convItem: { display: 'flex', gap: 8, padding: '8px 16px', background: 'transparent', border: 'none', borderRight: '3px solid transparent', borderRadius: 0, textAlign: 'right', alignItems: 'center', transition: 'background 0.12s ease', width: '100%' },
  convItemActive: { background: TAC, borderRightColor: TBL },
  convAvatar: { width: 44, height: 44, borderRadius: '50%', background: TI, color: TBL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, fontSize: 15 },
  convItemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  convCustomer: { fontSize: 13.5, fontWeight: 700, color: TTX, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  convTime: { fontSize: 12, color: TDM, flexShrink: 0, marginRight: 4 },
  convItemBottom: { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  convLastMsg: { fontSize: 12, color: TSB, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  convMiniMetaRow: { display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 4, minHeight: 14 },
  convMiniMetaPill: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: 'rgba(42,171,238,0.08)', color: TBL, fontSize: 12, fontWeight: 700 },
  unreadBadge: { background: TBL, color: '#fff', borderRadius: 20, fontSize: 12, fontWeight: 800, padding: '2px 8px', minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', flexShrink: 0 },

  convDetail: { background: TG, border: 'none', borderRadius: 0, padding: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0, overflow: 'hidden', boxShadow: 'none' },
  detailHeader: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${TB}`, marginBottom: 0, position: 'relative', background: TP },
  convBackBtn: { display: 'none', width: 32, height: 32, borderRadius: 9, background: TI, border: 'none', color: TSB, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  convAvatarLg: { width: 40, height: 40, borderRadius: '50%', background: TI, color: TBL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 },
  detailName: { fontSize: 14.5, fontWeight: 800, color: TTX },
  detailPage: { fontSize: 12, color: TDM, fontWeight: 500 },
  chatHeaderMetaRow: { display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 4 },
  chatHeaderMetaPill: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: TI, color: TSB, fontSize: 9.5, fontWeight: 600 },
  pinOrderBtn: { display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', background: 'rgba(42,171,238,0.10)', border: 'none', borderRadius: 9, color: TBL, fontSize: 12, fontWeight: 700, flexShrink: 0 },
  chatScroll: { flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', padding: '16px 16px', minHeight: 260, maxHeight: 'calc(100vh - 136px)', background: TG, border: 'none', borderRadius: 0 },
  msgBubbleIn: { background: '#1C2A38', border: 'none', borderRadius: '18px 18px 18px 5px', padding: '8px 12px', fontSize: 14, color: '#F5F5F5', maxWidth: '76%', lineHeight: 1.55, display: 'flex', flexDirection: 'column', gap: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.18)', overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0, willChange: 'transform, opacity' },
  msgBubbleOut: { background: 'linear-gradient(135deg,#2E6199,#2B5278)', border: 'none', borderRadius: '18px 18px 5px 18px', padding: '8px 12px', fontSize: 14, color: '#fff', maxWidth: '76%', lineHeight: 1.55, display: 'flex', flexDirection: 'column', gap: 2, boxShadow: '0 1px 3px rgba(43,82,120,0.35)', overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0, willChange: 'transform, opacity' },
  chatDateDivider: { alignSelf: 'center', margin: '4px 0 8px', padding: '4px 8px', borderRadius: 999, background: 'rgba(23,33,43,0.88)', color: TSB, fontSize: 12, fontWeight: 600 },
  msgImage: { width: '100%', maxWidth: 260, maxHeight: 320, objectFit: 'cover', borderRadius: 12, display: 'block', background: 'rgba(255,255,255,0.04)' },
  msgAudio: { width: 220, maxWidth: '100%', height: 38 },
  msgTime: { fontSize: 12, color: 'rgba(255,255,255,0.5)', alignSelf: 'flex-end', fontWeight: 500, marginTop: 2 },
  composerBar: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 0, background: TP, border: 'none', borderTop: `1px solid ${TB}`, borderRadius: 0, padding: '8px 16px', boxShadow: 'none' },
  composerIconBtn: { width: 34, height: 34, borderRadius: 9, background: 'transparent', border: 'none', color: TDM, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  recordingBar: { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '4px 4px' },
  recordingInfo: { flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' },
  recordingDot: { width: 9, height: 9, borderRadius: '50%', background: TRD, flexShrink: 0 },
  recordingTime: { fontSize: 14, fontWeight: 800, color: TTX, fontFamily: 'monospace', minWidth: 42 },
  recordingLabel: { fontSize: 12, color: TDM },
  recordingCancelBtn: { width: 44, height: 44, borderRadius: 11, background: 'rgba(242,80,80,0.09)', border: 'none', color: TRD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  recordingSendBtn: { width: 38, height: 38, borderRadius: '50%', background: TBTN, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(42,171,238,0.38)' },
  composerInput: { flex: 1, background: 'transparent', border: 'none', color: TTX, fontSize: 13.5, padding: '4px 4px', fontFamily: "'Cairo', sans-serif" },
  composerSendBtn: { width: 36, height: 36, borderRadius: '50%', background: TBTN, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(42,171,238,0.38)' },
  linkedOrderCard: { background: TI, border: `1px solid ${TB}`, borderRadius: 10, padding: 12, marginBottom: 8 },
  linkedOrderHeader: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: TBL, marginBottom: 8 },
  linkedOrderBody: { display: 'flex', flexDirection: 'column', gap: 8 },
  linkedOrderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  linkedOrderLabel: { fontSize: 12, color: TDM },
  linkedOrderValue: { fontSize: 12.5, color: TTX, fontWeight: 600 },
  linkedOrderDetailBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 8, padding: '8px', background: 'rgba(42,171,238,0.09)', border: 'none', borderRadius: 9, color: TBL, fontSize: 12, fontWeight: 700 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '52px 20px', color: TDM, fontSize: 13.5, fontWeight: 500, animation: 'alfhdFadeUp 0.5s var(--ease-bounce) both' },
  emptyStateLg: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, flex: 1, color: TDM, fontSize: 13.5, fontWeight: 500, animation: 'alfhdFadeUp 0.5s var(--ease-bounce) both' },

  // ── Orders ──
  printBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: TBTN, border: 'none', borderRadius: 10, color: '#fff', fontSize: 12.5, fontWeight: 700, boxShadow: '0 2px 8px rgba(42,171,238,0.32)' },
  secondaryBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: TI, border: 'none', borderRadius: 10, color: TSB, fontSize: 12.5, fontWeight: 600 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 },
  statCard: { display: 'flex', alignItems: 'center', gap: 12, background: `linear-gradient(145deg, ${TP}, #1A2736)`, border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, padding: '16px 16px', boxShadow: TSH, transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden' },
  statIconWrap: { width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statValue: { fontSize: 20, fontWeight: 800, color: TTX, lineHeight: 1.15, letterSpacing: '-0.02em' },
  statLabel: { fontSize: 12, color: TDM, marginTop: 2 },
  sectionTabs: { display: 'flex', gap: 4, marginBottom: 12 },
  sectionTab: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'transparent', border: 'none', borderRadius: 20, color: TDM, fontSize: 12.5, fontWeight: 600, transition: 'all 0.12s ease', whiteSpace: 'nowrap', flexShrink: 0 },
  sectionTabActive: { background: TAC, color: TBL },
  filterChips: { display: 'flex', gap: 4 },
  chip: { padding: '8px 12px', background: TI, border: 'none', borderRadius: 20, color: TDM, fontSize: 12, fontWeight: 600 },
  chipActive: { background: TAC, color: TBL },
  ordersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(272px,1fr))', gap: 12 },
  orderCard: { background: `linear-gradient(145deg, ${TP}, #1A2736)`, border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: TSH, transition: 'all 0.2s ease', position: 'relative' },
  orderTicketHead: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 12px 8px' },
  orderTicketAvatar: { width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: TI, color: TBL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 },
  orderCardCustomer: { fontSize: 13.5, fontWeight: 700, color: TTX, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  orderTicketPage: { fontSize: 12, color: TDM, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  orderStatusPill: { fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '4px 8px', flexShrink: 0 },
  orderTicketBody: { padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 4 },
  orderDetailRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: TSB },
  deliveryStepRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: TBL, fontWeight: 700, marginTop: 2 },
  orderTicketItems: { fontSize: 12, color: '#C8D0DC', background: TI, borderRadius: 8, padding: '8px 8px', marginTop: 2, lineHeight: 1.55, border: 'none' },
  orderTicketFoot: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '8px 12px', borderTop: `1px solid ${TB}` },
  orderCardTotal: { fontSize: 17, fontWeight: 800, color: TTX, letterSpacing: '-0.02em' },
  orderCurrency: { fontSize: 12, fontWeight: 500, color: TDM },
  orderTicketMeta: { display: 'flex', gap: 4, alignItems: 'center', fontSize: 12, color: TDM, marginTop: 2 },
  printedBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(77,219,107,0.11)', color: TGR, borderRadius: 20, padding: '2px 8px', fontSize: 9.5, fontWeight: 700 },
  batchBlock: { background: `linear-gradient(145deg, ${TP}, #1A2736)`, border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, padding: 16, boxShadow: TSH },
  batchHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  batchHeaderInfo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: TTX },
  batchHeaderTime: { fontSize: 12, color: TDM, fontWeight: 500 },
  orderCardActions: { display: 'flex', gap: 4, padding: '8px 12px', borderTop: `1px solid ${TB}`, background: 'rgba(0,0,0,0.08)' },
  orderActionBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 31, borderRadius: 8, background: TI, border: 'none', color: TDM },
  statusSelect: { border: '1px solid', borderRadius: 8, padding: '4px 8px', fontSize: 12, fontWeight: 700, appearance: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif" },

  // ── Stats ──
  chartCard: { background: `linear-gradient(145deg, ${TP}, #1A2736)`, border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: TSH },
  timeFilterBar: { display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' },
  customDateRow: { display: 'flex', gap: 8, marginBottom: 16 },
  customDateSelect: { background: TI, border: 'none', borderRadius: 9, padding: '8px 12px', color: TTX, fontSize: 12.5, fontFamily: "'Cairo', sans-serif", flex: 1 },
  customDateSelectCompact: { background: TI, border: 'none', borderRadius: 9, padding: '8px 8px', color: TTX, fontSize: 12, fontFamily: "'Cairo', sans-serif", minWidth: 110 },
  filtersWrap: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, background: TI, borderRadius: 10, padding: 8 },
  dateChipsRow: { display: 'none' },
  filterBottomRow: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  chartTitle: { fontSize: 14, fontWeight: 700, color: TTX, margin: '0 0 12px' },
  barChartArea: { display: 'flex', flexDirection: 'column', gap: 12 },
  barChartRow: { display: 'grid', gridTemplateColumns: '165px 1fr 105px', gap: 12, alignItems: 'center' },
  barChartLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: TSB, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  barChartTrack: { height: 5, background: TI, borderRadius: 4, overflow: 'hidden' },
  barChartFill: { height: '100%', background: `linear-gradient(90deg,${TBL2},${TBL})`, borderRadius: 4, transition: 'width 0.28s cubic-bezier(0.22,1,0.36,1)' },
  barChartValue: { fontSize: 12, fontWeight: 700, color: TBL, textAlign: 'left' },
  statsGrid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  donutWrap: { display: 'flex', justifyContent: 'center', padding: '8px 0' },
  pageStatRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageStatInfo: { display: 'flex', alignItems: 'center', gap: 8 },
  pageStatBadge: { background: TI, padding: '4px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: TSB },

  // ── Pages ──
  addBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: TBTN, border: 'none', borderRadius: 10, color: '#fff', fontSize: 12.5, fontWeight: 700, boxShadow: '0 2px 8px rgba(42,171,238,0.32)' },
  confirmBtn: { background: TBL, border: 'none', borderRadius: 8, padding: '0 16px', color: '#fff', fontWeight: 700, fontSize: 13 },
  fbErrorBox: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, background: 'rgba(242,80,80,0.07)', border: `1px solid rgba(242,80,80,0.18)`, borderRadius: 10, padding: '8px 12px', color: TRD, fontSize: 12.5, lineHeight: 1.6 },
  fbExchangingBox: { marginBottom: 12, background: 'rgba(42,171,238,0.07)', border: 'none', borderRadius: 10, padding: '8px 12px', color: TBL, fontSize: 12.5 },
  fbCandidatesWrap: { marginBottom: 16, background: TI, border: 'none', borderRadius: 11, padding: 12 },
  fbCandidatesTitle: { fontSize: 12.5, fontWeight: 700, color: TTX, marginBottom: 8 },
  fbCandidateRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: `1px solid ${TB}` },
  fbCandidateAvatarImg: { width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' },
  fbCandidateId: { fontSize: 12, color: TDM, marginTop: 2 },
  pagesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(295px,1fr))', gap: 12 },
  pageCard: { position: 'relative', display: 'flex', flexDirection: 'column', gap: 12, background: `linear-gradient(145deg, ${TP}, #1A2736)`, border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, padding: 16, boxShadow: TSH, overflow: 'hidden', transition: 'all 0.2s ease' },
  pageCardTopLine: { position: 'absolute', top: 0, right: 16, left: 16, height: 2, background: `linear-gradient(90deg, transparent, ${TBL}, transparent)`, opacity: 0.55 },
  pageCardHeader: { display: 'flex', alignItems: 'center', gap: 12, width: '100%' },
  subscribeBtn: { width: '100%', background: 'rgba(77,219,107,0.09)', border: `1px solid rgba(77,219,107,0.22)`, borderRadius: 10, padding: '8px 0', color: TGR, fontSize: 12, fontWeight: 700 },
  pageCardAvatar: { width: 46, height: 46, borderRadius: '50%', background: TI, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0 },
  pageCardName: { fontSize: 14, fontWeight: 800, color: TTX, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pageCardMeta: { fontSize: 12, color: TDM, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pageCardStatus: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginTop: 4, fontWeight: 600 },
  pageStatusPill: { display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderRadius: 20, padding: '8px 12px', fontSize: 12, fontWeight: 700, border: 'none' },
  pageStatusPillOk: { color: TGR, background: 'rgba(77,219,107,0.09)' },
  pageStatusPillWait: { color: TBL, background: 'rgba(42,171,238,0.09)' },
  liveDot: { width: 7, height: 7, borderRadius: '50%', boxShadow: '0 0 8px currentColor' },
  iconBtnDanger: { width: 30, height: 30, borderRadius: 8, background: 'rgba(242,80,80,0.08)', border: 'none', color: TRD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // ── Users ──
  usersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(285px,1fr))', gap: 12 },
  userCard: { background: `linear-gradient(145deg, ${TP}, #1A2736)`, border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, padding: 16, boxShadow: TSH, transition: 'all 0.2s ease' },
  userCardTop: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  userCardAvatar: { width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 },
  userCardName: { fontSize: 13, fontWeight: 700, color: TTX },
  userCardRole: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: TDM, marginTop: 2 },
  activeDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  userPermsList: { display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${TB}` },
  permTag: { background: 'rgba(42,171,238,0.09)', color: TBL, fontSize: 9.5, fontWeight: 600, padding: '4px 8px', borderRadius: 6 },
  userCardActions: { display: 'flex', gap: 8 },
  userActionBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px', background: TI, border: 'none', borderRadius: 8, color: TSB, fontSize: 12, fontWeight: 600 },
  userCardMetaRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  userCodeTag: { fontSize: 12, color: TDM, background: TI, border: 'none', borderRadius: 7, padding: '4px 8px', fontFamily: 'monospace' },
  warehouseNote: { display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(255,202,40,0.05)', border: `1px solid rgba(255,202,40,0.13)`, borderRadius: 9, padding: 8, fontSize: 12, color: TSB, lineHeight: 1.6 },
  rejectReasonBox: { margin: '0 12px 8px', padding: '8px 8px', background: 'rgba(242,80,80,0.07)', border: `1px solid rgba(242,80,80,0.14)`, borderRadius: 9, fontSize: 12, color: TTX, display: 'flex', flexDirection: 'column', gap: 4 },
  rejectReasonLabel: { fontSize: 12, color: TRD, fontWeight: 700 },
  rejectedCard: { border: `1.5px solid rgba(242,80,80,0.36)`, boxShadow: '0 0 0 1px rgba(242,80,80,0.09), 0 4px 14px -6px rgba(242,80,80,0.25)' },
  rejectedBanner: { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', background: '#7B1A1A', color: '#fff', fontSize: 12, fontWeight: 800, padding: '8px 12px', borderRadius: '12px 12px 0 0', margin: '-2px -2px 0' },
  prepTimeRow: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: TDM, margin: '0 12px 8px', paddingTop: 2 },
  orderReprepNoteBox: { display: 'flex', alignItems: 'flex-start', gap: 8, margin: '0 12px 8px', background: 'rgba(242,80,80,0.08)', border: `1px solid rgba(242,80,80,0.24)`, color: '#FCA5A5', borderRadius: 9, padding: '8px 8px', fontSize: 12, lineHeight: 1.6 },
  globalOrderSearchWrap: { position: 'relative', display: 'flex', alignItems: 'center', gap: 8, width: 208, minHeight: 34, background: TI, border: 'none', borderRadius: 10, padding: '0 8px' },
  globalOrderSearchInput: { width: '100%', background: 'transparent', border: 'none', outline: 'none', color: TTX, fontSize: 12, fontFamily: "'Cairo', sans-serif" },
  globalOrderResultsBox: { position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50, background: TP, border: `1px solid ${TB}`, borderRadius: 11, boxShadow: '0 4px 16px rgba(0,0,0,0.4)', overflow: 'hidden' },
  globalOrderResultItem: { width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px', border: 'none', background: 'transparent', borderRadius: 0, textAlign: 'right', color: TTX },
  globalOrderResultTitle: { fontSize: 12, fontWeight: 700, color: TTX, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  globalOrderResultMeta: { fontSize: 12, color: TDM, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  globalOrderEmpty: { padding: '12px', color: TDM, fontSize: 12, textAlign: 'center' },

  // ── Warehouse ──
  warehouseWrap: { flex: 1, overflow: 'auto', padding: '20px 16px', maxWidth: 700, margin: '0 auto', width: '100%' },
  warehouseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12, paddingTop: 'env(safe-area-inset-top,0px)' },
  warehouseGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  warehouseCard: { background: `linear-gradient(145deg, ${TP}, #1A2736)`, border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, padding: 16, boxShadow: TSH, transition: 'all 0.2s ease' },
  warehouseCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  warehouseCardNo: { fontSize: 12, fontWeight: 800, color: TBL, fontFamily: 'monospace' },
  warehouseCardDate: { fontSize: 12, color: TDM },
  warehouseBigType: { fontSize: 17, fontWeight: 800, color: TTX, lineHeight: 1.5, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' },
  warehouseFilterBar: { display: 'flex', gap: 8, marginBottom: 12 },
  warehouseFilterChip: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 8px', background: TI, border: 'none', borderRadius: 10, color: TDM, fontSize: 12.5, fontWeight: 700 },
  warehouseFilterChipActive: { background: TAC, color: TBL },
  warehouseFilterCount: { minWidth: 19, height: 19, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, padding: '0 4px' },
  warehouseFilterCountActive: { background: TBL, color: '#fff' },
  warehouseReprepNote: { display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 8, background: 'rgba(242,80,80,0.08)', border: `1px solid rgba(242,80,80,0.22)`, borderRadius: 10, padding: '8px 12px', color: '#FCA5A5' },
  warehouseReprepTitle: { fontSize: 12, fontWeight: 800, color: TRD, marginBottom: 4 },
  warehouseReprepText: { fontSize: 13.5, fontWeight: 700, color: '#FEE2E2', lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  warehouseItemsBox: { marginTop: 8, background: 'rgba(255,202,40,0.05)', border: `1px solid rgba(255,202,40,0.13)`, borderRadius: 9, padding: '8px 12px' },
  warehouseItemsLabel: { fontSize: 12, fontWeight: 700, color: '#FFCA28', marginBottom: 4 },
  warehouseItemsText: { fontSize: 13.5, color: TTX, lineHeight: 1.6, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' },
  warehouseBadge: { width: 38, height: 38, borderRadius: '50%', background: TBTN, color: '#fff', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(42,171,238,0.38)' },
  warehouseActions: { display: 'flex', gap: 8, marginTop: 12 },
  warehouseDoneBtn: { flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: TGBTN, border: 'none', borderRadius: 10, color: '#fff', fontSize: 13.5, fontWeight: 800, boxShadow: '0 2px 8px rgba(77,219,107,0.32)' },
  warehouseRejectBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '12px', background: TRDS, border: `1px solid rgba(242,80,80,0.22)`, borderRadius: 10, color: TRD, fontSize: 13, fontWeight: 700 },

  // ── Modal ──
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '16px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' },
  modal: { background: `linear-gradient(145deg, ${TP}, #1A2736)`, border: `1px solid rgba(255,255,255,0.10)`, borderRadius: 16, width: '100%', maxWidth: 445, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.4)', position: 'relative', zIndex: 1, marginTop: 0 },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px', borderBottom: `1px solid ${TB}` },
  modalTitle: { fontSize: 15, fontWeight: 700, color: TTX, margin: 0 },
  modalClose: { background: 'transparent', border: 'none', color: TDM, display: 'flex' },
  modalBody: { padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  formLabel: { fontSize: 12, fontWeight: 600, color: TDM },
  formInput: { background: TI, border: 'none', borderRadius: 9, padding: '8px 12px', color: TTX, fontSize: 13, fontFamily: "'Cairo', sans-serif" },
  roleToggle: { display: 'flex', gap: 8 },
  roleBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px', background: TI, border: 'none', borderRadius: 9, color: TDM, fontSize: 12, fontWeight: 600 },
  roleBtnActive: { background: TAC, color: TBL },
  permsGrid: { display: 'flex', flexDirection: 'column', gap: 4 },
  permCheckRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: TSB, padding: '4px 0', cursor: 'pointer' },
  modalFooter: { display: 'flex', gap: 8, padding: '12px 16px', borderTop: `1px solid ${TB}` },
  modalCancelBtn: { flex: 1, padding: '8px', background: 'transparent', border: `1px solid ${TB}`, borderRadius: 9, color: TDM, fontSize: 12.5, fontWeight: 600 },
  modalSaveBtn: { flex: 1, padding: '8px', background: TBTN, border: 'none', borderRadius: 9, color: '#fff', fontSize: 12.5, fontWeight: 700, boxShadow: '0 2px 8px rgba(42,171,238,0.28)' },
  detailGridRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingBottom: 8, borderBottom: `1px solid ${TB}` },
  detailGridLabel: { fontSize: 12, color: TDM, flexShrink: 0 },
  detailGridValue: { fontSize: 12.5, color: TTX, fontWeight: 600, textAlign: 'left', overflowWrap: 'anywhere' },
  detailActionBtn: { flex: 1, minWidth: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px', background: TI, border: 'none', borderRadius: 9, color: TSB, fontSize: 12, fontWeight: 700 },
  statsBottomBtns: { display: 'flex', gap: 8, marginTop: 12 },
  statsSmallBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1, padding: '8px', background: TI, border: 'none', borderRadius: 10, color: TSB, fontSize: 12.5, fontWeight: 700 },
  statsSummaryBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1.4, padding: '8px', background: TBTN, border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 800, boxShadow: '0 2px 8px rgba(42,171,238,0.32)' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 10, background: TI, border: 'none', marginBottom: 8 },
  summaryRowSub: { background: 'transparent', border: 'none', padding: '4px 16px', marginBottom: 2 },
  summaryRowLabel: { fontSize: 12.5, fontWeight: 600 },
  summaryRowValue: { fontSize: 16, fontWeight: 800 },
  summaryHint: { fontSize: 12, color: TDM, textAlign: 'center', marginTop: 8 },
  bestSellerRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  bestSellerRank: { width: 24, height: 24, borderRadius: 8, background: 'rgba(42,171,238,0.11)', color: TBL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 },
  bestSellerType: { fontSize: 12.5, fontWeight: 700, color: TTX, marginBottom: 4, overflowWrap: 'anywhere' },
  bestSellerTrack: { height: 5, background: TI, borderRadius: 4, overflow: 'hidden' },
  bestSellerFill: { height: '100%', background: `linear-gradient(90deg,${TBL2},${TBL})`, borderRadius: 4 },
  bestSellerCount: { fontSize: 14, fontWeight: 800, color: TBL, minWidth: 23, textAlign: 'center', flexShrink: 0 },
  convertedRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: `1px solid ${TB}` },
  convertedCustomer: { fontSize: 13, fontWeight: 700, color: TTX },
  convertedSub: { fontSize: 12, color: TBL, marginTop: 2 },
  convertedMeta: { fontSize: 12, color: TDM, marginTop: 2 },
  convertedTotal: { fontSize: 13, fontWeight: 800, color: TBL, flexShrink: 0 },
  neglectedRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px', marginBottom: 4, borderRadius: 10, background: TI, border: 'none', cursor: 'pointer' },
  neglectedRowSel: { background: TAC, border: '1px solid rgba(42,171,238,0.28)' },
  neglectedCheck: { width: 21, height: 21, borderRadius: 6, border: `1.5px solid ${TB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' },
  neglectedCheckOn: { background: TBL, borderColor: TBL },
};
