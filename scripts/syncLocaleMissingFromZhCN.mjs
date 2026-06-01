/**
 * 将 zh_CN.json 中有、其他语言包缺失的键补全（当前仅处理已知缺失的 8 个键）。
 * 运行: node scripts/syncLocaleMissingFromZhCN.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANG_DIR = path.join(__dirname, '../src/locales/lang');

/** 与 zh_CN 对齐的 8 个键在各语言下的译文（简洁） */
const PATCH_BY_LOCALE = {
  am_ET: {
    about_clear_cache_title: 'መሸጎጫ ማጽዳት',
    about_clear_cache_message_web: 'ከጸዳ በኋላ እንደገና መግባት ያስፈልጋል። ማጽዳት?',
    about_clear_cache_message_app: 'ከጸዳ በኋላ እንደገና መግባት፣ መተግበሪያ ይዘጋል። ማጽዳት?',
    app_version_check_action: 'ዝማኔ ማረጋገጫ',
    app_version_checking: 'ዝማኔ በማረጋገጥ ላይ…',
    app_version_check_failed: 'ዝማኔ አልተሳካም። ትንሽ ቆይተው ይሞክሩ።',
    app_version_new_available: 'አዲስ ስሪት',
    app_version_update_hint: 'መመሪያውን ይከተሉ ወይም ከመደብር ያውርዱ።'
  },
  ar_AE: {
    about_clear_cache_title: 'مسح الذاكرة المؤقتة',
    about_clear_cache_message_web: 'بعد المسح سيلزم تسجيل الدخول مجددًا. هل تتابع؟',
    about_clear_cache_message_app: 'بعد المسح سيلزم تسجيل الدخول وسيتم إعادة تشغيل التطبيق. هل تتابع؟',
    app_version_check_action: 'التحقق من التحديث',
    app_version_checking: 'جارٍ التحقق من التحديث…',
    app_version_check_failed: 'فشل التحقق. حاول لاحقًا.',
    app_version_new_available: 'إصدار جديد',
    app_version_update_hint: 'اتبع التعليمات أو نزّل أحدث نسخة من المتجر.'
  },
  bg_BG: {
    about_clear_cache_title: 'Изчистване на кеша',
    about_clear_cache_message_web: 'След изчистване ще трябва да влезете отново. Продължавате ли?',
    about_clear_cache_message_app: 'След изчистване ще трябва да влезете отново и приложението ще се рестартира. Продължавате ли?',
    app_version_check_action: 'Проверка за актуализация',
    app_version_checking: 'Проверка за актуализация…',
    app_version_check_failed: 'Проверката не бе успешна. Опитайте по-късно.',
    app_version_new_available: 'Нова версия',
    app_version_update_hint: 'Следвайте подсказките или изтеглете последната версия от магазина.'
  },
  bn_BD: {
    about_clear_cache_title: 'ক্যাশে মুছুন',
    about_clear_cache_message_web: 'মুছলে আবার লগইন লাগবে। চালিয়ে যাবেন?',
    about_clear_cache_message_app: 'মুছলে আবার লগইন ও অ্যাপ রিস্টার্ট হবে। চালিয়ে যাবেন?',
    app_version_check_action: 'আপডেট চেক',
    app_version_checking: 'আপডেট চেক হচ্ছে…',
    app_version_check_failed: 'চেক ব্যর্থ। পরে চেষ্টা করুন।',
    app_version_new_available: 'নতুন সংস্করণ',
    app_version_update_hint: 'নির্দেশনা মানুন বা স্টোর থেকে সর্বশেষ সংস্করণ ডাউনলোড করুন।'
  },
  de_DE: {
    about_clear_cache_title: 'Cache leeren',
    about_clear_cache_message_web: 'Nach dem Leeren ist erneuter Login nötig. Fortfahren?',
    about_clear_cache_message_app: 'Nach dem Leeren ist erneuter Login nötig und die App startet neu. Fortfahren?',
    app_version_check_action: 'Nach Updates suchen',
    app_version_checking: 'Suche nach Updates…',
    app_version_check_failed: 'Update-Prüfung fehlgeschlagen. Bitte später erneut versuchen.',
    app_version_new_available: 'Neue Version',
    app_version_update_hint: 'Folgen Sie den Hinweisen oder laden Sie die neueste Version aus dem Store.'
  },
  el_GR: {
    about_clear_cache_title: 'Εκκαθάριση προσωρινής μνήμης',
    about_clear_cache_message_web: 'Μετά την εκκαθάριση απαιτείται νέα σύνδεση. Συνέχεια;',
    about_clear_cache_message_app: 'Μετά την εκκαθάριση απαιτείται νέα σύνδεση και επανεκκίνηση εφαρμογής. Συνέχεια;',
    app_version_check_action: 'Έλεγχος ενημερώσεων',
    app_version_checking: 'Έλεγχος ενημερώσεων…',
    app_version_check_failed: 'Ο έλεγχος απέτυχε. Δοκιμάστε αργότερα.',
    app_version_new_available: 'Νέα έκδοση',
    app_version_update_hint: 'Ακολουθήστε τις οδηγίες ή κατεβάστε την τελευταία έκδοση από το κατάστημα.'
  },
  es_ES: {
    about_clear_cache_title: 'Borrar caché',
    about_clear_cache_message_web: 'Tras borrar tendrá que iniciar sesión de nuevo. ¿Continuar?',
    about_clear_cache_message_app: 'Tras borrar tendrá que iniciar sesión y la app se reiniciará. ¿Continuar?',
    app_version_check_action: 'Buscar actualizaciones',
    app_version_checking: 'Buscando actualizaciones…',
    app_version_check_failed: 'Error al comprobar. Inténtelo más tarde.',
    app_version_new_available: 'Nueva versión',
    app_version_update_hint: 'Siga las indicaciones o descargue la última versión en la tienda.'
  },
  fa_IR: {
    about_clear_cache_title: 'پاک‌سازی کش',
    about_clear_cache_message_web: 'پس از پاک‌سازی باید دوباره وارد شوید. ادامه می‌دهید؟',
    about_clear_cache_message_app: 'پس از پاک‌سازی باید دوباره وارد شوید و برنامه راه‌اندازی مجدد می‌شود. ادامه می‌دهید؟',
    app_version_check_action: 'بررسی به‌روزرسانی',
    app_version_checking: 'در حال بررسی به‌روزرسانی…',
    app_version_check_failed: 'بررسی ناموفق. بعداً تلاش کنید.',
    app_version_new_available: 'نسخه جدید',
    app_version_update_hint: 'راهنما را دنبال کنید یا آخرین نسخه را از فروشگاه بگیرید.'
  },
  fr_FR: {
    about_clear_cache_title: 'Vider le cache',
    about_clear_cache_message_web: 'Après vidage, reconnexion requise. Continuer ?',
    about_clear_cache_message_app: 'Après vidage, reconnexion et redémarrage de l’app. Continuer ?',
    app_version_check_action: 'Vérifier les mises à jour',
    app_version_checking: 'Vérification des mises à jour…',
    app_version_check_failed: 'Échec de la vérification. Réessayez plus tard.',
    app_version_new_available: 'Nouvelle version',
    app_version_update_hint: 'Suivez les instructions ou téléchargez la dernière version depuis le store.'
  },
  he_IL: {
    about_clear_cache_title: 'ניקוי מטמון',
    about_clear_cache_message_web: 'לאחר הניקוי תידרש התחברות מחדש. להמשיך?',
    about_clear_cache_message_app: 'לאחר הניקוי תידרש התחברות והאפליקציה תופעל מחדש. להמשיך?',
    app_version_check_action: 'בדיקת עדכון',
    app_version_checking: 'בודק עדכונים…',
    app_version_check_failed: 'הבדיקה נכשלה. נסו שוב מאוחר יותר.',
    app_version_new_available: 'גרסה חדשה',
    app_version_update_hint: 'עקבו אחר ההנחיות או הורידו את הגרסה האחרונה מהחנות.'
  },
  hi_IN: {
    about_clear_cache_title: 'कैश साफ़ करें',
    about_clear_cache_message_web: 'साफ़ करने के बाद दोबारा लॉगिन करना होगा। जारी रखें?',
    about_clear_cache_message_app: 'साफ़ करने के बाद दोबारा लॉगिन और ऐप रीस्टार्ट होगा। जारी रखें?',
    app_version_check_action: 'अपडेट जाँचें',
    app_version_checking: 'अपडेट जाँच हो रही है…',
    app_version_check_failed: 'जाँच विफल। बाद में कोशिश करें।',
    app_version_new_available: 'नया संस्करण',
    app_version_update_hint: 'निर्देशों का पालन करें या स्टोर से नवीनतम संस्करण डाउनलोड करें।'
  },
  hr_HR: {
    about_clear_cache_title: 'Očisti predmemoriju',
    about_clear_cache_message_web: 'Nakon čišćenja potrebna je ponovna prijava. Nastaviti?',
    about_clear_cache_message_app: 'Nakon čišćenja potrebna je ponovna prijava i aplikacija će se ponovno pokrenuti. Nastaviti?',
    app_version_check_action: 'Provjeri ažuriranja',
    app_version_checking: 'Provjera ažuriranja…',
    app_version_check_failed: 'Provjera nije uspjela. Pokušajte kasnije.',
    app_version_new_available: 'Nova verzija',
    app_version_update_hint: 'Slijedite upute ili preuzmite najnoviju verziju iz trgovine.'
  },
  hu_HU: {
    about_clear_cache_title: 'Gyorsítótár törlése',
    about_clear_cache_message_web: 'Törlés után újra be kell jelentkezni. Folytatja?',
    about_clear_cache_message_app: 'Törlés után újra be kell jelentkezni, az alkalmazás újraindul. Folytatja?',
    app_version_check_action: 'Frissítések keresése',
    app_version_checking: 'Frissítések ellenőrzése…',
    app_version_check_failed: 'Ellenőrzés sikertelen. Próbálja később.',
    app_version_new_available: 'Új verzió',
    app_version_update_hint: 'Kövesse az utasításokat, vagy töltse le a legújabb verziót az áruházból.'
  },
  hy_AM: {
    about_clear_cache_title: 'Քեշի մաքրում',
    about_clear_cache_message_web: 'Մաքրումից հետո պետք է նորից մուտք գործել։ Շարունակե՞լ։',
    about_clear_cache_message_app: 'Մաքրումից հետո պետք է նորից մուտք գործել, հավելվածը կվերագործարկվի։ Շարունակե՞լ։',
    app_version_check_action: 'Թարմացումների ստուգում',
    app_version_checking: 'Թարմացումների ստուգում…',
    app_version_check_failed: 'Ստուգումը ձախողվեց։ Փորձեք ավելի ուշ։',
    app_version_new_available: 'Նոր տարբերակ',
    app_version_update_hint: 'Հետևեք ցուցումներին կամ ներբեռնեք վերջին տարբերակը խանութից։'
  },
  id_ID: {
    about_clear_cache_title: 'Hapus cache',
    about_clear_cache_message_web: 'Setelah dihapus, login ulang diperlukan. Lanjut?',
    about_clear_cache_message_app: 'Setelah dihapus, login ulang dan aplikasi akan mulai ulang. Lanjut?',
    app_version_check_action: 'Periksa pembaruan',
    app_version_checking: 'Memeriksa pembaruan…',
    app_version_check_failed: 'Pemeriksaan gagal. Coba lagi nanti.',
    app_version_new_available: 'Versi baru',
    app_version_update_hint: 'Ikuti petunjuk atau unduh versi terbaru dari toko aplikasi.'
  },
  it_IT: {
    about_clear_cache_title: 'Svuota cache',
    about_clear_cache_message_web: 'Dopo lo svuotamento serve un nuovo accesso. Continuare?',
    about_clear_cache_message_app: 'Dopo lo svuotamento serve un nuovo accesso e l’app si riavvia. Continuare?',
    app_version_check_action: 'Verifica aggiornamenti',
    app_version_checking: 'Verifica aggiornamenti…',
    app_version_check_failed: 'Verifica non riuscita. Riprovare più tardi.',
    app_version_new_available: 'Nuova versione',
    app_version_update_hint: 'Seguire le istruzioni o scaricare l’ultima versione dallo store.'
  },
  ja_JP: {
    about_clear_cache_title: 'キャッシュ削除',
    about_clear_cache_message_web: '削除後は再ログインが必要です。実行しますか？',
    about_clear_cache_message_app: '削除後は再ログインが必要で、アプリが再起動します。実行しますか？',
    app_version_check_action: '更新を確認',
    app_version_checking: '更新を確認中…',
    app_version_check_failed: '確認に失敗しました。しばらくして再試行してください。',
    app_version_new_available: '新バージョン',
    app_version_update_hint: '案内に従うか、ストアから最新版を入手してください。'
  },
  kk_KZ: {
    about_clear_cache_title: 'Кэшті тазалау',
    about_clear_cache_message_web: 'Тазалғаннан кейін қайта кіру керек. Жалғастырасыз ба?',
    about_clear_cache_message_app: 'Тазалғаннан кейін қайта кіру және қолданба қайта іске қосылады. Жалғастырасыз ба?',
    app_version_check_action: 'Жаңартуларды тексеру',
    app_version_checking: 'Жаңартулар тексерілуде…',
    app_version_check_failed: 'Тексеру сәтсіз. Кейінірек қайталаңыз.',
    app_version_new_available: 'Жаңа нұсқа',
    app_version_update_hint: 'Нұсқауларды орындаңыз немесе дүкеннен соңғы нұсқаны жүктеңіз.'
  },
  ko_KR: {
    about_clear_cache_title: '캐시 삭제',
    about_clear_cache_message_web: '삭제 후 다시 로그인해야 합니다. 진행할까요?',
    about_clear_cache_message_app: '삭제 후 다시 로그인하며 앱이 재시작됩니다. 진행할까요?',
    app_version_check_action: '업데이트 확인',
    app_version_checking: '업데이트 확인 중…',
    app_version_check_failed: '확인에 실패했습니다. 잠시 후 다시 시도하세요.',
    app_version_new_available: '새 버전',
    app_version_update_hint: '안내에 따르거나 스토어에서 최신 버전을 받으세요.'
  },
  lt_LT: {
    about_clear_cache_title: 'Išvalyti talpyklą',
    about_clear_cache_message_web: 'Po išvalymo reikės prisijungti iš naujo. Tęsti?',
    about_clear_cache_message_app: 'Po išvalymo reikės prisijungti iš naujo ir programa paleis iš naujo. Tęsti?',
    app_version_check_action: 'Tikrinti naujinimus',
    app_version_checking: 'Tikrinami naujinimai…',
    app_version_check_failed: 'Tikrinimas nepavyko. Bandykite vėliau.',
    app_version_new_available: 'Nauja versija',
    app_version_update_hint: 'Vykdykite nurodymus arba atsisiųskite naujausią versiją iš parduotuvės.'
  },
  mn_MN: {
    about_clear_cache_title: 'Кэш цэвэрлэх',
    about_clear_cache_message_web: 'Цэвэрлэсний дараа дахин нэвтрэх шаардлагатай. Үргэлжлүүлэх үү?',
    about_clear_cache_message_app: 'Цэвэрлэсний дараа дахин нэвтрэх, апп дахин эхлэнэ. Үргэлжлүүлэх үү?',
    app_version_check_action: 'Шинэчлэл шалгах',
    app_version_checking: 'Шинэчлэл шалгаж байна…',
    app_version_check_failed: 'Шалгалт амжилтгүй. Дараа дахин оролдоно уу.',
    app_version_new_available: 'Шинэ хувилбар',
    app_version_update_hint: 'Зааврыг дагаж эсвэл дэлгүүрээс сүүлийн хувилбарыг татаж аваарай.'
  },
  nl_NL: {
    about_clear_cache_title: 'Cache wissen',
    about_clear_cache_message_web: 'Na wissen opnieuw inloggen vereist. Doorgaan?',
    about_clear_cache_message_app: 'Na wissen opnieuw inloggen en app herstart. Doorgaan?',
    app_version_check_action: 'Controleren op updates',
    app_version_checking: 'Controleren op updates…',
    app_version_check_failed: 'Controle mislukt. Probeer later opnieuw.',
    app_version_new_available: 'Nieuwe versie',
    app_version_update_hint: 'Volg de instructies of download de nieuwste versie uit de store.'
  },
  pl_PL: {
    about_clear_cache_title: 'Wyczyść pamięć podręczną',
    about_clear_cache_message_web: 'Po wyczyszczeniu wymagane ponowne logowanie. Kontynuować?',
    about_clear_cache_message_app: 'Po wyczyszczeniu wymagane logowanie i restart aplikacji. Kontynuować?',
    app_version_check_action: 'Sprawdź aktualizacje',
    app_version_checking: 'Sprawdzanie aktualizacji…',
    app_version_check_failed: 'Sprawdzenie nie powiodło się. Spróbuj później.',
    app_version_new_available: 'Nowa wersja',
    app_version_update_hint: 'Postępuj zgodnie z instrukcjami lub pobierz najnowszą wersję ze sklepu.'
  },
  pt_BR: {
    about_clear_cache_title: 'Limpar cache',
    about_clear_cache_message_web: 'Após limpar, será necessário entrar novamente. Continuar?',
    about_clear_cache_message_app: 'Após limpar, será necessário entrar novamente e o app reiniciará. Continuar?',
    app_version_check_action: 'Verificar atualizações',
    app_version_checking: 'Verificando atualizações…',
    app_version_check_failed: 'Falha na verificação. Tente mais tarde.',
    app_version_new_available: 'Nova versão',
    app_version_update_hint: 'Siga as instruções ou baixe a versão mais recente na loja.'
  },
  ro_RO: {
    about_clear_cache_title: 'Golire cache',
    about_clear_cache_message_web: 'După golire este necesară autentificarea din nou. Continuați?',
    about_clear_cache_message_app: 'După golire este necesară autentificarea și repornirea aplicației. Continuați?',
    app_version_check_action: 'Verificare actualizări',
    app_version_checking: 'Se verifică actualizările…',
    app_version_check_failed: 'Verificarea a eșuat. Încercați mai târziu.',
    app_version_new_available: 'Versiune nouă',
    app_version_update_hint: 'Urmați instrucțiunile sau descărcați ultima versiune din magazin.'
  },
  ru_RU: {
    about_clear_cache_title: 'Очистить кэш',
    about_clear_cache_message_web: 'После очистки потребуется войти снова. Продолжить?',
    about_clear_cache_message_app: 'После очистки потребуется войти снова, приложение перезапустится. Продолжить?',
    app_version_check_action: 'Проверить обновления',
    app_version_checking: 'Проверка обновлений…',
    app_version_check_failed: 'Проверка не удалась. Попробуйте позже.',
    app_version_new_available: 'Новая версия',
    app_version_update_hint: 'Следуйте подсказкам или скачайте последнюю версию из магазина.'
  },
  sk_SK: {
    about_clear_cache_title: 'Vymazať vyrovnávaciu pamäť',
    about_clear_cache_message_web: 'Po vymazaní bude potrebné sa znova prihlásiť. Pokračovať?',
    about_clear_cache_message_app: 'Po vymazaní bude potrebné sa znova prihlásiť a aplikácia sa reštartuje. Pokračovať?',
    app_version_check_action: 'Skontrolovať aktualizácie',
    app_version_checking: 'Kontrola aktualizácií…',
    app_version_check_failed: 'Kontrola zlyhala. Skúste to neskôr.',
    app_version_new_available: 'Nová verzia',
    app_version_update_hint: 'Postupujte podľa pokynov alebo stiahnite najnovšiu verziu z obchodu.'
  },
  sr_RS: {
    about_clear_cache_title: 'Обриши кеш',
    about_clear_cache_message_web: 'После брисања потребна је поновна пријава. Наставити?',
    about_clear_cache_message_app: 'После брисања потребна је поновна пријава и апликација ће се поново покренути. Наставити?',
    app_version_check_action: 'Провери ажурирања',
    app_version_checking: 'Провера ажурирања…',
    app_version_check_failed: 'Провера није успела. Покушајте касније.',
    app_version_new_available: 'Нова верзија',
    app_version_update_hint: 'Пратите упутства или преузмите најновију верзију из продавнице.'
  },
  sw_KE: {
    about_clear_cache_title: 'Futa akiba',
    about_clear_cache_message_web: 'Baada ya kufuta utahitaji kuingia tena. Endelea?',
    about_clear_cache_message_app: 'Baada ya kufuta utahitaji kuingia tena na programu itaanza upya. Endelea?',
    app_version_check_action: 'Angalia sasisho',
    app_version_checking: 'Inaangalia sasisho…',
    app_version_check_failed: 'Angalio halikufaulu. Jaribu tena baadaye.',
    app_version_new_available: 'Toleo jipya',
    app_version_update_hint: 'Fuata maagizo au pakua toleo jipya kutoka dukani.'
  },
  th_TH: {
    about_clear_cache_title: 'ล้างแคช',
    about_clear_cache_message_web: 'หลังล้างต้องเข้าสู่ระบบใหม่ ดำเนินการต่อ?',
    about_clear_cache_message_app: 'หลังล้างต้องเข้าสู่ระบบใหม่และแอปจะรีสตาร์ท ดำเนินการต่อ?',
    app_version_check_action: 'ตรวจสอบอัปเดต',
    app_version_checking: 'กำลังตรวจสอบอัปเดต…',
    app_version_check_failed: 'ตรวจสอบไม่สำเร็จ ลองใหม่ภายหลัง',
    app_version_new_available: 'เวอร์ชันใหม่',
    app_version_update_hint: 'ทำตามคำแนะนำหรือดาวน์โหลดเวอร์ชันล่าสุดจากสโตร์'
  },
  tr_TR: {
    about_clear_cache_title: 'Önbelleği temizle',
    about_clear_cache_message_web: 'Temizlemeden sonra yeniden giriş gerekir. Devam?',
    about_clear_cache_message_app: 'Temizlemeden sonra yeniden giriş ve uygulama yeniden başlar. Devam?',
    app_version_check_action: 'Güncellemeleri kontrol et',
    app_version_checking: 'Güncellemeler kontrol ediliyor…',
    app_version_check_failed: 'Kontrol başarısız. Daha sonra deneyin.',
    app_version_new_available: 'Yeni sürüm',
    app_version_update_hint: 'Yönergeleri izleyin veya mağazadan son sürümü indirin.'
  },
  uk_UA: {
    about_clear_cache_title: 'Очистити кеш',
    about_clear_cache_message_web: 'Після очищення потрібно увійти знову. Продовжити?',
    about_clear_cache_message_app: 'Після очищення потрібно увійти знову, застосунок перезапуститься. Продовжити?',
    app_version_check_action: 'Перевірити оновлення',
    app_version_checking: 'Перевірка оновлень…',
    app_version_check_failed: 'Перевірка не вдалася. Спробуйте пізніше.',
    app_version_new_available: 'Нова версія',
    app_version_update_hint: 'Дотримуйтесь підказок або завантажте останню версію з магазину.'
  },
  ur_PK: {
    about_clear_cache_title: 'کیش صاف کریں',
    about_clear_cache_message_web: 'صاف کرنے کے بعد دوبارہ لاگ اِن ضروری ہے۔ جاری رکھیں؟',
    about_clear_cache_message_app: 'صاف کرنے کے بعد دوبارہ لاگ اِن اور ایپ دوبارہ شروع ہوگی۔ جاری رکھیں؟',
    app_version_check_action: 'اپ ڈیٹ چیک کریں',
    app_version_checking: 'اپ ڈیٹ چیک ہو رہا ہے…',
    app_version_check_failed: 'چیک ناکام۔ بعد میں کوشش کریں۔',
    app_version_new_available: 'نیا ورژن',
    app_version_update_hint: 'ہدایات پر عمل کریں یا اسٹور سے تازہ ورژن ڈاؤن لوڈ کریں۔'
  },
  uz_UZ: {
    about_clear_cache_title: 'Keshni tozalash',
    about_clear_cache_message_web: 'Tozalagandan keyin qayta kirish kerak. Davom etasizmi?',
    about_clear_cache_message_app: 'Tozalagandan keyin qayta kirish va ilova qayta ishga tushadi. Davom etasizmi?',
    app_version_check_action: 'Yangilanishlarni tekshirish',
    app_version_checking: 'Yangilanishlar tekshirilmoqda…',
    app_version_check_failed: 'Tekshiruv muvaffaqiyatsiz. Keyinroq urinib ko‘ring.',
    app_version_new_available: 'Yangi versiya',
    app_version_update_hint: 'Ko‘rsatmalarga amal qiling yoki do‘kondan so‘nggi versiyani yuklab oling.'
  },
  vi_VN: {
    about_clear_cache_title: 'Xóa bộ nhớ đệm',
    about_clear_cache_message_web: 'Sau khi xóa cần đăng nhập lại. Tiếp tục?',
    about_clear_cache_message_app: 'Sau khi xóa cần đăng nhập lại và ứng dụng sẽ khởi động lại. Tiếp tục?',
    app_version_check_action: 'Kiểm tra cập nhật',
    app_version_checking: 'Đang kiểm tra cập nhật…',
    app_version_check_failed: 'Kiểm tra thất bại. Thử lại sau.',
    app_version_new_available: 'Phiên bản mới',
    app_version_update_hint: 'Làm theo hướng dẫn hoặc tải bản mới nhất từ cửa hàng.'
  },
  zh_HK: {
    about_clear_cache_title: '清除緩存',
    about_clear_cache_message_web: '清理後須重新登入，確定清除？',
    about_clear_cache_message_app: '清理後須重新登入並重啟應用，確定清除？',
    app_version_check_action: '檢查更新',
    app_version_checking: '正在檢查更新…',
    app_version_check_failed: '檢查更新失敗，請稍後重試',
    app_version_new_available: '新版本',
    app_version_update_hint: '請按提示更新，或前往應用商店下載最新安裝包。'
  },
  zh_TW: {
    about_clear_cache_title: '清除快取',
    about_clear_cache_message_web: '清除後需重新登入，確定清除？',
    about_clear_cache_message_app: '清除後需重新登入並重新啟動應用程式，確定清除？',
    app_version_check_action: '檢查更新',
    app_version_checking: '正在檢查更新…',
    app_version_check_failed: '檢查更新失敗，請稍後再試',
    app_version_new_available: '新版本',
    app_version_update_hint: '請依提示更新，或至應用商店下載最新安裝包。'
  }
};

const REQUIRED_KEYS = [
  'about_clear_cache_title',
  'about_clear_cache_message_web',
  'about_clear_cache_message_app',
  'app_version_check_action',
  'app_version_checking',
  'app_version_check_failed',
  'app_version_new_available',
  'app_version_update_hint'
];

function insertAfterKeyOrder(obj, afterKey, entries) {
  const out = {};
  for (const k of Object.keys(obj)) {
    out[k] = obj[k];
    if (k === afterKey) {
      for (const nk of Object.keys(entries)) {
        out[nk] = entries[nk];
      }
    }
  }
  return out;
}

function main() {
  const zhPath = path.join(LANG_DIR, 'zh_CN.json');
  const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));
  const zhKeys = Object.keys(zh);

  const files = fs.readdirSync(LANG_DIR).filter((f) => f.endsWith('.json') && f !== 'zh_CN.json');

  for (const file of files) {
    const code = file.replace(/\.json$/, '');
    const full = path.join(LANG_DIR, file);
    const data = JSON.parse(fs.readFileSync(full, 'utf8'));

    const missing = REQUIRED_KEYS.filter((k) => !(k in data));
    if (missing.length === 0) continue;

    const patch = PATCH_BY_LOCALE[code];
    if (!patch) {
      console.error(`No PATCH_BY_LOCALE for ${code}, missing:`, missing.join(', '));
      process.exitCode = 1;
      continue;
    }

    let merged = { ...data };
    const block1 = {
      about_clear_cache_title: patch.about_clear_cache_title,
      about_clear_cache_message_web: patch.about_clear_cache_message_web,
      about_clear_cache_message_app: patch.about_clear_cache_message_app
    };
    const block2 = {
      app_version_check_action: patch.app_version_check_action,
      app_version_checking: patch.app_version_checking,
      app_version_check_failed: patch.app_version_check_failed,
      app_version_new_available: patch.app_version_new_available,
      app_version_update_hint: patch.app_version_update_hint
    };

    merged = insertAfterKeyOrder(merged, 'about_us_slogan', block1);
    merged = insertAfterKeyOrder(merged, 'app_update_button', block2);

    for (const k of REQUIRED_KEYS) {
      if (!(k in merged)) {
        console.error(`${file}: key ${k} still missing after merge`);
        process.exitCode = 1;
      }
    }

    fs.writeFileSync(full, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
    console.log('patched', file, missing.length, 'keys');
  }

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(LANG_DIR, file), 'utf8'));
    const miss = zhKeys.filter((k) => !(k in data));
    if (miss.length) console.warn(file, 'still missing vs zh_CN:', miss.length, miss.slice(0, 15));
  }
}

main();
