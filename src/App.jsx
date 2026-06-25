import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageSquare, Package, Users, Settings, LogOut, Search,
  Plus, Filter, BarChart3, CheckCircle2, Clock, XCircle,
  Truck, Printer, ChevronDown, X, Shield, ShieldCheck, ShieldOff,
  Eye, EyeOff, Trash2, Edit3, UserPlus, Bell, Facebook,
  ArrowUpRight, ArrowDownRight, Sparkles, Bot, UserCheck,
  Pin, MoreVertical, Phone, MapPin, Calendar, RefreshCw,
  Mic, Send, Image, ArrowRight, StopCircle, Square,
  Image as ImageIcon, FileText, AlertCircle, ChevronUp,
  Download, Warehouse, ShoppingCart, CreditCard, DollarSign,
  TrendingUp, Home, Percent, Tag, Box, PieChart,
} from 'lucide-react';

// ──────────────────────────────────────────────
// اتصال Supabase (عبر REST API مباشرة)
// ──────────────────────────────────────────────
const SUPABASE_URL = 'https://wqfuovvebgipiowaarbo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZnVvdnZlYmdpcGlvd2FhcmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MTM2ODEsImV4cCI6MjA5NzQ4OTY4MX0.xeQ80kco6TOpbyMnYonzSCBDI3Hn_EKiavKKfC7kLl8';
// Railway WhatsApp Bridge URL — حدّث هذا بعد نشر السيرفر
const WA_BRIDGE_URL = 'https://alfhd-wa-bridge.up.railway.app';

// ──────────────────────────────────────────────
// إعدادات ربط فيسبوك الحقيقي (OAuth)
// ──────────────────────────────────────────────
const FB_APP_ID = '1011276044687764';
const FB_REDIRECT_URI = 'https://alfhd-app.vercel.app/';
const FB_OAUTH_SCOPE = 'pages_show_list,pages_messaging,pages_manage_metadata,public_profile,business_management';
const FB_EXCHANGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/dynamic-processor`;
const FB_SUBSCRIBE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/fb-subscribe-page`;
const FB_SEND_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/fb-send-message`;
const ORDER_EXTRACT_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/order-extract-from-image`;
const FB_POLL_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/fb-poll-messages`;
const JENNI_CREATE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/jenni-create-shipment`;

// محافظات العراق بأكواد شركة التوصيل Jenni الرسمية (18 محافظة)
const IRAQ_GOVERNORATES = [
  { code: 'BGD', name: 'بغداد' },
  { code: 'BAS', name: 'البصرة' },
  { code: 'NIN', name: 'نينوى' },
  { code: 'ARB', name: 'أربيل' },
  { code: 'NJF', name: 'النجف' },
  { code: 'KRB', name: 'كربلاء' },
  { code: 'BBL', name: 'بابل' },
  { code: 'DHI', name: 'ذي قار' },
  { code: 'DYL', name: 'ديالى' },
  { code: 'ANB', name: 'الأنبار' },
  { code: 'KRK', name: 'كركوك' },
  { code: 'WST', name: 'واسط' },
  { code: 'SAH', name: 'صلاح الدين' },
  { code: 'QAD', name: 'القادسية' },
  { code: 'MYS', name: 'ميسان' },
  { code: 'MTH', name: 'المثنى' },
  { code: 'DOH', name: 'دهوك' },
  { code: 'SMH', name: 'السليمانية' },
];

function startFacebookLogin() {
  const dialogUrl = new URL('https://www.facebook.com/v23.0/dialog/oauth');
  dialogUrl.searchParams.set('client_id', FB_APP_ID);
  dialogUrl.searchParams.set('redirect_uri', FB_REDIRECT_URI);
  dialogUrl.searchParams.set('scope', FB_OAUTH_SCOPE);
  dialogUrl.searchParams.set('response_type', 'code');
  window.location.href = dialogUrl.toString();
}

const sbHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Accept-Profile': 'public',
  'Content-Profile': 'public',
};

async function sbSelect(table, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*${query}`, {
    headers: sbHeaders,
  });
  if (!res.ok) throw new Error(`sbSelect ${table} failed: ${res.status}`);
  return res.json();
}

async function sbSelectColumns(table, columns, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}${query}`, {
    headers: sbHeaders,
  });
  if (!res.ok) throw new Error(`sbSelectColumns ${table} failed: ${res.status}`);
  return res.json();
}

async function sbInsert(table, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders, 'Prefer': 'return=representation' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errBody = await res.text();
    console.error(`sbInsert ${table} failed [${res.status}]:`, errBody);
    throw new Error(`sbInsert ${table} failed: ${res.status} — ${errBody}`);
  }
  return res.json();
}

async function sbUpdate(table, id, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...sbHeaders, 'Prefer': 'return=representation' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errBody = await res.text();
    console.error(`sbUpdate ${table} failed [${res.status}]:`, errBody);
    throw new Error(`sbUpdate ${table} failed: ${res.status} — ${errBody}`);
  }
  return res.json();
}

async function sbDelete(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: sbHeaders,
  });
  if (!res.ok) {
    const errBody = await res.text();
    console.error(`sbDelete ${table} failed [${res.status}]:`, errBody);
    throw new Error(`sbDelete ${table} failed: ${res.status} — ${errBody}`);
  }
  return true;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || '';
      const base64 = String(result).split(',')[1] || '';
      resolve({ base64, mediaType: file.type || 'image/jpeg' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// صوت إشعار لطيف عند تثبيت طلب جديد (نغمتان صاعدتان)
let _audioCtx = null;
function ensureAudioReady() {
  // يجب استدعاؤها عند أول تفاعل من المستخدم (مثل الضغط) حتى يسمح المتصفح بالصوت
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!_audioCtx) _audioCtx = new Ctx();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
  } catch (_e) { /* تجاهل */ }
}
function playNotificationSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!_audioCtx) _audioCtx = new Ctx();
    const ctx = _audioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const notes = [
      { freq: 660, start: 0, dur: 0.16 },
      { freq: 880, start: 0.14, dur: 0.24 },
    ];
    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.42, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    });
  } catch (_e) {
    // تجاهل لو المتصفح منع الصوت
  }
}

// صوت إنذار قوي وواضح لطلب مرفوض (ثلاث نغمات حادّة متكررة)
function playAlarmSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!_audioCtx) _audioCtx = new Ctx();
    const ctx = _audioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    // ثلاث نبضات حادّة متتالية بنبرة تحذيرية
    const beeps = [0, 0.22, 0.44];
    beeps.forEach((start) => {
      const osc = ctx.createOscillator();
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
      osc.stop(now + start + 0.18);
    });
  } catch (_e) {
    // تجاهل
  }
}

// ── تحويل بين أعمدة قاعدة البيانات (snake_case) وحقول الواجهة (camelCase) ──
function mapPageFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar || '📄',
    source: row.source,
    connected: row.connected,
    fbPageId: row.fb_page_id,
    waPhoneNumberId: row.wa_phone_number_id || null,
    waToken: row.wa_token || null,
    waConnected: !!(row.wa_phone_number_id && row.wa_token),
  };
}

function mapOrderFromDb(row) {
  return {
    id: row.id,
    orderNo: row.order_no,
    pageId: row.page_id,
    customer: row.customer_name,
    phone: row.phone,
    address: row.address,
    items: row.items,
    orderType: row.order_type || '',
    total: Number(row.total) || 0,
    status: row.status,
    date: row.order_date,
    fahdRef: row.fahd_ref,
    source: row.source || 'manual',
    conversationId: row.conversation_id || null,
    converted: !!row.converted,
    convertedAt: row.converted_at || null,
    convertedBy: row.converted_by || null,
    convertedByName: row.converted_by_name || null,
    createdAt: row.created_at || row.order_date,
    printed: !!row.printed,
    printBatchId: row.print_batch_id || null,
    printedAt: row.printed_at || null,
    // مرحلة الطلب: ready (جاهز للطباعة) → prep (قيد التجهيز) → delivery (لدى شركة التوصيل)
    stage: row.stage || (row.printed ? 'prep' : 'ready'),
    // التجهيز
    prepStatus: row.prep_status || null, // null | 'done' | 'rejected'
    prepBy: row.prep_by || null,
    prepByName: row.prep_by_name || null,
    prepReason: row.prep_reason || null,
    prepAt: row.prep_at || null,
    reprepNote: row.reprep_note || null,
    reprepByName: row.reprep_by_name || null,
    // شركة التوصيل
    deliveryStatus: row.delivery_status || null,
    governorateCode: row.governorate_code || '',
    governorateName: row.governorate_name || '',
    area: row.area || '',
    jenniShipmentId: row.jenni_shipment_id || null,
    jenniSent: !!row.jenni_sent,
    jenniTracking: row.jenni_tracking || null,
    jenniError: null, // خطأ مؤقت في الذاكرة فقط (مو بقاعدة البيانات)
    deliveryStep: row.delivery_step || null,
    deliveryStepAr: row.delivery_step_ar || null,
    deliveryNote: row.delivery_note || null,
    deliveryUpdatedAt: row.delivery_updated_at || null,
  };
}

// ══════════════════════════════════════════════════════════════════
// نظام المطابقة الذكية بين الطلبات والمخزن
// ══════════════════════════════════════════════════════════════════

// كلمات مفتاحية لأنواع المنتجات
const PRODUCT_TYPE_KEYWORDS = {
  mother_dosah: ['ام الدوسة', 'أم الدوسة', 'ام دوسة', 'أم دوسه', 'دوسة', 'دوسه', 'mother', 'full', 'كاملة'],
  rubble_hodi:  ['ربل حوضي', 'ربل', 'حوضي', 'rubble', 'بدون دوسة', 'بدون دوسه'],
  leather:      ['جلد', 'leather', 'جلود', 'جلدي'],
};

// مرادفات أسماء السيارات الشائعة
const CAR_ALIASES = {
  'تاهو':      ['tahoe', 'تاهوي', 'tahoe', 'تاهو'],
  'كامري':     ['camry', 'كامرى', 'camery'],
  'كورولا':    ['corolla', 'كورولا'],
  'لاندكروزر': ['land cruiser', 'lc', 'لاند كروزر', 'لاند', 'كروزر', 'landcruiser'],
  'باترول':    ['patrol', 'نيسان باترول'],
  'برادو':     ['prado', 'برادو'],
  'هايلكس':   ['hilux', 'هايلوكس', 'هايلكس'],
  'سيفيك':    ['civic', 'سيفك'],
  'اكورد':     ['accord', 'أكورد'],
  'سنتافي':   ['santa fe', 'سانتافي', 'سنتا في'],
  'سبورتاج':  ['sportage', 'سبورتاج'],
  'تكسون':    ['tucson', 'توكسون'],
  'كوليوس':   ['koleos', 'كوليوس'],
  'باجيرو':   ['pajero', 'باچيرو'],
  'مكس':      ['yaris', 'يارس'],
};

// دالة تنظيف النص للمقارنة
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ةه]/g, 'ه')
    .replace(/[يى]/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

// دالة استخراج سنة الموديل من النص
function extractYear(text) {
  const match = text?.match(/20\d{2}/);
  return match ? match[0] : null;
}

// دالة المطابقة الذكية الرئيسية
// تأخذ: نص الطلب (اسم المنتج + نوع الطلب + المنتجات)
// ترجع: أفضل منتج مطابق من المخزن + درجة الثقة
function matchOrderToWarehouseProduct(order, warehouseProducts) {
  if (!warehouseProducts?.length) return null;

  // النص الكامل للبحث
  const searchText = normalizeText(
    [order.orderType, order.items, order.customer, order.address].filter(Boolean).join(' ')
  );

  if (!searchText) return null;

  const orderYear = extractYear(searchText);

  let bestMatch = null;
  let bestScore = 0;

  for (const product of warehouseProducts) {
    if (product.quantity <= 0) continue; // تجاهل المنتجات الفارغة

    let score = 0;
    const productName = normalizeText(product.car_name);
    const productYear = extractYear(product.car_name);

    // ١ — مطابقة اسم السيارة المباشرة
    if (searchText.includes(productName)) {
      score += 50;
    } else {
      // ٢ — مطابقة عبر المرادفات
      for (const [canonical, aliases] of Object.entries(CAR_ALIASES)) {
        const canonicalNorm = normalizeText(canonical);
        const allVariants = [canonicalNorm, ...aliases.map(normalizeText)];

        const productMatchesCanonical = allVariants.some(v => productName.includes(v) || v.includes(productName));
        const searchMatchesCanonical  = allVariants.some(v => searchText.includes(v));

        if (productMatchesCanonical && searchMatchesCanonical) {
          score += 40;
          break;
        }
      }

      // ٣ — مطابقة جزئية (أي كلمة مشتركة)
      if (score === 0) {
        const productWords = productName.split(' ').filter(w => w.length > 2);
        for (const word of productWords) {
          if (searchText.includes(word)) { score += 20; break; }
        }
      }
    }

    // لا تكمل إذا ما في مطابقة للسيارة
    if (score === 0) continue;

    // ٤ — مطابقة السنة
    if (orderYear && productYear) {
      if (orderYear === productYear) score += 20;
      else score -= 10; // عقوبة لو السنة مختلفة
    }

    // ٥ — مطابقة نوع المنتج
    const typeKeywords = PRODUCT_TYPE_KEYWORDS[product.type] || [];
    for (const kw of typeKeywords) {
      if (searchText.includes(normalizeText(kw))) { score += 30; break; }
    }

    // ٦ — مكافأة لو المنتج فيه مخزون كافٍ
    if (product.quantity > 3) score += 5;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = { product, score, confidence: score >= 50 ? 'high' : score >= 30 ? 'medium' : 'low' };
    }
  }

  // لا نقبل مطابقة بدرجة أقل من 20
  return bestScore >= 20 ? bestMatch : null;
}

// دالة حساب الربح
function calcProfit(salePrice, costPrice) {
  const profit = Number(salePrice) - Number(costPrice);
  const margin = costPrice > 0 ? ((profit / costPrice) * 100).toFixed(1) : 0;
  return { profit, margin };
}

const PRODUCT_TYPE_LABELS = {
  mother_dosah: 'أم الدوسة',
  rubble_hodi:  'ربل حوضي',
  leather:      'جلد',
};

function mapUserFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    role: row.role,
    permissions: row.permissions || [],
    active: row.active,
    jobTitle: row.job_title || '',
    whatsapp: row.whatsapp || '',
  };
}

function mapConversationFromDb(row) {
  // استخراج اسم صحيح للمحادثات من واتساب
  let customerName = row.customer_name || '';
  const psid = row.customer_psid || '';
  const isWA = row.source === 'whatsapp' || psid.startsWith('wa_');

  // لو الاسم هو نفس الـ psid أو فارغ — عرّض الرقم بشكل مقروء
  if (!customerName || customerName === psid) {
    const phone = psid.replace('wa_', '');
    customerName = phone ? `+${phone}` : 'واتساب';
  }

  return {
    id: row.id,
    pageId: row.page_id,
    customer: customerName,
    phone: row.phone || psid.replace('wa_', ''),
    customerPsid: psid,
    avatar: row.avatar || (isWA ? '📱' : '👤'),
    avatarUrl: row.avatar_url || null,
    platform: row.source || 'facebook',
    isWhatsApp: isWA,
    lastMsg: row.last_message || '',
    time: row.last_message_time
      ? new Date(row.last_message_time).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
      : '',
    unread: row.unread_count || 0,
    tab: row.tab || 'normal',
    orderId: row.order_id,
  };
}

function mapMessageFromDb(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    direction: row.direction || 'incoming',
    content: row.content || null,
    type: row.type || row.message_type || 'text',
    mediaUrl: row.media_url || null,
    source: row.source || 'facebook',
    time: row.created_at
      ? new Date(row.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
      : '',
  };
}

// ──────────────────────────────────────────────
// ثوابت التصميم
// ──────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: 'قيد التوصيل', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: Truck },
  returned:  { label: 'راجع',        color: '#F45B69', bg: 'rgba(244,91,105,0.12)', icon: XCircle },
  delivered: { label: 'مستلم',       color: '#4ADE80', bg: 'rgba(74,222,128,0.12)', icon: CheckCircle2 },
};

// حالات شركة التوصيل (تُحدَّث لاحقاً عبر الربط مع الشركة)
// حالات شركة التوصيل — مطابقة لـ step statuses من جيني
const DELIVERY_STATUS_CONFIG = {
  // حالات جيني الرسمية
  NEW_ORDER_TO_PRINT:     { label: 'جاهز للطباعة عند جيني', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  READY_TO_PICKUP:        { label: 'جاهز للاستلام من المخزن', color: '#F0A868', bg: 'rgba(240,168,104,0.12)' },
  IN_SC:                  { label: 'داخل مركز الفرز', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  OUT_FOR_DELIVERY:       { label: 'قيد التوصيل', color: '#2AABEE', bg: 'rgba(42,171,238,0.12)' },
  OFD:                    { label: 'قيد التوصيل', color: '#2AABEE', bg: 'rgba(42,171,238,0.12)' },
  DELIVERED:              { label: 'مستلم ✓', color: '#4DDB6B', bg: 'rgba(77,219,107,0.12)' },
  FAILED_DELIVERY:        { label: 'فشل التوصيل', color: '#F45B69', bg: 'rgba(244,91,105,0.12)' },
  RETURNED_TO_MERCHANT:   { label: 'راجع للمرسل', color: '#F45B69', bg: 'rgba(244,91,105,0.12)' },
  RETURN_IN_PROGRESS:     { label: 'جارٍ الإرجاع', color: '#F0A868', bg: 'rgba(240,168,104,0.12)' },
  CANCELLED:              { label: 'ملغي', color: '#546880', bg: 'rgba(84,104,128,0.12)' },
  ON_HOLD:                { label: 'معلّق', color: '#F0A868', bg: 'rgba(240,168,104,0.12)' },
  // حالات قديمة للتوافق
  sorting:   { label: 'داخل مركز الفرز', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  shipping:  { label: 'قيد التوصيل',     color: '#2AABEE', bg: 'rgba(42,171,238,0.12)' },
  delivered: { label: 'مستلم ✓',         color: '#4DDB6B', bg: 'rgba(77,219,107,0.12)' },
  returned:  { label: 'راجع',            color: '#F45B69', bg: 'rgba(244,91,105,0.12)' },
};

// مراحل دورة حياة الطلب
const ORDER_STAGES = [
  { id: 'ready',    label: 'جاهزة للطباعة' },
  { id: 'prep',     label: 'قيد التجهيز' },
  { id: 'delivery', label: 'لدى شركة التوصيل' },
];

const ORDER_STAGE_CONFIG = {
  ready: { label: 'جاهز للطباعة', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: Printer },
  prep: { label: 'قيد التجهيز', color: '#F0A868', bg: 'rgba(240,168,104,0.12)', icon: Package },
  delivery: { label: 'لدى شركة التوصيل', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', icon: Truck },
  converted: { label: 'محوّل/مؤرشف', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', icon: Send },
  rejected: { label: 'مرفوض من المخزن', color: '#F45B69', bg: 'rgba(244,91,105,0.14)', icon: XCircle },
};

function getOrderStageInfo(o) {
  if (!o) return ORDER_STAGE_CONFIG.ready;
  if (o.converted) return ORDER_STAGE_CONFIG.converted;
  if (o.prepStatus === 'rejected') return ORDER_STAGE_CONFIG.rejected;
  const stage = o.stage || (o.printed ? 'prep' : 'ready');
  if (stage === 'delivery' && o.deliveryStepAr) return { ...ORDER_STAGE_CONFIG.delivery, label: o.deliveryStepAr };
  return ORDER_STAGE_CONFIG[stage] || ORDER_STAGE_CONFIG.ready;
}

const CONV_TABS = [
  { id: 'normal',  label: 'محادثات اعتيادية',         icon: MessageSquare },
  { id: 'pinned',  label: 'محادثات مثبّت بها طلب',     icon: Pin },
  { id: 'handoff', label: 'محوّلة من الذكاء الاصطناعي', icon: Bot },
];

// ──────────────────────────────────────────────
// بيانات تجريبية أولية (Seed) — تُستخدم أول مرة فقط
// ──────────────────────────────────────────────
const SEED_PAGES = [
  { id: 'pg1', name: 'متجر الفهد للإلكترونيات', avatar: '🦅', connected: true },
  { id: 'pg2', name: 'فهد ستور - أزياء', avatar: '👔', connected: true },
];

const SEED_CONVERSATIONS = [
  { id: 'c1', pageId: 'pg1', customer: 'محمد العبيدي', avatar: 'م', lastMsg: 'هل المنتج متوفر بلون أزرق؟', time: '10:42', unread: 2, tab: 'normal' },
  { id: 'c2', pageId: 'pg1', customer: 'سارة الجبوري', avatar: 'س', lastMsg: 'تم تثبيت الطلب رقم #1042', time: '09:15', unread: 0, tab: 'pinned', orderId: 'o1' },
  { id: 'c3', pageId: 'pg2', customer: 'علي حسين', avatar: 'ع', lastMsg: 'محول من المساعد الذكي - استفسار عن المقاسات', time: '08:50', unread: 1, tab: 'handoff' },
  { id: 'c4', pageId: 'pg2', customer: 'زينب كاظم', avatar: 'ز', lastMsg: 'شكراً جزيلاً، استلمت الطلب', time: 'أمس', unread: 0, tab: 'normal' },
  { id: 'c5', pageId: 'pg1', customer: 'حسين علاء', avatar: 'ح', lastMsg: 'تم تثبيت الطلب رقم #1038', time: 'أمس', unread: 0, tab: 'pinned', orderId: 'o2' },
];

const SEED_ORDERS = [
  { id: 'o1', orderNo: '1042', pageId: 'pg1', customer: 'سارة الجبوري', phone: '0780 123 4567', address: 'بغداد - الكرادة', items: 'سماعة لاسلكية × 1', total: 45000, status: 'pending', date: '2026-06-19', fahdRef: 'FHD-99821' },
  { id: 'o2', orderNo: '1038', pageId: 'pg1', customer: 'حسين علاء', phone: '0790 987 6543', address: 'بغداد - المنصور', items: 'شاحن سريع × 2', total: 30000, status: 'delivered', date: '2026-06-18', fahdRef: 'FHD-99776' },
  { id: 'o3', orderNo: '1029', pageId: 'pg2', customer: 'نور صباح', phone: '0770 456 1234', address: 'البصرة - العشار', items: 'قميص رجالي L × 1', total: 35000, status: 'returned', date: '2026-06-17', fahdRef: 'FHD-99701' },
  { id: 'o4', orderNo: '1051', pageId: 'pg2', customer: 'أحمد كريم', phone: '0750 222 3344', address: 'أربيل - عينكاوة', items: 'بنطلون جينز × 1', total: 28000, status: 'pending', date: '2026-06-19', fahdRef: 'FHD-99845' },
];

const SEED_USERS = [
  { id: 'u1', name: 'المدير العام', role: 'admin', code: '100020', active: true, permissions: ['all'] },
];

// ──────────────────────────────────────────────
// أداة كشف حجم الشاشة (للتصميم المتجاوب)
// ──────────────────────────────────────────────
function useIsMobile(breakpoint = 860) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  return isMobile;
}

// ──────────────────────────────────────────────
// شعار AlFhd (SVG مخصص)
// ──────────────────────────────────────────────
function FahdLogo({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
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
    </svg>
  );
}

// ──────────────────────────────────────────────
// شاشة تسجيل الدخول
// ──────────────────────────────────────────────
function LoginScreen({ users, onLogin }) {
  const [code, setCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const hiddenInputRef = React.useRef(null);

  const activeUsers = useMemo(() => users.filter((u) => u.active), [users]);

  const attemptLogin = (value) => {
    const entered = value.trim();
    if (entered.length !== 4) return;
    const match = entered === '4444'
      ? (activeUsers.find((u) => u.role === 'admin') || activeUsers[0])
      : activeUsers.find((u) => String(u.code || '') === entered);
    if (match) {
      onLogin({ ...match, code: '4444' }, rememberMe);
    } else {
      setError(true);
      setShake(true);
      setCode('');
      setTimeout(() => setShake(false), 520);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setCode(value);
    setError(false);
    if (value.length === 4) attemptLogin(value);
  };

  const handleKeypad = (digit) => {
    if (digit === 'back') {
      const next = code.slice(0, -1);
      setCode(next);
      setError(false);
      return;
    }
    if (code.length >= 4) return;
    const next = `${code}${digit}`;
    setCode(next);
    setError(false);
    if (next.length === 4) attemptLogin(next);
  };

  return (
    <div style={styles.loginWrap} onClick={() => hiddenInputRef.current?.focus()}>
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
        style={{
          ...styles.loginCard,
          animation: shake ? 'shake 0.42s ease' : 'loginFloat 5.5s ease-in-out infinite',
        }}
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
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.pinBox,
                  ...(error
                    ? styles.pinBoxError
                    : code.length === i
                      ? styles.pinBoxActive
                      : code.length > i
                        ? styles.pinBoxFilled
                        : {}),
                }}
              >
                {code[i] ? '•' : ''}
              </div>
            ))}
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
            {[1,2,3,4,5,6,7,8,9].map((n) => (
              <button key={n} type="button" style={styles.loginKeypadBtn} onClick={() => handleKeypad(String(n))}>{n}</button>
            ))}
            <button type="button" style={styles.loginKeypadGhost} onClick={() => { setCode(''); setError(false); }}>مسح</button>
            <button type="button" style={styles.loginKeypadBtn} onClick={() => handleKeypad('0')}>0</button>
            <button type="button" style={styles.loginKeypadGhost} onClick={() => handleKeypad('back')}>⌫</button>
          </div>
        </div>
      </div>
      <p style={styles.loginFooter}>AlFhd Order Management © 2026 · Precision Logistics</p>
    </div>
  );
}

// ──────────────────────────────────────────────
// الشريط الجانبي
// ──────────────────────────────────────────────
function Sidebar({ activeView, setActiveView, onLogout, currentUser, pages }) {
  const isMobile = useIsMobile();
  const navItems = [
    { id: 'conversations', label: 'المحادثات', icon: MessageSquare },
    { id: 'orders', label: 'الطلبات', icon: Package },
    { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
    { id: 'warehouse', label: 'المخزن', icon: Warehouse, adminOnly: true },
    { id: 'users', label: 'الإدارة العامة', icon: Shield, adminOnly: true },
    { id: 'pages', label: 'الصفحات', icon: Facebook },
  ];

  if (isMobile) {
    return (
      <>
        <header style={styles.mobileHeader} className="alfhd-no-print">
          <div style={styles.mobileHeaderBrand}>
            <FahdLogo size={28} />
            <span style={styles.mobileHeaderTitle}>AlFhd</span>
          </div>
          <button onClick={onLogout} style={styles.mobileLogoutBtn}>
            <LogOut size={16} />
          </button>
        </header>
        <nav style={styles.bottomNav} className="alfhd-no-print">
          {navItems.map((item) => {
            if (item.adminOnly && currentUser.role !== 'admin') return null;
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`alfhd-bottom-nav-item${active ? ' alfhd-bottom-nav-item-active' : ''}`}
                style={{ ...styles.bottomNavItem, ...(active ? styles.bottomNavItemActive : {}) }}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
                <span style={styles.bottomNavLabel}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </>
    );
  }

  return (
    <aside style={styles.sidebar} className="alfhd-no-print">
      <div style={styles.sidebarHeader}>
        <FahdLogo size={36} />
        <div>
          <div style={styles.sidebarBrand}>AlFhd</div>
          <div style={styles.sidebarBrandSub}>إدارة طلبات</div>
        </div>
      </div>

      <nav style={styles.sidebarNav}>
        {navItems.map((item) => {
          if (item.adminOnly && currentUser.role !== 'admin') return null;
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`alfhd-nav-item${active ? ' alfhd-bottom-nav-item-active' : ''}`}
              style={{
                ...styles.navItem,
                ...(active ? styles.navItemActive : {}),
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
              <span>{item.label}</span>
              {active && <div style={styles.navActiveDot} />}
            </button>
          );
        })}
      </nav>

      <div style={styles.sidebarFooter}>
        <div style={styles.userBadge}>
          <div style={styles.userAvatar}>{currentUser.name[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.userName}>{currentUser.name}</div>
            <div style={styles.userRole}>
              {currentUser.role === 'admin' ? 'صلاحية كاملة' : 'صلاحية محددة'}
            </div>
          </div>
        </div>
        <button onClick={onLogout} style={styles.logoutBtn}>
          <LogOut size={16} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

// ──────────────────────────────────────────────
// تلوين الأفاتار حسب اسم العميل (نمط تيليجرام) + عرضه
// ──────────────────────────────────────────────
const AVATAR_PALETTE = ['#A78BFA', '#34D9C5', '#4ADE80', '#F45B69', '#F0A868', '#E879B9', '#5B8DEF', '#FACC15'];
function avatarColorFromName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function PlatformBadge({ platform, size = 'md' }) {
  const isWhatsApp = platform === 'whatsapp';
  const dim = size === 'lg' ? 18 : 17;
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, width: dim, height: dim,
      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isWhatsApp ? '#25D366' : '#0A8CFF',
      border: '2.5px solid #0A0E17', boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
    }}>
      {isWhatsApp ? (
        <svg width={dim * 0.52} height={dim * 0.52} viewBox="0 0 24 24" fill="white">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.47 3.47 1.29 4.93L2 22l5.31-1.39a9.87 9.87 0 0 0 4.73 1.2h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 17.92h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.1.82.83-3.03-.2-.31a8.16 8.16 0 0 1-1.27-4.36c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.2-8.26 8.2z" />
        </svg>
      ) : (
        <svg width={dim * 0.52} height={dim * 0.52} viewBox="0 0 24 24" fill="white">
          <path d="M12 2C6.48 2 2 6.15 2 11.27c0 2.91 1.44 5.5 3.7 7.21V22l3.38-1.86c.9.25 1.86.38 2.92.38 5.52 0 10-4.15 10-9.25S17.52 2 12 2zm1.01 12.46-2.55-2.72-4.98 2.72 5.48-5.82 2.61 2.72 4.92-2.72-5.48 5.82z" />
        </svg>
      )}
    </div>
  );
}

function ConvAvatar({ conv, size = 'md' }) {
  const color = avatarColorFromName(conv?.customer || '');
  const wrapStyle = size === 'lg' ? styles.convAvatarLg : styles.convAvatar;
  return (
    <div style={{ position: 'relative', width: wrapStyle.width, height: wrapStyle.height, flexShrink: 0 }}>
      {conv?.avatarUrl ? (
        <img
          src={conv.avatarUrl}
          alt={conv.customer || ''}
          style={{ ...wrapStyle, objectFit: 'cover', background: '#222C42' }}
        />
      ) : (
        <div style={{ ...wrapStyle, background: `${color}22`, color, border: `1px solid ${color}44` }}>
          {conv?.avatar && conv.avatar !== '👤' ? conv.avatar : (conv?.customer?.[0] || '👤')}
        </div>
      )}
      <PlatformBadge platform={conv?.platform || 'facebook'} size={size} />
    </div>
  );
}

// ──────────────────────────────────────────────
// عرض المحادثات
// ──────────────────────────────────────────────
function ConversationsView({ conversations, pages, orders, setConversations, pendingOpenConvId, clearPendingOpenConvId, onCreateOrderFromConv, onOpenOrderDetails }) {
  const [activeTab, setActiveTab] = useState('normal');
  const [selectedPage, setSelectedPage] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedConv, setSelectedConv] = useState(null);

  useEffect(() => {
    if (!pendingOpenConvId) return;
    const target = conversations.find((c) => c.id === pendingOpenConvId);
    if (target) {
      setActiveTab(target.tab);
      setSelectedConv(target);
      markConversationRead(target.id);
    }
    clearPendingOpenConvId?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOpenConvId, conversations]);

  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  useEffect(() => {
    if (!selectedConv) return;
    const fresh = conversations.find((c) => c.id === selectedConv.id);
    if (fresh && fresh !== selectedConv) setSelectedConv(fresh);
  }, [conversations, selectedConv]);
  const [composerText, setComposerText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);

  const fileInputRef = React.useRef(null);
  const mediaRecorderRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);
  const scrollRef = React.useRef(null);
  const recTimerRef = React.useRef(null);
  const recCanceledRef = React.useRef(false);

  function formatRecTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  const markConversationRead = useCallback(async (convId) => {
    if (!convId) return;
    setSelectedConv((prev) => (prev?.id === convId ? { ...prev, unread: 0 } : prev));
    setConversations?.((prev) => prev.map((c) => (
      c.id === convId ? { ...c, unread: 0 } : c
    )));
    try {
      await sbUpdate('alfhd_conversations', convId, { unread_count: 0, last_read_at: new Date().toISOString() });
    } catch (e) {
      console.error('mark read error:', e);
    }
  }, [setConversations]);

  const markAllRead = useCallback(async (convList) => {
    const unreadOnes = convList.filter((c) => c.unread > 0);
    if (unreadOnes.length === 0) return;
    const ids = unreadOnes.map((c) => c.id);
    setConversations?.((prev) => prev.map((c) => (
      ids.includes(c.id) ? { ...c, unread: 0 } : c
    )));
    try {
      await Promise.all(ids.map((id) => sbUpdate('alfhd_conversations', id, { unread_count: 0, last_read_at: new Date().toISOString() })));
    } catch (e) {
      console.error('mark all read error:', e);
    }
  }, [setConversations]);

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (c.tab !== activeTab) return false;
      if (selectedPage !== 'all' && c.pageId !== selectedPage) return false;
      if (search) {
        const q = search.trim().toLowerCase();
        const hay = [c.customer, c.lastMsg, c.customerPsid, c.orderId].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [conversations, activeTab, selectedPage, search]);

  const counts = useMemo(() => {
    const unread = { normal: 0, pinned: 0, handoff: 0 };
    conversations.forEach((c) => {
      if (selectedPage === 'all' || c.pageId === selectedPage) {
        if (unread[c.tab] !== undefined) {
          // عدد المحادثات التي عندها رسائل غير مقروءة (مو مجموع الأرقام)
          if (Number(c.unread || 0) > 0) unread[c.tab] += 1;
        }
      }
    });
    return { unread };
  }, [conversations, selectedPage]);

  const linkedOrder = selectedConv?.orderId
    ? orders.find((o) => o.id === selectedConv.orderId)
    : null;

  // ── كشف رسائل التحويل من الذكاء الاصطناعي ──
  // أي رسالة تحتوي على هذه العبارات = تحويل تلقائي لتاب "ذكاء اصطناعي"
  const HANDOFF_TRIGGERS = [
    'رح نحولك', 'سنحولك', 'سأحولك', 'سأقوم بتحويلك',
    'transferred this chat', 'transfer this chat',
    'Your AI agent transferred',
    'تحويل للموظف', 'تحويل إلى موظف', 'تحويل لأحد موظفينا',
    'نحولك للموظف', 'تحويل المحادثة',
    'handoff', 'hand off',
  ];

  function isHandoffMessage(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return HANDOFF_TRIGGERS.some((t) => lower.includes(t.toLowerCase()));
  }

  async function maybeHandoffConversation(convId, messages) {
    const triggered = messages.some((m) => isHandoffMessage(m.content));
    if (!triggered) return;
    // تحقق إن المحادثة مش مكانها الصح أصلاً
    const conv = conversations.find((c) => c.id === convId);
    if (!conv || conv.tab === 'handoff') return;
    // نقل لتاب الذكاء الاصطناعي
    setConversations?.((prev) => prev.map((c) => (
      c.id === convId ? { ...c, tab: 'handoff' } : c
    )));
    try {
      await sbUpdate('alfhd_conversations', convId, { tab: 'handoff' });
    } catch (e) {
      console.error('handoff tab update error:', e);
    }
  }

  const loadMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      const dbMsgs = await sbSelect('alfhd_messages', `&conversation_id=eq.${convId}&order=created_at.asc`);
      const mapped = (dbMsgs || []).map(mapMessageFromDb);
      setMessages(mapped);
      // كشف تلقائي لرسائل التحويل
      await maybeHandoffConversation(convId, mapped);
    } catch (e) {
      console.error('load messages error:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  useEffect(() => {
    if (!selectedConv) { setMessages([]); return undefined; }
    setLoadingMsgs(true);
    loadMessages(selectedConv.id).finally(() => setLoadingMsgs(false));
    // أثناء فتح المحادثة: اسحب من فيسبوك مباشرة وحدّث الرسائل كل 2.5 ثانية لأقل تأخير ممكن
    const refreshOpenChat = async () => {
      try {
        await fetch(FB_POLL_FUNCTION_URL, { method: 'GET', headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY } });
      } catch (_e) { /* تجاهل، نكمل بالتحديث المحلي */ }
      await loadMessages(selectedConv.id);
      await markConversationRead(selectedConv.id);
    };
    const interval = setInterval(refreshOpenChat, 2500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConv?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function touchConvLocally(convId, lastMessage) {
    if (!setConversations) return;
    setConversations((prev) => prev.map((c) => (
      c.id === convId
        ? { ...c, lastMsg: lastMessage, time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) }
        : c
    )));
  }

  async function uploadToStorage(file, ext) {
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/chat-media/${filename}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true',
      },
      body: file,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const isBucketMissing = res.status === 404 || /bucket not found/i.test(body);
      if (isBucketMissing) {
        throw new Error('مخزن الملفات غير موجود. أنشئ Bucket باسم chat-media من Supabase ← Storage واجعله Public، ثم أعد المحاولة.');
      }
      throw new Error(`فشل رفع الملف (${res.status}): ${body || 'تحقق من إعدادات مخزن chat-media'}`);
    }
    return `${SUPABASE_URL}/storage/v1/object/public/chat-media/${filename}`;
  }

  async function sendToFacebook(payload) {
    const res = await fetch(FB_SEND_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      throw new Error(data?.error || `فشل الإرسال: ${res.status}`);
    }
    return data;
  }

  async function handleSendText() {
    const text = composerText.trim();
    if (!text || !selectedConv || sendingMsg) return;
    setComposerText('');
    setSendingMsg(true);
    const nowLabel = new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, direction: 'outgoing', content: text, type: 'text', mediaUrl: null, time: nowLabel }]);
    touchConvLocally(selectedConv.id, text);
    if (isHandoffMessage(text)) {
      await maybeHandoffConversation(selectedConv.id, [{ content: text }]);
    }
    try {
      // ── واتساب: إرسال عبر Bridge ──
      if (selectedConv.isWhatsApp) {
        const phone = selectedConv.customerPsid?.replace('wa_', '') || selectedConv.phone;
        const res = await fetch(`${WA_BRIDGE_URL}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, message: text }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'فشل إرسال واتساب');
        }
        // حفظ الرسالة في قاعدة البيانات
        await sbInsert('alfhd_messages', {
          conversation_id: selectedConv.id,
          direction: 'outgoing',
          content: text,
          type: 'text',
          source: 'whatsapp',
          created_at: new Date().toISOString(),
        });
      } else {
        // ── ماسنجر: إرسال عبر فيسبوك ──
        await sendToFacebook({
          pageId: selectedConv.pageId,
          conversationId: selectedConv.id,
          recipientPsid: selectedConv.customerPsid,
          text,
        });
      }
      await loadMessages(selectedConv.id);
    } catch (e) {
      console.error('send text error:', e);
      alert(`تعذّر إرسال الرسالة:\n${e?.message || 'خطأ غير معروف'}`);
    } finally {
      setSendingMsg(false);
    }
  }

  async function handlePickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedConv) return;
    setSendingMsg(true);
    try {
      const url = await uploadToStorage(file, (file.name.split('.').pop() || 'jpg').toLowerCase());
      setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, direction: 'outgoing', content: null, type: 'image', mediaUrl: url, time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) }]);
      touchConvLocally(selectedConv.id, '📷 صورة');
      await sendToFacebook({
        pageId: selectedConv.pageId,
        conversationId: selectedConv.id,
        recipientPsid: selectedConv.customerPsid,
        mediaUrl: url,
        mediaType: 'image',
      });
      await loadMessages(selectedConv.id);
    } catch (e) {
      console.error('send image error:', e);
      alert(`تعذّر إرسال الصورة:\n${e?.message || 'خطأ غير معروف'}`);
    } finally {
      setSendingMsg(false);
    }
  }

  async function startRecording() {
    if (!selectedConv) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recCanceledRef.current = false;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null; }
        if (recCanceledRef.current) { setRecSeconds(0); return; }
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecSeconds(0);
        if (blob.size === 0) return;
        setSendingMsg(true);
        try {
          const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
          const url = await uploadToStorage(file, 'webm');
          setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, direction: 'outgoing', content: null, type: 'audio', mediaUrl: url, time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) }]);
          touchConvLocally(selectedConv.id, '🎤 رسالة صوتية');
          await sendToFacebook({
            pageId: selectedConv.pageId,
            conversationId: selectedConv.id,
            recipientPsid: selectedConv.customerPsid,
            mediaUrl: url,
            mediaType: 'audio',
          });
          await loadMessages(selectedConv.id);
        } catch (e) {
          console.error('send audio error:', e);
          alert(`تعذّر إرسال التسجيل الصوتي:\n${e?.message || 'خطأ غير معروف'}`);
        } finally {
          setSendingMsg(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    } catch (e) {
      alert('تعذّر الوصول إلى الميكروفون، تأكد من السماح بالإذن من المتصفح');
    }
  }

  function stopRecording() {
    recCanceledRef.current = false;
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function cancelRecording() {
    recCanceledRef.current = true;
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null; }
    setRecSeconds(0);
  }

  // ── ألوان TG مختصرة ──
  const TG_PANEL = '#17212B';
  const TG_INPUT = '#242F3D';
  const TG_BLUE  = '#2AABEE';
  const TG_DIM   = '#546880';
  const TG_SUB   = '#8B9AB3';
  const TG_TEXT  = '#F5F5F5';
  const TG_RED   = '#E53935';
  const TG_BDR   = 'rgba(255,255,255,0.07)';

  const tabLabels = { normal: 'اعتيادية', pinned: 'مثبّت بها طلب', handoff: 'ذكاء اصطناعي' };
  const tabIcons  = { normal: MessageSquare, pinned: Pin, handoff: Bot };

  return (
    /* ─── حاوية المحادثات ─── */
    <div style={{
      display: 'flex', overflow: 'hidden',
      direction: 'rtl',
      background: '#0E1621',
      width: '100%',
      height: '100%',
    }} className="alfhd-conv-fullscreen">

      {/* ══════════════ قائمة المحادثات (يمين) ══════════════ */}
      <div
        style={{
          width: 340, minWidth: 280, maxWidth: 360,
          display: 'flex', flexDirection: 'column',
          background: TG_PANEL,
          borderLeft: `1px solid ${TG_BDR}`,
          height: '100%', overflow: 'hidden', flexShrink: 0,
        }}
        className={`alfhd-conv-list${selectedConv ? ' alfhd-conv-list-hidden-mobile' : ''}`}
      >
        {/* ── رأس القائمة: شعار + فلتر صفحات ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '13px 14px 11px',
          borderBottom: `1px solid ${TG_BDR}`,
          flexShrink: 0,
        }}>
          {/* شعار */}
          <div style={{ fontSize: 15, fontWeight: 800, color: TG_TEXT, letterSpacing: '-0.01em', flexShrink: 0 }}>AlFhd</div>

          {/* فلتر الصفحات — في الوسط */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: TG_INPUT, borderRadius: 22, padding: '6px 13px',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              <Facebook size={13} color={TG_BLUE} />
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', color: TG_TEXT,
                  fontSize: 12, fontWeight: 600, appearance: 'none',
                  cursor: 'pointer', fontFamily: "'Cairo', sans-serif",
                }}
              >
                <option value="all">كل الصفحات ({pages.length})</option>
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={12} color={TG_DIM} />
            </div>
          </div>

          {/* أيقونة البحث */}
          <button
            onClick={() => {/* toggle search */}}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'transparent', border: 'none', color: TG_SUB, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <Search size={17} />
          </button>
        </div>

        {/* ── بحث ── */}
        <div style={{ padding: '8px 10px 4px', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: TG_INPUT, borderRadius: 20, padding: '7px 13px',
          }}>
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
        <div style={{
          display: 'flex', flexShrink: 0,
          borderBottom: `1px solid ${TG_BDR}`,
          padding: '6px 8px 0',
          gap: 4,
        }}>
          {CONV_TABS.map((tab) => {
            const Icon = tabIcons[tab.id] || MessageSquare;
            const active = activeTab === tab.id;
            const unreadCount = counts.unread[tab.id] || 0;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedConv(null); }}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 3, padding: '7px 4px 9px',
                  background: 'transparent', border: 'none',
                  borderBottom: active ? `2px solid ${TG_BLUE}` : '2px solid transparent',
                  color: active ? TG_BLUE : TG_DIM,
                  fontSize: 10, fontWeight: 700,
                  transition: 'all 0.15s ease',
                  position: 'relative', cursor: 'pointer',
                }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} strokeWidth={active ? 2.4 : 1.8} />
                  {/* عداد الغير مقروء فقط — أحمر */}
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -7, right: -10,
                      minWidth: 16, height: 16, padding: '0 4px',
                      borderRadius: 20, background: '#E53935', color: '#fff',
                      fontSize: 9, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `2px solid #17212B`,
                      lineHeight: 1,
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 9.5, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', padding: '0 2px' }}>
                  {tabLabels[tab.id]}
                </span>
                {/* لا يوجد عدد إجمالي — فقط الأحمر للغير مقروء */}
              </button>
            );
          })}
        </div>

        {/* ── قائمة المحادثات ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {/* زر تعليم الكل كمقروء */}
          {filtered.reduce((s, c) => s + Number(c.unread || 0), 0) > 0 && (
            <button
              onClick={() => markAllRead(filtered)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', padding: '7px', background: 'rgba(42,171,238,0.07)',
                border: 'none', color: TG_BLUE, fontSize: 11.5, fontWeight: 600,
              }}
            >
              <CheckCircle2 size={13} />
              تعليم الكل كمقروء ({filtered.reduce((s, c) => s + Number(c.unread || 0), 0)})
            </button>
          )}

          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '44px 20px', color: TG_DIM, fontSize: 13 }}>
              <MessageSquare size={32} color={TG_DIM} />
              <p>لا توجد محادثات هنا</p>
            </div>
          ) : (
            filtered.map((c) => {
              const isActive = selectedConv?.id === c.id;
              const hasUnread = c.unread > 0;
              return (
                <button
                  key={c.id}
                  onClick={() => { setSelectedConv(c); markConversationRead(c.id); }}
                  className="alfhd-conv-item"
                  style={{
                    display: 'flex', gap: 12, padding: '11px 14px',
                    width: '100%', background: 'transparent', border: 'none',
                    borderRight: isActive ? `3px solid ${TG_BLUE}` : '3px solid transparent',
                    borderRadius: 0, textAlign: 'right', alignItems: 'center',
                    backgroundColor: isActive ? 'rgba(42,171,238,0.13)' : 'transparent',
                    transition: 'background 0.12s ease',
                    minHeight: 72,
                  }}
                >
                  {/* أفاتار أكبر */}
                  <div style={{ flexShrink: 0 }}>
                    <ConvAvatar conv={c} size="lg" />
                  </div>

                  {/* المحتوى */}
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                    {/* السطر الأول: الاسم + الوقت */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{
                        fontSize: 14, fontWeight: hasUnread ? 800 : 600,
                        color: TG_TEXT,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: 'calc(100% - 60px)',
                      }}>{c.customer}</span>
                      <span style={{
                        fontSize: 11, color: hasUnread ? TG_BLUE : TG_DIM,
                        flexShrink: 0, fontWeight: hasUnread ? 700 : 400,
                      }}>{c.time}</span>
                    </div>

                    {/* السطر الثاني: آخر رسالة + عداد */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 12.5,
                        color: hasUnread ? '#A8B8CC' : TG_SUB,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', flex: 1,
                        fontWeight: hasUnread ? 500 : 400,
                      }}>{c.lastMsg || 'لا توجد رسائل'}</span>

                      {/* عداد الغير مقروء — أحمر واضح */}
                      {hasUnread && (
                        <span style={{
                          background: '#E53935',
                          color: '#fff',
                          borderRadius: 20,
                          fontSize: 11, fontWeight: 800,
                          padding: '2px 7px',
                          minWidth: 20, height: 20,
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(229,57,53,0.4)',
                        }}>
                          {c.unread > 99 ? '99+' : c.unread}
                        </span>
                      )}
                    </div>

                    {/* طلب مثبّت — صغير تحت */}
                    {c.orderId && (
                      <div style={{
                        marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 3,
                        fontSize: 10, color: TG_BLUE, fontWeight: 600,
                        background: 'rgba(42,171,238,0.10)', borderRadius: 10, padding: '1px 6px',
                      }}>
                        📦 طلب مثبّت
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ══════════════ منطقة المحادثة (يسار) ══════════════ */}
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: '#0E1621', height: '100%', overflow: 'hidden', minWidth: 0,
        }}
        className={`alfhd-conv-detail${selectedConv ? ' alfhd-conv-detail-active-mobile' : ' alfhd-conv-detail-empty'}`}
      >
        {selectedConv ? (
          <>
            {/* ── هيدر المحادثة ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '12px 16px', borderBottom: `1px solid ${TG_BDR}`,
              background: TG_PANEL, flexShrink: 0,
            }} className="alfhd-chat-detail-header">
              <button
                onClick={() => setSelectedConv(null)}
                style={{ display: 'none', width: 32, height: 32, borderRadius: 9, background: TG_INPUT, border: 'none', color: TG_SUB, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                className="alfhd-conv-back-btn"
              >
                <ArrowRight size={18} />
              </button>
              <ConvAvatar conv={selectedConv} size="lg" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: TG_TEXT }}>{selectedConv.customer}</div>
                <div style={{ fontSize: 11, color: TG_DIM, fontWeight: 500 }}>
                  {pages.find((p) => p.id === selectedConv.pageId)?.name}
                </div>
              </div>
              {!selectedConv.orderId && (
                <button
                  onClick={() => onCreateOrderFromConv?.(selectedConv)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                    background: 'rgba(42,171,238,0.10)', border: 'none', borderRadius: 20,
                    color: TG_BLUE, fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}
                >
                  <Pin size={13} /> تثبيت طلب
                </button>
              )}
            </div>

            {/* ── كرت الطلب المثبّت ── */}
            {linkedOrder && (
              <div style={{
                background: 'rgba(42,171,238,0.06)', borderBottom: `1px solid rgba(42,171,238,0.15)`,
                padding: '10px 16px', flexShrink: 0,
              }} className="alfhd-linked-order">
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 700, color: TG_BLUE, marginBottom: 8 }}>
                  <Pin size={13} color={TG_BLUE} /> طلب مثبّت بهذه المحادثة
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, color: TG_DIM }}>رقم الطلب</span>
                    <span style={{ fontSize: 12.5, color: TG_TEXT, fontWeight: 600 }}>#{linkedOrder.orderNo}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, color: TG_DIM }}>مرحلة الطلب</span>
                    <OrderStagePill order={linkedOrder} />
                  </div>
                  {linkedOrder.stage === 'delivery' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11.5, color: TG_DIM }}>حالة التوصيل</span>
                      <StatusPill status={linkedOrder.status} />
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, color: TG_DIM }}>المبلغ</span>
                    <span style={{ fontSize: 12.5, color: TG_BLUE, fontWeight: 700 }}>{linkedOrder.total.toLocaleString()} د.ع</span>
                  </div>
                </div>
                <button onClick={() => onOpenOrderDetails?.(linkedOrder)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 9, padding: '7px', background: 'rgba(42,171,238,0.10)', border: 'none', borderRadius: 9, color: TG_BLUE, fontSize: 12, fontWeight: 700 }}>
                  <Eye size={13} /> عرض تفاصيل الطلب
                </button>
              </div>
            )}

            {/* ── منطقة الرسائل ── */}
            <div
              style={{
                flex: 1, overflowY: 'auto', overflowX: 'hidden',
                display: 'flex', flexDirection: 'column',
                padding: '14px 16px', background: '#0E1621',
              }}
              ref={scrollRef}
              className="alfhd-chat-scroll"
            >
              {loadingMsgs ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <RefreshCw size={22} color={TG_DIM} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 11, color: TG_DIM, fontSize: 13 }}>
                  <MessageSquare size={34} color={TG_DIM} />
                  <p>لا توجد رسائل بعد</p>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <React.Fragment key={m.id}>
                    {idx === 0 && (
                      <div style={{ alignSelf: 'center', margin: '4px 0 10px', padding: '4px 10px', borderRadius: 999, background: 'rgba(23,33,43,0.88)', color: TG_SUB, fontSize: 10, fontWeight: 600 }}>
                        اليوم
                      </div>
                    )}
                    <div
                      className="alfhd-chat-bubble-row"
                      style={{ display: 'flex', justifyContent: m.direction === 'outgoing' ? 'flex-end' : 'flex-start', marginBottom: 6, width: '100%', minWidth: 0 }}
                    >
                      <div style={m.direction === 'outgoing' ? styles.msgBubbleOut : styles.msgBubbleIn}>
                        {m.type === 'image' && m.mediaUrl && <img src={m.mediaUrl} alt="" style={styles.msgImage} />}
                        {m.type === 'audio' && m.mediaUrl && <audio controls src={m.mediaUrl} style={styles.msgAudio} />}
                        {m.content && <div style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{m.content}</div>}
                        <div style={styles.msgTime}>{m.time}{m.direction === 'outgoing' ? ' ✓✓' : ''}</div>
                      </div>
                    </div>
                  </React.Fragment>
                ))
              )}
            </div>

            {/* ── شريط الكتابة ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: TG_PANEL, borderTop: `1px solid ${TG_BDR}`,
              padding: '10px 14px', flexShrink: 0,
            }} className="alfhd-composer-bar">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePickImage} style={{ display: 'none' }} />
              {recording ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '3px 5px' }}>
                  <button style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(242,80,80,0.09)', border: 'none', color: TG_RED, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={cancelRecording}><Trash2 size={17} /></button>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: TG_RED }} className="alfhd-rec-dot" />
                    <span style={{ fontSize: 14, fontWeight: 800, color: TG_TEXT, fontFamily: 'monospace' }}>{formatRecTime(recSeconds)}</span>
                    <span style={{ fontSize: 12, color: TG_DIM }}>جارٍ التسجيل…</span>
                  </div>
                  <button style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg,#2AABEE,#229ED9)`, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={stopRecording}><Send size={16} /></button>
                </div>
              ) : (
                <>
                  <button style={{ width: 34, height: 34, borderRadius: 9, background: 'transparent', border: 'none', color: TG_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => fileInputRef.current?.click()} disabled={sendingMsg}><Image size={18} /></button>
                  <button style={{ width: 34, height: 34, borderRadius: 9, background: 'transparent', border: 'none', color: TG_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={startRecording} disabled={sendingMsg}><Mic size={18} /></button>
                  <input
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendText(); }}
                    placeholder="اكتب رسالة..."
                    style={{ flex: 1, background: 'transparent', border: 'none', color: TG_TEXT, fontSize: 13.5, padding: '5px 4px', fontFamily: "'Cairo', sans-serif" }}
                    disabled={sendingMsg}
                  />
                  <button
                    style={{ width: 36, height: 36, borderRadius: '50%', background: composerText.trim() ? `linear-gradient(135deg,#2AABEE,#229ED9)` : TG_INPUT, border: 'none', color: composerText.trim() ? '#fff' : TG_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                    onClick={handleSendText}
                    disabled={sendingMsg || !composerText.trim()}
                  >
                    <Send size={16} />
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 14, color: TG_DIM }}>
            <MessageSquare size={52} color={TG_DIM} strokeWidth={1.5} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: TG_SUB, marginBottom: 5 }}>اختر محادثة</div>
              <div style={{ fontSize: 12.5, color: TG_DIM }}>للعرض والتواصل مع الزبون</div>
            </div>
          </div>
        )}
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
            height: 100% !important;
            width: 100% !important;
            overflow-y: auto !important;
            max-width: 100% !important;
            min-width: 0 !important;
            flex-shrink: 0 !important;
          }
          .alfhd-conv-list-hidden-mobile { display: none !important; }
          .alfhd-conv-detail-empty { display: none !important; }
          .alfhd-conv-detail-active-mobile {
            position: fixed !important;
            top: 0 !important; right: 0 !important;
            left: 0 !important; bottom: 0 !important;
            z-index: 300 !important;
            width: 100vw !important;
            height: 100dvh !important;
            display: flex !important;
            flex-direction: column !important;
            background: #0E1621 !important;
          }
          .alfhd-conv-back-btn { display: flex !important; }
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
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
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
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800,
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
  { id: 'dayBefore', label: 'أول أمس' },
  { id: 'week', label: 'هذا الأسبوع' },
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
          <select value={datePreset} onChange={(e) => setDatePreset(e.target.value)} style={styles.pageSelect}>
            {DATE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <ChevronDown size={14} color="#5E6986" />
        </div>
        {datePreset === 'custom' && (
          <>
            <select value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} style={styles.customDateSelectCompact}>
              {AR_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={customYear} onChange={(e) => setCustomYear(e.target.value)} style={styles.customDateSelectCompact}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        )}
        <div style={styles.pageSelectWrap}>
          <Facebook size={15} color="#3B82F6" />
          <select value={pageFilter} onChange={(e) => setPageFilter(e.target.value)} style={styles.pageSelect}>
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
// عرض الطلبات
// ──────────────────────────────────────────────
function OrdersView({ orders, pages, setOrders, conversations, setConversations, onViewConversation, pendingNewOrderFromConv, clearPendingNewOrderFromConv, currentUser, onContactCustomer, pendingOpenOrderId, clearPendingOpenOrderId }) {
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
  const [printTarget, setPrintTarget] = useState(null);

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

    setEditingOrder({
      id: null,
      pageId: conv.pageId || pages[0]?.id || '',
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
  function isWithinPrepWindow(o) {
    // طلبات "قيد التجهيز" تبقى ظاهرة 3 أيام فقط، بعدها تنتقل للمهملة
    const ref = o.printedAt || o.createdAt || o.date;
    if (!ref) return true;
    return (Date.now() - new Date(ref).getTime()) <= THREE_DAYS;
  }

  const stageOrders = useMemo(() => {
    return visibleOrders.filter((o) => {
      const stage = o.stage || (o.printed ? 'prep' : 'ready');
      if (stage !== section) return false;
      if (!passesCommon(o)) return false;
      if (section === 'prep' && !isWithinPrepWindow(o)) return false;
      if (section === 'delivery' && statusFilter !== 'all' && o.status !== statusFilter) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleOrders, section, selectedPage, statusFilter, search, datePreset, customMonth, customYear]);

  const stageCounts = useMemo(() => {
    const c = { ready: 0, prep: 0, delivery: 0 };
    visibleOrders.forEach((o) => {
      if (selectedPage !== 'all' && o.pageId !== selectedPage) return;
      const stage = o.stage || (o.printed ? 'prep' : 'ready');
      if (stage === 'prep' && !isWithinPrepWindow(o)) return;
      if (c[stage] !== undefined) c[stage]++;
    });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleOrders, selectedPage]);

  const stats = useMemo(() => {
    const scoped = selectedPage === 'all' ? visibleOrders : visibleOrders.filter((o) => o.pageId === selectedPage);
    return {
      total: scoped.length,
      pending: scoped.filter((o) => o.status === 'pending').length,
      delivered: scoped.filter((o) => o.status === 'delivered').length,
      returned: scoped.filter((o) => o.status === 'returned').length,
    };
  }, [visibleOrders, selectedPage]);

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

    // 3. كود المحافظة — governorate_code (إجباري، من قائمة Jenni)
    if (!order.governorateCode) {
      errors.governorateCode = 'المحافظة مطلوبة — إجبارية من شركة التوصيل';
    } else {
      const validCodes = IRAQ_GOVERNORATES.map((g) => g.code);
      if (!validCodes.includes(order.governorateCode)) {
        errors.governorateCode = `كود المحافظة غير صالح: ${order.governorateCode}`;
      }
    }

    // 4. المدينة/المنطقة — city (إجباري)
    if (!String(order.area || '').trim()) {
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
    if (!editingOrder.pageId) { alert('اختر الصفحة'); return; }

    // ── تحقق إجباري من كل حقول جيني قبل الحفظ ──
    const validationErrors = validateJenniFields(editingOrder);
    if (Object.keys(validationErrors).length > 0) {
      const msgs = Object.values(validationErrors).join('\n• ');
      alert(`⛔ لا يمكن حفظ الطلب — أخطاء إجبارية:\n\n• ${msgs}\n\nهذه الحقول مطلوبة من شركة التوصيل ولا يمكن إرسال الشحنة بدونها.`);
      return;
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
          total: Number(editingOrder.total) || 0,
          status: editingOrder.status,
          conversation_id: editingOrder.conversationId || null,
          source: editingOrder.conversationId ? 'chat' : (editingOrder.source || 'manual'),
        };
        await sbUpdate('alfhd_orders', editingOrder.id, payload);
        const updatedOrder = {
          ...editingOrder,
          pageId: editingOrder.pageId, customer: editingOrder.customer, phone: editingOrder.phone,
          address: editingOrder.address, items: editingOrder.items, orderType: editingOrder.orderType,
          governorateCode: editingOrder.governorateCode || '', governorateName: editingOrder.governorateName || '', area: editingOrder.area || '',
          total: Number(editingOrder.total) || 0, status: editingOrder.status,
          conversationId: editingOrder.conversationId || null,
          source: editingOrder.conversationId ? 'chat' : (editingOrder.source || 'manual'),
        };
        setOrders((prev) => prev.map((o) => (o.id === editingOrder.id ? updatedOrder : o)));
        if (editingOrder.conversationId) await pinConversationToOrder(editingOrder.conversationId, editingOrder.id);
        // ── إعادة إرسال لجيني إذا لم يُرسَل بعد أو كان فيه خطأ سابق ──
        const prevOrder = orders.find((o) => o.id === editingOrder.id);
        if (!prevOrder?.jenniSent) {
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
          total: Number(editingOrder.total) || 0,
          status: editingOrder.status || 'pending',
          stage: 'ready',
          order_date: new Date().toISOString().slice(0, 10),
          fahd_ref: `FHD-${Math.floor(10000 + Math.random() * 89999)}`,
          conversation_id: editingOrder.conversationId || null,
          source: editingOrder.conversationId ? 'chat' : 'manual',
        };
        const created = await sbInsert('alfhd_orders', payload);
        if (created?.[0]) {
          const newOrder = mapOrderFromDb(created[0]);
          setOrders((prev) => [newOrder, ...prev]);
          if (editingOrder.conversationId) await pinConversationToOrder(editingOrder.conversationId, created[0].id);
          // ── إرسال فوري لجيني عند إنشاء الطلب ──
          // الطلب يظهر عند جيني بحالة NEW_ORDER_TO_PRINT (جاهز للطباعة)
          // وهذا هو الـ workflow الصحيح: جيني تعرف بالطلب مبكراً قبل الطباعة
          sendOrderToJenni(newOrder, { silent: true });
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
  // تنظيف رقم الهاتف ليكون بصيغة 07XXXXXXXXX التي تقبلها جيني
  function normalizeIraqiPhone(raw) {
    if (!raw) return '';
    let digits = String(raw).replace(/[^0-9]/g, '');
    if (digits.startsWith('964')) digits = '0' + digits.slice(3);
    if (digits.startsWith('00964')) digits = '0' + digits.slice(5);
    if (!digits.startsWith('0')) digits = '0' + digits;
    return digits.slice(0, 11); // 07XXXXXXXXX = 11 رقماً
  }

  async function sendOrderToJenni(o, { silent = false } = {}) {
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
    const cityValue = String(o.area || '').trim() || String(o.address || '').split(' - ')[1] || '';
    if (!cityValue) {
      const msg = 'المنطقة/المدينة مطلوبة — عدّل الطلب وأضف المنطقة';
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: msg } : x)));
      if (!silent) alert(msg);
      return false;
    }
    if (!Number(o.total) || Number(o.total) <= 0) {
      const msg = 'المبلغ يجب أن يكون أكبر من صفر';
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: msg } : x)));
      if (!silent) alert(msg);
      return false;
    }

    // ── البيانات المرسلة لشركة التوصيل ──
    const shipmentPayload = {
      external_shipment_id: String(o.id),
      shipment_number: String(o.orderNo || o.id),
      receiver_name: o.customer || '',
      receiver_phone_1: cleanPhone,
      governorate_code: o.governorateCode,
      city: cityValue,
      address: o.address || '',
      amount_iqd: Number(o.total) || 0,
      note: o.orderType || undefined,
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

      if (res.ok && (data?.success || data?.shipment_id)) {
        const patch = {
          jenni_sent: true,
          jenni_shipment_id: data.shipment_id || null,
          jenni_tracking: data.tracking_number || null,
          delivery_status: 'sorting',
        };
        setOrders((prev) => prev.map((x) => (x.id === o.id ? {
          ...x,
          jenniSent: true,
          jenniShipmentId: data.shipment_id || null,
          jenniTracking: data.tracking_number || null,
          jenniError: null,
          deliveryStatus: 'sorting',
        } : x)));
        try { await sbUpdate('alfhd_orders', o.id, patch); } catch (_e) { /* تجاهل */ }
        console.log('✅ تم الإرسال لشركة التوصيل بنجاح، shipment_id:', data.shipment_id);
        return true;
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
  function JenniActionsPanel({ o }) {
    if (!o.jenniSent || !o.deliveryStatus) return null;
    const status = o.deliveryStatus;

    const actions = [];

    // لو فشل التوصيل — يمكن إعادة الجدولة أو الإرجاع
    if (status === 'FAILED_DELIVERY' || status === 'ON_HOLD') {
      actions.push(
        <button key="reschedule" style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
          background: 'rgba(42,171,238,0.10)', border: '1px solid rgba(42,171,238,0.25)',
          borderRadius: 9, color: '#2AABEE', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}
          onClick={() => alert('تواصل مع شركة التوصيل لإعادة الجدولة')}
        >
          <RefreshCw size={13} /> إعادة جدولة التوصيل
        </button>
      );
    }

    // لو راجع — يمكن تأكيد الاستلام
    if (status === 'RETURNED_TO_MERCHANT' || status === 'RETURN_IN_PROGRESS') {
      actions.push(
        <button key="confirm_return" style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
          background: 'rgba(242,80,80,0.08)', border: '1px solid rgba(242,80,80,0.25)',
          borderRadius: 9, color: '#F25050', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}
          onClick={() => markOrderConverted(o)}
        >
          <XCircle size={13} /> تأكيد الإرجاع وأرشفة الطلب
        </button>
      );
    }

    // لو مستلم — تأكيد وأرشفة
    if (status === 'DELIVERED') {
      actions.push(
        <button key="archive" style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
          background: 'rgba(77,219,107,0.08)', border: '1px solid rgba(77,219,107,0.25)',
          borderRadius: 9, color: '#4DDB6B', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}
          onClick={() => markOrderConverted(o)}
        >
          <CheckCircle2 size={13} /> تأكيد الاستلام وأرشفة الطلب
        </button>
      );
    }

    if (actions.length === 0) return null;

    return (
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, color: '#546880', fontWeight: 600, marginBottom: 2 }}>إجراءات متاحة:</div>
        {actions}
      </div>
    );
  }

  function triggerPrint(target, idsToMove) {
    setPrintTarget(target);
    setTimeout(() => {
      window.print();
      setPrintTarget(null);
      if (idsToMove?.length) markOrdersPrintedAndPrep(idsToMove);
    }, 60);
  }

  function handlePrintReady() {
    const ids = stageOrders.map((o) => o.id);
    if (ids.length === 0) { alert('لا توجد طلبات جاهزة للطباعة'); return; }
    triggerPrint('ready', ids);
  }

  function handleReprintBatch(batchId, batchOrders) {
    triggerPrint(batchId, null);
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

  function StageStatusBadge({ o }) {
    if (section === 'delivery') {
      const dcfg = DELIVERY_STATUS_CONFIG[o.deliveryStatus] || DELIVERY_STATUS_CONFIG.sorting;
      return <div style={{ ...styles.orderStatusPill, color: dcfg.color, background: dcfg.bg }}>{dcfg.label}</div>;
    }
    if (section === 'prep') {
      return <div style={{ ...styles.orderStatusPill, color: '#F0A868', background: 'rgba(240,168,104,0.12)' }}>قيد التجهيز</div>;
    }
    return <div style={{ ...styles.orderStatusPill, color: '#3B82F6', background: 'rgba(59,130,246,0.12)' }}>جديد</div>;
  }

  function renderOrderCard(o, index = 0) {
    const page = pages.find((p) => p.id === o.pageId);
    const isRejected = o.prepStatus === 'rejected';
    return (
      <div
        key={o.id}
        style={{ ...styles.orderCard, ...(isRejected ? styles.rejectedCard : {}), animationDelay: `${Math.min(index * 0.04, 0.4)}s` }}
        className="alfhd-order-card alfhd-card-enter"
      >
        {isRejected && (
          <div style={styles.rejectedBanner}>
            <AlertCircle size={16} />
            <span>لم يُجهَّز من قبل المخزن — تحقق قبل الطباعة</span>
          </div>
        )}

        <div style={styles.orderTicketHead}>
          <div style={styles.orderTicketAvatar}>{o.customer?.[0] || '؟'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.orderCardCustomer}>{o.customer}</div>
            <div style={styles.orderTicketPage}>{page?.avatar} {page?.name || 'بدون صفحة'}</div>
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
              <div style={{ fontSize: 11, color: '#F0A868', background: 'rgba(240,168,104,0.08)', border: '1px solid rgba(240,168,104,0.2)', borderRadius: 8, padding: '6px 10px', marginTop: 4 }}>
                ⚠️ لم يُعثر على منتج مطابق في المخزن
              </div>
            );
            const { product, confidence } = match;
            return (
              <div style={{ background: confidence === 'high' ? 'rgba(77,219,107,0.07)' : 'rgba(42,171,238,0.07)', border: `1px solid ${confidence === 'high' ? 'rgba(77,219,107,0.22)' : 'rgba(42,171,238,0.22)'}`, borderRadius: 9, padding: '8px 10px', marginTop: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: confidence === 'high' ? '#4DDB6B' : '#2AABEE', marginBottom: 4 }}>
                  📦 المنتج في المخزن {confidence === 'high' ? '✓' : '~'}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#F5F5F5' }}>
                  {product.car_name} — {PRODUCT_TYPE_LABELS[product.type]}
                </div>
                {product.location && (
                  <div style={{ fontSize: 11, color: '#2AABEE', marginTop: 3, fontWeight: 700 }}>
                    📍 الموقع: {product.location}
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#546880', marginTop: 2 }}>
                  المتبقي في المخزن: {product.quantity} قطعة
                </div>
              </div>
            );
          })()}

          {/* ── حالة شركة التوصيل ── */}
          {o.jenniSent && (
            <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(42,171,238,0.05)', border: '1px solid rgba(42,171,238,0.12)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Truck size={12} color="#2AABEE" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2AABEE' }}>شركة التوصيل</span>
                {o.deliveryStatus && (() => {
                  const dcfg = DELIVERY_STATUS_CONFIG[o.deliveryStatus];
                  return dcfg ? (
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: dcfg.color, background: dcfg.bg, padding: '2px 7px', borderRadius: 20, marginRight: 'auto' }}>
                      {dcfg.label}
                    </span>
                  ) : <span style={{ fontSize: 10.5, color: '#546880', marginRight: 'auto' }}>{o.deliveryStatus}</span>;
                })()}
              </div>
              {o.deliveryNote && (
                <div style={{ fontSize: 10.5, color: '#8B9AB3', marginBottom: 2 }}>📝 {o.deliveryNote}</div>
              )}
              {o.jenniTracking && (
                <div style={{ fontSize: 10, color: '#546880', fontFamily: 'monospace' }}>تتبع: #{o.jenniTracking}</div>
              )}
              {o.deliveryUpdatedAt && (
                <div style={{ fontSize: 10, color: '#546880', marginTop: 2 }}>
                  آخر تحديث: {new Date(o.deliveryUpdatedAt).toLocaleString('ar-IQ')}
                </div>
              )}
              <JenniActionsPanel o={o} />
            </div>
          )}
        </div>

        {o.jenniError && (
          <div style={{ margin: '0 0 6px', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(244,91,105,0.3)' }}>
            <div style={{ background: 'rgba(244,91,105,0.1)', padding: '7px 10px', fontSize: 11, color: '#F45B69', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <span style={{ flexShrink: 0 }}>⚠️</span>
              <span>{o.jenniError}</span>
            </div>
            <button
              onClick={() => startEditOrder(o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '7px', background: 'rgba(244,91,105,0.08)',
                border: 'none', borderTop: '1px solid rgba(244,91,105,0.18)',
                color: '#F45B69', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
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
          {section === 'delivery' && (
            o.jenniSent ? (
              // الطلب عند شركة التوصيل — الحالة تأتي تلقائياً من جيني
              <div style={{
                ...styles.statusSelect,
                color: STATUS_CONFIG[o.status]?.color || '#9AA3B8',
                background: STATUS_CONFIG[o.status]?.bg || 'rgba(154,163,184,0.1)',
                borderColor: (STATUS_CONFIG[o.status]?.color || '#9AA3B8') + '44',
                flex: 1.4, display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 700, cursor: 'default',
              }}>
                <Truck size={12} />
                {STATUS_CONFIG[o.status]?.label || o.deliveryStepAr || 'جاري التحديث...'}
              </div>
            ) : (
              <select
                value={o.status}
                onChange={(e) => updateStatus(o.id, e.target.value)}
                style={{ ...styles.statusSelect, color: STATUS_CONFIG[o.status]?.color, borderColor: (STATUS_CONFIG[o.status]?.color || '#999') + '44', background: STATUS_CONFIG[o.status]?.bg, flex: 1.4 }}
              >
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
              </select>
            )
          )}
          {o.conversationId && (
            <button onClick={() => onViewConversation?.(o.conversationId)} style={styles.orderActionBtn} title="عرض المحادثة">
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
        <div>
          <h2 style={styles.viewTitle}>الطلبات</h2>
          <p style={styles.viewSubtitle}>متابعة كاملة عبر مراحل الطباعة والتجهيز والتوصيل</p>
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
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 13px', background: 'rgba(42,171,238,0.10)',
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
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
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
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px',
                background: 'linear-gradient(135deg,#4DDB6B,#22C55E)',
                border: 'none', borderRadius: 10,
                color: '#fff', fontSize: 12.5, fontWeight: 700,
                boxShadow: '0 2px 8px rgba(77,219,107,0.35)',
              }}
            >
              <Printer size={15} /> طباعة الكل ({stageOrders.length})
            </button>
          )}
        </div>
      </div>

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

      <div style={styles.sectionTabs} className="alfhd-no-print">
        {ORDER_STAGES.map((st) => (
          <button
            key={st.id}
            onClick={() => { setSection(st.id); setStatusFilter('all'); }}
            style={{ ...styles.sectionTab, ...(section === st.id ? styles.sectionTabActive : {}) }}
          >
            {st.label}
            <span style={{ ...styles.convTabCount, ...(section === st.id ? styles.convTabCountActive : {}) }}>
              {stageCounts[st.id]}
            </span>
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
          {['all', 'pending', 'delivered', 'returned'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ ...styles.chip, ...(statusFilter === s ? styles.chipActive : {}) }}>
              {s === 'all' ? 'الكل' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      )}

      {isPrep ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {prepBatches.length === 0 ? (
            <div style={styles.emptyState}><Package size={32} color="#39425C" /><p>لا توجد طلبات قيد التجهيز</p></div>
          ) : prepBatches.map((batch) => (
            <div key={batch.batchId} style={styles.batchBlock}>
              <div style={styles.batchHeader} className="alfhd-no-print">
                <div style={styles.batchHeaderInfo}>
                  <Printer size={14} color="#3B82F6" />
                  <span>دفعة — {batch.orders.length} طلب</span>
                  {batch.printedAt && <span style={styles.batchHeaderTime}>{new Date(batch.printedAt).toLocaleString('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
                </div>
                <button onClick={() => handleReprintBatch(batch.batchId, batch.orders)} style={styles.secondaryBtn}>
                  <Printer size={14} /> إعادة طباعة
                </button>
              </div>
              <div style={styles.ordersGrid} className={`alfhd-orders-grid${printTarget === batch.batchId ? ' alfhd-print-area' : ''}`}>
                {batch.orders.map(renderOrderCard)}
              </div>
            </div>
          ))}
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
          onMoveToDelivery={isPrep ? () => moveToDelivery(detailOrder) : null}
          onReprep={detailOrder.prepStatus === 'rejected' ? (note) => reprepOrder(detailOrder, note) : null}
          onContactCustomer={onContactCustomer}
        />
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
              margin: '0 17px 2px',
              padding: '8px 11px',
              background: 'rgba(42,171,238,0.07)',
              border: '1px solid rgba(42,171,238,0.20)',
              borderRadius: 9,
              fontSize: 11,
              color: '#2AABEE',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 600,
            }}>
              <Truck size={13} />
              الحقول المُعلَّمة بـ <span style={{ color: '#F25050', fontWeight: 800 }}>*</span> إجبارية من شركة التوصيل — لن تُقبل الشحنة بدونها
            </div>

            <div style={styles.modalBody}>
              {/* الصفحة */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>الصفحة</label>
                <select value={editingOrder.pageId} onChange={(e) => setEditingOrder({ ...editingOrder, pageId: e.target.value })} style={styles.formInput}>
                  {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

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
                  <span style={{ fontSize: 10.5, color: '#F25050', marginTop: 3, fontWeight: 600 }}>⚠ مطلوب</span>
                )}
              </div>

              {/* رقم الهاتف — إجباري Jenni */}
              <div style={styles.formGroup}>
                <label style={{ ...styles.formLabel, display: 'flex', alignItems: 'center', gap: 4 }}>
                  رقم الهاتف
                  <span style={{ color: '#F25050', fontWeight: 800, fontSize: 13 }}>*</span>
                  <span style={{ fontSize: 10, color: '#546880', fontWeight: 500, marginRight: 'auto' }}>07XXXXXXXXX</span>
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
                        onChange={(e) => setEditingOrder({ ...editingOrder, phone: e.target.value })}
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
                      {!raw && <span style={{ fontSize: 10.5, color: '#F25050', marginTop: 3, fontWeight: 600 }}>⚠ مطلوب</span>}
                      {phoneErr && <span style={{ fontSize: 10.5, color: '#F25050', marginTop: 3, fontWeight: 600 }}>⚠ صيغة خاطئة — المطلوب: 07XXXXXXXXX</span>}
                      {phoneOk && <span style={{ fontSize: 10.5, color: '#4DDB6B', marginTop: 3, fontWeight: 600 }}>✓ صالح لشركة التوصيل</span>}
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
                        display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6,
                        padding: '6px 10px', background: 'rgba(42,171,238,0.10)',
                        border: '1px solid rgba(42,171,238,0.22)', borderRadius: 8,
                        color: '#2AABEE', fontSize: 11, fontWeight: 700, cursor: 'pointer', width: '100%',
                        justifyContent: 'center',
                      }}
                    >
                      ✨ استخراج "{found.name}" من العنوان تلقائياً
                    </button>
                  ) : null;
                })()}
                <select
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
                  <span style={{ fontSize: 10.5, color: '#F25050', marginTop: 3, fontWeight: 600 }}>⚠ مطلوب — شركة التوصيل ترفض الشحنة بدون محافظة</span>
                )}
              </div>

              {/* المنطقة/المدينة — إجباري Jenni (city) */}
              <div style={styles.formGroup}>
                <label style={{ ...styles.formLabel, display: 'flex', alignItems: 'center', gap: 4 }}>
                  المنطقة / المدينة
                  <span style={{ color: '#F25050', fontWeight: 800, fontSize: 13 }}>*</span>
                  <span style={{ fontSize: 10, color: '#546880', fontWeight: 500, marginRight: 'auto' }}>city لشركة التوصيل</span>
                </label>
                <input
                  value={editingOrder.area || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, area: e.target.value })}
                  style={{
                    ...styles.formInput,
                    borderRadius: 9,
                    border: !String(editingOrder.area || '').trim() ? '1.5px solid rgba(242,80,80,0.5)' : '1.5px solid rgba(42,171,238,0.25)',
                    background: '#242F3D',
                  }}
                  placeholder="مثال: الكرادة، المنصور، الكرخ..."
                />
                {!String(editingOrder.area || '').trim() && (
                  <span style={{ fontSize: 10.5, color: '#F25050', marginTop: 3, fontWeight: 600 }}>⚠ مطلوب — تُرسَل كـ city لشركة التوصيل</span>
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
                      {!totalOk && <span style={{ fontSize: 10.5, color: '#F25050', marginTop: 3, fontWeight: 600 }}>⚠ المبلغ يجب أن يكون أكبر من صفر</span>}
                    </>
                  );
                })()}
              </div>

              {/* العنوان التفصيلي — اختياري */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>العنوان التفصيلي <span style={{ color: '#546880', fontSize: 10 }}>(اختياري)</span></label>
                <input
                  value={editingOrder.address}
                  onChange={(e) => setEditingOrder({ ...editingOrder, address: e.target.value })}
                  style={{ ...styles.formInput, borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)', background: '#242F3D' }}
                  placeholder="أقرب نقطة دالة، رقم الدار..."
                />
              </div>

              {/* نوع الطلب — اختياري (note في Jenni) */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>نوع الطلب / ملاحظة <span style={{ color: '#546880', fontSize: 10 }}>(اختياري — تُرسَل كـ note لشركة التوصيل)</span></label>
                <input
                  value={editingOrder.orderType}
                  onChange={(e) => setEditingOrder({ ...editingOrder, orderType: e.target.value })}
                  style={{ ...styles.formInput, borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)', background: '#242F3D' }}
                  placeholder="مثال: أرضيات سيارة، ملابس..."
                />
              </div>

              {/* المنتجات — اختياري */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>المنتجات / التفاصيل <span style={{ color: '#546880', fontSize: 10 }}>(اختياري)</span></label>
                <textarea
                  value={editingOrder.items}
                  onChange={(e) => setEditingOrder({ ...editingOrder, items: e.target.value })}
                  style={{ ...styles.formInput, borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)', background: '#242F3D', minHeight: 70, resize: 'vertical' }}
                  placeholder="وصف المنتجات والكميات"
                />
              </div>

              {/* ربط محادثة */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>ربط بمحادثة <span style={{ color: '#546880', fontSize: 10 }}>(اختياري)</span></label>
                <select
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
                    padding: '10px 13px',
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
  const o = order;
  const [reprepMode, setReprepMode] = useState(false);
  const [reprepNote, setReprepNote] = useState('');
  const isRejected = o.prepStatus === 'rejected';
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>تفاصيل الطلب #{o.orderNo}</h3>
          <button onClick={onClose} style={styles.modalClose}><X size={18} /></button>
        </div>
        <div style={styles.modalBody}>
          {isRejected && (
            <div style={{ ...styles.rejectReasonBox, margin: 0 }}>
              <span style={styles.rejectReasonLabel}>لم يُجهَّز من المخزن{o.prepByName ? ` (${o.prepByName})` : ''}:</span>
              <span>{o.prepReason || 'بدون سبب محدد'}</span>
            </div>
          )}
          <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>العميل</span><span style={styles.detailGridValue}>{o.customer}</span></div>
          {page && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>الصفحة</span><span style={styles.detailGridValue}>{page.avatar} {page.name}</span></div>}
          {o.orderType && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>نوع الطلب</span><span style={styles.detailGridValue}>{o.orderType}</span></div>}
          {o.phone && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>الهاتف</span><span style={styles.detailGridValue}>{o.phone}</span></div>}
          {o.governorateName && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>المحافظة</span><span style={styles.detailGridValue}>{o.governorateName}</span></div>}
          {o.area && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>المنطقة</span><span style={styles.detailGridValue}>{o.area}</span></div>}
          {o.address && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>العنوان</span><span style={styles.detailGridValue}>{o.address}</span></div>}
          {o.deliveryStepAr && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>حالة الشركة</span><span style={{ ...styles.detailGridValue, color: '#60A5FA', fontWeight: 700 }}>{o.deliveryStepAr}</span></div>}
          {o.items && (
            <div style={{ ...styles.detailGridRow, flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
              <span style={styles.detailGridLabel}>المنتجات</span>
              <span style={{ ...styles.detailGridValue, whiteSpace: 'pre-wrap', textAlign: 'right' }}>{o.items}</span>
            </div>
          )}
          <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>المبلغ</span><span style={{ ...styles.detailGridValue, color: '#60A5FA', fontWeight: 800, fontSize: 16 }}>{Number(o.total).toLocaleString()} د.ع</span></div>
          <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>التاريخ</span><span style={styles.detailGridValue}>{o.date}</span></div>
          <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>الرقم المرجعي</span><span style={{ ...styles.detailGridValue, fontFamily: 'monospace' }}>{o.fahdRef}</span></div>

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
                  <RefreshCw size={15} style={{ marginLeft: 6, display: 'inline', verticalAlign: 'middle' }} /> إعادة الطلب للتجهيز
                </button>
              )}
              {onMoveToDelivery && (
                <button onClick={onMoveToDelivery} style={{ ...styles.modalSaveBtn, flex: '1 1 100%', marginBottom: 4 }}>
                  <Truck size={15} style={{ marginLeft: 6, display: 'inline', verticalAlign: 'middle' }} /> نقل لشركة التوصيل
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
    <div style={styles.statCard} className="alfhd-stat-card">
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

  const breakdown = useMemo(() => {
    const converted = scopedOrders.filter((o) => o.converted);
    const fromChat = scopedOrders.filter((o) => !o.converted && o.source === 'chat');
    const manual = scopedOrders.filter((o) => !o.converted && o.source !== 'chat');
    return { total: scopedOrders.length, converted: converted.length, fromChat: fromChat.length, manual: manual.length };
  }, [scopedOrders]);

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
          <select value={statsPage} onChange={(e) => setStatsPage(e.target.value)} style={styles.pageSelect}>
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
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} style={styles.pageSelect}>
              {DATE_PRESETS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <ChevronDown size={14} color="#5E6986" />
          </div>
          {timeFilter === 'custom' && (
            <>
              <select value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} style={styles.customDateSelectCompact}>
                {AR_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={customYear} onChange={(e) => setCustomYear(e.target.value)} style={styles.customDateSelectCompact}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            {perPage.map((p) => (
              <div key={p.id} style={styles.pageStatRow}>
                <div style={styles.pageStatInfo}>
                  <span style={{ fontSize: 20 }}>{p.avatar}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#EAF0FB' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#5E6986' }}>{p.orderCount} طلب</div>
                  </div>
                </div>
                <div style={styles.pageStatBadge}>{p.convCount} محادثة</div>
              </div>
            ))}
          </div>
        </div>
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
          <div style={{ ...styles.searchBox, marginBottom: 14 }}>
            <Search size={15} color="#5E6986" />
            <input placeholder="بحث بالاسم، الرقم، الهاتف، أو المدير..." value={q} onChange={(e) => setQ(e.target.value)} style={styles.searchInput} />
          </div>
          {shown.length === 0 ? (
            <div style={styles.emptyState}><Send size={28} color="#39425C" /><p>لا توجد طلبات محوّلة</p></div>
          ) : shown.map((o) => {
            const page = pages.find((p) => p.id === o.pageId);
            return (
              <div key={o.id} style={styles.convertedRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.convertedCustomer}>{o.customer} <span style={{ fontSize: 11, color: '#5E6986' }}>#{o.orderNo}</span></div>
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
    const batchId = `batch-${Date.now()}`;
    const printedAt = new Date().toISOString();
    // أعدها لمرحلة التجهيز بدفعة طباعة جديدة
    setOrders((prev) => prev.map((o) => (
      ids.includes(o.id) ? { ...o, printed: true, printBatchId: batchId, printedAt, stage: 'prep' } : o
    )));
    try {
      await Promise.all(ids.map((id) => sbUpdate('alfhd_orders', id, {
        printed: true, print_batch_id: batchId, printed_at: printedAt, stage: 'prep',
      })));
    } catch (e) { console.error('reprint neglected error:', e); }
    setTimeout(() => window.print(), 80);
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
            <input placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} style={styles.searchInput} />
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
                  <div style={styles.convertedCustomer}>{o.customer} <span style={{ fontSize: 11, color: '#5E6986' }}>#{o.orderNo}</span></div>
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
            <Printer size={15} style={{ marginLeft: 6, display: 'inline', verticalAlign: 'middle' }} />
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

  // ── إعدادات واتساب للصفحة ──
  const [waSettingsPage, setWaSettingsPage] = useState(null);
  const [waPhoneInput, setWaPhoneInput] = useState('');
  const [waTokenInput, setWaTokenInput] = useState('');
  const [savingWa, setSavingWa] = useState(false);

  async function saveWaSettings() {
    if (!waSettingsPage) return;
    if (!waPhoneInput.trim()) { alert('أدخل Phone Number ID'); return; }
    if (!waTokenInput.trim()) { alert('أدخل WhatsApp Token'); return; }
    setSavingWa(true);
    try {
      await sbUpdate('alfhd_pages', waSettingsPage.id, {
        wa_phone_number_id: waPhoneInput.trim(),
        wa_token: waTokenInput.trim(),
      });
      setPages((prev) => prev.map((p) => p.id === waSettingsPage.id ? {
        ...p, waPhoneNumberId: waPhoneInput.trim(), waToken: waTokenInput.trim(), waConnected: true,
      } : p));
      setWaSettingsPage(null);
      alert('✅ تم ربط واتساب بنجاح!');
    } catch (e) { alert('فشل الحفظ: ' + e.message); }
    finally { setSavingWa(false); }
  }

  async function removeWaSettings(pageId) {
    if (!window.confirm('هل تريد إلغاء ربط واتساب؟')) return;
    try {
      await sbUpdate('alfhd_pages', pageId, { wa_phone_number_id: null, wa_token: null });
      setPages((prev) => prev.map((p) => p.id === pageId ? { ...p, waPhoneNumberId: null, waToken: null, waConnected: false } : p));
    } catch (e) { alert('فشل: ' + e.message); }
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
            padding: '10px 18px',
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
          display: 'flex', alignItems: 'flex-start', gap: 10,
          marginBottom: 16, padding: '12px 14px',
          background: 'rgba(242,80,80,0.08)', border: '1px solid rgba(242,80,80,0.22)',
          borderRadius: 12, color: '#F25050', fontSize: 13, lineHeight: 1.6,
        }}>
          <XCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{fbError}</span>
        </div>
      )}

      {exchanging && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
          padding: '12px 14px',
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
          <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F5', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Facebook size={15} color="#2AABEE" />
            اختر الصفحة للربط
          </div>
          {fbCandidates.map((c) => (
            <div key={c.fb_page_id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              {c.avatar
                ? <img src={c.avatar} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#1877F2,#0D5FBF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Facebook size={20} color="#fff" /></div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#F5F5F5' }}>{c.name}</div>
                <div style={{ fontSize: 10.5, color: '#546880', marginTop: 2 }}>ID: {c.fb_page_id}</div>
              </div>
              <button
                onClick={() => confirmAddPage(c)}
                style={{
                  padding: '7px 14px', background: 'linear-gradient(135deg,#1877F2,#0D5FBF)',
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
            <div style={{ fontSize: 15, fontWeight: 700, color: '#8B9AB3', marginBottom: 6 }}>لا توجد صفحات مرتبطة</div>
            <div style={{ fontSize: 12, color: '#546880' }}>اضغط "ربط صفحة جديدة" لبدء ربط صفحاتك</div>
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
              <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
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
                  <div style={{
                    position: 'absolute', bottom: -2, left: -2,
                    width: 16, height: 16, borderRadius: '50%',
                    background: p.connected ? '#1DDB6B' : '#546880',
                    border: '2.5px solid #17212B',
                    boxShadow: p.connected ? '0 0 8px rgba(29,219,107,0.6)' : 'none',
                  }} />
                </div>

                {/* معلومات الصفحة */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#F5F5F5', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#546880' }}>
                    <Facebook size={10} color="#1877F2" />
                    <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{p.fbPageId ? p.fbPageId.slice(0, 16) + '...' : 'معرّف غير متاح'}</span>
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 5,
                    padding: '3px 9px', borderRadius: 20,
                    background: p.connected ? 'rgba(29,219,107,0.12)' : 'rgba(84,104,128,0.15)',
                    fontSize: 10.5, fontWeight: 700,
                    color: p.connected ? '#1DDB6B' : '#8B9AB3',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                    {p.connected ? 'متصلة' : 'غير متصلة'}
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
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '9px',
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
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '9px',
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
        <div style={styles.modalOverlay} onClick={() => setWaSettingsPage(null)}>
          <div style={styles.modal} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <span style={{ color: '#25D366', marginLeft: 6 }}>●</span>
                ربط واتساب — {waSettingsPage.name}
              </h3>
              <button onClick={() => setWaSettingsPage(null)} style={styles.modalClose}><X size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ background: 'rgba(37,211,102,0.07)', border: '1px solid rgba(37,211,102,0.20)', borderRadius: 10, padding: '10px 13px', marginBottom: 14, fontSize: 12, color: '#25D366', lineHeight: 1.7 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>كيف أحصل على هذه المعلومات؟</div>
                <div>١. افتح developers.facebook.com ← تطبيقك ALfhd-app</div>
                <div>٢. واتساب ← إعداد واجهة API</div>
                <div>٣. انسخ <b>معرف رقم الهاتف</b> و<b>رمز الوصول</b></div>
              </div>
              <div style={styles.formGroup}>
                <label style={{ ...styles.formLabel, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Phone Number ID <span style={{ color: '#F25050', fontWeight: 800 }}>*</span>
                </label>
                <input value={waPhoneInput} onChange={(e) => setWaPhoneInput(e.target.value)}
                  style={{ ...styles.formInput, fontFamily: 'monospace', direction: 'ltr' }}
                  placeholder="مثال: 1187286511134496" />
              </div>
              <div style={styles.formGroup}>
                <label style={{ ...styles.formLabel, display: 'flex', alignItems: 'center', gap: 4 }}>
                  رمز الوصول (Access Token) <span style={{ color: '#F25050', fontWeight: 800 }}>*</span>
                </label>
                <textarea value={waTokenInput} onChange={(e) => setWaTokenInput(e.target.value)}
                  style={{ ...styles.formInput, fontFamily: 'monospace', direction: 'ltr', minHeight: 80, resize: 'vertical', fontSize: 10 }}
                  placeholder="EAAOXwA1p2Z..." />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Webhook URL للواتساب (انسخه لـ Meta)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input readOnly value={`${SUPABASE_URL}/functions/v1/wa-webhook`}
                    style={{ ...styles.formInput, fontFamily: 'monospace', fontSize: 10, direction: 'ltr', flex: 1, color: '#2AABEE' }} />
                  <button onClick={() => navigator.clipboard?.writeText(`${SUPABASE_URL}/functions/v1/wa-webhook`)}
                    style={{ padding: '8px 12px', background: 'rgba(42,171,238,0.10)', border: '1px solid rgba(42,171,238,0.22)', borderRadius: 8, color: '#2AABEE', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    نسخ
                  </button>
                </div>
              </div>
              {waSettingsPage.waConnected && (
                <button onClick={() => { removeWaSettings(waSettingsPage.id); setWaSettingsPage(null); }}
                  style={{ width: '100%', padding: '8px', background: 'rgba(242,80,80,0.08)', border: '1px solid rgba(242,80,80,0.22)', borderRadius: 9, color: '#F25050', fontSize: 12, fontWeight: 700 }}>
                  إلغاء ربط واتساب من هذه الصفحة
                </button>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setWaSettingsPage(null)} style={styles.modalCancelBtn}>إلغاء</button>
              <button onClick={saveWaSettings} disabled={savingWa}
                style={{ ...styles.modalSaveBtn, background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
                {savingWa ? 'جارٍ الحفظ...' : '✓ حفظ وربط واتساب'}
              </button>
            </div>
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
];

function AdminView({ users, setUsers, orders, conversations, onViewConversation, onContactWhatsApp }) {
  const [adminTab, setAdminTab] = useState('managers'); // managers | warehouse | fulfillment
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', role: 'manager', permissions: [], jobTitle: '', whatsapp: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const managers = users.filter((u) => u.role === 'admin' || u.role === 'manager');
  const warehouse = users.filter((u) => u.role === 'warehouse');

  const openAddManager = () => {
    setForm({ name: '', code: '', role: 'manager', permissions: [], jobTitle: '', whatsapp: '' });
    setEditingUser(null); setFormError(''); setShowAdd(true);
  };
  const openAddWarehouse = () => {
    setForm({ name: '', code: '', role: 'warehouse', permissions: [], jobTitle: '', whatsapp: '' });
    setEditingUser(null); setFormError(''); setShowAdd(true);
  };
  const openEdit = (user) => {
    setForm({ name: user.name, code: user.code, role: user.role, permissions: user.permissions || [], jobTitle: user.jobTitle || '', whatsapp: user.whatsapp || '' });
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
        const [updated] = await sbUpdate('alfhd_users', editingUser.id, payload);
        setUsers((prev) => prev.map((u) => u.id === editingUser.id ? mapUserFromDb(updated) : u));
      } else {
        const [created] = await sbInsert('alfhd_users', { ...payload, active: true });
        setUsers((prev) => [...prev, mapUserFromDb(created)]);
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
    { id: 'warehouse', label: 'موظفي المخزن', icon: Package },
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
                : u.role === 'warehouse' ? <><Package size={12} color="#F0A868" /> {u.jobTitle || 'موظف مخزن'}</>
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
        {adminTab === 'warehouse' && <button onClick={openAddWarehouse} style={styles.addBtn}><UserPlus size={16} /> إضافة موظف مخزن</button>}
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
          <div style={styles.emptyState}><Package size={32} color="#39425C" /><p>لا يوجد موظفو مخزن بعد</p></div>
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
                {editingUser ? 'تعديل' : (form.role === 'warehouse' ? 'إضافة موظف مخزن' : 'إضافة مدير')}
              </h3>
              <button onClick={() => setShowAdd(false)} style={styles.modalClose}><X size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>الاسم</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={styles.formInput} placeholder="اسم الموظف" />
              </div>

              {form.role === 'warehouse' && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>المسمى الوظيفي</label>
                    <input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} style={styles.formInput} placeholder="مثال: مسؤول تجهيز" />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>رقم واتساب</label>
                    <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} style={styles.formInput} placeholder="07XXXXXXXXX" />
                  </div>
                </>
              )}

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>رمز الدخول (4 أرقام)</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={styles.formInput} placeholder="1234" inputMode="numeric" />
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
                  <span>موظف المخزن يرى فقط الطلبات المثبتة من كل الصفحات، ويعلّمها "تم التجهيز" أو "لم يتم" بدون صلاحية تعديل أو حذف.</span>
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
      <div style={{ ...styles.filtersWrap, marginTop: 10 }} className="alfhd-no-print">
        <div style={styles.filterBottomRow}>
          <div style={styles.pageSelectWrap}>
            <Calendar size={15} color="#60A5FA" />
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} style={styles.pageSelect}>
              {DATE_PRESETS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <ChevronDown size={14} color="#5E6986" />
          </div>
          {timeFilter === 'custom' && (
            <>
              <select value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} style={styles.customDateSelectCompact}>
                {AR_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={customYear} onChange={(e) => setCustomYear(e.target.value)} style={styles.customDateSelectCompact}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      <div style={{ ...styles.ordersGrid, marginTop: 14 }}>
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
                      <Phone size={14} /> <span style={{ fontSize: 11, fontWeight: 700 }}>المجهّز</span>
                    </button>
                  )}
                  {o.conversationId ? (
                    <button onClick={() => onViewConversation?.(o.conversationId)} style={styles.orderActionBtn} title="مراسلة الزبون">
                      <MessageSquare size={14} /> <span style={{ fontSize: 11, fontWeight: 700 }}>الزبون</span>
                    </button>
                  ) : o.phone ? (
                    <button onClick={() => onContactWhatsApp?.(o.phone)} style={styles.orderActionBtn} title="الاتصال بالزبون">
                      <Phone size={14} /> <span style={{ fontSize: 11, fontWeight: 700 }}>الزبون</span>
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

// واجهة موظف المخزن المبسطة — يرى فقط الطلبات المثبتة ويعلّمها تم/لم يتم

// ──────────────────────────────────────────────
// التطبيق الرئيسي
// ──────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 30, background: '#0E1621', color: '#F5F5F5', minHeight: '100vh', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
          <div style={{ background: 'rgba(242,80,80,0.1)', border: '1px solid rgba(242,80,80,0.3)', borderRadius: 12, padding: 20, maxWidth: 600, margin: '40px auto' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#F25050', marginBottom: 12 }}>⚠️ خطأ في التطبيق</div>
            <div style={{ fontSize: 13, color: '#F0A868', marginBottom: 8, fontFamily: 'monospace', direction: 'ltr' }}>
              {this.state.error?.message}
            </div>
            <div style={{ fontSize: 11, color: '#546880', fontFamily: 'monospace', direction: 'ltr', whiteSpace: 'pre-wrap' }}>
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
  // ── المخزن ──
  const [warehouseProducts, setWarehouseProducts] = useState([]);

  // ── تسجيل بيعة في المخزن تلقائياً ──
  async function recordWarehouseSale(order) {
    try {
      // ابحث عن أفضل منتج مطابق
      const match = matchOrderToWarehouseProduct(order, warehouseProducts);
      if (!match) {
        console.warn('⚠️ لم يُعثر على منتج مطابق في المخزن للطلب:', order.orderNo);
        return;
      }

      const { product, confidence } = match;
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
      const match = matchOrderToWarehouseProduct(order, warehouseProducts);
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
        const res = await sbSelect('wh_products', '&order=car_name.asc');
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
        '&order=last_message_time.desc'
      );
      if (dbConversations) {
        const sig = dbConversations.map((c) => `${c.id}:${c.last_message_time}:${c.last_message}:${c.unread_count}:${c.tab}:${c.order_id}:${c.avatar_url || ''}`).join('|');
        if (sig !== convSignatureRef.current) {
          convSignatureRef.current = sig;
          const mapped = dbConversations.map(mapConversationFromDb);
          setConversations(mapped);

          // ── كشف تحويل تلقائي من آخر رسالة ──
          const toHandoff = mapped.filter((c) => {
            if (c.tab === 'handoff') return false; // مكانه الصح أصلاً
            const msg = (c.lastMsg || '').toLowerCase();
            return HANDOFF_TRIGGERS_GLOBAL.some((t) => msg.includes(t.toLowerCase()));
          });
          if (toHandoff.length > 0) {
            setConversations((prev) => prev.map((c) => (
              toHandoff.find((h) => h.id === c.id) ? { ...c, tab: 'handoff' } : c
            )));
            // حفظ في قاعدة البيانات
            toHandoff.forEach(async (c) => {
              try { await sbUpdate('alfhd_conversations', c.id, { tab: 'handoff' }); } catch (_e) { /* تجاهل */ }
            });
          }
        }
      }
    } catch (e) {
      console.error('Supabase conversations load error:', e);
    }
  }, []);

  const knownOrderIdsRef = React.useRef(null);
  const orderSignatureRef = React.useRef('');
  const rejectedIdsRef = React.useRef(null);
  const refreshOrders = useCallback(async () => {
    try {
      const dbOrders = await sbSelect('alfhd_orders', '&order=created_at.desc');
      if (!dbOrders) return;
      const mapped = dbOrders.map(mapOrderFromDb);
      // كشف طلب جديد مثبّت من المحادثات لتشغيل صوت الإشعار
      if (knownOrderIdsRef.current) {
        const newChatOrder = mapped.find((o) => o.source === 'chat' && !knownOrderIdsRef.current.has(o.id));
        if (newChatOrder) playNotificationSound();
      }
      knownOrderIdsRef.current = new Set(mapped.map((o) => o.id));

      // كشف طلب رفضه المجهّز حديثاً لتشغيل صوت إنذار قوي للمدير
      const rejectedNow = new Set(mapped.filter((o) => o.prepStatus === 'rejected').map((o) => o.id));
      if (rejectedIdsRef.current) {
        const newlyRejected = [...rejectedNow].some((id) => !rejectedIdsRef.current.has(id));
        if (newlyRejected) playAlarmSound();
      }
      rejectedIdsRef.current = rejectedNow;

      // حدّث الحالة فقط إذا تغيّر شيء فعلاً
      const sig = dbOrders.map((o) => `${o.id}:${o.status}:${o.stage}:${o.prep_status}:${o.converted}:${o.printed}:${o.jenni_sent}:${o.jenni_shipment_id}:${o.jenni_tracking}:${o.delivery_status}:${o.delivery_step}:${o.delivery_step_ar}:${o.delivery_note}:${o.delivery_updated_at}`).join('|');
      if (sig !== orderSignatureRef.current) {
        orderSignatureRef.current = sig;

        // ── كشف التغييرات الجديدة في حالة التوصيل ──
        const prevOrders = orders;
        for (const newOrder of mapped) {
          const prev = prevOrders.find(o => o.id === newOrder.id);
          if (!prev) continue;

          const prevStatus = prev.deliveryStatus;
          const newStatus  = newOrder.deliveryStatus;

          // DELIVERED → تسجيل بيعة في المخزن وتخفيض الكمية
          if (newStatus === 'DELIVERED' && prevStatus !== 'DELIVERED') {
            console.log(`🎉 طلب #${newOrder.orderNo} مستلم — تسجيل في المخزن...`);
            recordWarehouseSale(newOrder);
          }

          // RETURNED → إرجاع للمخزن
          if ((newStatus === 'RETURNED_TO_MERCHANT' || newStatus === 'returned') &&
              prevStatus !== 'RETURNED_TO_MERCHANT' && prevStatus !== 'returned') {
            console.log(`↩️ طلب #${newOrder.orderNo} راجع — إرجاع للمخزن...`);
            returnToWarehouse(newOrder);
          }
        }

        setOrders(mapped);
      }
    } catch (e) {
      console.error('orders refresh error:', e);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return undefined;
    const interval = setInterval(refreshOrders, 10000);
    return () => clearInterval(interval);
  }, [storageReady, refreshOrders]);

  // تحميل البيانات الحقيقية من Supabase (لا يمنع عرض الواجهة أبداً)
  useEffect(() => {
    (async () => {
      try {
        const [dbPages, dbOrders, dbUsers] = await Promise.all([
          sbSelectColumns('alfhd_pages', 'id,name,avatar,source,fb_page_id,connected,created_at', '&order=created_at.asc'),
          sbSelect('alfhd_orders', '&order=created_at.desc'),
          sbSelect('alfhd_users', '&order=created_at.asc'),
        ]);

        if (dbPages?.length) setPages(dbPages.map(mapPageFromDb));
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

  useEffect(() => {
    if (!storageReady) return undefined;
    pollFacebookNow();
    const interval = setInterval(pollFacebookNow, 7000);
    return () => clearInterval(interval);
  }, [storageReady, pollFacebookNow]);

  // بعد تحميل Supabase: حدّث بيانات المستخدم المسجّل (صلاحيات جديدة إلخ) وأوقف شاشة التحميل
  useEffect(() => {
    if (!storageReady) return;
    setAppLoading(false);
    try {
      const saved = JSON.parse(localStorage.getItem('alfhd_session') || sessionStorage.getItem('alfhd_session') || 'null');
      if (saved?.userId) {
        const found = users.find((u) => u.id === saved.userId && u.active);
        if (found) {
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
  if (authedUser.role === 'warehouse') {
    return (
      <>
        <GlobalStyles />
        <div style={styles.appWrap} className="alfhd-app-wrap">
          <WarehouseView />
        </div>
      </>
    );
  }

  return (
    <ErrorBoundary>
    <>
      <GlobalStyles />
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
          {activeView === 'conversations' && (
            <ConversationsView
              conversations={conversations}
              pages={pages}
              orders={orders}
              setConversations={setConversations}
              pendingOpenConvId={pendingOpenConvId}
              clearPendingOpenConvId={() => setPendingOpenConvId(null)}
              onCreateOrderFromConv={goToNewOrderFromConversation}
              onOpenOrderDetails={goToOrderDetails}
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
        </main>
      </div>
    </>
    </ErrorBoundary>
  );
}

// ══════════════════════════════════════════════════════════════════
// WarehouseView — نظام إدارة المخزن الكامل (مدمج في الموقع)
// ══════════════════════════════════════════════════════════════════
const WH_PRODUCT_TYPES = [
  { id: 'mother_dosah', label: 'أم الدوسة', icon: '🪣', color: '#3B82F6' },
  { id: 'rubble_hodi',  label: 'ربل حوضي',  icon: '📦', color: '#8B5CF6' },
  { id: 'leather',      label: 'جلد',        icon: '✨', color: '#F59E0B' },
];
const WH_DEBT_TYPES = [
  { id: 'supplier', label: 'موزع جملة', color: '#F45B69' },
  { id: 'rent',     label: 'إيجار',     color: '#F0A868' },
  { id: 'salary',   label: 'راتب',      color: '#A78BFA' },
  { id: 'expense',  label: 'مصاريف',    color: '#60A5FA' },
  { id: 'other',    label: 'أخرى',      color: '#546880' },
];
const LOW_STOCK = 3;
function whFmt(n) { return `${(Number(n)||0).toLocaleString()} د.ع`; }
function whToday() { return new Date().toISOString().slice(0,10); }
function whDaysUntil(d) { return d ? Math.ceil((new Date(d)-new Date())/86400000) : null; }

function WhModal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:16 }} onClick={onClose}>
      <div style={{ background:'linear-gradient(145deg,#17212B,#1A2736)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.7)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:'#F5F5F5' }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#546880', cursor:'pointer' }}><X size={18}/></button>
        </div>
        <div style={{ padding:'16px 18px' }}>{children}</div>
      </div>
    </div>
  );
}
function WhField({ label, required, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#8B9AB3', marginBottom:5 }}>{label}{required&&<span style={{color:'#F25050'}}> *</span>}</label>
      {children}
    </div>
  );
}
const whInp = { width:'100%', background:'#242F3D', border:'1px solid rgba(255,255,255,0.07)', borderRadius:9, color:'#F5F5F5', fontSize:13, padding:'9px 12px', outline:'none', boxSizing:'border-box', fontFamily:'Cairo,sans-serif' };

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
        <div style={{background:'rgba(242,80,80,0.06)',border:'1px solid rgba(242,80,80,0.25)',borderRadius:12,padding:14,marginBottom:16}}>
          <div style={{color:'#F25050',fontWeight:800,marginBottom:8,display:'flex',alignItems:'center',gap:6}}><AlertCircle size={15}/>تنبيهات</div>
          {low.length>0&&<div style={{fontSize:12,color:'#F0A868',marginBottom:4}}>⚠️ {low.length} منتج أقل من {LOW_STOCK} قطع: {low.slice(0,3).map(p=>p.car_name).join('، ')}</div>}
          {urgent.length>0&&<div style={{fontSize:12,color:'#F25050'}}>🔴 {urgent.length} دين يستحق خلال 7 أيام</div>}
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12,marginBottom:18}}>
        {stats.map(s=>(
          <div key={s.l} style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,padding:'13px 15px',boxShadow:'0 2px 8px rgba(0,0,0,0.4)'}}>
            <s.I size={18} color={s.c} style={{marginBottom:8}}/>
            <div style={{fontSize:17,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:'#546880',marginTop:3}}>{s.l}</div>
          </div>
        ))}
      </div>
      {low.length>0&&(
        <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(242,80,80,0.2)',borderRadius:13,padding:14,marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:800,color:'#F25050',marginBottom:10}}>منتجات تحتاج تزويد</div>
          {low.map(p=>(
            <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',background:'rgba(242,80,80,0.06)',borderRadius:9,marginBottom:6,border:'1px solid rgba(242,80,80,0.15)'}}>
              <div>
                <div style={{fontSize:12.5,fontWeight:700,color:'#F5F5F5'}}>{p.car_name} — {WH_PRODUCT_TYPES.find(t=>t.id===p.type)?.label}</div>
                {p.location&&<div style={{fontSize:11,color:'#546880'}}>📍 {p.location}</div>}
              </div>
              <div style={{fontSize:22,fontWeight:800,color:p.quantity===0?'#F25050':'#F0A868'}}>{p.quantity}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,padding:14}}>
        <div style={{fontSize:13,fontWeight:800,color:'#F5F5F5',marginBottom:10}}>آخر المبيعات</div>
        {sales.slice(0,5).map(s=>(
          <div key={s.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <div><div style={{fontSize:12.5,fontWeight:600,color:'#F5F5F5'}}>{s.product_name}</div><div style={{fontSize:11,color:'#546880'}}>{s.date} · {s.customer_name||'زبون'}</div></div>
            <div style={{fontSize:13,fontWeight:800,color:'#4DDB6B'}}>{whFmt(s.total_iqd)}</div>
          </div>
        ))}
        {!sales.length&&<div style={{color:'#546880',fontSize:13,textAlign:'center',padding:20}}>لا توجد مبيعات بعد</div>}
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
  const [form,setForm]=useState({car_name:'',type:'mother_dosah',quantity:0,cost_iqd:0,price_iqd:0,location:'',notes:''});
  const [carForm,setCarForm]=useState({name:''});
  const [saving,setSaving]=useState(false);
  const filtered = products.filter(p=>(type==='all'||p.type===type)&&(!search||p.car_name?.includes(search)||p.location?.includes(search)));
  function openNew(){setEditing(null);setForm({car_name:'',type:'mother_dosah',quantity:0,cost_iqd:0,price_iqd:0,location:'',notes:''});setModal(true);}
  function openEdit(p){setEditing(p);setForm({...p});setModal(true);}
  async function save(){
    if(!form.car_name.trim()){alert('أدخل اسم السيارة');return;}
    setSaving(true);
    try{
      if(editing){await sbU('wh_products',editing.id,form);setProducts(prev=>prev.map(p=>p.id===editing.id?{...p,...form}:p));}
      else{const r=await sbI('wh_products',{...form,created_at:new Date().toISOString()});if(r?.[0])setProducts(prev=>[r[0],...prev]);}
      setModal(false);
    }catch(e){alert('فشل: '+e.message);}
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
  async function del(id){if(!confirm('حذف هذا المنتج؟'))return;await sbD('wh_products',id);setProducts(prev=>prev.filter(p=>p.id!==id));}
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14,flexWrap:'wrap',gap:8}}>
        <h3 style={{margin:0,fontSize:17,fontWeight:800,color:'#F5F5F5'}}>المنتجات والمخزون</h3>
        <div style={{display:'flex',gap:7}}>
          <button onClick={()=>setCarModal(true)} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 13px',background:'rgba(167,139,250,0.1)',border:'1px solid rgba(167,139,250,0.3)',borderRadius:9,color:'#A78BFA',fontSize:12,fontWeight:700,cursor:'pointer'}}>
            <Plus size={13}/> إضافة سيارة
          </button>
          <button onClick={openNew} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 13px',background:'linear-gradient(135deg,#2AABEE,#229ED9)',border:'none',borderRadius:9,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
            <Plus size={13}/> منتج جديد
          </button>
        </div>
      </div>
      <div style={{display:'flex',gap:7,marginBottom:12,flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:1,minWidth:160}}>
          <Search size={13} style={{position:'absolute',right:9,top:'50%',transform:'translateY(-50%)',color:'#546880'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." style={{...whInp,paddingRight:29}}/>
        </div>
        {[{id:'all',label:'الكل'},...WH_PRODUCT_TYPES].map(t=>(
          <button key={t.id} onClick={()=>setType(t.id)} style={{padding:'6px 11px',borderRadius:18,border:`1px solid ${type===t.id?'#2AABEE':'rgba(255,255,255,0.07)'}`,background:type===t.id?'rgba(42,171,238,0.15)':'transparent',color:type===t.id?'#2AABEE':'#546880',fontSize:11.5,fontWeight:700,cursor:'pointer'}}>
            {t.icon||''} {t.label}
          </button>
        ))}
      </div>
      <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,overflow:'hidden'}}>
        {filtered.length===0?<div style={{padding:40,textAlign:'center',color:'#546880'}}>لا توجد منتجات</div>:
        filtered.map((p,i)=>{
          const t=WH_PRODUCT_TYPES.find(x=>x.id===p.type);
          const isLow=p.quantity<=LOW_STOCK;
          return(
            <div key={p.id} style={{display:'flex',alignItems:'center',gap:11,padding:'11px 14px',borderBottom:i<filtered.length-1?'1px solid rgba(255,255,255,0.06)':'none'}}>
              <div style={{width:42,height:42,borderRadius:10,background:`${t?.color||'#2AABEE'}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{t?.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:'#F5F5F5'}}>{p.car_name}</div>
                <div style={{display:'flex',gap:7,marginTop:3,flexWrap:'wrap'}}>
                  <span style={{fontSize:11,color:t?.color,background:`${t?.color||'#2AABEE'}15`,padding:'2px 7px',borderRadius:18}}>{t?.label}</span>
                  {p.location&&<span style={{fontSize:11,color:'#546880'}}>📍 {p.location}</span>}
                  {p.price_iqd>0&&<span style={{fontSize:11,color:'#546880'}}>{whFmt(p.price_iqd)}</span>}
                </div>
              </div>
              <div style={{textAlign:'center',minWidth:46}}>
                <div style={{fontSize:20,fontWeight:800,color:isLow?'#F25050':'#4DDB6B'}}>{p.quantity}</div>
                <div style={{fontSize:10,color:'#546880'}}>قطعة</div>
                {isLow&&<div style={{fontSize:10,color:'#F25050',fontWeight:700}}>⚠️</div>}
              </div>
              <div style={{display:'flex',gap:5}}>
                <button onClick={()=>openEdit(p)} style={{padding:7,background:'rgba(42,171,238,0.1)',border:'1px solid rgba(42,171,238,0.2)',borderRadius:8,color:'#2AABEE',cursor:'pointer'}}><Edit3 size={13}/></button>
                <button onClick={()=>del(p.id)} style={{padding:7,background:'rgba(242,80,80,0.08)',border:'1px solid rgba(242,80,80,0.18)',borderRadius:8,color:'#F25050',cursor:'pointer'}}><Trash2 size={13}/></button>
              </div>
            </div>
          );
        })}
      </div>
      {modal&&(
        <WhModal title={editing?'تعديل منتج':'إضافة منتج'} onClose={()=>setModal(false)}>
          <WhField label="اسم السيارة" required>
            <select value={form.car_name} onChange={e=>setForm(f=>({...f,car_name:e.target.value}))} style={whInp}>
              <option value="">اختر سيارة...</option>
              {cars.map(c=><option key={c} value={c}>{c}</option>)}
              <option value="__new__">+ اكتب اسم جديد</option>
            </select>
            {form.car_name==='__new__'&&<input placeholder="اسم السيارة الجديدة" onChange={e=>setForm(f=>({...f,car_name:e.target.value}))} style={{...whInp,marginTop:6}}/>}
          </WhField>
          <WhField label="نوع المنتج" required>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={whInp}>
              {WH_PRODUCT_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </WhField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:11}}>
            <WhField label="الكمية"><input type="number" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:Number(e.target.value)}))} style={whInp}/></WhField>
            <WhField label="سعر الشراء (د.ع)"><input type="number" value={form.cost_iqd} onChange={e=>setForm(f=>({...f,cost_iqd:Number(e.target.value)}))} style={whInp}/></WhField>
            <WhField label="سعر البيع (د.ع)" required><input type="number" value={form.price_iqd} onChange={e=>setForm(f=>({...f,price_iqd:Number(e.target.value)}))} style={whInp}/></WhField>
            <WhField label="موقع المخزن (A-350)"><input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="فرع A، رف 350" style={whInp}/></WhField>
          </div>
          <WhField label="ملاحظات"><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{...whInp,minHeight:55,resize:'vertical'}}/></WhField>
          <div style={{display:'flex',gap:9,marginTop:8}}>
            <button onClick={()=>setModal(false)} style={{flex:1,padding:'10px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,color:'#8B9AB3',cursor:'pointer',fontWeight:700}}>إلغاء</button>
            <button onClick={save} disabled={saving} style={{flex:2,padding:'10px',background:'linear-gradient(135deg,#2AABEE,#229ED9)',border:'none',borderRadius:9,color:'#fff',fontWeight:800,cursor:'pointer'}}>{saving?'جارٍ الحفظ...':'حفظ'}</button>
          </div>
        </WhModal>
      )}
      {carModal&&(
        <WhModal title="إضافة سيارة جديدة" onClose={()=>setCarModal(false)}>
          <div style={{background:'rgba(42,171,238,0.07)',border:'1px solid rgba(42,171,238,0.18)',borderRadius:9,padding:11,marginBottom:13,fontSize:12,color:'#2AABEE'}}>
            سيتم إضافة الأنواع الثلاثة (أم الدوسة، ربل حوضي، جلد) تلقائياً
          </div>
          <WhField label="اسم السيارة" required>
            <input value={carForm.name} onChange={e=>setCarForm({name:e.target.value})} placeholder="مثال: تويوتا كامري 2022" style={whInp}/>
          </WhField>
          <div style={{display:'flex',gap:9,marginTop:8}}>
            <button onClick={()=>setCarModal(false)} style={{flex:1,padding:'10px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,color:'#8B9AB3',cursor:'pointer',fontWeight:700}}>إلغاء</button>
            <button onClick={addCar} disabled={saving} style={{flex:2,padding:'10px',background:'linear-gradient(135deg,#A78BFA,#7C3AED)',border:'none',borderRadius:9,color:'#fff',fontWeight:800,cursor:'pointer'}}>{saving?'جارٍ الإضافة...':'✨ إضافة للأنواع الثلاثة'}</button>
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
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <h3 style={{margin:0,fontSize:17,fontWeight:800,color:'#F5F5F5'}}>المبيعات</h3>
        <button onClick={()=>setModal(true)} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 13px',background:'linear-gradient(135deg,#4DDB6B,#22C55E)',border:'none',borderRadius:9,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}><Plus size={13}/> تسجيل بيعة</button>
      </div>
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {[['today','اليوم'],['week','الأسبوع'],['month','الشهر'],['year','السنة'],['all','الكل']].map(([v,l])=>(
          <button key={v} onClick={()=>setPeriod(v)} style={{padding:'6px 12px',borderRadius:18,border:`1px solid ${period===v?'#4DDB6B':'rgba(255,255,255,0.07)'}`,background:period===v?'rgba(77,219,107,0.14)':'transparent',color:period===v?'#4DDB6B':'#546880',fontSize:12,fontWeight:700,cursor:'pointer'}}>{l}</button>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:14}}>
        {[{l:'الإيرادات',v:whFmt(rev),c:'#4DDB6B'},{l:'عدد الصفقات',v:filtered.length,c:'#2AABEE'},{l:'قطع مباعة',v:filtered.reduce((s,x)=>s+x.quantity,0),c:'#A78BFA'}].map(s=>(
          <div key={s.l} style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'12px 14px',textAlign:'center'}}>
            <div style={{fontSize:18,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:'#546880',marginTop:3}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,overflow:'hidden'}}>
        {filtered.length===0?<div style={{padding:40,textAlign:'center',color:'#546880'}}>لا توجد مبيعات</div>:
        filtered.map((s,i)=>(
          <div key={s.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 14px',borderBottom:i<filtered.length-1?'1px solid rgba(255,255,255,0.06)':'none'}}>
            <div>
              <div style={{fontSize:12.5,fontWeight:700,color:'#F5F5F5'}}>{s.product_name}</div>
              <div style={{fontSize:11,color:'#546880',marginTop:2}}>{s.date} · {s.customer_name||'زبون'} · {s.quantity} قطعة</div>
            </div>
            <div style={{fontSize:14,fontWeight:800,color:'#4DDB6B'}}>{whFmt(s.total_iqd)}</div>
          </div>
        ))}
      </div>
      {modal&&(
        <WhModal title="تسجيل بيعة جديدة" onClose={()=>setModal(false)}>
          <WhField label="المنتج" required>
            <select value={form.product_id} onChange={e=>{const p=products.find(x=>x.id===e.target.value);setForm(f=>({...f,product_id:e.target.value,product_name:p?`${p.car_name} — ${WH_PRODUCT_TYPES.find(t=>t.id===p.type)?.label}`:'',price_iqd:p?.price_iqd||0}));}} style={whInp}>
              <option value="">اختر منتج</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.car_name} — {WH_PRODUCT_TYPES.find(t=>t.id===p.type)?.label} ({p.quantity} قطعة)</option>)}
            </select>
          </WhField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:11}}>
            <WhField label="الكمية" required><input type="number" min="1" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:Number(e.target.value)}))} style={whInp}/></WhField>
            <WhField label="السعر (د.ع)" required><input type="number" value={form.price_iqd} onChange={e=>setForm(f=>({...f,price_iqd:Number(e.target.value)}))} style={whInp}/></WhField>
          </div>
          <div style={{background:'rgba(77,219,107,0.07)',border:'1px solid rgba(77,219,107,0.2)',borderRadius:9,padding:'10px 13px',marginBottom:12,fontSize:16,fontWeight:800,color:'#4DDB6B'}}>{whFmt(form.price_iqd*form.quantity)}</div>
          <WhField label="اسم الزبون"><input value={form.customer_name} onChange={e=>setForm(f=>({...f,customer_name:e.target.value}))} placeholder="اختياري" style={whInp}/></WhField>
          <WhField label="التاريخ"><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={whInp}/></WhField>
          <div style={{display:'flex',gap:9,marginTop:8}}>
            <button onClick={()=>setModal(false)} style={{flex:1,padding:'10px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,color:'#8B9AB3',cursor:'pointer',fontWeight:700}}>إلغاء</button>
            <button onClick={save} disabled={saving} style={{flex:2,padding:'10px',background:'linear-gradient(135deg,#4DDB6B,#22C55E)',border:'none',borderRadius:9,color:'#fff',fontWeight:800,cursor:'pointer'}}>{saving?'جارٍ الحفظ...':'حفظ البيعة'}</button>
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
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <h3 style={{margin:0,fontSize:17,fontWeight:800,color:'#F5F5F5'}}>موزعو الجملة</h3>
        <button onClick={openNew} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 13px',background:'linear-gradient(135deg,#2AABEE,#229ED9)',border:'none',borderRadius:9,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}><Plus size={13}/> موزع جديد</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:13}}>
        {suppliers.map(s=>(
          <div key={s.id} style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:15,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,right:0,left:0,height:3,background:'linear-gradient(90deg,transparent,#2AABEE,transparent)',opacity:0.7}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:'#F5F5F5'}}>{s.name}</div>
                {s.phone&&<div style={{fontSize:12,color:'#2AABEE',marginTop:3}}>📞 {s.phone}</div>}
                {s.address&&<div style={{fontSize:12,color:'#546880',marginTop:2}}>📍 {s.address}</div>}
              </div>
              <div style={{display:'flex',gap:5}}>
                <button onClick={()=>openEdit(s)} style={{padding:6,background:'rgba(42,171,238,0.1)',border:'1px solid rgba(42,171,238,0.2)',borderRadius:7,color:'#2AABEE',cursor:'pointer'}}><Edit3 size={12}/></button>
                <button onClick={()=>del(s.id)} style={{padding:6,background:'rgba(242,80,80,0.08)',border:'1px solid rgba(242,80,80,0.18)',borderRadius:7,color:'#F25050',cursor:'pointer'}}><Trash2 size={12}/></button>
              </div>
            </div>
            {s.available_products&&(
              <div style={{background:'rgba(42,171,238,0.06)',border:'1px solid rgba(42,171,238,0.12)',borderRadius:8,padding:'8px 10px'}}>
                <div style={{fontSize:10.5,color:'#2AABEE',fontWeight:700,marginBottom:3}}>المتوفر عنده:</div>
                <div style={{fontSize:12,color:'#8B9AB3'}}>{s.available_products}</div>
              </div>
            )}
            {s.notes&&<div style={{fontSize:11.5,color:'#546880',marginTop:8}}>📝 {s.notes}</div>}
          </div>
        ))}
        {!suppliers.length&&<div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,padding:40,textAlign:'center',color:'#546880'}}>لا يوجد موزعون بعد</div>}
      </div>
      {modal&&(
        <WhModal title={editing?'تعديل موزع':'إضافة موزع جديد'} onClose={()=>setModal(false)}>
          <WhField label="اسم الموزع" required><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={whInp}/></WhField>
          <WhField label="رقم الهاتف"><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="07XXXXXXXXX" style={whInp}/></WhField>
          <WhField label="العنوان"><input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} style={whInp}/></WhField>
          <WhField label="المنتجات المتوفرة عنده"><textarea value={form.available_products} onChange={e=>setForm(f=>({...f,available_products:e.target.value}))} placeholder="كامري 2020 جلد، لاندكروزر ربل..." style={{...whInp,minHeight:65,resize:'vertical'}}/></WhField>
          <WhField label="ملاحظات"><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{...whInp,minHeight:55,resize:'vertical'}}/></WhField>
          <div style={{display:'flex',gap:9,marginTop:8}}>
            <button onClick={()=>setModal(false)} style={{flex:1,padding:'10px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,color:'#8B9AB3',cursor:'pointer',fontWeight:700}}>إلغاء</button>
            <button onClick={save} disabled={saving} style={{flex:2,padding:'10px',background:'linear-gradient(135deg,#2AABEE,#229ED9)',border:'none',borderRadius:9,color:'#fff',fontWeight:800,cursor:'pointer'}}>{saving?'جارٍ الحفظ...':'حفظ'}</button>
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
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <h3 style={{margin:0,fontSize:17,fontWeight:800,color:'#F5F5F5'}}>الديون والمصاريف</h3>
        <button onClick={openNew} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 13px',background:'rgba(242,80,80,0.1)',border:'1px solid rgba(242,80,80,0.28)',borderRadius:9,color:'#F25050',fontSize:12,fontWeight:700,cursor:'pointer'}}><Plus size={13}/> إضافة دين</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:11,marginBottom:14}}>
        <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(242,80,80,0.2)',borderRadius:12,padding:'12px 14px'}}>
          <div style={{fontSize:18,fontWeight:800,color:'#F25050'}}>{whFmt(totalUnpaid)}</div>
          <div style={{fontSize:11,color:'#546880',marginTop:3}}>إجمالي الديون غير المسددة</div>
        </div>
        <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'12px 14px'}}>
          <div style={{fontSize:18,fontWeight:800,color:'#F0A868'}}>{debts.filter(d=>d.status==='unpaid'&&whDaysUntil(d.due_date)!==null&&whDaysUntil(d.due_date)<=7).length}</div>
          <div style={{fontSize:11,color:'#546880',marginTop:3}}>ديون تستحق خلال 7 أيام</div>
        </div>
      </div>
      <div style={{display:'flex',gap:6,marginBottom:12}}>
        {[['all','الكل'],['unpaid','غير مسددة'],['paid','مسددة']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding:'6px 12px',borderRadius:18,border:`1px solid ${filter===v?'#F25050':'rgba(255,255,255,0.07)'}`,background:filter===v?'rgba(242,80,80,0.12)':'transparent',color:filter===v?'#F25050':'#546880',fontSize:12,fontWeight:700,cursor:'pointer'}}>{l}</button>
        ))}
      </div>
      <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,overflow:'hidden'}}>
        {filtered.length===0?<div style={{padding:40,textAlign:'center',color:'#546880'}}>لا توجد ديون</div>:
        filtered.map((d,i)=>{
          const type=WH_DEBT_TYPES.find(t=>t.id===d.type);
          const days=whDaysUntil(d.due_date);
          const urgent=d.status==='unpaid'&&days!==null&&days<=7;
          return(
            <div key={d.id} style={{display:'flex',alignItems:'center',gap:11,padding:'11px 14px',borderBottom:i<filtered.length-1?'1px solid rgba(255,255,255,0.06)':'none',background:urgent?'rgba(242,80,80,0.04)':'transparent'}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:d.status==='paid'?'#4DDB6B':type?.color||'#F25050',flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:'#F5F5F5'}}>{d.name}</div>
                <div style={{display:'flex',gap:7,marginTop:3,flexWrap:'wrap'}}>
                  <span style={{fontSize:11,color:type?.color,background:`${type?.color||'#F25050'}15`,padding:'2px 7px',borderRadius:18}}>{type?.label}</span>
                  {d.due_date&&<span style={{fontSize:11,color:urgent?'#F25050':'#546880'}}>📅 {d.due_date}{days!==null?` (${days>0?`${days} يوم`:'اليوم'})`:''}</span>}
                  {d.status==='paid'&&<span style={{fontSize:11,color:'#4DDB6B'}}>✓ مسدد</span>}
                </div>
              </div>
              <div style={{fontSize:14,fontWeight:800,color:d.status==='paid'?'#546880':'#F25050'}}>{whFmt(d.amount_iqd)}</div>
              <div style={{display:'flex',gap:5}}>
                {d.status==='unpaid'&&<button onClick={()=>markPaid(d.id)} title="تسديد" style={{padding:6,background:'rgba(77,219,107,0.1)',border:'1px solid rgba(77,219,107,0.2)',borderRadius:7,color:'#4DDB6B',cursor:'pointer'}}><CheckCircle2 size={12}/></button>}
                <button onClick={()=>openEdit(d)} style={{padding:6,background:'rgba(42,171,238,0.1)',border:'1px solid rgba(42,171,238,0.2)',borderRadius:7,color:'#2AABEE',cursor:'pointer'}}><Edit3 size={12}/></button>
                <button onClick={()=>del(d.id)} style={{padding:6,background:'rgba(242,80,80,0.08)',border:'1px solid rgba(242,80,80,0.18)',borderRadius:7,color:'#F25050',cursor:'pointer'}}><Trash2 size={12}/></button>
              </div>
            </div>
          );
        })}
      </div>
      {modal&&(
        <WhModal title={editing?'تعديل دين':'إضافة دين/مصروف'} onClose={()=>setModal(false)}>
          <WhField label="الاسم / الوصف" required><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="مثال: دين موزع أبو علي" style={whInp}/></WhField>
          <WhField label="النوع" required>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={whInp}>
              {WH_DEBT_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </WhField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:11}}>
            <WhField label="المبلغ (د.ع)" required><input type="number" value={form.amount_iqd} onChange={e=>setForm(f=>({...f,amount_iqd:Number(e.target.value)}))} style={whInp}/></WhField>
            <WhField label="تاريخ الاستحقاق"><input type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} style={whInp}/></WhField>
          </div>
          <WhField label="الحالة">
            <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={whInp}>
              <option value="unpaid">غير مسدد</option>
              <option value="paid">مسدد</option>
            </select>
          </WhField>
          <WhField label="ملاحظات"><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{...whInp,minHeight:55,resize:'vertical'}}/></WhField>
          <div style={{display:'flex',gap:9,marginTop:8}}>
            <button onClick={()=>setModal(false)} style={{flex:1,padding:'10px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,color:'#8B9AB3',cursor:'pointer',fontWeight:700}}>إلغاء</button>
            <button onClick={save} disabled={saving} style={{flex:2,padding:'10px',background:'rgba(242,80,80,0.15)',border:'1px solid rgba(242,80,80,0.3)',borderRadius:9,color:'#F25050',fontWeight:800,cursor:'pointer'}}>{saving?'جارٍ الحفظ...':'حفظ'}</button>
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
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <h3 style={{margin:0,fontSize:17,fontWeight:800,color:'#F5F5F5'}}>الموظفون والرواتب</h3>
        <button onClick={openNew} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 13px',background:'linear-gradient(135deg,#A78BFA,#7C3AED)',border:'none',borderRadius:9,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}><Plus size={13}/> موظف جديد</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:13}}>
        {employees.map(e=>(
          <div key={e.id} style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:15}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:11}}>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <div style={{width:42,height:42,borderRadius:'50%',background:'linear-gradient(135deg,#A78BFA,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:'#fff'}}>{e.name?.[0]}</div>
                <div><div style={{fontSize:13.5,fontWeight:800,color:'#F5F5F5'}}>{e.name}</div><div style={{fontSize:11.5,color:'#546880'}}>{e.role||'موظف'}</div></div>
              </div>
              <div style={{display:'flex',gap:5}}>
                <button onClick={()=>openEdit(e)} style={{padding:6,background:'rgba(42,171,238,0.1)',border:'1px solid rgba(42,171,238,0.2)',borderRadius:7,color:'#2AABEE',cursor:'pointer'}}><Edit3 size={12}/></button>
                <button onClick={()=>del(e.id)} style={{padding:6,background:'rgba(242,80,80,0.08)',border:'1px solid rgba(242,80,80,0.18)',borderRadius:7,color:'#F25050',cursor:'pointer'}}><Trash2 size={12}/></button>
              </div>
            </div>
            <div style={{background:'rgba(167,139,250,0.08)',border:'1px solid rgba(167,139,250,0.15)',borderRadius:9,padding:'9px 12px',marginBottom:10}}>
              <div style={{fontSize:11,color:'#A78BFA',marginBottom:2}}>الراتب الشهري</div>
              <div style={{fontSize:17,fontWeight:800,color:'#A78BFA'}}>{whFmt(e.salary)}</div>
            </div>
            {e.phone&&<div style={{fontSize:12,color:'#2AABEE',marginBottom:8}}>📞 {e.phone}</div>}
            <button onClick={()=>{setPayModal(e);setPayForm({amount:e.salary,date:whToday(),notes:''}); }}
              style={{width:'100%',padding:'8px',background:'rgba(77,219,107,0.08)',border:'1px solid rgba(77,219,107,0.2)',borderRadius:9,color:'#4DDB6B',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <DollarSign size={13}/> صرف راتب
            </button>
          </div>
        ))}
        {!employees.length&&<div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,padding:40,textAlign:'center',color:'#546880'}}>لا يوجد موظفون</div>}
      </div>
      {modal&&(
        <WhModal title={editing?'تعديل موظف':'إضافة موظف'} onClose={()=>setModal(false)}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:11}}>
            <WhField label="الاسم" required><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={whInp}/></WhField>
            <WhField label="المسمى الوظيفي"><input value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} placeholder="موظف، محاسب..." style={whInp}/></WhField>
            <WhField label="الراتب (د.ع)" required><input type="number" value={form.salary} onChange={e=>setForm(f=>({...f,salary:Number(e.target.value)}))} style={whInp}/></WhField>
            <WhField label="رقم الهاتف"><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={whInp}/></WhField>
          </div>
          <div style={{display:'flex',gap:9,marginTop:8}}>
            <button onClick={()=>setModal(false)} style={{flex:1,padding:'10px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,color:'#8B9AB3',cursor:'pointer',fontWeight:700}}>إلغاء</button>
            <button onClick={save} disabled={saving} style={{flex:2,padding:'10px',background:'linear-gradient(135deg,#A78BFA,#7C3AED)',border:'none',borderRadius:9,color:'#fff',fontWeight:800,cursor:'pointer'}}>{saving?'جارٍ الحفظ...':'حفظ'}</button>
          </div>
        </WhModal>
      )}
      {payModal&&(
        <WhModal title={`صرف راتب — ${payModal.name}`} onClose={()=>setPayModal(null)}>
          <WhField label="المبلغ (د.ع)" required><input type="number" value={payForm.amount} onChange={e=>setPayForm(f=>({...f,amount:Number(e.target.value)}))} style={whInp}/></WhField>
          <WhField label="التاريخ"><input type="date" value={payForm.date} onChange={e=>setPayForm(f=>({...f,date:e.target.value}))} style={whInp}/></WhField>
          <WhField label="ملاحظات"><input value={payForm.notes} onChange={e=>setPayForm(f=>({...f,notes:e.target.value}))} placeholder="راتب شهر..." style={whInp}/></WhField>
          <div style={{display:'flex',gap:9,marginTop:8}}>
            <button onClick={()=>setPayModal(null)} style={{flex:1,padding:'10px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:9,color:'#8B9AB3',cursor:'pointer',fontWeight:700}}>إلغاء</button>
            <button onClick={payEmployee} disabled={saving} style={{flex:2,padding:'10px',background:'linear-gradient(135deg,#4DDB6B,#22C55E)',border:'none',borderRadius:9,color:'#fff',fontWeight:800,cursor:'pointer'}}>{saving?'جارٍ الحفظ...':'صرف الراتب'}</button>
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
      <h3 style={{margin:'0 0 14px',fontSize:17,fontWeight:800,color:'#F5F5F5'}}>التقارير المالية</h3>
      <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
        {[['today','اليوم'],['week','الأسبوع'],['month','الشهر'],['year','السنة'],['all','الكل']].map(([v,l])=>(
          <button key={v} onClick={()=>setPeriod(v)} style={{padding:'6px 12px',borderRadius:18,border:`1px solid ${period===v?'#2AABEE':'rgba(255,255,255,0.07)'}`,background:period===v?'rgba(42,171,238,0.14)':'transparent',color:period===v?'#2AABEE':'#546880',fontSize:12,fontWeight:700,cursor:'pointer'}}>{l}</button>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))',gap:11,marginBottom:16}}>
        {[
          {l:'الإيرادات',v:whFmt(rev),c:'#4DDB6B',I:TrendingUp},
          {l:'إجمالي الديون',v:whFmt(totalDebt),c:'#F25050',I:CreditCard},
          {l:'تكلفة المخزن',v:whFmt(stockCost),c:'#F0A868',I:Package},
          {l:'قيمة البيع المتوقعة',v:whFmt(stockSale),c:'#A78BFA',I:BarChart3},
          {l:'الربح المتوقع',v:whFmt(stockSale-stockCost),c:stockSale>stockCost?'#4DDB6B':'#F25050',I:Percent},
        ].map(s=>(
          <div key={s.l} style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'12px 14px'}}>
            <s.I size={16} color={s.c} style={{marginBottom:7}}/>
            <div style={{fontSize:16,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:'#546880',marginTop:3}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:13}}>
        <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,padding:14}}>
          <div style={{fontSize:13,fontWeight:800,color:'#F5F5F5',marginBottom:11}}>مبيعات حسب النوع</div>
          {byType.map(t=>(
            <div key={t.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <span style={{fontSize:16}}>{t.icon}</span>
                <div><div style={{fontSize:12.5,fontWeight:700,color:'#F5F5F5'}}>{t.label}</div><div style={{fontSize:11,color:'#546880'}}>{t.count} صفقة</div></div>
              </div>
              <div style={{fontSize:13,fontWeight:800,color:t.color}}>{whFmt(t.total)}</div>
            </div>
          ))}
        </div>
        <div style={{background:'linear-gradient(145deg,#17212B,#1A2736)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:13,padding:14}}>
          <div style={{fontSize:13,fontWeight:800,color:'#F5F5F5',marginBottom:11}}>الأكثر مبيعاً</div>
          {top.map(([name,qty])=>(
            <div key={name} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <span style={{fontSize:12.5,color:'#F5F5F5'}}>{name}</span>
              <span style={{fontSize:12.5,fontWeight:700,color:'#4DDB6B'}}>{qty} قطعة</span>
            </div>
          ))}
          {!top.length&&<div style={{color:'#546880',fontSize:13,textAlign:'center',padding:20}}>لا توجد بيانات</div>}
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
  const sbD = async (t,id) => { const url=`${SUPABASE_URL}/rest/v1/${t}?id=eq.${id}`; await fetch(url,{method:'DELETE',headers:{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`}}); };

  useEffect(()=>{
    async function load(){
      setLoading(true);
      try{
        const [p,s,sup,d,e]=await Promise.all([
          sbSelect('wh_products','&order=car_name.asc'),
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
    if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,color:'#546880',flexDirection:'column',gap:12}}><RefreshCw size={24} style={{animation:'spin 1s linear infinite'}}/><span>جارٍ تحميل المخزن...</span></div>;
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
        <div style={{display:'flex',overflowX:'auto',background:'#17212B',borderBottom:'1px solid rgba(255,255,255,0.07)',padding:'8px 10px',gap:6,flexShrink:0,WebkitOverflowScrolling:'touch'}}>
          {WH_NAV.map(item=>{
            const Icon=item.icon;
            const active=whView===item.id;
            return(
              <button key={item.id} onClick={()=>setWhView(item.id)}
                style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'7px 12px',borderRadius:10,background:active?'rgba(42,171,238,0.18)':'rgba(255,255,255,0.04)',border:`1px solid ${active?'rgba(42,171,238,0.35)':'transparent'}`,color:active?'#2AABEE':'#8B9AB3',fontSize:10,fontWeight:active?800:600,cursor:'pointer',flexShrink:0,transition:'all 0.15s',minWidth:56}}>
                <Icon size={18} strokeWidth={active?2.5:1.8}/>
                {item.label}
              </button>
            );
          })}
        </div>
      ) : (
        /* ── على اللابتوب: قائمة جانبية ── */
        <div style={{width:200,flexShrink:0,background:'linear-gradient(180deg,#17212B,#141F2B)',borderLeft:'1px solid rgba(255,255,255,0.07)',display:'flex',flexDirection:'column',padding:'14px 10px',gap:4,overflowY:'auto'}}>
          <div style={{fontSize:13,fontWeight:800,color:'#8B9AB3',padding:'0 6px 10px',borderBottom:'1px solid rgba(255,255,255,0.07)',marginBottom:6}}>
            🏪 إدارة المخزن
          </div>
          {(lowCount>0||urgentDbt>0)&&(
            <div style={{background:'rgba(242,80,80,0.08)',border:'1px solid rgba(242,80,80,0.2)',borderRadius:9,padding:'7px 10px',marginBottom:8,fontSize:11}}>
              {lowCount>0&&<div style={{color:'#F0A868',marginBottom:2}}>⚠️ {lowCount} منتج منخفض</div>}
              {urgentDbt>0&&<div style={{color:'#F25050'}}>🔴 {urgentDbt} دين عاجل</div>}
            </div>
          )}
          {WH_NAV.map(item=>{
            const Icon=item.icon;
            const active=whView===item.id;
            return(
              <button key={item.id} onClick={()=>setWhView(item.id)}
                style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'9px 10px',borderRadius:9,background:active?'rgba(42,171,238,0.15)':'transparent',border:active?'1px solid rgba(42,171,238,0.25)':'1px solid transparent',color:active?'#2AABEE':'#8B9AB3',fontSize:12.5,fontWeight:active?800:600,cursor:'pointer',transition:'all 0.15s'}}>
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
      }

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
        --tg-dim:     #546880;
        --tg-hover:   rgba(255,255,255,0.05);
        --tg-active:  rgba(42,171,238,0.15);
        /* Telegram easing curves */
        --ease-tg:       cubic-bezier(0.4, 0.0, 0.2, 1);
        --ease-tg-out:   cubic-bezier(0.0, 0.0, 0.2, 1);
        --ease-tg-in:    cubic-bezier(0.4, 0.0, 1.0, 1);
        --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);
        --ease-bounce:   cubic-bezier(0.22, 1, 0.36, 1);
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
        animation: msgSlideIn 0.22s var(--ease-bounce) both;
        will-change: transform, opacity;
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

      /* دخول فقاعة رسالة — مثل Telegram */
      @keyframes msgSlideIn {
        from { opacity: 0; transform: scale(0.88) translateY(6px); }
        to   { opacity: 1; transform: scale(1)    translateY(0); }
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

        /* كل الصفحات: هيدر 52px + نافيجيشن 66px */
        .alfhd-main-area {
          padding: 52px 0 66px !important;
          width: 100% !important;
          min-height: 100vh !important;
          box-sizing: border-box !important;
        }

        /* صفحة المحادثات: padding عادي مثل باقي الصفحات */
        .alfhd-main-conv {
          padding: 52px 0 66px !important;
          height: 100vh !important;
          min-height: 0 !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
          box-sizing: border-box !important;
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
          animation: chatSlideIn 0.2s ease !important;
          border-radius: 0 !important;
          border: none !important;
          padding: 0 !important;
          min-height: 0 !important;
        }
        .alfhd-conv-detail-active-mobile .alfhd-chat-detail-header {
          padding: 12px 14px !important;
          padding-top: max(12px, env(safe-area-inset-top, 12px)) !important;
          flex-shrink: 0 !important;
        }
        .alfhd-conv-detail-active-mobile .alfhd-chat-scroll {
          flex: 1 1 auto !important;
          max-height: none !important;
          min-height: 0 !important;
          padding: 12px !important;
          overflow-y: auto !important;
        }
        .alfhd-conv-detail-active-mobile .alfhd-composer-bar {
          margin: 0 !important;
          border-radius: 0 !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: none !important;
          padding: 10px 12px !important;
          padding-bottom: max(10px, env(safe-area-inset-bottom, 10px)) !important;
          flex-shrink: 0 !important;
        }
        .alfhd-conv-detail-active-mobile .alfhd-linked-order {
          flex-shrink: 0 !important;
          margin: 0 !important;
          max-height: 130px !important;
          overflow-y: auto !important;
          border-radius: 0 !important;
        }
        .alfhd-conv-back-btn { display: flex !important; }
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
const TDM = '#546880';
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
  loginBrandTop: { position: 'absolute', top: 20, zIndex: 2, display: 'flex', alignItems: 'center', gap: 7, color: TSB, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', background: 'rgba(23,33,43,0.80)', border: `1px solid ${TB}`, borderRadius: 999, padding: '6px 13px' },
  loginCard: { position: 'relative', zIndex: 1, background: TP, border: `1px solid ${TB}`, borderRadius: 16, padding: '36px 30px 24px', width: '100%', maxWidth: 390, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'loginFloat 5s ease-in-out infinite' },
  loginGlassShine: { display: 'none' },
  loginCardAccent: { position: 'absolute', top: 0, right: 0, left: 0, height: 2, background: `linear-gradient(90deg, transparent, ${TBL}, transparent)`, borderRadius: '16px 16px 0 0', opacity: 0.7 },
  loginLogoArea: { position: 'relative', marginBottom: 4 },
  logoGlow: { position: 'absolute', inset: -22, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,171,238,0.18) 0%, transparent 70%)', filter: 'blur(10px)' },
  loginTitle: { fontSize: 28, fontWeight: 800, color: TTX, margin: '12px 0 2px', letterSpacing: '0.03em' },
  loginSubtitle: { fontSize: 12, color: TSB, margin: 0, fontWeight: 500 },
  loginMicroCopy: { marginTop: 9, color: TBL, fontSize: 10.5, fontWeight: 700, background: 'rgba(42,171,238,0.10)', border: '1px solid rgba(42,171,238,0.18)', borderRadius: 999, padding: '4px 11px' },
  inputLabel: { display: 'block', fontSize: 11, color: TSB, marginBottom: 11, fontWeight: 700, textAlign: 'center', letterSpacing: '0.05em' },
  pinBoxesWrap: { position: 'relative', display: 'flex', gap: 9, justifyContent: 'center', cursor: 'text' },
  pinBox: { width: 50, height: 56, borderRadius: 10, background: TI, border: `1.5px solid ${TB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: TBL, fontWeight: 900, transition: 'border-color 0.13s, transform 0.12s' },
  pinBoxActive: { borderColor: TBL, transform: 'translateY(-2px)' },
  pinBoxFilled: { borderColor: 'rgba(42,171,238,0.45)', background: 'rgba(42,171,238,0.07)' },
  pinBoxError: { borderColor: TRD },
  pinHiddenInput: { position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', border: 'none', padding: 0, margin: 0, cursor: 'text' },
  errorText: { color: TRD, fontSize: 11.5, marginTop: 9, textAlign: 'center', fontWeight: 600 },
  rememberRow: { marginTop: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, color: TSB, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' },
  loginKeypad: { marginTop: 17, display: 'grid', gridTemplateColumns: 'repeat(3, 50px)', gap: 9, justifyContent: 'center' },
  loginKeypadBtn: { width: 50, height: 50, borderRadius: 10, border: `1px solid ${TB}`, background: TI, color: TTX, fontSize: 16, fontWeight: 700 },
  loginKeypadGhost: { width: 50, height: 50, borderRadius: 10, border: `1px solid ${TB}`, background: 'transparent', color: TSB, fontSize: 11, fontWeight: 700 },
  checkbox: { width: 14, height: 14, accentColor: TBL, cursor: 'pointer' },
  loginFooter: { marginTop: 20, fontSize: 10, color: TDM, position: 'relative', zIndex: 1, letterSpacing: '0.04em' },

  // ── App layout ──
  appWrap: { display: 'flex', minHeight: '100vh', background: TG, direction: 'rtl', color: TTX, fontFamily: "'Cairo', sans-serif" },
  sidebar: { width: 260, background: TP, borderLeft: `1px solid ${TB}`, display: 'flex', flexDirection: 'column', padding: '14px 10px', flexShrink: 0 },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px 14px', borderBottom: `1px solid ${TB}`, marginBottom: 10 },
  sidebarBrand: { fontSize: 15.5, fontWeight: 800, color: TTX },
  sidebarBrandSub: { fontSize: 9, color: TDM, letterSpacing: '0.05em', textTransform: 'uppercase' },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, border: '1px solid transparent', background: 'transparent', color: TSB, fontSize: 13.5, fontWeight: 600, textAlign: 'right', position: 'relative', transition: 'all 0.12s ease' },
  navItemActive: { background: TAC, borderColor: 'rgba(42,171,238,0.20)', color: TBL, fontWeight: 700 },
  navActiveDot: { position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', width: 3, height: 15, borderRadius: 4, background: TBL },
  sidebarFooter: { paddingTop: 11, borderTop: `1px solid ${TB}` },
  userBadge: { display: 'flex', alignItems: 'center', gap: 9, padding: '6px', marginBottom: 7 },
  userAvatar: { width: 32, height: 32, borderRadius: '50%', background: TBTN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 700, color: TTX, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: 10, color: TDM },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '9px 11px', background: 'transparent', border: '1px solid rgba(242,80,80,0.18)', borderRadius: 10, color: TRD, fontSize: 12.5, fontWeight: 600 },

  // ── Mobile ──
  mobileHeader: { position: 'fixed', top: 0, right: 0, left: 0, height: 52, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(23,33,43,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid rgba(255,255,255,0.09)`, padding: '0 14px', direction: 'rtl', paddingTop: 'env(safe-area-inset-top,0px)' },
  mobileHeaderBrand: { display: 'flex', alignItems: 'center', gap: 8 },
  mobileHeaderTitle: { fontSize: 15, fontWeight: 800, color: TTX },
  mobileLogoutBtn: { width: 32, height: 32, borderRadius: 9, background: 'rgba(242,80,80,0.09)', border: 'none', color: TRD, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  bottomNav: { position: 'fixed', bottom: 0, right: 0, left: 0, zIndex: 100, display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: 'rgba(23,33,43,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: `1px solid rgba(255,255,255,0.09)`, padding: '6px 4px', paddingBottom: 'max(8px, env(safe-area-inset-bottom,8px))', direction: 'rtl' },
  bottomNavItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'transparent', border: 'none', color: TDM, padding: '5px 8px', flex: 1, minWidth: 0, position: 'relative' },
  bottomNavItemActive: { color: TBL },
  bottomNavLabel: { fontSize: 9.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' },

  mainArea: { flex: 1, overflow: 'auto', padding: '0', position: 'relative', background: TG },
  viewWrap: { animation: 'fadeUp 0.24s var(--ease-bounce) both', maxWidth: 1480, margin: '0 auto', padding: '16px 18px', willChange: 'opacity, transform' },
  viewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap', gap: 11 },
  viewTitle: { fontSize: 19, fontWeight: 800, color: TTX, margin: 0, letterSpacing: '-0.02em' },
  viewSubtitle: { fontSize: 12, color: TDM, margin: '3px 0 0', fontWeight: 500 },
  pageSelectWrap: { display: 'flex', alignItems: 'center', gap: 7, background: TI, border: 'none', borderRadius: 10, padding: '6px 11px' },
  pageSelect: { background: 'transparent', border: 'none', color: TTX, fontSize: 12.5, fontWeight: 600, appearance: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif" },

  // ── Conversations ──
  convTabs: { display: 'flex', gap: 5, marginBottom: 0, flexWrap: 'wrap', padding: '0 0 9px' },
  convTab: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'transparent', border: 'none', borderRadius: 20, color: TDM, fontSize: 12, fontWeight: 600, transition: 'all 0.12s ease' },
  convTabActive: { background: TAC, color: TBL },
  convTabCount: { background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '1px 6px', fontSize: 10, fontWeight: 700 },
  convTabCountActive: { background: 'rgba(42,171,238,0.28)', color: TBL },
  unreadPulse: { position: 'absolute', top: -5, left: -5, minWidth: 15, height: 15, padding: '0 4px', borderRadius: 20, background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${TP}` },
  markAllReadBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '7px', marginBottom: 4, background: 'rgba(42,171,238,0.07)', border: 'none', borderRadius: 0, color: TBL, fontSize: 12, fontWeight: 600 },
  markAllReadBtnDisabled: { opacity: 0.38, color: TDM, background: 'transparent', cursor: 'not-allowed' },

  convLayout: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: 0, minHeight: '100vh', alignItems: 'stretch' },
  convList: { background: TP, border: 'none', borderRadius: 0, borderLeft: `1px solid ${TB}`, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 0, maxHeight: '100vh', overflow: 'auto', boxShadow: 'none' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, background: TI, border: 'none', borderRadius: 10, padding: '8px 12px', margin: '0 10px 7px', boxShadow: 'none' },
  searchInput: { background: 'transparent', border: 'none', color: TTX, fontSize: 12.5, width: '100%', fontFamily: "'Cairo', sans-serif" },
  convItem: { display: 'flex', gap: 10, padding: '10px 14px', background: 'transparent', border: 'none', borderRight: '3px solid transparent', borderRadius: 0, textAlign: 'right', alignItems: 'center', transition: 'background 0.12s ease', width: '100%' },
  convItemActive: { background: TAC, borderRightColor: TBL },
  convAvatar: { width: 44, height: 44, borderRadius: '50%', background: TI, color: TBL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, fontSize: 15 },
  convItemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  convCustomer: { fontSize: 13.5, fontWeight: 700, color: TTX, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  convTime: { fontSize: 10.5, color: TDM, flexShrink: 0, marginRight: 5 },
  convItemBottom: { display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center' },
  convLastMsg: { fontSize: 12, color: TSB, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  convMiniMetaRow: { display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 3, minHeight: 14 },
  convMiniMetaPill: { display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 999, background: 'rgba(42,171,238,0.08)', color: TBL, fontSize: 9, fontWeight: 700 },
  unreadBadge: { background: TBL, color: '#fff', borderRadius: 20, fontSize: 10.5, fontWeight: 800, padding: '2px 7px', minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', flexShrink: 0 },

  convDetail: { background: TG, border: 'none', borderRadius: 0, padding: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0, overflow: 'hidden', boxShadow: 'none' },
  detailHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${TB}`, marginBottom: 0, position: 'relative', background: TP },
  convBackBtn: { display: 'none', width: 32, height: 32, borderRadius: 9, background: TI, border: 'none', color: TSB, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  convAvatarLg: { width: 40, height: 40, borderRadius: '50%', background: TI, color: TBL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 },
  detailName: { fontSize: 14.5, fontWeight: 800, color: TTX },
  detailPage: { fontSize: 11, color: TDM, fontWeight: 500 },
  chatHeaderMetaRow: { display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginTop: 3 },
  chatHeaderMetaPill: { display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 999, background: TI, color: TSB, fontSize: 9.5, fontWeight: 600 },
  pinOrderBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', background: 'rgba(42,171,238,0.10)', border: 'none', borderRadius: 9, color: TBL, fontSize: 11.5, fontWeight: 700, flexShrink: 0 },
  chatScroll: { flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', padding: '14px 16px', minHeight: 260, maxHeight: 'calc(100vh - 136px)', background: TG, border: 'none', borderRadius: 0 },
  msgBubbleIn: { background: '#182533', border: 'none', borderRadius: '16px 16px 16px 4px', padding: '8px 12px', fontSize: 13.5, color: '#F5F5F5', maxWidth: '74%', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 3, boxShadow: '0 1px 2px rgba(0,0,0,0.3)', overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0, willChange: 'transform, opacity' },
  msgBubbleOut: { background: '#2B5278', border: 'none', borderRadius: '16px 16px 4px 16px', padding: '8px 12px', fontSize: 13.5, color: '#fff', maxWidth: '74%', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 3, boxShadow: '0 1px 2px rgba(0,0,0,0.3)', overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0, willChange: 'transform, opacity' },
  chatDateDivider: { alignSelf: 'center', margin: '4px 0 10px', padding: '4px 10px', borderRadius: 999, background: 'rgba(23,33,43,0.88)', color: TSB, fontSize: 10, fontWeight: 600 },
  msgImage: { width: '100%', maxWidth: 260, borderRadius: 10, display: 'block' },
  msgAudio: { width: 240, maxWidth: '100%', height: 34 },
  msgTime: { fontSize: 10, color: 'rgba(255,255,255,0.45)', alignSelf: 'flex-end', fontWeight: 500 },
  composerBar: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 0, background: TP, border: 'none', borderTop: `1px solid ${TB}`, borderRadius: 0, padding: '10px 14px', boxShadow: 'none' },
  composerIconBtn: { width: 34, height: 34, borderRadius: 9, background: 'transparent', border: 'none', color: TDM, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  recordingBar: { display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '3px 5px' },
  recordingInfo: { flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' },
  recordingDot: { width: 9, height: 9, borderRadius: '50%', background: TRD, flexShrink: 0 },
  recordingTime: { fontSize: 14, fontWeight: 800, color: TTX, fontFamily: 'monospace', minWidth: 42 },
  recordingLabel: { fontSize: 12, color: TDM },
  recordingCancelBtn: { width: 36, height: 36, borderRadius: 9, background: 'rgba(242,80,80,0.09)', border: 'none', color: TRD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  recordingSendBtn: { width: 38, height: 38, borderRadius: '50%', background: TBTN, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(42,171,238,0.38)' },
  composerInput: { flex: 1, background: 'transparent', border: 'none', color: TTX, fontSize: 13.5, padding: '5px 4px', fontFamily: "'Cairo', sans-serif" },
  composerSendBtn: { width: 36, height: 36, borderRadius: '50%', background: TBTN, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(42,171,238,0.38)' },
  linkedOrderCard: { background: TI, border: `1px solid ${TB}`, borderRadius: 10, padding: 12, marginBottom: 9 },
  linkedOrderHeader: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: TBL, marginBottom: 9 },
  linkedOrderBody: { display: 'flex', flexDirection: 'column', gap: 7 },
  linkedOrderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  linkedOrderLabel: { fontSize: 11.5, color: TDM },
  linkedOrderValue: { fontSize: 12.5, color: TTX, fontWeight: 600 },
  linkedOrderDetailBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 9, padding: '8px', background: 'rgba(42,171,238,0.09)', border: 'none', borderRadius: 9, color: TBL, fontSize: 12, fontWeight: 700 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '44px 20px', color: TDM, fontSize: 13 },
  emptyStateLg: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 11, flex: 1, color: TDM, fontSize: 13 },

  // ── Orders ──
  printBtn: { display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', background: TBTN, border: 'none', borderRadius: 10, color: '#fff', fontSize: 12.5, fontWeight: 700, boxShadow: '0 2px 8px rgba(42,171,238,0.32)' },
  secondaryBtn: { display: 'flex', alignItems: 'center', gap: 7, padding: '8px 13px', background: TI, border: 'none', borderRadius: 10, color: TSB, fontSize: 12.5, fontWeight: 600 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 },
  statCard: { display: 'flex', alignItems: 'center', gap: 11, background: `linear-gradient(145deg, ${TP}, #1A2736)`, border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, padding: '14px 16px', boxShadow: TSH, transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden' },
  statIconWrap: { width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statValue: { fontSize: 20, fontWeight: 800, color: TTX, lineHeight: 1.15, letterSpacing: '-0.02em' },
  statLabel: { fontSize: 10.5, color: TDM, marginTop: 2 },
  sectionTabs: { display: 'flex', gap: 5, marginBottom: 13 },
  sectionTab: { display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', background: 'transparent', border: 'none', borderRadius: 20, color: TDM, fontSize: 12.5, fontWeight: 600, transition: 'all 0.12s ease' },
  sectionTabActive: { background: TAC, color: TBL },
  filterChips: { display: 'flex', gap: 5 },
  chip: { padding: '6px 12px', background: TI, border: 'none', borderRadius: 20, color: TDM, fontSize: 11.5, fontWeight: 600 },
  chipActive: { background: TAC, color: TBL },
  ordersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(272px,1fr))', gap: 11 },
  orderCard: { background: `linear-gradient(145deg, ${TP}, #1A2736)`, border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: TSH, transition: 'all 0.2s ease', position: 'relative' },
  orderTicketHead: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 13px 9px' },
  orderTicketAvatar: { width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: TI, color: TBL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 },
  orderCardCustomer: { fontSize: 13.5, fontWeight: 700, color: TTX, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  orderTicketPage: { fontSize: 10.5, color: TDM, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  orderStatusPill: { fontSize: 10.5, fontWeight: 700, borderRadius: 20, padding: '3px 9px', flexShrink: 0 },
  orderTicketBody: { padding: '0 13px 9px', display: 'flex', flexDirection: 'column', gap: 5 },
  orderDetailRow: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: TSB },
  deliveryStepRow: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: TBL, fontWeight: 700, marginTop: 2 },
  orderTicketItems: { fontSize: 11.5, color: '#C8D0DC', background: TI, borderRadius: 8, padding: '8px 10px', marginTop: 2, lineHeight: 1.55, border: 'none' },
  orderTicketFoot: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '9px 13px', borderTop: `1px solid ${TB}` },
  orderCardTotal: { fontSize: 17, fontWeight: 800, color: TTX, letterSpacing: '-0.02em' },
  orderCurrency: { fontSize: 11, fontWeight: 500, color: TDM },
  orderTicketMeta: { display: 'flex', gap: 4, alignItems: 'center', fontSize: 10, color: TDM, marginTop: 2 },
  printedBadge: { display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(77,219,107,0.11)', color: TGR, borderRadius: 20, padding: '2px 7px', fontSize: 9.5, fontWeight: 700 },
  batchBlock: { background: `linear-gradient(145deg, ${TP}, #1A2736)`, border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, padding: 14, boxShadow: TSH },
  batchHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  batchHeaderInfo: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: TTX },
  batchHeaderTime: { fontSize: 10.5, color: TDM, fontWeight: 500 },
  orderCardActions: { display: 'flex', gap: 5, padding: '9px 13px', borderTop: `1px solid ${TB}`, background: 'rgba(0,0,0,0.08)' },
  orderActionBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 31, borderRadius: 8, background: TI, border: 'none', color: TDM },
  statusSelect: { border: '1px solid', borderRadius: 8, padding: '5px 8px', fontSize: 11.5, fontWeight: 700, appearance: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif" },

  // ── Stats ──
  chartCard: { background: `linear-gradient(145deg, ${TP}, #1A2736)`, border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, padding: 16, marginBottom: 13, boxShadow: TSH },
  timeFilterBar: { display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap' },
  customDateRow: { display: 'flex', gap: 8, marginBottom: 14 },
  customDateSelect: { background: TI, border: 'none', borderRadius: 9, padding: '8px 11px', color: TTX, fontSize: 12.5, fontFamily: "'Cairo', sans-serif", flex: 1 },
  customDateSelectCompact: { background: TI, border: 'none', borderRadius: 9, padding: '8px 10px', color: TTX, fontSize: 12, fontFamily: "'Cairo', sans-serif", minWidth: 110 },
  filtersWrap: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, background: TI, borderRadius: 10, padding: 10 },
  dateChipsRow: { display: 'none' },
  filterBottomRow: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  chartTitle: { fontSize: 14, fontWeight: 700, color: TTX, margin: '0 0 13px' },
  barChartArea: { display: 'flex', flexDirection: 'column', gap: 12 },
  barChartRow: { display: 'grid', gridTemplateColumns: '165px 1fr 105px', gap: 11, alignItems: 'center' },
  barChartLabel: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: TSB, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  barChartTrack: { height: 5, background: TI, borderRadius: 4, overflow: 'hidden' },
  barChartFill: { height: '100%', background: `linear-gradient(90deg,${TBL2},${TBL})`, borderRadius: 4, transition: 'width 0.5s ease' },
  barChartValue: { fontSize: 11.5, fontWeight: 700, color: TBL, textAlign: 'left' },
  statsGrid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 },
  donutWrap: { display: 'flex', justifyContent: 'center', padding: '8px 0' },
  pageStatRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageStatInfo: { display: 'flex', alignItems: 'center', gap: 9 },
  pageStatBadge: { background: TI, padding: '4px 9px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, color: TSB },

  // ── Pages ──
  addBtn: { display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', background: TBTN, border: 'none', borderRadius: 10, color: '#fff', fontSize: 12.5, fontWeight: 700, boxShadow: '0 2px 8px rgba(42,171,238,0.32)' },
  confirmBtn: { background: TBL, border: 'none', borderRadius: 8, padding: '0 15px', color: '#fff', fontWeight: 700, fontSize: 13 },
  fbErrorBox: { display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12, background: 'rgba(242,80,80,0.07)', border: `1px solid rgba(242,80,80,0.18)`, borderRadius: 10, padding: '10px 12px', color: TRD, fontSize: 12.5, lineHeight: 1.6 },
  fbExchangingBox: { marginBottom: 12, background: 'rgba(42,171,238,0.07)', border: 'none', borderRadius: 10, padding: '10px 12px', color: TBL, fontSize: 12.5 },
  fbCandidatesWrap: { marginBottom: 15, background: TI, border: 'none', borderRadius: 11, padding: 12 },
  fbCandidatesTitle: { fontSize: 12.5, fontWeight: 700, color: TTX, marginBottom: 10 },
  fbCandidateRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${TB}` },
  fbCandidateAvatarImg: { width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' },
  fbCandidateId: { fontSize: 10.5, color: TDM, marginTop: 2 },
  pagesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(295px,1fr))', gap: 12 },
  pageCard: { position: 'relative', display: 'flex', flexDirection: 'column', gap: 12, background: `linear-gradient(145deg, ${TP}, #1A2736)`, border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, padding: 14, boxShadow: TSH, overflow: 'hidden', transition: 'all 0.2s ease' },
  pageCardTopLine: { position: 'absolute', top: 0, right: 16, left: 16, height: 2, background: `linear-gradient(90deg, transparent, ${TBL}, transparent)`, opacity: 0.55 },
  pageCardHeader: { display: 'flex', alignItems: 'center', gap: 11, width: '100%' },
  subscribeBtn: { width: '100%', background: 'rgba(77,219,107,0.09)', border: `1px solid rgba(77,219,107,0.22)`, borderRadius: 10, padding: '9px 0', color: TGR, fontSize: 12, fontWeight: 700 },
  pageCardAvatar: { width: 46, height: 46, borderRadius: '50%', background: TI, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0 },
  pageCardName: { fontSize: 14, fontWeight: 800, color: TTX, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pageCardMeta: { fontSize: 10.5, color: TDM, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pageCardStatus: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, marginTop: 3, fontWeight: 600 },
  pageStatusPill: { display: 'inline-flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start', borderRadius: 20, padding: '6px 11px', fontSize: 11.5, fontWeight: 700, border: 'none' },
  pageStatusPillOk: { color: TGR, background: 'rgba(77,219,107,0.09)' },
  pageStatusPillWait: { color: TBL, background: 'rgba(42,171,238,0.09)' },
  liveDot: { width: 7, height: 7, borderRadius: '50%', boxShadow: '0 0 8px currentColor' },
  iconBtnDanger: { width: 30, height: 30, borderRadius: 8, background: 'rgba(242,80,80,0.08)', border: 'none', color: TRD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // ── Users ──
  usersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(285px,1fr))', gap: 11 },
  userCard: { background: `linear-gradient(145deg, ${TP}, #1A2736)`, border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, padding: 14, boxShadow: TSH, transition: 'all 0.2s ease' },
  userCardTop: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  userCardAvatar: { width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 },
  userCardName: { fontSize: 13, fontWeight: 700, color: TTX },
  userCardRole: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: TDM, marginTop: 2 },
  activeDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  userPermsList: { display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${TB}` },
  permTag: { background: 'rgba(42,171,238,0.09)', color: TBL, fontSize: 9.5, fontWeight: 600, padding: '3px 7px', borderRadius: 6 },
  userCardActions: { display: 'flex', gap: 6 },
  userActionBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px', background: TI, border: 'none', borderRadius: 8, color: TSB, fontSize: 10.5, fontWeight: 600 },
  userCardMetaRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  userCodeTag: { fontSize: 10.5, color: TDM, background: TI, border: 'none', borderRadius: 7, padding: '3px 8px', fontFamily: 'monospace' },
  warehouseNote: { display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(255,202,40,0.05)', border: `1px solid rgba(255,202,40,0.13)`, borderRadius: 9, padding: 10, fontSize: 12, color: TSB, lineHeight: 1.6 },
  rejectReasonBox: { margin: '0 13px 10px', padding: '8px 10px', background: 'rgba(242,80,80,0.07)', border: `1px solid rgba(242,80,80,0.14)`, borderRadius: 9, fontSize: 12, color: TTX, display: 'flex', flexDirection: 'column', gap: 3 },
  rejectReasonLabel: { fontSize: 10.5, color: TRD, fontWeight: 700 },
  rejectedCard: { border: `1.5px solid rgba(242,80,80,0.36)`, boxShadow: '0 0 0 1px rgba(242,80,80,0.09), 0 4px 14px -6px rgba(242,80,80,0.25)' },
  rejectedBanner: { display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', background: '#7B1A1A', color: '#fff', fontSize: 12, fontWeight: 800, padding: '8px 11px', borderRadius: '12px 12px 0 0', margin: '-1px -1px 0' },
  prepTimeRow: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: TDM, margin: '0 13px 8px', paddingTop: 2 },
  orderReprepNoteBox: { display: 'flex', alignItems: 'flex-start', gap: 7, margin: '0 13px 10px', background: 'rgba(242,80,80,0.08)', border: `1px solid rgba(242,80,80,0.24)`, color: '#FCA5A5', borderRadius: 9, padding: '8px 10px', fontSize: 12, lineHeight: 1.6 },
  globalOrderSearchWrap: { position: 'relative', display: 'flex', alignItems: 'center', gap: 6, width: 208, minHeight: 34, background: TI, border: 'none', borderRadius: 10, padding: '0 10px' },
  globalOrderSearchInput: { width: '100%', background: 'transparent', border: 'none', outline: 'none', color: TTX, fontSize: 12, fontFamily: "'Cairo', sans-serif" },
  globalOrderResultsBox: { position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50, background: TP, border: `1px solid ${TB}`, borderRadius: 11, boxShadow: '0 4px 16px rgba(0,0,0,0.4)', overflow: 'hidden' },
  globalOrderResultItem: { width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', border: 'none', background: 'transparent', borderRadius: 0, textAlign: 'right', color: TTX },
  globalOrderResultTitle: { fontSize: 12, fontWeight: 700, color: TTX, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  globalOrderResultMeta: { fontSize: 10.5, color: TDM, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  globalOrderEmpty: { padding: '11px', color: TDM, fontSize: 12, textAlign: 'center' },

  // ── Warehouse ──
  warehouseWrap: { flex: 1, overflow: 'auto', padding: '18px 15px', maxWidth: 700, margin: '0 auto', width: '100%' },
  warehouseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 11, paddingTop: 'env(safe-area-inset-top,0px)' },
  warehouseGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  warehouseCard: { background: `linear-gradient(145deg, ${TP}, #1A2736)`, border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, padding: 14, boxShadow: TSH, transition: 'all 0.2s ease' },
  warehouseCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  warehouseCardNo: { fontSize: 12, fontWeight: 800, color: TBL, fontFamily: 'monospace' },
  warehouseCardDate: { fontSize: 11, color: TDM },
  warehouseBigType: { fontSize: 17, fontWeight: 800, color: TTX, lineHeight: 1.5, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' },
  warehouseFilterBar: { display: 'flex', gap: 6, marginBottom: 13 },
  warehouseFilterChip: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 7px', background: TI, border: 'none', borderRadius: 10, color: TDM, fontSize: 12.5, fontWeight: 700 },
  warehouseFilterChipActive: { background: TAC, color: TBL },
  warehouseFilterCount: { minWidth: 19, height: 19, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800, padding: '0 5px' },
  warehouseFilterCountActive: { background: TBL, color: '#fff' },
  warehouseReprepNote: { display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10, background: 'rgba(242,80,80,0.08)', border: `1px solid rgba(242,80,80,0.22)`, borderRadius: 10, padding: '10px 11px', color: '#FCA5A5' },
  warehouseReprepTitle: { fontSize: 12, fontWeight: 800, color: TRD, marginBottom: 3 },
  warehouseReprepText: { fontSize: 13.5, fontWeight: 700, color: '#FEE2E2', lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  warehouseItemsBox: { marginTop: 10, background: 'rgba(255,202,40,0.05)', border: `1px solid rgba(255,202,40,0.13)`, borderRadius: 9, padding: '9px 11px' },
  warehouseItemsLabel: { fontSize: 10.5, fontWeight: 700, color: '#FFCA28', marginBottom: 4 },
  warehouseItemsText: { fontSize: 13.5, color: TTX, lineHeight: 1.6, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' },
  warehouseBadge: { width: 38, height: 38, borderRadius: '50%', background: TBTN, color: '#fff', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(42,171,238,0.38)' },
  warehouseActions: { display: 'flex', gap: 8, marginTop: 12 },
  warehouseDoneBtn: { flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', background: TGBTN, border: 'none', borderRadius: 10, color: '#fff', fontSize: 13.5, fontWeight: 800, boxShadow: '0 2px 8px rgba(77,219,107,0.32)' },
  warehouseRejectBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '12px', background: TRDS, border: `1px solid rgba(242,80,80,0.22)`, borderRadius: 10, color: TRD, fontSize: 13, fontWeight: 700 },

  // ── Modal ──
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: `linear-gradient(145deg, ${TP}, #1A2736)`, border: `1px solid rgba(255,255,255,0.10)`, borderRadius: 16, width: '100%', maxWidth: 445, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.4)', position: 'relative', zIndex: 1 },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 17px', borderBottom: `1px solid ${TB}` },
  modalTitle: { fontSize: 15, fontWeight: 700, color: TTX, margin: 0 },
  modalClose: { background: 'transparent', border: 'none', color: TDM, display: 'flex' },
  modalBody: { padding: '15px 17px', display: 'flex', flexDirection: 'column', gap: 13 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  formLabel: { fontSize: 11.5, fontWeight: 600, color: TDM },
  formInput: { background: TI, border: 'none', borderRadius: 9, padding: '9px 12px', color: TTX, fontSize: 13, fontFamily: "'Cairo', sans-serif" },
  roleToggle: { display: 'flex', gap: 6 },
  roleBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', background: TI, border: 'none', borderRadius: 9, color: TDM, fontSize: 12, fontWeight: 600 },
  roleBtnActive: { background: TAC, color: TBL },
  permsGrid: { display: 'flex', flexDirection: 'column', gap: 4 },
  permCheckRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: TSB, padding: '5px 0', cursor: 'pointer' },
  modalFooter: { display: 'flex', gap: 8, padding: '13px 17px', borderTop: `1px solid ${TB}` },
  modalCancelBtn: { flex: 1, padding: '9px', background: 'transparent', border: `1px solid ${TB}`, borderRadius: 9, color: TDM, fontSize: 12.5, fontWeight: 600 },
  modalSaveBtn: { flex: 1, padding: '9px', background: TBTN, border: 'none', borderRadius: 9, color: '#fff', fontSize: 12.5, fontWeight: 700, boxShadow: '0 2px 8px rgba(42,171,238,0.28)' },
  detailGridRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 11, paddingBottom: 10, borderBottom: `1px solid ${TB}` },
  detailGridLabel: { fontSize: 11.5, color: TDM, flexShrink: 0 },
  detailGridValue: { fontSize: 12.5, color: TTX, fontWeight: 600, textAlign: 'left', overflowWrap: 'anywhere' },
  detailActionBtn: { flex: 1, minWidth: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', background: TI, border: 'none', borderRadius: 9, color: TSB, fontSize: 12, fontWeight: 700 },
  statsBottomBtns: { display: 'flex', gap: 8, marginTop: 13 },
  statsSmallBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, padding: '10px', background: TI, border: 'none', borderRadius: 10, color: TSB, fontSize: 12.5, fontWeight: 700 },
  statsSummaryBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, flex: 1.4, padding: '10px', background: TBTN, border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 800, boxShadow: '0 2px 8px rgba(42,171,238,0.32)' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 10, background: TI, border: 'none', marginBottom: 6 },
  summaryRowSub: { background: 'transparent', border: 'none', padding: '4px 15px', marginBottom: 2 },
  summaryRowLabel: { fontSize: 12.5, fontWeight: 600 },
  summaryRowValue: { fontSize: 16, fontWeight: 800 },
  summaryHint: { fontSize: 11, color: TDM, textAlign: 'center', marginTop: 8 },
  bestSellerRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 },
  bestSellerRank: { width: 24, height: 24, borderRadius: 8, background: 'rgba(42,171,238,0.11)', color: TBL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 800, flexShrink: 0 },
  bestSellerType: { fontSize: 12.5, fontWeight: 700, color: TTX, marginBottom: 4, overflowWrap: 'anywhere' },
  bestSellerTrack: { height: 5, background: TI, borderRadius: 4, overflow: 'hidden' },
  bestSellerFill: { height: '100%', background: `linear-gradient(90deg,${TBL2},${TBL})`, borderRadius: 4 },
  bestSellerCount: { fontSize: 14, fontWeight: 800, color: TBL, minWidth: 23, textAlign: 'center', flexShrink: 0 },
  convertedRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${TB}` },
  convertedCustomer: { fontSize: 13, fontWeight: 700, color: TTX },
  convertedSub: { fontSize: 11, color: TBL, marginTop: 2 },
  convertedMeta: { fontSize: 10.5, color: TDM, marginTop: 2 },
  convertedTotal: { fontSize: 13, fontWeight: 800, color: TBL, flexShrink: 0 },
  neglectedRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px', marginBottom: 5, borderRadius: 10, background: TI, border: 'none', cursor: 'pointer' },
  neglectedRowSel: { background: TAC, border: '1px solid rgba(42,171,238,0.28)' },
  neglectedCheck: { width: 21, height: 21, borderRadius: 6, border: `1.5px solid ${TB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' },
  neglectedCheckOn: { background: TBL, borderColor: TBL },
};
